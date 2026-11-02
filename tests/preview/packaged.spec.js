import {test,expect} from '@playwright/test';
for(const width of [320,390]){
 test('packaged preview boots and preserves chapter two and home at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'氷の向こうへの冒険'})).toBeVisible();
  await expect(page.getByRole('link',{name:'第51面から冒険する'})).toBeVisible();
  await page.getByRole('link',{name:'54・57・59面を比較する'}).click();
  await expect(page.locator('[data-review-stage]')).toHaveCount(3);
  await expect(page.locator('#review-summary')).toContainText('0面の感想');
  await page.locator('[data-review-stage="54"] a.primary').click();
  await expect(page.locator('#fun-count')).toHaveText('STAGE 54');
  await expect(page.locator('#fun-title')).not.toHaveText('読み込み中…');
  await page.locator('#playtest-review summary').click();
  await expect(page.locator('#review-enjoyment')).toBeVisible();
  await expect(page.locator('#expedition-map')).toBeAttached();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.goto('/adventure.html');
  await expect(page.locator('#home-screen')).toBeAttached();
  await expect(page.locator('#chapter-two-link')).toBeAttached();
  expect(errors).toEqual([]);
 });
}
