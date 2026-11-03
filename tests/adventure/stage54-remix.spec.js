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
 await expect(page.locator('#stage54-remix-compare a')).toHaveCount(3);
 await page.locator('[data-variant="b"] a').click();
 await expect(page.locator('#fun-title')).toHaveText(pack.stages[1].chapter.title);
});

for(const width of [320,390])test('stage54 review: independent original A/B ratings and insight at '+width+'px',async({page})=>{
 await page.setViewportSize({width,height:844});
 await page.goto('/stage54-remix-lab.html?stage=1');
 const campaign=await page.evaluate(()=>localStorage.getItem('zurash-app:chapter-two-preview:v1'));
 await page.locator('#playtest-review summary').click();
 await page.locator('#review-enjoyment').selectOption('fun');
 await page.locator('#review-difficulty').selectOption('balanced');
 await page.locator('#review-insight').selectOption('strong');
 await page.locator('#review-note').fill('Aは壁の移動を考えるのがよかった');
 await page.locator('#playtest-form button[type="submit"]').click();
 await expect(page.locator('#review-status')).toContainText('保存しました');
 await page.locator('#stage-choices [data-stage-choice="2"]').click();
 await expect(page.locator('#playtest-review')).toHaveAttribute('open','');
 await expect(page.locator('#review-enjoyment')).toBeVisible();
 await expect(page.locator('#review-enjoyment')).toHaveValue('');
 await page.locator('#review-enjoyment').selectOption('okay');
 await page.locator('#review-difficulty').selectOption('hard');
 await page.locator('#review-insight').selectOption('some');
 await page.locator('#review-note').fill('Bは少し難しかった');
 await page.locator('#playtest-form button[type="submit"]').click();
 await page.goto('/chapter-two-review.html');
 await expect(page.locator('[data-variant]')).toHaveCount(3);
 await expect(page.locator('#stage54-compare-status')).toContainText('2案の感想');
 await expect(page.locator('[data-variant-review="original"]')).toHaveText('感想：未評価');
 await expect(page.locator('[data-variant-review="a"]')).toContainText('発見があって気持ちよかった');
 await expect(page.locator('[data-variant-review="b"]')).toContainText('少し発見があった');
 await expect(page.locator('[data-variant-note="a"]')).toHaveText('Aは壁の移動を考えるのがよかった');
 await expect(page.locator('[data-variant-note="b"]')).toHaveText('Bは少し難しかった');
 await page.locator('[data-variant="original"] a').click();
 await expect(page.locator('#fun-count')).toHaveText('STAGE 54');
 await page.locator('#playtest-review summary').click();
 await page.locator('#review-enjoyment').selectOption('fun');
 await page.locator('#review-insight').selectOption('strong');
 await page.locator('#playtest-form button[type="submit"]').click();
 await page.goto('/chapter-two-review.html');
 await expect(page.locator('#stage54-compare-status')).toContainText('3案の感想');
 await expect(page.locator('[data-variant-review="original"]')).toContainText('発見があって気持ちよかった');
 const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('zurash-app:chapter-two-playtest-review:v1')));
 expect(Object.keys(data.reviews)).toHaveLength(3);
 expect(await page.evaluate(()=>localStorage.getItem('zurash-app:chapter-two-preview:v1'))).toBe(campaign);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
