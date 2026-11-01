import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const stage=JSON.parse(fs.readFileSync(new URL('../../data/chapters/chapter-02/gate-long-candidates-v1.json',import.meta.url),'utf8')).stages[0];
for(const width of [320,390]){
 test('gate long trials stage 56: 16 real actions, switch/undo and save isolation at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto('/gate-long-lab.html');
  const saved=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
  await expect(page.locator('#fun-title')).toHaveText(stage.chapter.title);
  await expect(page.locator('#fun-gate-status')).toContainText('閉じている');
  await expect(page.locator('#fun-pass-target')).toHaveText('20手以内');
  await expect(page.locator('#fun-board')).toHaveAttribute('data-stage','1');
  await page.locator('#fun-hint').click();
  await expect(page.locator('#fun-feedback strong')).toHaveText('ヒント① 考え方');
  for(let i=0;i<stage.proof.length;i++){
   const action=stage.proof[i];
   await page.locator('[data-fun-mode="'+action.prep.type+'"]').click();
   if(action.prep.type==='wall'){
    await page.locator('#fun-board [data-cell="'+action.prep.from+'"]').click();
    await page.locator('#fun-board [data-cell="'+action.prep.to+'"]').click();
   }
   await page.locator('[data-fun-dir="'+action.dir+'"]').click();
   await expect(page.locator('#fun-moves')).toHaveText(String(i+1));
   if(i===7){
    await expect(page.locator('#fun-gate-status')).toContainText('開いている');
    await expect(page.locator('#fun-prompt')).toContainText('扉が開いた');
    await page.locator('#fun-undo').click();
    await expect(page.locator('#fun-moves')).toHaveText('7');
    await expect(page.locator('#fun-gate-status')).toContainText('閉じている');
    await page.locator('[data-fun-mode="wall"]').click();
    await page.locator('#fun-board [data-cell="5"]').click();
    await page.locator('#fun-board [data-cell="6"]').click();
    await page.locator('[data-fun-dir="0"]').click();
    await expect(page.locator('#fun-gate-status')).toContainText('開いている');
    await expect(page.locator('#fun-moves')).toHaveText('8');
   }
  }
  await expect(page.locator('#fun-stars')).toHaveText('0');
  await expect(page.locator('#fun-rank')).toHaveText('Sランク合格！');
  await expect(page.locator('#fun-benchmark')).toContainText('最短 16手');
  await expect(page.locator('#fun-progress')).toContainText('Sランク 1/1面');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))).toEqual(saved);
  expect(errors).toEqual([]);
 });
}
