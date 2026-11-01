import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const stage=JSON.parse(fs.readFileSync(new URL('../../data/chapters/chapter-02/gate-closure-candidates-v1.json',import.meta.url),'utf8')).stages[0];
for(const width of [320,390]){
 test('gate closure trials stage58: 17 real actions, closed stopper, undo and save isolation at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto('/gate-closure-lab.html');
  const saved=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
  await expect(page.locator('#fun-title')).toHaveText(stage.chapter.title);
  await expect(page.locator('#fun-pass-target')).toHaveText('22手以内');
  await expect(page.locator('#fun-gate-status')).toContainText('閉じている');
  await page.locator('#fun-hint').click();
  await expect(page.locator('#fun-feedback strong')).toHaveText('ヒント① 考え方');
  for(let i=0;i<stage.proof.length;i++){
   const {prep,dir}=stage.proof[i];
   await page.locator('[data-fun-mode="'+prep.type+'"]').click();
   if(prep.type==='wall'){
    await page.locator('#fun-board [data-cell="'+prep.from+'"]').click();
    await page.locator('#fun-board [data-cell="'+prep.to+'"]').click();
   }
   await page.locator('[data-fun-dir="'+dir+'"]').click();
   await expect(page.locator('#fun-moves')).toHaveText(String(i+1));
   if(i===1)await expect(page.locator('#fun-gate-status')).toContainText('開いている');
   if(i===15){
    await expect(page.locator('#fun-gate-status')).toContainText('閉じている');
    await expect(page.locator('#fun-prompt')).toContainText('扉が閉じた');
    await expect(page.locator('#fun-stars')).toHaveText('1');
    await page.locator('#fun-undo').click();
    await expect(page.locator('#fun-moves')).toHaveText('15');
    await expect(page.locator('#fun-gate-status')).toContainText('開いている');
    await page.locator('[data-fun-mode="none"]').click();
    await page.locator('[data-fun-dir="2"]').click();
    await expect(page.locator('#fun-moves')).toHaveText('16');
    await expect(page.locator('#fun-gate-status')).toContainText('閉じている');
   }
  }
  await expect(page.locator('#fun-stars')).toHaveText('0');
  await expect(page.locator('#fun-rank')).toHaveText('Sランク合格！');
  await expect(page.locator('#fun-benchmark')).toContainText('最短 17手');
  await expect(page.locator('#fun-progress')).toContainText('Sランク 1/1面');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))).toEqual(saved);
  expect(errors).toEqual([]);
 });
}
