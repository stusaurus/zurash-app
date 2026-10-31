import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {TASKS,newHome,HOME_KEY} from '../../src/puzzle/house.js';
const proofs=JSON.parse(fs.readFileSync(new URL('../../reports/chapter-01/solutions.json',import.meta.url))).stages;
async function perform(page,action){
  await page.locator(`[data-mode="${action.prep.type}"]`).click();
  if(['wall','glove'].includes(action.prep.type))await page.locator(`[data-cell="${action.prep.from}"]`).click();
  if(['wall','glove','ice'].includes(action.prep.type))await page.locator(`[data-cell="${action.prep.to}"]`).click();
  await page.locator(`[data-dir="${action.dir}"]`).click();
}
async function openRepairs(page){
 if(await page.locator('#repair-menu').getAttribute('aria-expanded')!=='true')await page.locator('#repair-menu').click();
}
// An isolated earned-star fixture lets UI failures surface before the long playthrough.
// The full six-condition test below earns every star through the actual puzzles.
test('scene controls, pending resume and designs',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const fixture=newHome();fixture.home.reached=50;
  for(let n=1;n<=50;n++)fixture.progress.completed[`pz-${100000+n}`]={reward:1,bestTurns:1,revision:1};
  await page.addInitScript(({key,save})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(save));},{key:HOME_KEY,save:fixture});
  await page.goto('/adventure.html');
  await expect(page.locator('#home-repairs')).toBeHidden();
  await page.locator('[data-edit-object="home-entry-0"]').click();
  await expect(page.locator('#home-repairs')).toBeVisible();
  await page.locator('#close-repairs').click();
  await expect(page.locator('#home-repairs')).toBeHidden();
  await page.getByRole('button',{name:'玄関へ',exact:true}).click();
  await page.getByRole('button',{name:'キッチンへ',exact:true}).click();
  await expect(page.locator('#home-screen')).toHaveAttribute('data-scene','kitchen');
  await page.locator('[data-area="entry"]').click();await openRepairs(page);
  for(const t of TASKS.slice(0,3)){
    await page.locator(`[data-repair="${t.id}"]`).click();
    await expect(page.locator(`[data-object="${t.id}"]`)).toHaveAttribute('data-state','building');
    if(t===TASKS[0]){await page.reload();await page.locator('[data-area="entry"]').click();await openRepairs(page);}
    await expect(page.locator(`[data-style="${t.id}"][data-choice="0"]`)).toBeVisible();
  }
  for(let i=0;i<3;i++){
    for(const t of TASKS.slice(0,3))await page.locator(`[data-style="${t.id}"][data-choice="${i}"]`).click();
    await expect(page.locator('[data-door-design]')).toHaveAttribute('data-door-design',['arch','glass','porthole'][i]);
    await page.getByRole('button',{name:'外観に戻る',exact:true}).click();
    await expect(page.locator('[data-door-design]')).toHaveAttribute('data-door-design',['arch','glass','porthole'][i]);
    await expect(page.locator('#home-balance')).toHaveText('42');
    await page.locator('[data-area="entry"]').click();await openRepairs(page);
  }
  await page.reload();await page.locator('[data-area="entry"]').click();await openRepairs(page);
  await expect(page.locator('[data-door-design]')).toHaveAttribute('data-door-design','porthole');
  expect(await page.locator('.home-bottom').evaluate(e=>getComputedStyle(e).position)).not.toBe('fixed');
  expect(await page.locator('.home-bottom').evaluate(e=>getComputedStyle(e).position)).not.toBe('sticky');
  for(const choice of await page.locator('[data-style]').all()){
    await choice.scrollIntoViewIfNeeded();
    expect(await choice.evaluate(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e===hit||e.contains(hit);})).toBeTruthy();
  }
  await page.locator('#close-repairs').click();await expect(page.locator('#home-repairs')).toBeHidden();
});
test('art comparisons at the same camera',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 for(const version of ['pr4','new'])for(const scene of ['exterior','entry']){
  for(const [state,style]of [['before',0],['complete',0],['complete',1],['complete',2],...(version==='new'?[['building',0]]:[])]){
   await page.goto(`/tests/fixtures/house-art-review.html?version=${version}&scene=${scene}&state=${state}&style=${style}`);
   await expect(page.locator('html')).toHaveAttribute('data-ready','true');
   await page.evaluate(async()=>{const urls=[...new Set([...document.querySelectorAll('#art image')].map(e=>e.href.baseVal))];await Promise.all(urls.map(src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=resolve;im.onerror=()=>reject(Error('Art image failed: '+src));im.src=src;})));});
   const label=`${version}-${scene}-${state}-${style}`;
   const shot=await page.locator('#art').screenshot({animations:'disabled',type:'jpeg',quality:82,path:info.outputPath(label+'.jpg')});
   if(info.project.name==='chromium')console.log(`ART_COMPARE_${label}=`+shot.toString('base64'));
  }
 }
 expect(errors).toEqual([]);
});
for(const width of [320,390,1440])test(`all 50 stages, unlock events and reload at ${width}px`,async({page},info)=>{
  await page.setViewportSize({width,height:900});const errors=[],httpErrors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400&&/\.(js|json|webp|png|css)(\?|$)/.test(r.url()))httpErrors.push(`${r.status()} ${r.url()}`);});
  await page.goto('/adventure.html');await page.locator('#play-next').click();
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
      await page.screenshot({animations:'disabled',path:info.outputPath(`chapter-stage-${number}-${width}.png`),fullPage:true});
      if(info.project.name==='chromium'&&width===390&&[10,23,50].includes(number)){
        const preview=await page.screenshot({animations:'disabled',type:'jpeg',quality:65,fullPage:true});console.log(`CHAPTER_PREVIEW_${number}=${preview.toString('base64')}`);
      }
    }
    if(number===1){
      await page.locator('#return-home').click();
      await expect(page.locator('#home-screen')).toHaveAttribute('data-scene','exterior');
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('#moves')).toHaveText('0'); // House keyboard input must not move the hidden puzzle.
      await page.locator('#play-next').click();
      await expect(page.locator('#board')).toHaveAttribute('data-stage','1');
    }
    const before=Number(await page.locator('#balance').textContent());
    // At stage 50 the first glove charge must be restored by Undo.
    if(number===50){
      await perform(page,proof.actions[0]);await expect(page.locator('#moves')).toHaveText('1');
      await page.locator('#undo').click();await expect(page.locator('#moves')).toHaveText('0');
      await expect(page.locator('[data-mode="glove"]')).toContainText('あと 1 回');
    }
    for(let i=0;i<proof.actions.length;i++){
      if(number===1)await page.locator('#board .cell.arrival:has(.star)').click();
      else await perform(page,proof.actions[i]);
      await expect(page.locator('#moves')).toHaveText(String(i+1));
    }
    await expect(page.locator('#notice')).toBeVisible();await expect(page.locator('#remaining')).toHaveText('0');await expect(page.locator('#balance')).toHaveText(String(before+1));
    if(number<50){await page.locator('#notice-primary').click();await page.locator('#play-next').click();}
  }
  await page.locator('#notice-primary').click();
  await expect(page.locator('#home-balance')).toHaveText('50');
  // The new exterior is the home; entering a room changes the actual artwork.
  await expect(page.locator('#home-screen')).toHaveAttribute('data-scene','exterior');
  await expect(page.locator('[data-scene-art="exterior"]')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  for(const b of await page.locator('.scene-hotspot,.object-target').all()){
    const box=await b.boundingBox();expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
  }
  await page.getByRole('button',{name:'玄関へ',exact:true}).click();
  await expect(page.locator('[data-scene-art="entry"]')).toBeVisible();
  await page.getByRole('button',{name:'キッチンへ',exact:true}).click();
  await expect(page.locator('#home-screen')).toHaveAttribute('data-scene','kitchen');
  await page.locator('[data-area="entry"]').click();await openRepairs(page);
  if(info.project.name==='chromium'&&width===390){
    await page.screenshot({animations:'disabled',path:info.outputPath('entry-before-390.png'),fullPage:true});
    console.log('SCENE_BEFORE_ENTRY='+ (await page.screenshot({animations:'disabled',type:'jpeg',quality:75,fullPage:true})).toString('base64'));
  }
  for(const t of TASKS){
    await page.locator(`[data-area="${t.area}"]`).click();await openRepairs(page);await page.locator(`[data-repair="${t.id}"]`).click();
    if(t===TASKS[0]){
      await expect(page.locator(`[data-object="${t.id}"]`)).toHaveAttribute('data-state','building');
      await expect(page.locator('#home-balance')).toHaveText('47');
      await page.reload(); // Paid construction resumes without a second debit.
      await page.locator('[data-area="entry"]').click();await openRepairs(page);
    }
    await expect(page.locator(`[data-style="${t.id}"][data-choice="2"]`)).toBeVisible();
    if(t!==TASKS.at(-1))await page.locator(`[data-style="${t.id}"][data-choice="2"]`).click();
  }
  await expect(page.locator('#notice-title')).toHaveText('トリケンの家が完成！');await page.locator('#notice-primary').click();
  await expect(page.locator('#home-balance')).toHaveText('10');
  // Every entry design has different geometry/materials and is shared by both views.
  const motifs=[['arch','timber','lantern'],['glass','clapboard','bell'],['porthole','masonry','globe']];
  for(let choice=0;choice<3;choice++){
    await page.locator('[data-area="entry"]').click();await openRepairs(page);
    for(const t of TASKS.slice(0,3))await page.locator(`[data-style="${t.id}"][data-choice="${choice}"]`).click();
    for(const scene of ['entry','exterior']){
      if(scene==='exterior')await page.getByRole('button',{name:'外観に戻る',exact:true}).click();
      await expect(page.locator(`[data-scene-art="${scene}"] [data-door-design]`)).toHaveAttribute('data-door-design',motifs[choice][0]);
      await expect(page.locator(`[data-scene-art="${scene}"]`)).toHaveAttribute('data-wall-design',motifs[choice][1]);
      await expect(page.locator(`[data-scene-art="${scene}"] [data-light-design]`)).toHaveAttribute('data-light-design',motifs[choice][2]);
      await expect(page.locator('#home-balance')).toHaveText('10');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
      if(info.project.name==='chromium'&&width===390){
        await page.screenshot({animations:'disabled',path:info.outputPath(`${scene}-design-${choice}-390.png`),fullPage:true});
        console.log(`SCENE_${scene.toUpperCase()}_${choice}=`+(await page.screenshot({animations:'disabled',type:'jpeg',quality:75,fullPage:true})).toString('base64'));
      }
    }
  }
  await page.reload();
  await page.locator('[data-area="entry"]').click();await openRepairs(page);
  for(const t of TASKS.slice(0,3))await expect(page.locator(`[data-style="${t.id}"][data-choice="2"]`)).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('[data-door-design]')).toHaveAttribute('data-door-design','porthole');
  for(const choice of await page.locator('[data-style]').all()){
    await choice.scrollIntoViewIfNeeded();
    expect(await choice.evaluate(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e===hit||e.contains(hit);})).toBeTruthy();
  }
  await page.screenshot({animations:'disabled',path:info.outputPath(`completed-house-${width}.png`),fullPage:true});
  if(info.project.name==='chromium'&&width===390)console.log('HOME_PREVIEW='+ (await page.screenshot({animations:'disabled',type:'jpeg',quality:65,fullPage:true})).toString('base64'));
  await page.reload();await expect(page.locator('#home-balance')).toHaveText('10');
  await page.locator('#play-next').click();await expect(page.locator('#board')).toHaveAttribute('data-stage','50');
  for(const action of proofs[49].actions)await perform(page,action);
  await expect(page.locator('#balance')).toHaveText('10');await expect(page.locator('#notice-text')).toContainText('獲得済み');
  expect(errors).toEqual([]);expect(httpErrors).toEqual([]);
});
