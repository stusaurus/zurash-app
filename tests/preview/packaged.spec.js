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
  await page.getByRole('link',{name:'54・57・59・70面を比較する'}).click();
  await expect(page.locator('[data-review-stage]')).toHaveCount(4);
  await expect(page.locator('#review-summary')).toContainText('12案中 0案の感想');
  await expect(page.locator('#stage54-remix-compare a')).toHaveCount(3);
  await page.locator('[data-variant="a"] a').click();
  await page.locator('#playtest-review summary').click();
  await expect(page.locator('#review-insight')).toBeVisible();
  await expect(page.locator('#fun-title')).toHaveText('氷海の壁リレー');
  await page.goto('/chapter-two-review.html');
  await expect(page.locator('[data-variant59]')).toHaveCount(3);
  await page.locator('[data-variant59="a"] a').click();
  await expect(page.locator('#fun-title')).toHaveText('氷海の往復航路');
  await expect(page.locator('#fun-warp-remaining')).toHaveText('2');
  await page.goto('/chapter-two-review.html');
  await expect(page.locator('[data-variant57]')).toHaveCount(3);
  await page.locator('[data-variant57="a"] a').click();
  await expect(page.locator('#fun-title')).toHaveText('七つ星と氷扉の連鎖');
  await page.goto('/chapter-two-review.html');
  await expect(page.locator('[data-variant70]')).toHaveCount(3);
  await page.locator('[data-variant70="a"] a').click();
  await expect(page.locator('#fun-title')).toHaveText('五つの灯標・光の連鎖');
  await expect(page.locator('#star-journey-label')).toHaveText('集めた星 0 / 5');
  await expect(page.locator('#star-journey-track')).toHaveAttribute('aria-valuenow','0');
  await expect(page.locator('#fun-ice-remaining')).toHaveText('1');
  await expect(page.locator('#fun-glove-remaining')).toHaveText('1');
  await page.goto('/chapter-two-review.html');
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

for(const width of [320,390]){
 test('packaged preview: 54 A/B review stays open and safely exports text at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  await page.addInitScript(()=>{
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
    writeText:async value=>{window.__copiedComparisonText=value;}
   }});
  });
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await page.goto('/stage54-remix-lab.html?stage=1');
  await expect(page.locator('#fun-title')).toHaveText('氷海の壁リレー');
  await page.locator('#playtest-review summary').click();
  await page.locator('#review-enjoyment').selectOption('fun');
  await page.locator('#review-insight').selectOption('strong');
  await page.locator('#review-note').fill('Aで壁をずらすひらめきが面白かった');
  await page.locator('#playtest-form button[type=submit]').click();
  await expect(page.locator('#review-status')).toContainText('保存しました');
  await page.locator('#stage-choices [data-stage-choice="2"]').click();
  await expect(page.locator('#playtest-review')).toHaveAttribute('open','');
  await expect(page.locator('#review-enjoyment')).toBeVisible();
  await expect(page.locator('#review-enjoyment')).toHaveValue('');
  await page.locator('#review-enjoyment').selectOption('okay');
  await page.locator('#review-note').fill('Bは手数を読むのが少し難しい');
  await page.locator('#playtest-form button[type=submit]').click();
  await page.goto('/chapter-two-review.html');
  await expect(page.locator('#review-summary')).toContainText('12案中 2案の感想');
  await expect(page.locator('#copy-review')).toBeEnabled();
  await page.locator('#copy-review').click();
  await expect(page.locator('#export-status')).toContainText('コピーしました');
  const copied=await page.evaluate(()=>window.__copiedComparisonText);
  expect(copied).toContain('評価済み 2/12案');
  expect(copied).toContain('Aで壁をずらすひらめきが面白かった');
  expect(copied).toContain('Bは手数を読むのが少し難しい');
  expect(copied).toContain('現行70面：未評価');
  expect(await page.evaluate(()=>localStorage.getItem('zurash-app:chapter-two-preview:v1'))).toBe(null);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}

for(const width of [320,390]){
 test('packaged preview: move journal reflects play, undo and candidate change at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  await page.goto('/stage70-finale-lab.html?stage=1');
  await expect(page.locator('#move-history-summary')).toContainText('0手');
  await expect(page.locator('#move-history')).not.toHaveAttribute('open','');
  await page.locator('[data-fun-mode="none"]').click();
  await page.locator('[data-fun-dir="3"]').click();
  await expect(page.locator('#fun-moves')).toHaveText('1');
  await expect(page.locator('#star-journey-track')).toHaveAttribute('aria-valuenow','0');
  await expect(page.locator('#move-history-summary')).toContainText('1手');
  await page.locator('#move-history summary').click();
  await expect(page.locator('#move-history-list li')).toHaveCount(1);
  await expect(page.locator('#move-history-list')).toContainText('左へ滑走');
  await page.locator('#fun-undo').click();
  await expect(page.locator('#move-history-summary')).toContainText('0手');
  await expect(page.locator('#move-history-list')).toContainText('まだ操作していません');
  await page.locator('[data-stage-choice="2"]').click();
  await expect(page.locator('#move-history-summary')).toContainText('0手');
  await expect(page.locator('#move-history')).not.toHaveAttribute('open','');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}

// Item feedback is deliberately transient; check it while it is visible,
// then verify Undo removes it without persisting a separate effect state.
for(const width of [320,390]){
 test('packaged preview: ice item feedback appears without blocking the next turn at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  await page.goto('/stage54-remix-lab.html?stage=1');
  await page.locator('[data-fun-mode="ice"]').click();
  await page.locator('#fun-board [data-cell="24"]').click();
  await page.locator('[data-fun-dir="2"]').click();
  await expect(page.locator('#fun-moves')).toHaveText('1');
  await expect(page.locator('#fun-move-effect')).toContainText('アイスを置いた！');
  await expect(page.locator('#fun-board [data-cell="24"].board-cue-item')).toHaveCount(1);
  await expect(page.locator('#fun-retry')).toBeEnabled();
  await page.locator('#fun-undo').click();
  await expect(page.locator('#fun-move-effect')).toHaveCount(0);
  await expect(page.locator('#fun-board .board-cue-item')).toHaveCount(0);
  await expect(page.locator('#fun-moves')).toHaveText('0');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}
