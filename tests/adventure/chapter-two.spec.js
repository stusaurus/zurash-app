import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const stages=JSON.parse(fs.readFileSync(new URL('../../data/chapters/chapter-02/adventure-v1.json',import.meta.url))).stages;
async function act(page,a){
 await page.locator('[data-fun-mode="'+a.prep.type+'"]').click();
 if(['wall','glove'].includes(a.prep.type))await page.locator('#fun-board [data-cell="'+a.prep.from+'"]').click();
 if(a.prep.to!==undefined)await page.locator('#fun-board [data-cell="'+a.prep.to+'"]').click();
 await page.locator('[data-fun-dir="'+a.dir+'"]').click();
 await expect(page.locator('#fun-retry')).toBeEnabled();
}
for(const width of [320,390,1440]){
 test('chapter two adventure: all mixed stages, unlock, save, hints, undo and retry at '+width,async({page})=>{
  await page.setViewportSize({width,height:844});await page.emulateMedia({reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
  await page.goto('/chapter-two.html?trial=1');
  await expect(page.locator('#fun-title')).toHaveText(stages[0].chapter.title);
  await expect(page.locator('[data-stage-choice="2"]')).toBeDisabled();
  const before=await page.evaluate(()=>localStorage.getItem('zurash-app:home-preview:ice-town:v2'));
  for(const [n,s]of stages.entries()){
   await expect(page.locator('#fun-title')).toHaveText(s.chapter.title);
   await expect(page.locator('#fun-count')).toContainText(String(s.chapter.number));
   if(n===0){
    for(let hint=1;hint<=4;hint++)await page.locator('#fun-hint').click();
    await expect(page.locator('#fun-feedback ol li')).toHaveCount(s.proof.length);
   }
   for(const [i,a]of s.proof.entries()){
    await act(page,a);await expect(page.locator('#fun-moves')).toHaveText(String(i+1));
    if(i===2){
     await page.reload();await expect(page.locator('#fun-moves')).toHaveText('3');
     await page.locator('#fun-undo').click();await expect(page.locator('#fun-moves')).toHaveText('2');await act(page,a);
    }
   }
   await expect(page.locator('#fun-rank')).toHaveText('Sランク合格！');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   if(n===stages.length-1){await page.screenshot({path:'test-results/chapter-two-'+test.info().project.name+'-'+width+'.png',fullPage:true});await page.reload();await expect(page.locator('#fun-result')).toBeVisible();}
   else await page.locator('#fun-next').click();
  }
  expect(await page.evaluate(()=>localStorage.getItem('zurash-app:home-preview:ice-town:v2'))).toBe(before);
  await page.locator('#fun-retry').click();await expect(page.locator('#fun-moves')).toHaveText('0');
  await page.reload();await expect(page.locator('#fun-moves')).toHaveText('0');
  expect(errors).toEqual([]);
 });
 test('chapter two adventure: first chapter requirement and trial entry at '+width,async({page})=>{
  await page.setViewportSize({width,height:844});await page.goto('/chapter-two.html');
  await expect(page.locator('#fun-title')).toHaveText('もうすぐ、新しい冒険へ');
  await page.getByRole('link',{name:'第2章だけ先行試遊する'}).click();
  await expect(page.locator('#fun-title')).toHaveText(stages[0].chapter.title);
 });
}
for(const width of [320,390,1440])test('chapter two adventure: direct practice70, all tools undo and separate save at '+width,async({page})=>{
 await page.setViewportSize({width,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/chapter-two.html?trial=1&practice=1&stage=70');
 const stage=stages.find(s=>s.chapter.number===70);
 await expect(page.locator('#fun-title')).toHaveText(stage.chapter.title);
 const original=await page.evaluate(()=>localStorage.getItem('zurash-app:chapter-two-preview:v1'));
 for(const [i,a]of stage.proof.entries()){
  await act(page,a);
  if(['ice','glove','warp'].includes(a.prep.type)){
   await page.locator('#fun-undo').click();await expect(page.locator('#fun-moves')).toHaveText(String(i));await act(page,a);
   await page.reload();await expect(page.locator('#fun-moves')).toHaveText(String(i+1));
  }
 }
 await expect(page.locator('#fun-rank')).toHaveText('Sランク合格！');
 expect(await page.evaluate(()=>localStorage.getItem('zurash-app:chapter-two-preview:v1'))).toBe(original);
 await page.locator('.chapter-map summary').click();
 await expect(page.locator('[data-stage-choice="1"]')).toBeEnabled();
 await page.locator('[data-stage-choice="1"]').click();await expect(page.locator('#fun-title')).toHaveText(stages[0].chapter.title);
});
