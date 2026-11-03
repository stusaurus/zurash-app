import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const pack=JSON.parse(fs.readFileSync(new URL('../../data/chapters/chapter-02/stage57-remix-candidates-v1.json',import.meta.url),'utf8'));
for(const width of [320,390]){
 test('stage57 remix: A/B full S-rank paths, gate states and saves '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('response',response=>{if(response.status()>=400)errors.push(response.status()+' '+response.url());});
  await page.goto('/stage57-remix-lab.html');
  const before=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
  await expect(page.locator('#stage-choices button')).toHaveCount(2);
  for(let j=0;j<2;j++){
   const stage=pack.stages[j];
   await expect(page.locator('#fun-title')).toHaveText(stage.chapter.title);
   for(let i=0;i<stage.proof.length;i++){
    const {prep,dir}=stage.proof[i];
    await page.locator('[data-fun-mode="'+prep.type+'"]').click();
    if(prep.type==='wall'){
     await page.locator('#fun-board [data-cell="'+prep.from+'"]').click();
     await page.locator('#fun-board [data-cell="'+prep.to+'"]').click();
    }
    await page.locator('[data-fun-dir="'+dir+'"]').click();
    await expect(page.locator('#fun-moves')).toHaveText(String(i+1));
    if(stage.provenance.toggleTurns.includes(i+1)){
     const isOpen=stage.provenance.toggleTurns.indexOf(i+1)%2===0;
     await expect(page.locator('#fun-gate-status')).toContainText(isOpen?'開いている':'閉じている');
    }
   }
   await expect(page.locator('#fun-stars')).toHaveText('0');
   await expect(page.locator('#fun-rank')).toHaveText('Sランク合格！');
   await expect(page.locator('#fun-benchmark')).toContainText('最短 '+stage.challenge.minimumTurns+'手');
   await page.locator('#fun-next').click();
  }
  expect(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))).toEqual(before);
  expect(errors).toEqual([]);
 });
 test('stage57 remix: A/B human reviews stay separate and persistent '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  await page.goto('/stage57-remix-lab.html?stage=1');
  await page.locator('#playtest-review summary').click();
  await page.locator('#review-enjoyment').selectOption('fun');
  await page.locator('#review-insight').selectOption('strong');
  await page.locator('#review-note').fill('Aはゲートが予想外に動いて面白かった');
  await page.locator('#playtest-form button[type=submit]').click();
  await page.locator('[data-stage-choice="2"]').click();
  await page.locator('#review-enjoyment').selectOption('okay');
  await page.locator('#review-insight').selectOption('some');
  await page.locator('#playtest-form button[type=submit]').click();
  await page.goto('/stage57-remix-lab.html?stage=1');
  await page.locator('#playtest-review summary').click();
  await expect(page.locator('#review-insight')).toHaveValue('strong');
  await page.locator('[data-stage-choice="2"]').click();
  await expect(page.locator('#review-insight')).toHaveValue('some');
  expect(await page.evaluate(()=>localStorage.getItem('zurash-app:chapter-two-preview:v1'))).toBe(null);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}
