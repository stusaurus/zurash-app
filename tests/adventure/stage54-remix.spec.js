import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const pack=JSON.parse(fs.readFileSync(new URL('../../data/chapters/chapter-02/stage54-remix-candidates-v1.json',import.meta.url),'utf8'));
for(const width of [320,390]){
 test('stage54 remix: both candidate routes play full UI and preserve all saves at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto('/stage54-remix-lab.html');
  const before=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
  await expect(page.locator('#stage-choices button')).toHaveCount(2);
  for(let j=0;j<pack.stages.length;j++){
   const stage=pack.stages[j];
   await expect(page.locator('#fun-title')).toHaveText(stage.chapter.title);
   await expect(page.locator('#fun-pass-target')).toHaveText(stage.challenge.passThrough+'手以内');
   for(let i=0;i<stage.proof.length;i++){
    const {prep,dir}=stage.proof[i];
    await page.locator('[data-fun-mode="'+prep.type+'"]').click();
    if(prep.type==='wall'){
     await page.locator('#fun-board [data-cell="'+prep.from+'"]').click();
     await page.locator('#fun-board [data-cell="'+prep.to+'"]').click();
    }else if(['ice','warp'].includes(prep.type)){
     await page.locator('#fun-board [data-cell="'+prep.to+'"]').click();
    }
    await page.locator('[data-fun-dir="'+dir+'"]').click();
    await expect(page.locator('#fun-moves')).toHaveText(String(i+1));
   }
   await expect(page.locator('#fun-stars')).toHaveText('0');
   await expect(page.locator('#fun-rank')).toHaveText('Sランク合格！');
   await expect(page.locator('#fun-benchmark')).toContainText('最短 '+stage.challenge.minimumTurns+'手');
   await expect(page.locator('#fun-progress')).toContainText('Sランク '+(j+1)+'/2面');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await page.locator('#fun-next').click();
  }
  await expect(page.locator('#fun-title')).toHaveText(pack.stages[0].chapter.title);
  expect(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))).toEqual(before);
  expect(errors).toEqual([]);
 });
}
test('stage54 remix: page two direct selection and comparison links',async({page})=>{
 await page.goto('/chapter-two-review.html');
 await expect(page.locator('#stage54-remix-compare a')).toHaveCount(2);
 await page.locator('#stage54-remix-compare a').nth(1).click();
 await expect(page.locator('#fun-title')).toHaveText(pack.stages[1].chapter.title);
});
