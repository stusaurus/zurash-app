import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const pack=JSON.parse(fs.readFileSync(new URL('../../data/chapters/chapter-02/stage70-finale-candidates-v1.json',import.meta.url),'utf8'));
for(const width of [320,390]){
 test('stage70 finale: A/B complete gate and 3 items with S rank '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto('/stage70-finale-lab.html');
  const original=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
  await expect(page.locator('#stage-choices button')).toHaveCount(2);
  for(let j=0;j<pack.stages.length;j++){
   const s=pack.stages[j];
   await expect(page.locator('#fun-title')).toHaveText(s.chapter.title);
   await expect(page.locator('#fun-ice-remaining')).toHaveText('1');
   await expect(page.locator('#fun-glove-remaining')).toHaveText('1');
   await expect(page.locator('#fun-warp-remaining')).toHaveText('2');
   for(const [i,action] of s.proof.entries()){
    const {prep,dir}=action;
    await page.locator('[data-fun-mode="'+prep.type+'"]').click();
    if(prep.type==='wall'||prep.type==='glove'){
     await page.locator('#fun-board [data-cell="'+prep.from+'"]').click();
     await page.locator('#fun-board [data-cell="'+prep.to+'"]').click();
    }else if(prep.type==='ice'||prep.type==='warp'){
     await page.locator('#fun-board [data-cell="'+prep.to+'"]').click();
    }
    await page.locator('[data-fun-dir="'+dir+'"]').click();
    await expect(page.locator('#fun-moves')).toHaveText(String(i+1));
    if(prep.type==='ice')await expect(page.locator('#fun-ice-remaining')).toHaveText('0');
    if(prep.type==='glove')await expect(page.locator('#fun-glove-remaining')).toHaveText('0');
   }
   await expect(page.locator('#fun-warp-remaining')).toHaveText('0');
   await expect(page.locator('#fun-stars')).toHaveText('0');
   await expect(page.locator('#fun-rank')).toHaveText('Sランク合格！');
   await expect(page.locator('#fun-benchmark')).toContainText('最短 '+s.challenge.minimumTurns+'手');
   await expect(page.locator('#move-history-summary')).toContainText(s.proof.length+'手');
   await page.locator('#move-history summary').click();
   await expect(page.locator('#move-history-list li')).toHaveCount(5);
   await expect(page.locator('#move-history-list')).toContainText('へ滑走');
   await expect(page.locator('#fun-review-now')).toBeVisible();
   await expect(page.locator('#playtest-review')).not.toHaveAttribute('open','');
   await page.locator('#fun-review-now').click();
   await expect(page.locator('#playtest-review')).toHaveAttribute('open','');
   await expect(page.locator('#review-enjoyment')).toBeFocused();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await page.locator('#fun-next').click();
   await expect(page.locator('#playtest-review')).not.toHaveAttribute('open','');
   await expect(page.locator('#move-history-summary')).toContainText('0手');
  }
  expect(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))).toEqual(original);
  expect(errors).toEqual([]);
 });
 test('stage70 finale: independent reviews enable private JSON export '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  await page.goto('/stage70-finale-lab.html?stage=1');
  await page.locator('#playtest-review summary').click();
  await page.locator('#review-enjoyment').selectOption('fun');
  await page.locator('#review-insight').selectOption('strong');
  await page.locator('#review-note').fill('Aはテンポよく星が取れた');
  await page.locator('#playtest-form button[type=submit]').click();
  await expect(page.locator('#review-status')).toContainText('保存しました');
  await page.locator('[data-stage-choice="2"]').click();
  await page.locator('#review-enjoyment').selectOption('okay');
  await page.locator('#review-insight').selectOption('some');
  await page.locator('#playtest-form button[type=submit]').click();
  await page.goto('/chapter-two-review.html');
  await expect(page.locator('[data-variant70]')).toHaveCount(3);
  await expect(page.locator('#stage70-compare-status')).toContainText('2案の感想');
  await expect(page.locator('[data-variant70-review="a"]')).toContainText('発見があって気持ちよかった');
  await expect(page.locator('[data-variant70-review="b"]')).toContainText('少し発見があった');
  await expect(page.locator('#export-review')).toBeEnabled();
  const evt=page.waitForEvent('download');
  await page.locator('#export-review').click();
  const file=await evt;
  expect(file.suggestedFilename()).toBe('zurash-chapter-two-comparison-reviews.json');
  expect(await page.evaluate(()=>localStorage.getItem('zurash-app:chapter-two-preview:v1'))).toBe(null);
 });
}
