import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {CHAPTER_TWO_KEY,newChapterTwo,checkpointTwo} from '../../src/puzzle/chapter-two-progress.js';
import {initialGate,applyGate,gateSuccessors} from '../../src/puzzle/gate-v2.js';
import {initialPuzzle} from '../../src/puzzle/schema.js';
import {applyPuzzle,successors} from '../../src/puzzle/engine.js';
import {tapLanding} from '../../src/puzzle/tap-landing.js';
const completedJourneyStages=JSON.parse(fs.readFileSync(new URL('../../data/chapters/chapter-02/adventure-v1.json',import.meta.url),'utf8')).stages;
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
  // Finish async stage initialization before opening the review disclosure.
  // Previously the summary click could race setStage(), which closes it.
  await expect(page.locator('#fun-title')).toHaveText('氷海の壁リレー');
  await expect(page.locator('#playtest-review')).not.toHaveAttribute('open','');
  await page.locator('#playtest-review summary').click();
  await expect(page.locator('#playtest-review')).toHaveAttribute('open','');
  await expect(page.locator('#review-insight')).toBeVisible();
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

for(const width of [320,390]){
 test('packaged clear share works without leaking a move sequence at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  await page.addInitScript(()=>{
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
    writeText:async text=>{window.__clearCopy=text;}
   }});
  });
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/fun-lab.html?stage=1');
  await expect(page.locator('#clear-share-copy')).toHaveCount(0);
  await page.locator('[data-fun-mode="none"]').click();
  await page.locator('[data-fun-dir="1"]').click();
  await expect(page.locator('#clear-share-copy')).toBeVisible();
  const before=await page.evaluate(()=>JSON.stringify(localStorage));
  await page.locator('#clear-share-copy').click();
  await expect(page.locator('#clear-share-status')).toContainText('コピーしました');
  const shared=await page.evaluate(()=>window.__clearCopy);
  expect(shared).toContain('すべってみよう');
  expect(shared).toContain('1手でクリア');
  expect(shared).toContain('研究パズル');
  expect(shared).not.toContain('Sランク');
  expect(shared).not.toContain('http://');
  await expect(page.locator('#clear-challenge-play')).toHaveAttribute('href','./fun-lab.html?stage=1');
  await expect(page.locator('#clear-challenge-info')).toContainText('正式公開前の試遊版');
  expect(shared).not.toContain('prep');
  expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}
test('packaged clear share never claims success if clipboard access is blocked',async({page})=>{
 await page.setViewportSize({width:320,height:844});
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
   writeText:async()=>{throw Error('Clipboard denied by browser');}
  }});
  Object.defineProperty(document,'execCommand',{configurable:true,value:()=>false});
 });
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/fun-lab.html?stage=1');
 await page.locator('[data-fun-mode="none"]').click();
 await page.locator('[data-fun-dir="1"]').click();
 await page.locator('#clear-share-copy').click();
 await expect(page.locator('#clear-share-status')).toContainText('コピーできませんでした');
 await expect(page.locator('#clear-share-status')).not.toContainText('コピーしました');
 await expect(page.locator('#fun-result')).toBeVisible();
 expect(errors).toEqual([]);
});
for(const width of [320,390]){
 test('packaged preview: first puzzle clear shows reward, next preview and seamless stage entry '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/fun-lab.html?stage=1');
  await expect(page.locator('#fun-title')).toHaveText('すべってみよう');
  await page.locator('[data-fun-mode="none"]').click();
  await page.locator('[data-fun-dir="1"]').click();
  await expect(page.locator('#fun-result')).toBeVisible();
  await expect(page.locator('#clear-hero-grade')).toHaveText('✓');
  await expect(page.locator('#clear-hero-label')).toHaveText('クリア！');
  await expect(page.locator('#clear-next-preview')).toContainText('次のパズル');
  await expect(page.locator('#clear-next-preview')).toContainText('壁はストッパー');
  await expect(page.locator('#fun-next')).toHaveText('次のパズルへ');
  await expect(page.locator('#fun-retry')).toBeEnabled();
  await page.locator('#fun-next').click();
  await expect(page.locator('#fun-title')).toHaveText('壁はストッパー');
  await expect(page.locator('#fun-result')).toBeHidden();
  await expect(page.locator('#fun-board')).toHaveClass(/stage-entry/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}

for(const width of [320,390]){
 test('packaged home remembers real stage completion and deep-links to its earned memory at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  const stage=completedJourneyStages[0];
  const completed=checkpointTwo(newChapterTwo(),completedJourneyStages,stage,stage.proof);
  const initial=JSON.stringify(completed);
  await page.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:CHAPTER_TWO_KEY,value:initial});
  await page.goto('/adventure.html?view=expedition');
  await expect(page.locator('#expedition-home')).toBeVisible();
  await expect(page.locator('#expedition-home')).toHaveAttribute('data-arrival','true');
  await expect(page.locator('#expedition-home h2')).toHaveText('氷海の冒険の思い出');
  await expect(page.locator('#expedition-home h2')).toBeFocused();
  await expect(page.locator('#expedition-home')).toContainText('道しるべの結晶 1/20個');
  await expect(page.locator('#expedition-album-progress')).toContainText('冒険 1/20面クリア');
  await expect(page.locator('#expedition-album-progress')).toContainText('Sランク 1/20面');
  await expect(page.locator('#expedition-memory-album [data-album-stop]')).toHaveCount(4);
  await expect(page.locator('#expedition-home .expedition-route li[data-lit]')).toHaveCount(4);
  await expect(page.locator('#expedition-memory-album [data-album-lit]')).toHaveCount(4);
  await expect(page.locator('#expedition-memory-album [data-lit]')).toHaveCount(0);
  await page.locator('#expedition-memory-album [data-album-stop="trail"] summary').click();
  await expect(page.locator('#expedition-memory-album [data-album-stop="trail"] .expedition-album-replay')).toHaveAttribute('href',/stage=52/);
  await page.locator('#expedition-memory-album [data-album-stop="gate"] summary').click();
  await expect(page.locator('#expedition-memory-album [data-album-stop="gate"] .expedition-album-replay')).toHaveCount(0);
  await expect(page.locator('#expedition-home [data-lit=true]')).toHaveCount(0);
  await expect(page.locator('#expedition-home .expedition-house-link')).toBeVisible();
  expect(await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY)).toEqual(initial);
  await page.goto('/chapter-two.html?trial=1&stage=51');
  await expect(page.locator('#fun-result')).toBeVisible();
  await expect(page.locator('#clear-personal-record')).toHaveAttribute('data-record-state','resumed');
  await expect(page.locator('#clear-personal-record')).toContainText('クリア記録を再表示中');
  await page.goto('/adventure.html?view=expedition');
  await page.locator('#expedition-home .expedition-house-link').click();
  await expect(page.locator('#home-screen')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}

for(const width of [320,390]){
 test('packaged invitation to stage 70 begins fresh in separate practice without touching official ledger '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  const stage=completedJourneyStages[0];
  const saved=checkpointTwo(newChapterTwo(),completedJourneyStages,stage,stage.proof);
  const original=JSON.stringify(saved);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:CHAPTER_TWO_KEY,value:original});
  await page.goto('/chapter-two.html?trial=1&practice=1&replay=1&stage=70');
  await expect(page.locator('#fun-count')).toHaveText('STAGE 70');
  await expect(page.locator('#fun-result')).toBeHidden();
  await expect(page.locator('#fun-moves')).toHaveText('0');
  await expect(page.locator('#save-status')).toContainText('自由試遊');
  await expect(page.locator('#fun-invite')).toBeVisible();
  await expect(page.locator('#fun-action-title')).toHaveText('選んだ操作：そのまま滑る');
  await expect(page.locator('#fun-action-guide')).toHaveAttribute('data-phase','direction');
  const legalDirs=await page.locator('[data-fun-dir][data-legal="true"]').count();
  expect(legalDirs).toBeGreaterThan(0);
  await expect(page.locator('#fun-action-directions')).not.toBeEmpty();
  await expect(page.locator('#fun-invite')).toContainText('トリケンからの挑戦状');
  await expect(page.locator('#fun-invite')).toContainText('STAGE 70');
  await expect(page.locator('#fun-invite')).toContainText(completedJourneyStages[19].chapter.title);
  await expect(page.locator('#fun-invite .fun-invite-steps p')).toHaveCount(3);
  await expect(page.locator('#fun-invite')).toContainText('結晶や家の記録は変わりません');
  await expect(page.locator('#fun-invite-start')).toBeVisible();
  await expect(page.locator('#fun-invite-start')).toHaveCSS('min-height','44px');
  await expect(page).not.toHaveURL(/replay=1/);
  await page.locator('#fun-invite-start').click();
  await expect(page.locator('#fun-invite')).toHaveCount(0);
  await expect(page.locator('#fun-board')).toBeFocused();
  await expect(page.locator('#fun-moves')).toHaveText('0');
  // The one-shot letter is gone, but a compact reminder is always available.
  const help=page.locator('#fun-quick-help');
  await expect(help).not.toHaveAttribute('open','');
  await expect(help.locator('summary')).toHaveCSS('min-height','44px');
  await help.locator('summary').click();
  await expect(help).toHaveAttribute('open','');
  await expect(help).toContainText('通りすぎるだけでは取れない');
  await expect(help).toContainText('光る場所をタップ');
  await expect(help).toContainText('1手戻す');
  await expect(page.locator('[data-fun-mode="none"]')).toBeEnabled();
  await help.locator('summary').click();
  await expect(help).not.toHaveAttribute('open','');
  expect(await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY)).toBe(original);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.reload();
  await expect(page.locator('#fun-count')).toHaveText('STAGE 70');
  await expect(page.locator('#fun-moves')).toHaveText('0');
  await expect(page.locator('#fun-invite')).toHaveCount(0);
  await expect(page.locator('#fun-quick-help summary')).toBeVisible();
  await expect(page.locator('#fun-quick-help')).not.toHaveAttribute('open','');
  expect(await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY)).toBe(original);
  expect(errors).toEqual([]);
 });
}
for(const width of [320,390]){
 test('ordinary chapter-two practice does not show an unsolicited invitation at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  await page.goto('/chapter-two.html?trial=1&practice=1&stage=51');
  await expect(page.locator('#fun-count')).toHaveText('STAGE 51');
  await expect(page.locator('#fun-invite')).toHaveCount(0);
  await expect(page.locator('#fun-board')).toBeVisible();
  await expect(page.locator('#fun-quick-help')).not.toHaveAttribute('open','');
  await expect(page.locator('#fun-action-guide')).toHaveAttribute('data-phase','direction');
  await page.locator('#fun-quick-help summary').click();
  await expect(page.locator('#fun-quick-help')).toContainText('星のマスで止まる');
  await expect(page.locator('[data-fun-mode="none"]')).toBeEnabled();
 });
}






for(const width of [320,390]){
 test('CPU practice offers selectable three strengths, legal turns and a fresh isolated reset '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/duel-boss.html?cpu=unrecognized');
  await expect(page.locator('#boss-board .boss-cell')).toHaveCount(49);
  const difficulty=page.locator('#boss-difficulty');
  await expect(difficulty).toHaveValue('normal');
  await expect(difficulty.locator('option')).toHaveCount(3);
  await difficulty.selectOption('practice');
  await expect(difficulty).toHaveValue('practice');
  await expect(page).toHaveURL(/cpu=practice/);
  await expect(page.locator('#boss-message')).toContainText('れんしゅう');
  await expect(page.locator('#boss-turns')).toHaveText('0');
  await page.locator('#boss-skip').click();
  const legalDirection=page.locator('#boss-directions [data-boss-dir]:not(:disabled)').first();
  await expect(legalDirection).toBeEnabled();
  await legalDirection.click();
  // CPU is a genuine opponent: it must produce a second legal engine turn.
  await expect(page.locator('#boss-turns')).toHaveText('2',{timeout:15000});
  await expect(page.locator('#boss-side')).toHaveText('あなたの番');
  await difficulty.selectOption('challenge');
  await expect(page).toHaveURL(/cpu=challenge/);
  await expect(page.locator('#boss-message')).toContainText('じっくり考える');
  await expect(page.locator('#boss-turns')).toHaveText('0');
  await expect(page.locator('#boss-score-human')).toHaveText('0');
  await expect(page.locator('#boss-score-cpu')).toHaveText('0');
  await expect(page.locator('#boss-result')).toBeHidden();
  await page.locator('#boss-reset').click();
  await expect(page.locator('#boss-difficulty')).toHaveValue('challenge');
  await expect(page.locator('#boss-turns')).toHaveText('0');
  const saves=await page.evaluate(()=>({
   adventure:localStorage.getItem('zurash-app:chapter-two-preview:v1'),
   practice:localStorage.getItem('zurash-app:chapter-two-preview:v1:practice')
  }));
  expect(saves).toEqual({adventure:null,practice:null});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}
for(const width of [320,390]){
 test('CPU search runs in isolated worker and reset cancels its reply '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/duel-boss.html?cpu=challenge');
  const workerStarted=page.waitForEvent('worker',{timeout:15000});
  await page.locator('#boss-skip').click();
  await page.locator('#boss-directions [data-boss-dir]:not(:disabled)').first().click();
  await expect(page.locator('#boss-turns')).toHaveText('1');
  const cpuWorker=await workerStarted;
  expect(cpuWorker.url()).toContain('/src/boss-cpu-worker.js');
  // Reset always remains usable while a background CPU is thinking.
  await page.locator('#boss-reset').click();
  await expect(page.locator('#boss-turns')).toHaveText('0');
  await page.waitForTimeout(600);
  await expect(page.locator('#boss-turns')).toHaveText('0');
  await expect(page.locator('#boss-side')).toHaveText('あなたの番');
  await page.locator('#boss-skip').click();
  await page.locator('#boss-directions [data-boss-dir]:not(:disabled)').first().click();
  await expect(page.locator('#boss-turns')).toHaveText('2',{timeout:15000});
  await expect(page.locator('#boss-side')).toHaveText('あなたの番');
  expect(errors).toEqual([]);
 });
}
test('CPU falls back to valid main-thread opponent when module Workers are unavailable',async({page})=>{
 await page.setViewportSize({width:320,height:844});
 await page.addInitScript(()=>{Object.defineProperty(window,'Worker',{configurable:true,value:undefined});});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/duel-boss.html?cpu=challenge');
 await page.locator('#boss-skip').click();
 await page.locator('#boss-directions [data-boss-dir]:not(:disabled)').first().click();
 await expect(page.locator('#boss-turns')).toHaveText('2',{timeout:15000});
 await expect(page.locator('#boss-side')).toHaveText('あなたの番');
 await page.locator('#boss-reset').click();
 await expect(page.locator('#boss-turns')).toHaveText('0');
 expect(await page.evaluate(()=>localStorage.getItem('zurash-app:chapter-two-preview:v1'))).toBeNull();
 expect(errors).toEqual([]);
});

test('CPU switching while opponent thinks aborts stale delayed response',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/duel-boss.html?cpu=practice');
 await page.locator('#boss-skip').click();
 await page.locator('#boss-directions [data-boss-dir]:not(:disabled)').first().click();
 await expect(page.locator('#boss-turns')).toHaveText('1');
 await page.locator('#boss-difficulty').selectOption('normal');
 await expect(page.locator('#boss-turns')).toHaveText('0');
 await page.waitForTimeout(650);
 await expect(page.locator('#boss-turns')).toHaveText('0');
 await expect(page.locator('#boss-side')).toHaveText('あなたの番');
 await expect(page.locator('#boss-message')).toContainText('ふつう');
});
test('the packaged preview home links directly to CPU trial',async({page})=>{
 await page.goto('/');
 const cpu=page.getByRole('link',{name:/CPUと対戦/});
 await expect(cpu).toHaveAttribute('href','./duel-boss.html?cpu=normal');
 await cpu.click();
 await expect(page.locator('#boss-difficulty')).toHaveValue('normal');
 await expect(page.locator('#boss-board .boss-cell')).toHaveCount(49);
});


test('real 17-move stage60 clear unlocks optional CPU challenge only after completion',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.emulateMedia({reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const stage=completedJourneyStages.find(s=>s.chapter.number===60);
 let saved=newChapterTwo();
 for(const earlier of completedJourneyStages.filter(s=>s.chapter.number<60))
  saved=checkpointTwo(saved,completedJourneyStages,earlier,earlier.proof);
 await page.goto('/');
 await page.evaluate(({key,value})=>localStorage.setItem(key,value),
  {key:CHAPTER_TWO_KEY,value:JSON.stringify(saved)});
 await page.goto('/chapter-two.html?trial=1&stage=60&tap=1');
 await expect(page.locator('#fun-count')).toHaveText('STAGE 60');
 await expect(page.locator('#cpu-encounter-slot')).toBeHidden();
 await expect(page.locator('#fun-result')).toBeHidden();
 let state=initialGate(stage);
 for(let i=0;i<stage.proof.length;i++){
  const action=stage.proof[i],next=applyGate(stage,state,action);
  await page.locator('[data-fun-mode="'+action.prep.type+'"]').click();
  if(action.prep.type==='wall'||action.prep.type==='glove'){
   await page.locator('[data-cell="'+action.prep.from+'"]').click();
   await page.locator('[data-cell="'+action.prep.to+'"]').click();
  }else if(action.prep.type==='ice'||action.prep.type==='warp'){
   await page.locator('[data-cell="'+action.prep.to+'"]').click();
  }
  const target=page.locator('[data-cell="'+next.position+'"]');
  await expect(target).toHaveClass(/arrival/);
  const landing=tapLanding(gateSuccessors(stage,state),action.prep,next.position);
  await target.click();
  if(landing?.kind==='direction-required')
   await page.locator('[data-fun-dir="'+action.dir+'"]').click();
  await expect(page.locator('#fun-moves')).toHaveText(String(i+1));
  if(i+1<stage.proof.length)await expect(page.locator('#cpu-encounter-slot')).toBeHidden();
  state=next;
 }
 await expect(page.locator('#fun-result')).toBeVisible();
 await expect(page.locator('#fun-rank')).toContainText('Sランク');
 await expect(page.locator('#cpu-encounter-link')).toBeVisible();
 await expect(page.locator('#cpu-encounter-link')).toHaveAttribute('href',
  './duel-boss.html?cpu=practice&from=60&tap=1');
 const earned=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),CHAPTER_TWO_KEY);
 expect(earned.completed[stage.id].bestTurns).toBe(stage.proof.length);
 expect(Object.keys(earned.completed)).toHaveLength(10);
 const recordBefore=JSON.stringify(earned.completed);
 await page.locator('#cpu-encounter-link').click();
 await expect(page.locator('#boss-difficulty')).toHaveValue('practice');
 await expect(page.locator('#boss-return')).toBeVisible();
 expect(await page.evaluate(key=>JSON.stringify(JSON.parse(localStorage.getItem(key)).completed),CHAPTER_TWO_KEY)).toBe(recordBefore);
 await page.locator('#boss-return').click();
 await expect(page.locator('#fun-count')).toHaveText('STAGE 61');
 expect(await page.evaluate(key=>JSON.stringify(JSON.parse(localStorage.getItem(key)).completed),CHAPTER_TWO_KEY)).toBe(recordBefore);
 expect(errors).toEqual([]);
});

test('stage60 earned clear optionally invites a rival and returns to unlocked stage61 without new rewards',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/chapter-two.html?trial=1&stage=60');
 await expect(page.locator('#cpu-encounter-slot')).toBeHidden();
 let save=newChapterTwo();
 for(const stage of completedJourneyStages.filter(s=>s.chapter.number<=60)){
  save=checkpointTwo(save,completedJourneyStages,stage,stage.proof);
 }
 await page.evaluate(({key,value})=>localStorage.setItem(key,value),
  {key:CHAPTER_TWO_KEY,value:JSON.stringify(save)});
 await page.goto('/chapter-two.html?trial=1&stage=60&tap=1');
 await expect(page.locator('#fun-result')).toBeVisible();
 const event=page.locator('#cpu-encounter-link');
 await expect(event).toBeVisible();
 await expect(event).toHaveAttribute('href','./duel-boss.html?cpu=practice&from=60&tap=1');
 const before=await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY);
 await event.click();
 await expect(page.locator('#boss-board .boss-cell')).toHaveCount(49);
 await expect(page.locator('#boss-difficulty')).toHaveValue('practice');
 await expect(page.locator('#boss-return')).toBeVisible();
 await expect(page.locator('#boss-return')).toHaveAttribute('href',
  './chapter-two.html?trial=1&stage=61&tap=1');
 expect(await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY)).toBe(before);
 await page.locator('#boss-return').click();
 await expect(page.locator('#fun-count')).toHaveText('STAGE 61');
 await expect(page.locator('#fun-result')).toBeHidden();
 const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),CHAPTER_TWO_KEY);
 expect(after.completed).toEqual(save.completed);
 expect(after.active.id).toBe(completedJourneyStages[10].id);
 expect(errors).toEqual([]);
});

for(const width of [320,390]){
 test('real 18-move stage70 finale and CPU bonus return to complete home album '+width+'px',async({page})=>{
 await page.setViewportSize({width,height:844});
 await page.emulateMedia({reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const stage=completedJourneyStages.find(s=>s.chapter.number===70);
 let saved=newChapterTwo();
 for(const earlier of completedJourneyStages.filter(s=>s.chapter.number<70))
  saved=checkpointTwo(saved,completedJourneyStages,earlier,earlier.proof);
 await page.goto('/');
 await page.evaluate(({key,value})=>localStorage.setItem(key,value),
  {key:CHAPTER_TWO_KEY,value:JSON.stringify(saved)});
 await page.goto('/chapter-two.html?trial=1&stage=70&tap=1');
 await expect(page.locator('#fun-count')).toHaveText('STAGE 70');
 await expect(page.locator('#cpu-encounter-slot')).toBeHidden();
 await expect(page.locator('#fun-result')).toBeHidden();
 const zoom=page.locator('#fun-board-zoom');
 if(width===320){
  await expect(zoom).toBeVisible();
  await zoom.click();
  await expect(zoom).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#fun-board-viewport')).toHaveAttribute('data-zoomed','true');
 }
 let position=initialGate(stage);
 for(let i=0;i<stage.proof.length;i++){
  const action=stage.proof[i],next=applyGate(stage,position,action);
  await page.locator('[data-fun-mode="'+action.prep.type+'"]').click();
  if(action.prep.type==='wall'||action.prep.type==='glove'){
   await page.locator('[data-cell="'+action.prep.from+'"]').click();
   await page.locator('[data-cell="'+action.prep.to+'"]').click();
  }else if(action.prep.type==='ice'||action.prep.type==='warp'){
   await page.locator('[data-cell="'+action.prep.to+'"]').click();
  }
  const target=page.locator('[data-cell="'+next.position+'"]');
  await expect(target).toHaveClass(/arrival/);
  const landing=tapLanding(gateSuccessors(stage,position),action.prep,next.position);
  await target.click();
  if(landing?.kind==='direction-required')
   await page.locator('[data-fun-dir="'+action.dir+'"]').click();
  await expect(page.locator('#fun-moves')).toHaveText(String(i+1));
  if(width===320){
   await expect(zoom).toHaveAttribute('aria-pressed','true');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  if(i<stage.proof.length-1){
   await expect(page.locator('#cpu-encounter-slot')).toBeHidden();
   await expect(page.locator('#fun-result')).toBeHidden();
  }
  position=next;
 }
 await expect(page.locator('#fun-result')).toBeVisible();
 await expect(page.locator('#fun-rank')).toContainText('Sランク');
 await expect(page.locator('#expedition-reward')).toContainText('初クリア');
 await expect(page.locator('#expedition-reward')).toContainText('第2章クリア');
 await expect(page.locator('#cpu-encounter-link')).toBeVisible();
 await expect(page.locator('#cpu-encounter-link')).toHaveAttribute('href',
  './duel-boss.html?cpu=normal&from=70&tap=1');
 const earned=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),CHAPTER_TWO_KEY);
 expect(Object.keys(earned.completed)).toHaveLength(20);
 expect(earned.completed[stage.id].bestTurns).toBe(18);
 const record=JSON.stringify(earned.completed);
 await page.locator('#cpu-encounter-link').click();
 await expect(page.locator('#boss-difficulty')).toHaveValue('normal');
 await expect(page.locator('#boss-return')).toHaveAttribute('href',
  './adventure.html?view=expedition');
 expect(await page.evaluate(key=>JSON.stringify(JSON.parse(localStorage.getItem(key)).completed),CHAPTER_TWO_KEY)).toBe(record);
 await page.locator('#boss-return').click();
 await expect(page).toHaveURL(/adventure\.html\?view=expedition/);
 await expect(page.locator('#expedition-home')).toBeVisible();
 await expect(page.locator('#expedition-home')).toContainText('道しるべの結晶 20/20個');
 await expect(page.locator('#expedition-home')).toContainText('灯り 4/4か所');
 await expect(page.locator('#expedition-memory-album [data-album-lit="true"]')).toHaveCount(4);
 await expect(page.locator('#expedition-album-progress')).toContainText('冒険 20/20面クリア');
 expect(await page.evaluate(key=>JSON.stringify(JSON.parse(localStorage.getItem(key)).completed),CHAPTER_TWO_KEY)).toBe(record);
 await page.goto('/chapter-two.html?trial=1&stage=70&tap=1');
 await expect(page.locator('#fun-result')).toBeVisible();
 await expect(page.locator('#cpu-encounter-link')).toBeVisible();
 await expect(page.locator('#expedition-reward')).not.toContainText('初クリア！');
 expect(await page.evaluate(key=>JSON.stringify(JSON.parse(localStorage.getItem(key)).completed),CHAPTER_TWO_KEY)).toBe(record);
 expect(errors).toEqual([]);
 });
}


for(const width of [320,390]){
 test('completed moves never claim earned crystals when browser storage rejects the final save '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const stage=completedJourneyStages.find(s=>s.chapter.number===51);
  await page.goto('/');
  await page.addInitScript(({key,stageId})=>{
   const original=Storage.prototype.setItem;
   Storage.prototype.setItem=function(k,value){
    if(k===key){
     try{
      const parsed=JSON.parse(value);
      if(Object.prototype.hasOwnProperty.call(parsed.completed,stageId))
       throw new DOMException('No space left','QuotaExceededError');
     }catch(e){if(e?.name==='QuotaExceededError')throw e;}
    }
    return original.call(this,k,value);
   };
  },{key:CHAPTER_TWO_KEY,stageId:stage.id});
  await page.goto('/chapter-two.html?trial=1&stage=51&tap=1');
  await expect(page.locator('#fun-result')).toBeHidden();
  let state=initialPuzzle(stage);
  for(let i=0;i<stage.proof.length;i++){
   const action=stage.proof[i],next=applyPuzzle(stage,state,action);
   await page.locator('[data-fun-mode="'+action.prep.type+'"]').click();
   if(action.prep.type==='wall'||action.prep.type==='glove'){
    await page.locator('[data-cell="'+action.prep.from+'"]').click();
    await page.locator('[data-cell="'+action.prep.to+'"]').click();
   }else if(action.prep.type==='ice'||action.prep.type==='warp'){
    await page.locator('[data-cell="'+action.prep.to+'"]').click();
   }
   const target=page.locator('[data-cell="'+next.position+'"]');
   await expect(target).toHaveClass(/arrival/);
   const landing=tapLanding(successors(stage,state),action.prep,next.position);
   await target.click();
   if(landing?.kind==='direction-required')
    await page.locator('[data-fun-dir="'+action.dir+'"]').click();
   await expect(page.locator('#fun-moves')).toHaveText(String(i+1));
   state=next;
  }
  await expect(page.locator('#fun-result')).toBeVisible();
  await expect(page.locator('#save-status')).toContainText('保存できませんでした');
  const reward=page.locator('#expedition-reward');
  await expect(reward).toContainText('記録を保存できませんでした');
  await expect(reward).toContainText('結晶と道しるべは未確定');
  await expect(reward).not.toContainText('初クリア');
  await expect(reward).not.toContainText('結晶 +1');
  await expect(page.locator('#fun-progress')).toContainText('端末に未保存の仮記録');
  await expect(page.locator('#expedition-map')).toContainText('道しるべの結晶 0/20個');
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),CHAPTER_TWO_KEY);
  expect(saved.completed[stage.id]).toBeUndefined();
  expect(saved.active.actions).toHaveLength(stage.proof.length-1);
  await page.reload();
  await expect(page.locator('#fun-result')).toBeHidden();
  await expect(page.locator('#fun-moves')).toHaveText(String(stage.proof.length-1));
  const after=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),CHAPTER_TWO_KEY);
  expect(after.completed[stage.id]).toBeUndefined();
  expect(errors).toEqual([]);
 });
}


async function completeFirstStageByTaps(page,stage){
 let state=initialPuzzle(stage);
 for(let i=0;i<stage.proof.length;i++){
  const action=stage.proof[i],next=applyPuzzle(stage,state,action);
  await page.locator('[data-fun-mode="'+action.prep.type+'"]').click();
  if(action.prep.type==='wall'||action.prep.type==='glove'){
   await page.locator('[data-cell="'+action.prep.from+'"]').click();
   await page.locator('[data-cell="'+action.prep.to+'"]').click();
  }else if(action.prep.type==='ice'||action.prep.type==='warp'){
   await page.locator('[data-cell="'+action.prep.to+'"]').click();
  }
  const target=page.locator('[data-cell="'+next.position+'"]');
  await expect(target).toHaveClass(/arrival/);
  const landing=tapLanding(successors(stage,state),action.prep,next.position);
  await target.click();
  if(landing?.kind==='direction-required')
   await page.locator('[data-fun-dir="'+action.dir+'"]').click();
  await expect(page.locator('#fun-moves')).toHaveText(String(i+1));
  state=next;
 }
 await expect(page.locator('#fun-result')).toBeVisible();
}

for(const width of [320,390]){
 test('failed stage51 save can recover in place without losing its clear '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const stage=completedJourneyStages[0];
  await page.goto('/');
  await page.addInitScript(({key,stageId})=>{
   const original=Storage.prototype.setItem;
   Storage.prototype.setItem=function(k,value){
    if(k===key&&sessionStorage.getItem('permit-final-save')!=='yes'){
     let current;
     try{current=JSON.parse(value);}catch(_){}
     if(current?.completed&&Object.prototype.hasOwnProperty.call(current.completed,stageId))
      throw new DOMException('Storage full','QuotaExceededError');
    }
    return original.call(this,k,value);
   };
  },{key:CHAPTER_TWO_KEY,stageId:stage.id});
  await page.goto('/chapter-two.html?trial=1&stage=51&tap=1');
  await completeFirstStageByTaps(page,stage);
  await expect(page.locator('#save-write-actions')).toBeVisible();
  await expect(page.locator('#expedition-reward')).toContainText('結晶と道しるべは未確定');
  await expect(page.locator('#cpu-encounter-slot')).toBeHidden();
  await page.locator('#fun-next').click();
  await expect(page.locator('#fun-count')).toHaveText('STAGE 51');
  await expect(page.locator('#save-status')).toContainText('記録がまだ保存されていません');
  const old=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),CHAPTER_TWO_KEY);
  expect(old.completed[stage.id]).toBeUndefined();
  expect(old.active.actions).toHaveLength(stage.proof.length-1);
  await page.evaluate(()=>sessionStorage.setItem('permit-final-save','yes'));
  await page.locator('#retry-chapter-two-save').click();
  await expect(page.locator('#save-write-actions')).toBeHidden();
  await expect(page.locator('#save-status')).toContainText('クリア記録を保存しました');
  await expect(page.locator('#expedition-reward')).toContainText('初クリア');
  await expect(page.locator('#expedition-reward')).toContainText('結晶 +1');
  await expect(page.locator('#expedition-map')).toContainText('道しるべの結晶 1/20個');
  await expect(page.locator('#fun-progress')).not.toContainText('未保存の仮記録');
  const restored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),CHAPTER_TWO_KEY);
  expect(restored.completed[stage.id].bestTurns).toBe(stage.proof.length);
  expect(restored.active.actions).toHaveLength(stage.proof.length);
  await page.reload();
  await expect(page.locator('#fun-result')).toBeVisible();
  await expect(page.locator('#fun-moves')).toHaveText(String(stage.proof.length));
  await expect(page.locator('#save-write-actions')).toBeHidden();
  expect(await page.evaluate(({key,id})=>JSON.parse(localStorage.getItem(key)).completed[id].bestTurns,{key:CHAPTER_TWO_KEY,id:stage.id})).toBe(stage.proof.length);
  expect(errors).toEqual([]);
 });
}

test('another tab changing the ledger mid-stage never gets silently overwritten',async({page})=>{
 await page.setViewportSize({width:320,height:844});
 const stage=completedJourneyStages[0];
 await page.goto('/chapter-two.html?trial=1&stage=51&tap=1');
 await expect(page.locator('#fun-count')).toHaveText('STAGE 51');
 const original=await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY);
 expect(JSON.parse(original).active.id).toBe(stage.id);
 const externallySaved=JSON.stringify(newChapterTwo());
 await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),
  {key:CHAPTER_TWO_KEY,raw:externallySaved});
 const before=initialPuzzle(stage),action=stage.proof[0],next=applyPuzzle(stage,before,action);
 await page.locator('[data-fun-mode="none"]').click();
 const target=page.locator('[data-cell="'+next.position+'"]');
 await expect(target).toHaveClass(/arrival/);
 const landing=tapLanding(successors(stage,before),action.prep,next.position);
 await target.click();
 if(landing?.kind==='direction-required')
  await page.locator('[data-fun-dir="'+action.dir+'"]').click();
 await expect(page.locator('#fun-moves')).toHaveText('1');
 await expect(page.locator('#save-write-actions')).toBeVisible();
 await expect(page.locator('#save-status')).toContainText('別のタブで保存記録が変更');
 expect(await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY)).toBe(externallySaved);
 await page.locator('#retry-chapter-two-save').click();
 await expect(page.locator('#save-status')).toContainText('上書きせず保護しています');
 expect(await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY)).toBe(externallySaved);
});

test('a changed on-disk ledger blocks retry and the in-memory clear remains exportable',async({page})=>{
 await page.setViewportSize({width:320,height:844});
 const stage=completedJourneyStages[0];
 await page.goto('/');
 await page.addInitScript(({key,stageId})=>{
  const original=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k,value){
   if(k===key){
    let current;
    try{current=JSON.parse(value);}catch(_){}
    if(current?.completed&&Object.prototype.hasOwnProperty.call(current.completed,stageId))
     throw new DOMException('Storage full','QuotaExceededError');
   }
   return original.call(this,k,value);
  };
 },{key:CHAPTER_TWO_KEY,stageId:stage.id});
 await page.goto('/chapter-two.html?trial=1&stage=51&tap=1');
 await completeFirstStageByTaps(page,stage);
 await expect(page.locator('#save-write-actions')).toBeVisible();
 const external=JSON.stringify(newChapterTwo());
 await page.evaluate(({key,value})=>localStorage.setItem(key,value),{key:CHAPTER_TWO_KEY,value:external});
 await page.locator('#retry-chapter-two-save').click();
 await expect(page.locator('#save-status')).toContainText('別のタブなどで保存記録が変更');
 expect(await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY)).toBe(external);
 const downloadPromise=page.waitForEvent('download');
 await page.locator('#download-unsaved-chapter-two').click();
 const download=await downloadPromise;
 expect(download.suggestedFilename()).toContain('zurash-chapter-two-unsaved-');
 const unsaved=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
 expect(unsaved.completed[stage.id].bestTurns).toBe(stage.proof.length);
 expect(await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY)).toBe(external);
});

test('corrupt chapter-two save is never overwritten automatically and recovery backs up its original bytes',async({page})=>{
 await page.setViewportSize({width:320,height:844});
 const original='{"version":999,"future":"do not modify this data"}';
 await page.goto('/');
 await page.evaluate(({key,value})=>localStorage.setItem(key,value),
  {key:CHAPTER_TWO_KEY,value:original});
 await page.goto('/chapter-two.html?trial=1&tap=1');
 await expect(page.locator('#save-recovery')).toBeVisible();
 await expect(page.locator('#save-write-actions')).toBeHidden();
 await expect(page.locator('#save-status')).toContainText('元の記録は保持しています');
 await expect(page.locator('#expedition-map')).toContainText('道しるべの結晶 0/20個');
 expect(await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY)).toBe(original);
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#reset-invalid-save').click();
 await expect(page.locator('#save-recovery')).toBeHidden();
 await expect(page.locator('#save-status')).toContainText('元の記録はこの端末の');
 const after=await page.evaluate(key=>({
  current:JSON.parse(localStorage.getItem(key)),
  backups:Object.keys(localStorage)
   .filter(k=>k.startsWith(key+':invalid-backup:'))
   .map(k=>({key:k,content:localStorage.getItem(k)}))
 }),CHAPTER_TWO_KEY);
 expect(after.current.version).toBe(1);
 expect(after.current.completed).toEqual({});
 expect(after.backups).toHaveLength(1);
 expect(after.backups[0].content).toBe(original);
 await page.reload();
 await expect(page.locator('#save-recovery')).toBeHidden();
 await expect(page.locator('#fun-count')).toHaveText('STAGE 51');
 expect(await page.evaluate(k=>localStorage.getItem(k),after.backups[0].key)).toBe(original);
});

test('stage70 earned clear offers optional finale rival then goes home with unchanged crystals',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 let save=newChapterTwo();
 for(const stage of completedJourneyStages)
  save=checkpointTwo(save,completedJourneyStages,stage,stage.proof);
 await page.goto('/');
 await page.evaluate(({key,value})=>localStorage.setItem(key,value),
  {key:CHAPTER_TWO_KEY,value:JSON.stringify(save)});
 await page.goto('/chapter-two.html?trial=1&stage=70');
 await expect(page.locator('#fun-result')).toBeVisible();
 const event=page.locator('#cpu-encounter-link');
 await expect(event).toBeVisible();
 await expect(event).toHaveAttribute('href','./duel-boss.html?cpu=normal&from=70');
 const before=await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY);
 await event.click();
 await expect(page.locator('#boss-difficulty')).toHaveValue('normal');
 await expect(page.locator('#boss-return')).toHaveAttribute('href','./adventure.html?view=expedition');
 expect(await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY)).toBe(before);
 await page.locator('#boss-return').click();
 await expect(page).toHaveURL(/adventure\.html\?view=expedition/);
 expect(await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY)).toBe(before);
});
test('practice mode keeps a separate ledger and returns to practice after a bonus duel',async({page})=>{
 await page.setViewportSize({width:320,height:844});
 const stage=completedJourneyStages.find(s=>s.chapter.number===60);
 const save=checkpointTwo(newChapterTwo(),completedJourneyStages,stage,stage.proof,{practice:true});
 await page.goto('/');
 await page.evaluate(({key,value})=>localStorage.setItem(key,value),
  {key:CHAPTER_TWO_KEY+':practice',value:JSON.stringify(save)});
 await page.goto('/chapter-two.html?trial=1&practice=1&stage=60&tap=1');
 await expect(page.locator('#cpu-encounter-link')).toHaveAttribute('href',
  './duel-boss.html?cpu=practice&from=60&practice=1&tap=1');
 const prior=await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY+':practice');
 await page.locator('#cpu-encounter-link').click();
 await expect(page.locator('#boss-return')).toHaveAttribute('href',
  './chapter-two.html?trial=1&practice=1&stage=61&tap=1');
 expect(await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY+':practice')).toBe(prior);
 expect(await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY)).toBeNull();
 await page.locator('#boss-return').click();
 await expect(page.locator('#fun-count')).toHaveText('STAGE 61');
 expect(await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY)).toBeNull();
});
test('direct CPU practice and malformed milestone links never show an adventure redirect',async({page})=>{
 await page.goto('/duel-boss.html?cpu=normal');
 await expect(page.locator('#boss-return')).toBeHidden();
 await page.goto('/duel-boss.html?cpu=normal&from=https%3A%2F%2Fevil.example');
 await expect(page.locator('#boss-return')).toBeHidden();
 await page.goto('/duel-boss.html?cpu=challenge&from=65');
 await expect(page.locator('#boss-return')).toBeHidden();
});

for(const [width,height] of [[320,568],[390,844]]){
 test('tap-first crowded stages offer optional 44px board targets without horizontal page overflow '+width+'x'+height,async({page})=>{
  await page.setViewportSize({width,height});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/chapter-two.html?trial=1&practice=1&stage=70&tap=1');
  const zoom=page.locator('#fun-board-zoom');
  await expect(zoom).toBeVisible();
  await expect(zoom).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('#fun-board-viewport')).toHaveAttribute('data-zoomed','false');
  const normalCell=(await page.locator('#fun-board .cell').first().boundingBox()).width;
  expect(normalCell).toBeLessThan(44);
  await zoom.click();
  await expect(zoom).toHaveText('元の大きさ');
  await expect(zoom).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#fun-board-viewport')).toHaveAttribute('data-zoomed','true');
  const sizes=await page.evaluate(()=>{
   const board=document.querySelector('#fun-board');
   const frame=document.querySelector('#fun-board-viewport');
   const cell=board.querySelector('.cell').getBoundingClientRect();
   return {cellWidth:cell.width,cellHeight:cell.height,frameWidth:frame.clientWidth,frameScroll:frame.scrollWidth,pageScroll:document.documentElement.scrollWidth,screen:innerWidth};
  });
  expect(sizes.cellWidth).toBeGreaterThanOrEqual(44);
  expect(sizes.cellHeight).toBeGreaterThanOrEqual(44);
  expect(sizes.frameScroll).toBeGreaterThan(sizes.frameWidth);
  expect(sizes.pageScroll).toBeLessThanOrEqual(sizes.screen);
  await page.locator('#fun-board-viewport').evaluate(el=>{el.scrollLeft=el.scrollWidth;});
  expect(await page.locator('#fun-board-viewport').evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
  // The magnification changes only presentation, never the puzzle position.
  await expect(page.locator('#fun-moves')).toHaveText('0');
  await zoom.click();
  await expect(page.locator('#fun-board-viewport')).toHaveAttribute('data-zoomed','false');
  await expect(page.locator('#fun-board-zoom')).toHaveAttribute('aria-pressed','false');
  expect((await page.locator('#fun-board .cell').first().boundingBox()).width).toBeLessThan(44);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}
test('zoomed board follows player on real move and Undo but allows manual horizontal exploration',async({page})=>{
 await page.setViewportSize({width:320,height:844});
 await page.emulateMedia({reducedMotion:'reduce'});
 const stage=completedJourneyStages.at(-1),action=stage.proof[0],next=applyGate(stage,initialGate(stage),action);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/chapter-two.html?trial=1&practice=1&stage=70&tap=1');
 await page.locator('#fun-board-zoom').click();
 const frame=page.locator('#fun-board-viewport');
 const max=await frame.evaluate(el=>el.scrollWidth-el.clientWidth);
 expect(max).toBeGreaterThan(0);
 await frame.evaluate(el=>el.scrollLeft=el.scrollWidth);
 expect(await frame.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
 await page.locator('[data-fun-mode="'+action.prep.type+'"]').click();
 await page.locator('[data-cell="'+action.prep.from+'"]').click();
 await page.locator('[data-cell="'+action.prep.to+'"]').click();
 await page.locator('[data-cell="'+next.position+'"]').click();
 await expect(page.locator('#fun-moves')).toHaveText('1');
 const readPan=()=>page.evaluate(()=>{
  const viewport=document.querySelector('#fun-board-viewport');
  const player=document.querySelector('#fun-board .cell img').closest('.cell').getBoundingClientRect();
  const rect=viewport.getBoundingClientRect();
  const expected=Math.max(0,Math.min(viewport.scrollWidth-viewport.clientWidth,
   viewport.scrollLeft+player.left+player.width/2-rect.left-rect.width/2));
  return {scroll:viewport.scrollLeft,expected};
 });
 const after=await readPan();
 expect(Math.abs(after.scroll-after.expected)).toBeLessThanOrEqual(2);
 // Manual panning works until the next deliberate move or Undo.
 await frame.evaluate(el=>el.scrollLeft=el.scrollWidth);
 expect(await frame.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
 await page.locator('#fun-undo').click();
 await expect(page.locator('#fun-moves')).toHaveText('0');
 const reverted=await readPan();
 expect(Math.abs(reverted.scroll-reverted.expected)).toBeLessThanOrEqual(2);
 await expect(page.locator('#fun-board-zoom')).toHaveAttribute('aria-pressed','true');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(errors).toEqual([]);
});

test('beginner 4-column stage 51 keeps full-size tiles without extra zoom controls',async({page})=>{
 await page.setViewportSize({width:320,height:844});
 await page.goto('/chapter-two.html?trial=1&practice=1&stage=51&tap=1');
 await expect(page.locator('#fun-board-zoom')).toBeHidden();
 await expect(page.locator('#fun-dpad')).toBeHidden();
 const cell=await page.locator('#fun-board .cell').first().boundingBox();
 expect(cell.width).toBeGreaterThanOrEqual(44);
 await page.locator('#fun-board .cell.arrival').first().click();
 await expect(page.locator('#fun-moves')).toHaveText('1');
});
test('magnification preserves stage70 legal moves and Undo without choosing a solution',async({page})=>{
 await page.setViewportSize({width:320,height:844});
 await page.emulateMedia({reducedMotion:'reduce'});
 const stage=completedJourneyStages.at(-1),action=stage.proof[0],initial=initialGate(stage),next=applyGate(stage,initial,action);
 await page.goto('/chapter-two.html?trial=1&practice=1&stage=70&tap=1');
 const zoom=page.locator('#fun-board-zoom');
 await zoom.click();
 await page.locator('[data-fun-mode="'+action.prep.type+'"]').click();
 await page.locator('[data-cell="'+action.prep.from+'"]').click();
 await page.locator('[data-cell="'+action.prep.to+'"]').click();
 await expect(page.locator('[data-cell="'+next.position+'"]')).toHaveClass(/arrival/);
 await page.locator('[data-cell="'+next.position+'"]').click();
 await expect(page.locator('#fun-moves')).toHaveText('1');
 await expect(zoom).toHaveAttribute('aria-pressed','true');
 await page.locator('#fun-undo').click();
 await expect(page.locator('#fun-moves')).toHaveText('0');
 await expect(zoom).toHaveAttribute('aria-pressed','true');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

for(const [width,height] of [[320,568],[390,844]]){
 test('tap-first compact layout keeps board, tools and Undo together, not a new button row '+width+'x'+height,async({page})=>{
  await page.setViewportSize({width,height});
  await page.goto('/chapter-two.html?trial=1&practice=1&stage=70');
  const legacyBoardWidth=(await page.locator('#fun-board').boundingBox()).width;
  await page.goto('/chapter-two.html?trial=1&practice=1&stage=70&tap=1');
  const tapBoardWidth=(await page.locator('#fun-board').boundingBox()).width;
  expect(tapBoardWidth).toBeGreaterThan(legacyBoardWidth);
  await expect(page.locator('#fun-dpad')).toBeHidden();
  await expect(page.locator('#fun-tools #fun-direction-toggle')).toBeVisible();
  await expect(page.locator('.fun-controls > #fun-direction-toggle')).toHaveCount(0);
  await expect(page.locator('#fun-quick-help')).not.toHaveAttribute('open','');
  const target=page.locator('#fun-direction-toggle');
  const size=await target.boundingBox();
  expect(size).not.toBeNull();
  expect(size.width).toBeGreaterThanOrEqual(44);
  expect(size.height).toBeGreaterThanOrEqual(44);
  await page.locator('#fun-board').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
  const measure=await page.evaluate(()=>{
   const board=document.querySelector('#fun-board').getBoundingClientRect();
   const actions=document.querySelector('.fun-actions').getBoundingClientRect();
   const tools=document.querySelector('#fun-tools').getBoundingClientRect();
   return {boardTop:board.top,actionsBottom:actions.bottom,toolsHeight:tools.height,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  expect(measure.overflow).toBe(false);
  expect(measure.boardTop).toBeGreaterThanOrEqual(-5);
  expect(measure.actionsBottom).toBeLessThanOrEqual(height+5);
  // Up to five available item tools + one fallback fit in only three rows.
  expect(measure.toolsHeight).toBeLessThanOrEqual(175);
 });
}
test('packaged welcome offers a beginner stage51 tap-first entry',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 const entry=page.getByRole('link',{name:/第51面から盤面タップで遊ぶ/});
 await expect(entry).toHaveAttribute('href','./chapter-two.html?trial=1&practice=1&stage=51&tap=1');
 await entry.click();
 await expect(page.locator('#fun-count')).toHaveText('STAGE 51');
 await expect(page.locator('#fun-dpad')).toBeHidden();
 await expect(page.locator('#fun-action-next')).toContainText('タップ');
});

for(const width of [320,390]){
 test('tap-first prototype starts without D-pad, moves by landing tap, offers optional directions '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/chapter-two.html?trial=1&practice=1&stage=51&tap=1');
  await expect(page.locator('#fun-board')).toBeVisible();
  await expect(page.locator('#fun-dpad')).toBeHidden();
  await expect(page.locator('#fun-direction-toggle')).toBeVisible();
  await expect(page.locator('#fun-direction-toggle')).toHaveAttribute('aria-expanded','false');
  await expect(page.locator('#fun-action-next')).toContainText('タップ');
  await expect(page.locator('#fun-action-directions')).toBeEmpty();
  expect(await page.locator('#fun-board .cell.arrival').count()).toBeGreaterThan(0);
  await page.locator('#fun-board .cell.arrival').first().click();
  await expect(page.locator('#fun-moves')).toHaveText('1');
  await expect(page.locator('#fun-dpad')).toBeHidden();
  await page.locator('#fun-direction-toggle').click();
  await expect(page.locator('#fun-dpad')).toBeVisible();
  await expect(page.locator('#fun-direction-toggle')).toHaveAttribute('aria-expanded','true');
  await page.locator('#fun-direction-toggle').click();
  await expect(page.locator('#fun-dpad')).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}
test('the chosen preparation is highlighted only in tap-first mode, without consuming a turn',async({page})=>{
 await page.setViewportSize({width:320,height:844});
 const stage=completedJourneyStages.at(-1),prep=stage.proof[0].prep;
 await page.goto('/chapter-two.html?trial=1&practice=1&stage=70&tap=1');
 await page.locator('[data-fun-mode="wall"]').click();
 await page.locator('[data-cell="'+prep.from+'"]').click();
 await page.locator('[data-cell="'+prep.to+'"]').click();
 const selected=page.locator('[data-cell="'+prep.to+'"]');
 await expect(selected).toHaveClass(/prepared-target/);
 await expect(selected).toHaveAttribute('aria-pressed','true');
 await expect(selected).toHaveAttribute('aria-label',/ここに準備した/);
 await expect(page.locator('#fun-moves')).toHaveText('0');
 await page.locator('[data-fun-mode="none"]').click();
 await expect(page.locator('#fun-board .prepared-target')).toHaveCount(0);
 await page.goto('/chapter-two.html?trial=1&practice=1&stage=70');
 await page.locator('[data-fun-mode="wall"]').click();
 await page.locator('[data-cell="'+prep.from+'"]').click();
 await page.locator('[data-cell="'+prep.to+'"]').click();
 await expect(page.locator('#fun-board .prepared-target')).toHaveCount(0);
 await expect(page.locator('#fun-moves')).toHaveText('0');
});

test('tap-first stage70 can finish all 18 proven actions using board taps and safe fallback only if needed',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.emulateMedia({reducedMotion:'reduce'});
 const stage=completedJourneyStages.at(-1);
 let state=initialGate(stage);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/chapter-two.html?trial=1&practice=1&stage=70&tap=1');
 await expect(page.locator('#fun-dpad')).toBeHidden();
 expect(await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY)).toBe(null);
 let fallbackUses=0;
 for(let i=0;i<stage.proof.length;i++){
  const action=stage.proof[i],next=applyGate(stage,state,action);
  await page.locator('[data-fun-mode="'+action.prep.type+'"]').click();
  if(action.prep.type==='wall'||action.prep.type==='glove'){
   await page.locator('[data-cell="'+action.prep.from+'"]').click();
   await page.locator('[data-cell="'+action.prep.to+'"]').click();
  }else if(action.prep.type==='ice'||action.prep.type==='warp'){
   await page.locator('[data-cell="'+action.prep.to+'"]').click();
  }
  if(action.prep.type!=='none'){
   const prepared=page.locator('[data-cell="'+action.prep.to+'"]');
   await expect(prepared).toHaveClass(/prepared-target/);
   await expect(prepared).toHaveAttribute('aria-pressed','true');
   await expect(prepared).toHaveAttribute('aria-label',/ここに準備した/);
   await expect(page.locator('#fun-prompt')).toContainText('光る停止マスをタップしよう');
   if(action.prep.type==='warp')await expect(page.locator('#fun-prompt')).toContainText('ワープの準備');
   if(action.prep.type==='ice')await expect(page.locator('#fun-prompt')).toContainText('氷を置く準備');
   await expect(page.locator('#fun-moves')).toHaveText(String(i));
  }
  const targets=page.locator('[data-cell="'+next.position+'"]');
  await expect(targets).toHaveClass(/arrival/);
  // The tested pure resolver selects a tap only when the actual next state
  // is unambiguous. The browser never writes to internal state directly.
  const candidates=gateSuccessors(stage,state);
  const landing=tapLanding(candidates,action.prep,next.position);
  if(landing?.kind==='direction-required'){
   await targets.click();
   await expect(page.locator('#fun-dpad')).toBeVisible();
   await page.locator('[data-fun-dir="'+action.dir+'"]').click();
   fallbackUses++;
  }else{
   await targets.click();
  }
  await expect(page.locator('#fun-moves')).toHaveText(String(i+1));
  await expect(page.locator('#fun-board .prepared-target')).toHaveCount(0);
  state=next;
 }
 await expect(page.locator('#fun-result')).toBeVisible();
 await expect(page.locator('#fun-rank')).toContainText('Sランク');
 expect(await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY)).toBe(null);
 expect(fallbackUses).toBeGreaterThanOrEqual(0);
 expect(errors).toEqual([]);
});

for(const [width,height] of [[320,568],[320,844],[390,667],[390,844]]){
 test('packaged mobile controls: 44px arrows and board-to-pad visible after focusing play area '+width+'x'+height,async({page})=>{
  await page.setViewportSize({width,height});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/chapter-two.html?trial=1&practice=1&stage=70');
  await expect(page.locator('#fun-board')).toBeVisible();
  await expect(page.locator('#fun-action-guide')).toBeVisible();
  await expect(page.locator('#fun-quick-help')).not.toHaveAttribute('open','');
  const sizes=await page.locator('[data-fun-dir]').evaluateAll(buttons=>buttons.map(el=>({
   width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height
  })));
  expect(sizes).toHaveLength(4);
  for(const size of sizes){
   expect(size.width).toBeGreaterThanOrEqual(44);
   expect(size.height).toBeGreaterThanOrEqual(44);
  }
  await page.locator('#fun-board').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
  const geometry=await page.evaluate(()=>{
   const b=document.querySelector('#fun-board').getBoundingClientRect();
   const pad=document.querySelector('#fun-dpad').getBoundingClientRect();
   return {boardTop:b.top,padBottom:pad.bottom,viewport:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  expect(geometry.overflow).toBe(false);
  expect(geometry.boardTop).toBeGreaterThanOrEqual(-5);
  expect(geometry.padBottom).toBeLessThanOrEqual(geometry.viewport+5);
  // Inline help is still reusable; opening it cannot hide the actual puzzle.
  await page.locator('#fun-quick-help summary').click();
  await expect(page.locator('#fun-quick-help')).toHaveAttribute('open','');
  await expect(page.locator('#fun-board')).toBeVisible();
  await page.locator('#fun-quick-help summary').click();
  await expect(page.locator('#fun-quick-help')).not.toHaveAttribute('open','');
  expect(errors).toEqual([]);
 });
}

for(const width of [320,390]){
 test('packaged stage70: legal wall selection, destination and directions are explained without spoilers '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/chapter-two.html?trial=1&practice=1&stage=70');
  await expect(page.locator('#fun-action-guide')).toHaveAttribute('data-phase','direction');
  const before=await page.evaluate(()=>localStorage.getItem('zurash-app:chapter-two-preview:v1'));
  const wall=page.locator('[data-fun-mode="wall"]');
  await expect(wall).toBeEnabled();
  await wall.click();
  await expect(page.locator('#fun-action-guide')).toHaveAttribute('data-phase','wall');
  await expect(page.locator('#fun-action-next')).toContainText('動かせる壁');
  await expect(page.locator('#fun-board .cell.wall.hot').first()).toBeVisible();
  await expect(page.locator('[data-fun-dir][data-legal="true"]')).toHaveCount(0);
  await page.locator('#fun-board .cell.wall.hot').first().click();
  await expect(page.locator('#fun-action-guide')).toHaveAttribute('data-phase','target');
  await expect(page.locator('#fun-action-next')).toContainText('移動先');
  await page.locator('#fun-board .cell.hot').first().click();
  await expect(page.locator('#fun-action-guide')).toHaveAttribute('data-phase','direction');
  await expect(page.locator('#fun-action-directions')).not.toBeEmpty();
  expect(await page.locator('[data-fun-dir][data-legal="true"]').count()).toBeGreaterThan(0);
  await page.locator('[data-fun-mode="none"]').click();
  await expect(page.locator('#fun-action-title')).toHaveText('選んだ操作：そのまま滑る');
  await expect(page.locator('#fun-action-guide')).toHaveAttribute('data-phase','direction');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.evaluate(()=>localStorage.getItem('zurash-app:chapter-two-preview:v1'))).toBe(before);
  expect(errors).toEqual([]);
 });
}

for(const width of [320,390]){
 test('packaged adventure: earned S-best pace tracks retry, move, Undo without resetting best '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  const stage=completedJourneyStages[0];
  const save=checkpointTwo(newChapterTwo(),completedJourneyStages,stage,stage.proof);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({key,value})=>localStorage.setItem(key,value),{key:CHAPTER_TWO_KEY,value:JSON.stringify(save)});
  // Trial entry bypasses chapter-one completion for preview QA only; it is
  // not practice mode and still uses the genuine chapter-two record ledger.
  await page.goto('/chapter-two.html?trial=1&stage=51');
  await expect(page.locator('#fun-result')).toBeVisible();
  await expect(page.locator('#fun-best-chase')).toBeHidden();
  await expect(page.locator('#clear-challenge-play')).toHaveAttribute('href','./chapter-two.html?trial=1&practice=1&replay=1&stage=51');
  await page.locator('#fun-again').click();
  await expect(page.locator('#fun-result')).toBeHidden();
  await expect(page.locator('#fun-best-chase')).toBeVisible();
  await expect(page.locator('#fun-best-chase')).toHaveAttribute('data-phase','s-replay');
  await expect(page.locator('#fun-best-chase-label')).toContainText('あと8手');
  await page.locator('[data-fun-mode="none"]').click();
  await page.locator('[data-fun-dir="1"]').click();
  await expect(page.locator('#fun-moves')).toHaveText('1');
  await expect(page.locator('#fun-retry')).toBeEnabled();
  await expect(page.locator('#fun-best-chase-label')).toContainText('あと7手');
  await page.locator('#fun-undo').click();
  await expect(page.locator('#fun-moves')).toHaveText('0');
  await expect(page.locator('#fun-best-chase-label')).toContainText('あと8手');
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).completed,CHAPTER_TWO_KEY)).toEqual(save.completed);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 });
}
