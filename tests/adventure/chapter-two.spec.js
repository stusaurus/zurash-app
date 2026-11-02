import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const stages=JSON.parse(fs.readFileSync(new URL('../../data/chapters/chapter-02/adventure-v1.json',import.meta.url))).stages;
async function act(page,a){
 await page.locator('[data-fun-mode="'+a.prep.type+'"]').click();
 if(['wall','glove'].includes(a.prep.type))await page.locator('#fun-board [data-cell="'+a.prep.from+'"]').click();
 if(a.prep.to!==undefined)await page.locator('#fun-board [data-cell="'+a.prep.to+'"]').click();
 await page.locator('[data-fun-dir="'+a.dir+'"]').click();
 await expect(page.locator('#fun-retry')).toBeEnabled();
}
for(const width of [320,390,1440]){
 test('chapter two adventure: all mixed stages, unlock, save, hints, undo and retry at '+width,async({page})=>{
  await page.setViewportSize({width,height:844});await page.emulateMedia({reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
  await page.goto('/chapter-two.html?trial=1');
  await expect(page.locator('#fun-title')).toHaveText(stages[0].chapter.title);
  await expect(page.locator('[data-stage-choice="2"]')).toBeDisabled();
  const before=await page.evaluate(()=>localStorage.getItem('zurash-app:home-preview:ice-town:v2'));
  for(const [n,s]of stages.entries()){
   await expect(page.locator('#fun-title')).toHaveText(s.chapter.title);
   await expect(page.locator('#fun-count')).toContainText(String(s.chapter.number));
   if(n===0){
    for(let hint=1;hint<=4;hint++)await page.locator('#fun-hint').click();
    await expect(page.locator('#fun-feedback ol li')).toHaveCount(s.proof.length);
   }
   for(const [i,a]of s.proof.entries()){
    await act(page,a);await expect(page.locator('#fun-moves')).toHaveText(String(i+1));
    if(i===2){
     await page.reload();await expect(page.locator('#fun-moves')).toHaveText('3');
     await page.locator('#fun-undo').click();await expect(page.locator('#fun-moves')).toHaveText('2');await act(page,a);
    }
   }
   await expect(page.locator('#fun-rank')).toHaveText('Sランク合格！');
   await expect(page.locator('#fun-finish')).toContainText('壁移動'+s.proof.filter(a=>['wall','glove'].includes(a.prep.type)).length+'回');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   if(n===stages.length-1){await page.screenshot({path:'test-results/chapter-two-'+test.info().project.name+'-'+width+'.png',fullPage:true});await page.reload();await expect(page.locator('#fun-result')).toBeVisible();await expect(page.locator('#fun-benchmark')).toContainText('最短 '+s.challenge.minimumTurns+'手');}
   else await page.locator('#fun-next').click();
  }
  expect(await page.evaluate(()=>localStorage.getItem('zurash-app:home-preview:ice-town:v2'))).toBe(before);
  await page.locator('#fun-retry').click();await expect(page.locator('#fun-moves')).toHaveText('0');
  await page.reload();await expect(page.locator('#fun-moves')).toHaveText('0');
  expect(errors).toEqual([]);
 });
 test('chapter two adventure: first chapter requirement and trial entry at '+width,async({page})=>{
  await page.setViewportSize({width,height:844});await page.goto('/chapter-two.html');
  await expect(page.locator('#fun-title')).toHaveText('もうすぐ、新しい冒険へ');
  await page.getByRole('link',{name:'第2章だけ先行試遊する'}).click();
  await expect(page.locator('#fun-title')).toHaveText(stages[0].chapter.title);
 });
}
for(const width of [320,390,1440])test('chapter two adventure: direct practice70, all tools undo and separate save at '+width,async({page})=>{
 await page.setViewportSize({width,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/chapter-two.html?trial=1&practice=1&stage=70');
 const stage=stages.find(s=>s.chapter.number===70);
 await expect(page.locator('#fun-title')).toHaveText(stage.chapter.title);
 const original=await page.evaluate(()=>localStorage.getItem('zurash-app:chapter-two-preview:v1'));
 for(const [i,a]of stage.proof.entries()){
  await act(page,a);
  if(['ice','glove','warp'].includes(a.prep.type)){
   await page.locator('#fun-undo').click();await expect(page.locator('#fun-moves')).toHaveText(String(i));await act(page,a);
   await page.reload();await expect(page.locator('#fun-moves')).toHaveText(String(i+1));
  }
 }
 await expect(page.locator('#fun-rank')).toHaveText('Sランク合格！');
 await expect(page.locator('#chapter-story-title')).toHaveText('第2章・全20ステージクリア！');
 await expect(page.locator('#chapter-story')).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('zurash-app:chapter-two-preview:v1'))).toBe(original);
 await page.locator('.chapter-map summary').click();
 await expect(page.locator('[data-stage-choice="1"]')).toBeEnabled();
 await page.locator('[data-stage-choice="1"]').click();await expect(page.locator('#fun-title')).toHaveText(stages[0].chapter.title);
});

test('chapter two adventure: deployed clean URL keeps chapter mode and direct practice',async({page})=>{
 await page.route('**/chapter-two?*',async route=>route.fulfill({path:new URL('../../chapter-two.html',import.meta.url).pathname,contentType:'text/html'}));
 await page.goto('/chapter-two?trial=1&practice=1&stage=70');
 await expect(page.locator('#fun-title')).toHaveText(stages.find(s=>s.chapter.number===70).chapter.title);
 await expect(page.locator('#fun-count')).toHaveText('STAGE 70');
});

test('chapter two adventure: invalid save can be downloaded then deliberately recovered without touching house',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/chapter-two.html?trial=1');
 const invalid='{"version":999,"opaque":"do not destroy"}';
 await page.evaluate(({raw})=>{
  localStorage.setItem('zurash-app:chapter-two-preview:v1',raw);
  localStorage.setItem('zurash-app:home-preview:ice-town:v2','keep-chapter-one');
 },{raw:invalid});
 await page.reload();
 await expect(page.locator('#save-recovery')).toBeVisible();
 await expect(page.locator('#save-status')).toContainText('上書きしません');
 const output=page.waitForEvent('download');
 await page.locator('#download-invalid-save').click();
 const downloaded=await output;expect(downloaded.suggestedFilename()).toContain('original-record.txt');
 expect(await page.evaluate(()=>localStorage.getItem('zurash-app:chapter-two-preview:v1'))).toBe(invalid);
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#reset-invalid-save').click();
 await expect(page.locator('#save-recovery')).toBeHidden();
 await expect(page.locator('#fun-title')).toHaveText(stages[0].chapter.title);
 await expect(page.locator('#save-status')).toContainText('元の記録は');
 const result=await page.evaluate(()=>{
  const key='zurash-app:chapter-two-preview:v1';
  const backupKey=Object.keys(localStorage).find(s=>s.startsWith(key+':invalid-backup:'));
  return {saved:localStorage.getItem(key),backup:backupKey?localStorage.getItem(backupKey):null,house:localStorage.getItem('zurash-app:home-preview:ice-town:v2')};
 });
 expect(JSON.parse(result.saved)).toEqual({version:1,completed:{},active:{id:stages[0].id,revision:stages[0].revision,actions:[]}});
 expect(result.backup).toBe(invalid);
 expect(result.house).toBe('keep-chapter-one');
 await page.reload();
 await expect(page.locator('#fun-title')).toHaveText(stages[0].chapter.title);
 await expect(page.locator('#save-recovery')).toBeHidden();
});

test('chapter two adventure: a human review is optional, local-only, persistent and exportable',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/chapter-two.html?trial=1&practice=1&stage=54');
 await expect(page.locator('#fun-count')).toHaveText('STAGE 54');
 const campaignBefore=await page.evaluate(()=>localStorage.getItem('zurash-app:chapter-two-preview:v1'));
 await page.locator('#playtest-review summary').click();
 await page.locator('#review-enjoyment').selectOption('poor');
 await page.locator('#review-difficulty').selectOption('hard');
 await page.locator('#review-note').fill('54面は壁移動が少なくて、滑走が長く感じた。');
 await page.locator('#playtest-form button[type=submit]').click();
 await expect(page.locator('#review-status')).toContainText('端末内に保存しました');
 await page.reload();
 await page.locator('#playtest-review summary').click();
 await expect(page.locator('#review-enjoyment')).toHaveValue('poor');
 await expect(page.locator('#review-difficulty')).toHaveValue('hard');
 await expect(page.locator('#review-note')).toHaveValue('54面は壁移動が少なくて、滑走が長く感じた。');
 expect(await page.evaluate(()=>localStorage.getItem('zurash-app:chapter-two-preview:v1'))).toBe(campaignBefore);
 const download=page.waitForEvent('download');
 await page.locator('#export-playtest-reviews').click();
 const file=await download;expect(file.suggestedFilename()).toBe('zurash-chapter-two-playtest-reviews.json');
 const data=JSON.parse(await page.evaluate(()=>localStorage.getItem('zurash-app:chapter-two-playtest-review:v1')));
 const stage=stages.find(s=>s.chapter.number===54);
 expect(data.reviews[stage.id]).toMatchObject({enjoyment:'poor',difficulty:'hard',note:'54面は壁移動が少なくて、滑走が長く感じた。'});
});
