import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const proofs=JSON.parse(fs.readFileSync(new URL('../../reports/chapter-01/solutions.json',import.meta.url))).stages;
async function perform(page,action){
  await page.locator(`[data-mode="${action.prep.type}"]`).click();
  if(['wall','glove'].includes(action.prep.type))await page.locator(`[data-cell="${action.prep.from}"]`).click();
  if(['wall','glove','ice'].includes(action.prep.type))await page.locator(`[data-cell="${action.prep.to}"]`).click();
  await page.locator(`[data-dir="${action.dir}"]`).click();
}
for(const width of [320,390,1440])test(`all 50 stages, unlock events and reload at ${width}px`,async({page},info)=>{
  await page.setViewportSize({width,height:900});const errors=[],httpErrors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400&&/\.(js|json|webp|png|css)(\?|$)/.test(r.url()))httpErrors.push(`${r.status()} ${r.url()}`);});
  await page.goto('/adventure.html');
  for(const proof of proofs){
    const number=proof.number;
    await expect(page.locator('#board')).toHaveAttribute('data-stage',String(number));
    if([10,20,30].includes(number)){
      await expect(page.locator('#notice-kicker')).toContainText('新しい道具');
      await expect(page.locator('#notice')).toBeVisible();await page.locator('#notice-primary').click();
    }
    if(number<10)for(const mode of ['ice','glove','warp'])await expect(page.locator(`[data-mode="${mode}"]`)).toBeDisabled();
    if(number===10){await expect(page.locator('[data-mode="ice"]')).toBeEnabled();await expect(page.locator('[data-mode="glove"]')).toBeDisabled();}
    if(number===20){await expect(page.locator('[data-mode="glove"]')).toBeEnabled();await expect(page.locator('[data-mode="warp"]')).toBeDisabled();}
    if(number===30)await expect(page.locator('[data-mode="warp"]')).toBeEnabled();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    if([1,10,20,23,30,40,50].includes(number)){
      await page.screenshot({path:info.outputPath(`chapter-stage-${number}-${width}.png`),fullPage:true});
      if(info.project.name==='chromium'&&width===390&&[10,23,50].includes(number)){
        const preview=await page.screenshot({type:'jpeg',quality:65,fullPage:true});console.log(`CHAPTER_PREVIEW_${number}=${preview.toString('base64')}`);
      }
    }
    const before=Number(await page.locator('#balance').textContent());
    // At stage 50 the first glove charge must be restored by Undo.
    if(number===50){
      await perform(page,proof.actions[0]);await expect(page.locator('#moves')).toHaveText('1');
      await page.locator('#undo').click();await expect(page.locator('#moves')).toHaveText('0');
      await expect(page.locator('[data-mode="glove"]')).toContainText('あと 1 回');
    }
    for(let i=0;i<proof.actions.length;i++){await perform(page,proof.actions[i]);await expect(page.locator('#moves')).toHaveText(String(i+1));}
    await expect(page.locator('#notice')).toBeVisible();await expect(page.locator('#remaining')).toHaveText('0');await expect(page.locator('#balance')).toHaveText(String(before+1));
    if(number<50)await page.locator('#notice-primary').click();
  }
  await expect(page.locator('#completion')).toHaveText('50 / 50 クリア');await expect(page.locator('#balance')).toHaveText('41');
  await expect(page.locator('[data-built="true"]')).toHaveCount(3);await page.locator('#notice-primary').click();
  await page.reload();await expect(page.locator('#board')).toHaveAttribute('data-stage','50');await expect(page.locator('#balance')).toHaveText('41');
  for(const action of proofs[49].actions)await perform(page,action);
  await expect(page.locator('#balance')).toHaveText('41');await expect(page.locator('#notice-text')).toContainText('獲得済み');
  expect(errors).toEqual([]);expect(httpErrors).toEqual([]);
});
