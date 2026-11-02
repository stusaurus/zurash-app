import {test,expect} from '@playwright/test';
for(const width of [320,390]){
 test('review hub: three research candidates, safe saved feedback, optional export at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto('/chapter-two-review.html');
  await expect(page.locator('[data-review-stage]')).toHaveCount(3);
  await expect(page.locator('[data-variant]')).toHaveCount(3);
  await expect(page.locator('#review-summary')).toContainText('0面の感想');
  await expect(page.locator('#export-review')).toBeDisabled();
  await expect(page.locator('[data-review-stage="54"]')).toContainText('STAGE 54');
  await expect(page.locator('[data-review-stage="57"]')).toContainText('67面と比べる');
  await expect(page.locator('[data-review-stage="59"]')).toContainText('65面と比べる');
  const saveBefore=await page.evaluate(()=>localStorage.getItem('zurash-app:chapter-two-preview:v1'));
  const link=page.locator('[data-review-stage="57"] a.primary');
  await link.click();
  await expect(page.locator('#fun-count')).toHaveText('STAGE 57');
  await page.locator('#playtest-review summary').click();
  await page.locator('#review-enjoyment').selectOption('fun');
  await page.locator('#review-difficulty').selectOption('hard');
  await page.locator('#review-note').fill('三度開いてひらめいた！');
  await page.locator('#playtest-form button[type="submit"]').click();
  await expect(page.locator('#review-status')).toContainText('保存しました');
  await page.goto('/chapter-two-review.html');
  await expect(page.locator('#review-summary')).toContainText('1面の感想');
  await expect(page.locator('[data-review-label="57"]')).toContainText('面白かった');
  await expect(page.locator('[data-review-note="57"]')).toHaveText('三度開いてひらめいた！');
  await expect(page.locator('#export-review')).toBeEnabled();
  const download=page.waitForEvent('download');await page.locator('#export-review').click();
  const artifact=await download;expect(artifact.suggestedFilename()).toContain('comparison-reviews.json');
  expect(await page.evaluate(()=>localStorage.getItem('zurash-app:chapter-two-preview:v1'))).toBe(saveBefore);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}
test('review hub: corrupted feedback is not overwritten or interpreted as a rating',async({page})=>{
 await page.goto('/chapter-two-review.html');
 await page.evaluate(()=>localStorage.setItem('zurash-app:chapter-two-playtest-review:v1','{"version":999,"future":"keep"}'));
 await page.reload();
 await expect(page.locator('#review-error')).toBeVisible();
 await expect(page.locator('#export-review')).toBeDisabled();
 expect(await page.evaluate(()=>localStorage.getItem('zurash-app:chapter-two-playtest-review:v1'))).toBe('{"version":999,"future":"keep"}');
});
