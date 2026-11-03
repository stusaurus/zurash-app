import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const stages=JSON.parse(fs.readFileSync(new URL('../../data/chapters/chapter-02/stage59-return-candidates-v1.json',import.meta.url),'utf8')).stages;
for(const width of [320,390]){
 test('stage59 return: two warps, gate, undo, both S proofs and isolated saves at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto('/stage59-return-lab.html');
  const original=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
  await expect(page.locator('#stage-choices button')).toHaveCount(2);
  for(let j=0;j<stages.length;j++){
   const stage=stages[j];
   await expect(page.locator('#fun-title')).toHaveText(stage.chapter.title);
   await expect(page.locator('#fun-warp-remaining')).toHaveText('2');
   for(let i=0;i<stage.proof.length;i++){
    const {prep,dir}=stage.proof[i];
    await page.locator('[data-fun-mode="'+prep.type+'"]').click();
    if(prep.type==='wall'){
     await page.locator('#fun-board [data-cell="'+prep.from+'"]').click();
     await page.locator('#fun-board [data-cell="'+prep.to+'"]').click();
    }else if(prep.type==='warp'){
     await page.locator('#fun-board [data-cell="'+prep.to+'"]').click();
    }
    await page.locator('[data-fun-dir="'+dir+'"]').click();
    await expect(page.locator('#fun-moves')).toHaveText(String(i+1));
    // Wait until the sliding animation has finished before starting another move.
    await expect(page.locator('#fun-retry')).toBeEnabled();
    if(i===2)await expect(page.locator('#fun-warp-remaining')).toHaveText('1');
    if(i===6){
     await expect(page.locator('#fun-warp-remaining')).toHaveText('0');
     await page.locator('#fun-undo').click();
     await expect(page.locator('#fun-moves')).toHaveText('6');
     await expect(page.locator('#fun-warp-remaining')).toHaveText('1');
     await page.locator('[data-fun-mode="warp"]').click();
     await page.locator('#fun-board [data-cell="0"]').click();
     await page.locator('[data-fun-dir="2"]').click();
     await expect(page.locator('#fun-moves')).toHaveText('7');
     await expect(page.locator('#fun-retry')).toBeEnabled();
     await expect(page.locator('#fun-warp-remaining')).toHaveText('0');
    }
    if(i===9)await expect(page.locator('#fun-gate-status')).toContainText('開いている');
   }
   await expect(page.locator('#fun-stars')).toHaveText('0');
   await expect(page.locator('#fun-rank')).toHaveText('Sランク合格！');
   await expect(page.locator('#fun-benchmark')).toContainText('最短 '+stage.challenge.minimumTurns+'手');
   await expect(page.locator('#fun-progress')).toContainText('Sランク '+(j+1)+'/2面');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await page.locator('#fun-next').click();
  }
  expect(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))).toEqual(original);
  expect(errors).toEqual([]);
 });
 test('stage59 return: A/B review remains local and appears in three-way comparison at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  await page.goto('/stage59-return-lab.html?stage=1');
  await page.locator('#playtest-review summary').click();
  await page.locator('#review-enjoyment').selectOption('fun');
  await page.locator('#review-insight').selectOption('strong');
  await page.locator('#review-note').fill('島から帰るところが気持ちいい');
  await page.locator('#playtest-form button[type="submit"]').click();
  await expect(page.locator('#review-status')).toContainText('保存しました');
  await page.locator('[data-stage-choice="2"]').click();
  await page.locator('#review-enjoyment').selectOption('okay');
  await page.locator('#review-insight').selectOption('some');
  await page.locator('#playtest-form button[type="submit"]').click();
  await page.goto('/chapter-two-review.html');
  await expect(page.locator('[data-variant59]')).toHaveCount(3);
  await expect(page.locator('[data-variant59-review="original"]')).toContainText('未評価');
  await expect(page.locator('[data-variant59-review="a"]')).toContainText('発見があって気持ちよかった');
  await expect(page.locator('[data-variant59-review="b"]')).toContainText('少し発見があった');
  await expect(page.locator('#stage59-compare-status')).toContainText('2案の感想');
  expect(await page.evaluate(()=>localStorage.getItem('zurash-app:chapter-two-preview:v1'))).toBe(null);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}
