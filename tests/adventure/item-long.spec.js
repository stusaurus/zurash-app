import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const pack=JSON.parse(fs.readFileSync(new URL('../../data/chapters/chapter-02/item-long-candidates-v1.json',import.meta.url),'utf8'));
test('item long trials replay 19,16,20-turn shortest routes and preserve existing saves',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await page.goto('/item-long-lab.html');
 const before=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
 await expect(page.locator('#stage-choices button')).toHaveCount(3);
 for(let j=0;j<pack.stages.length;j++){
  const stage=pack.stages[j];
  await expect(page.locator('#fun-title')).toHaveText(stage.chapter.title);
  await expect(page.locator('#fun-board')).toHaveAttribute('data-stage',String(j+1));
  await expect(page.locator('#fun-pass-target')).toHaveText(stage.challenge.passThrough+'手以内');
  if(j===0){
   await page.locator('#fun-hint').click();
   await expect(page.locator('#fun-feedback strong')).toHaveText('ヒント① 考え方');
  }
  let used=0;
  for(let i=0;i<stage.proof.length;i++){
   const {prep,dir}=stage.proof[i];
   await page.locator('[data-fun-mode="'+prep.type+'"]').click();
   if(['wall','glove'].includes(prep.type)){
    await page.locator('#fun-board [data-cell="'+prep.from+'"]').click();
    await page.locator('#fun-board [data-cell="'+prep.to+'"]').click();
   }else if(['ice','warp'].includes(prep.type)){
    await page.locator('#fun-board [data-cell="'+prep.to+'"]').click();
    used++;
   }
   if(prep.type==='glove')used++;
   await page.locator('[data-fun-dir="'+dir+'"]').click();
   await expect(page.locator('#fun-moves')).toHaveText(String(i+1));
   // The counter updates before WebKit finishes the slide animation.
   // Do not fire the next preparation while controls are temporarily locked.
   await expect(page.locator('#fun-retry')).toBeEnabled();
  }
  expect(used).toBe(1);
  await expect(page.locator('#fun-stars')).toHaveText('0');
  await expect(page.locator('#fun-rank')).toHaveText('Sランク合格！');
  await expect(page.locator('#fun-benchmark')).toContainText('最短 '+stage.challenge.minimumTurns+'手');
  await expect(page.locator('[data-stage-choice="'+(j+1)+'"] .fun-rank-mark')).toHaveText('S');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#fun-next').click();
 }
 await expect(page.locator('#fun-title')).toHaveText(pack.stages[0].chapter.title);
 expect(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))).toEqual(before);
 expect(errors).toEqual([]);
});
