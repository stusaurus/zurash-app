import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {TASKS,newHome,HOME_KEY} from '../../src/puzzle/house.js';
const proofs=JSON.parse(fs.readFileSync(new URL('../../reports/chapter-01/solutions.json',import.meta.url))).stages;
async function perform(page,action){
  await page.locator(`[data-mode="${action.prep.type}"]`).click();
  if(['wall','glove'].includes(action.prep.type))await page.locator(`[data-cell="${action.prep.from}"]`).click();
  if(['wall','glove','ice'].includes(action.prep.type))await page.locator(`[data-cell="${action.prep.to}"]`).click();
  await page.locator(`[data-dir="${action.dir}"]`).click();
}
async function openRepairs(page){
 if(await page.locator('#repair-menu').getAttribute('aria-expanded')!=='true')await page.locator('#repair-menu').click();
}
// An isolated earned-star fixture lets UI failures surface before the long playthrough.
// The full six-condition test below earns every star through the actual puzzles.
test('scene controls, pending resume and designs',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const fixture=newHome();fixture.home.reached=50;
  for(let n=1;n<=50;n++)fixture.progress.completed[`pz-${100000+n}`]={reward:1,bestTurns:1,revision:1};
  await page.addInitScript(({key,save})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(save));},{key:HOME_KEY,save:fixture});
  await page.goto('/adventure.html');
  await expect(page.locator('#home-repairs')).toBeHidden();
  await page.locator('[data-edit-object="home-entry-0"]').click();
  await expect(page.locator('#home-repairs')).toBeVisible();
  await expect(page.locator('#preview-home-entry-0 figcaption')).toHaveText('修復前');
  const ids=await page.locator('[id]').evaluateAll(es=>es.map(e=>e.id));expect(new Set(ids).size).toBe(ids.length);
  for(const preview of await page.locator('.repair-preview>svg').all()){
    const error=await preview.evaluate(e=>{const box=e.getBoundingClientRect(),v=e.viewBox.baseVal;return Math.abs(box.width/box.height-v.width/v.height);});
    expect(error).toBeLessThan(.02);
  }
  await page.locator('#close-repairs').click();
  await expect(page.locator('#home-repairs')).toBeHidden();
  await page.getByRole('button',{name:'玄関へ',exact:true}).click();
  await page.getByRole('button',{name:'キッチンへ',exact:true}).click();
  await expect(page.locator('#home-screen')).toHaveAttribute('data-scene','kitchen');
  await page.locator('[data-area="entry"]').click();await openRepairs(page);
  for(const t of TASKS.slice(0,3)){
    await page.locator(`[data-repair="${t.id}"]`).click();
    await expect(page.locator(`[data-object="${t.id}"]`)).toHaveAttribute('data-state','building');
    await expect(page.locator(`#preview-${t.id} figcaption`)).toHaveText('修復中…');
    if(t===TASKS[0]){await page.reload();await page.locator('[data-area="entry"]').click();await openRepairs(page);}
    await expect(page.locator(`[data-style="${t.id}"][data-choice="0"]`)).toBeVisible();
  }
  for(let i=0;i<3;i++){
    for(const t of TASKS.slice(0,3))await page.locator(`[data-style="${t.id}"][data-choice="${i}"]`).click();
    await expect(page.locator('[data-door-design]')).toHaveAttribute('data-door-design',['arch','glass','crystal'][i]);
    await page.getByRole('button',{name:'外観に戻る',exact:true}).click();
    await expect(page.locator('[data-door-design]')).toHaveAttribute('data-door-design',['arch','glass','crystal'][i]);
    await expect(page.locator('#home-balance')).toHaveText('42');
    await page.locator('[data-area="entry"]').click();await openRepairs(page);
  }
  await page.reload();await page.locator('[data-area="entry"]').click();await openRepairs(page);
  await expect(page.locator('[data-door-design]')).toHaveAttribute('data-door-design','crystal');
  await expect(page.locator('#preview-home-entry-0 figcaption')).toHaveText('クリスタル');
  expect(await page.locator('.home-bottom').evaluate(e=>getComputedStyle(e).position)).not.toBe('fixed');
  expect(await page.locator('.home-bottom').evaluate(e=>getComputedStyle(e).position)).not.toBe('sticky');
  for(const choice of await page.locator('[data-style]').all()){
    await choice.scrollIntoViewIfNeeded();
    expect(await choice.evaluate(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e===hit||e.contains(hit);})).toBeTruthy();
  }
  await page.locator('#close-repairs').click();await expect(page.locator('#home-repairs')).toBeHidden();
  // Finishing the last repair can happen while a puzzle is open.
  const nearComplete=structuredClone(fixture);
  for(const t of TASKS.slice(0,-1)){nearComplete.home.done[t.id]=true;nearComplete.progress.town[t.id]=t.cost;}
  await page.evaluate(({key,save})=>localStorage.setItem(key,JSON.stringify(save)),{key:HOME_KEY,save:nearComplete});
  await page.reload();await page.locator('[data-area="garden"]').click();await openRepairs(page);
  await page.locator(`[data-repair="${TASKS.at(-1).id}"]`).click();
  await page.locator('#play-next').click();
  await expect(page.locator('#notice-title')).toHaveText('トリケンの家が完成！');
  await page.locator('#notice-primary').click();
  await expect(page.locator('#home-screen')).toBeVisible();
  await expect(page.locator('.game-panel')).toBeHidden();
  await expect(page.locator('#home-screen')).toHaveAttribute('data-scene','exterior');
  await expect(page.locator('#home-balance')).toHaveText('10');
});
test('art comparisons at the same camera',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 for(const version of ['pr4','new'])for(const scene of ['exterior','entry']){
  for(const [state,style]of [['before',0],['complete',0],['complete',1],['complete',2],...(version==='new'?[['building',0]]:[])]){
   await page.goto(`/tests/fixtures/house-art-review.html?version=${version}&scene=${scene}&state=${state}&style=${style}`);
   await expect(page.locator('html')).toHaveAttribute('data-ready','true');
   await page.evaluate(async()=>{const urls=[...new Set([...document.querySelectorAll('#art image')].map(e=>e.href.baseVal))];await Promise.all(urls.map(src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=resolve;im.onerror=()=>reject(Error('Art image failed: '+src));im.src=src;})));});
   const label=`${version}-${scene}-${state}-${style}`;
   const shot=await page.locator('#art').screenshot({animations:'disabled',type:'jpeg',quality:82,path:info.outputPath(label+'.jpg')});
  }
 }
 expect(errors).toEqual([]);
});
for(const width of [320,390,1440])test(`all 50 stages, unlock events and reload at ${width}px`,async({page},info)=>{
  await page.setViewportSize({width,height:900});const errors=[],httpErrors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400&&/\.(js|json|webp|png|css)(\?|$)/.test(r.url()))httpErrors.push(`${r.status()} ${r.url()}`);});
  await page.goto('/adventure.html');await page.locator('#play-next').click();
  for(const proof of proofs){
    const number=proof.number;
    await expect(page.locator('#board')).toHaveAttribute('data-stage',String(number));
    if([10,20,30].includes(number)){
      await expect(page.locator('#notice-kicker')).toContainText('新しい道具');
      await expect(page.locator('#notice')).toBeVisible();await page.locator('#notice-primary').click();
    }
    if(number<10)for(const mode of ['ice','glove','warp'])await expect(page.locator(`[data-mode="${mode}"]`)).toBeDisabled();
    if(number===10){await expect(page.locator('[data-mode="ice"]')).toBeEnabled();await expect(page.locator('[data-mode="glove"]')).toBeDisabled();}
    if(number===20){await expect(page.locator('[data-mode="glove"]')).toBeEnabled();await expect(page.locator('[data-mode="warp"]')).toBeDisabled();}
    if(number===30)await expect(page.locator('[data-mode="warp"]')).toBeEnabled();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
    if([1,10,20,23,30,40,50].includes(number)){
      await page.screenshot({animations:'disabled',path:info.outputPath(`chapter-stage-${number}-${width}.png`),fullPage:true});
      if(info.project.name==='chromium'&&width===390&&[10,23,50].includes(number)){
      }
    }
    if(number===1){
      await page.locator('#return-home').click();
      await expect(page.locator('#home-screen')).toHaveAttribute('data-scene','exterior');
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('#moves')).toHaveText('0'); // House keyboard input must not move the hidden puzzle.
      await page.locator('#play-next').click();
      await expect(page.locator('#board')).toHaveAttribute('data-stage','1');
    }
    const before=Number(await page.locator('#balance').textContent());
    // At stage 50 the first glove charge must be restored by Undo.
    if(number===50){
      await perform(page,proof.actions[0]);await expect(page.locator('#moves')).toHaveText('1');
      await page.locator('#undo').click();await expect(page.locator('#moves')).toHaveText('0');
      await expect(page.locator('[data-mode="glove"]')).toContainText('あと 1 回');
    }
    for(let i=0;i<proof.actions.length;i++){
      if(number===1)await page.locator('#board .cell.arrival:has(.star)').click();
      else await perform(page,proof.actions[i]);
      await expect(page.locator('#moves')).toHaveText(String(i+1));
    }
    await expect(page.locator('#notice')).toBeVisible();await expect(page.locator('#remaining')).toHaveText('0');await expect(page.locator('#balance')).toHaveText(String(before+1));
    if(number<50){await page.locator('#notice-primary').click();await page.locator('#play-next').click();}
  }
  await page.locator('#notice-primary').click();
  await expect(page.locator('#home-balance')).toHaveText('50');
  // The new exterior is the home; entering a room changes the actual artwork.
  await expect(page.locator('#home-screen')).toHaveAttribute('data-scene','exterior');
  await expect(page.locator('[data-scene-art="exterior"]')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  for(const b of await page.locator('.scene-hotspot,.object-target').all()){
    const box=await b.boundingBox();expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
  }
  await page.getByRole('button',{name:'玄関へ',exact:true}).click();
  await expect(page.locator('[data-scene-art="entry"]')).toBeVisible();
  await page.getByRole('button',{name:'キッチンへ',exact:true}).click();
  await expect(page.locator('#home-screen')).toHaveAttribute('data-scene','kitchen');
  await page.locator('[data-area="entry"]').click();await openRepairs(page);
  if(info.project.name==='chromium'&&width===390){
    await page.screenshot({animations:'disabled',path:info.outputPath('entry-before-390.png'),fullPage:true});
  }
  for(const t of TASKS){
    await page.locator(`[data-area="${t.area}"]`).click();await expect(page.locator('#home-screen')).toHaveAttribute('data-scene',t.area);await openRepairs(page);await page.locator(`[data-repair="${t.id}"]`).click();
    if(t===TASKS[0]){
      await expect(page.locator(`[data-object="${t.id}"]`)).toHaveAttribute('data-state','building');
      await expect(page.locator('#home-balance')).toHaveText('47');
      await page.reload(); // Paid construction resumes without a second debit.
      await page.locator('[data-area="entry"]').click();await openRepairs(page);
    }
    await expect(page.locator(`[data-style="${t.id}"][data-choice="2"]`)).toBeVisible();
    if(t!==TASKS.at(-1))await page.locator(`[data-style="${t.id}"][data-choice="2"]`).click();
  }
  await expect(page.locator('#notice-title')).toHaveText('トリケンの家が完成！');await page.locator('#notice-primary').click();
  await expect(page.locator('#home-screen')).toHaveAttribute('data-scene','exterior');
  await expect(page.locator('#home-repairs')).toBeHidden();
  await expect(page.locator('#home-balance')).toHaveText('10');
  // Every entry design has different geometry/materials and is shared by both views.
  const motifs=[['arch','timber','lantern'],['glass','clapboard','bell'],['crystal','masonry','crystal']];
  for(let choice=0;choice<3;choice++){
    await page.locator('[data-area="entry"]').click();await openRepairs(page);
    for(const t of TASKS.slice(0,3))await page.locator(`[data-style="${t.id}"][data-choice="${choice}"]`).click();
    for(const scene of ['entry','exterior']){
      if(scene==='exterior')await page.getByRole('button',{name:'外観に戻る',exact:true}).click();
      await expect(page.locator(`[data-scene-art="${scene}"] [data-door-design]`)).toHaveAttribute('data-door-design',motifs[choice][0]);
      await expect(page.locator(`[data-scene-art="${scene}"]`)).toHaveAttribute('data-wall-design',motifs[choice][1]);
      await expect(page.locator(`[data-scene-art="${scene}"] [data-light-design]`)).toHaveAttribute('data-light-design',motifs[choice][2]);
      await expect(page.locator('#home-balance')).toHaveText('10');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
      if(info.project.name==='chromium'&&width===390){
        await page.screenshot({animations:'disabled',path:info.outputPath(`${scene}-design-${choice}-390.png`),fullPage:true});
      }
    }
  }
  await page.reload();
  await page.locator('[data-area="entry"]').click();await openRepairs(page);
  for(const t of TASKS.slice(0,3))await expect(page.locator(`[data-style="${t.id}"][data-choice="2"]`)).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('[data-door-design]')).toHaveAttribute('data-door-design','crystal');
  for(const choice of await page.locator('[data-style]').all()){
    await choice.scrollIntoViewIfNeeded();
    expect(await choice.evaluate(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e===hit||e.contains(hit);})).toBeTruthy();
  }
  await page.screenshot({animations:'disabled',path:info.outputPath(`completed-house-${width}.png`),fullPage:true});
  await page.reload();await expect(page.locator('#home-balance')).toHaveText('10');
  await page.locator('#play-next').click();await expect(page.locator('#board')).toHaveAttribute('data-stage','50');
  for(const action of proofs[49].actions)await perform(page,action);
  await expect(page.locator('#balance')).toHaveText('10');await expect(page.locator('#notice-text')).toContainText('獲得済み');
  expect(errors).toEqual([]);expect(httpErrors).toEqual([]);
});

for(const width of [320,390,1440])test(`v7 all scenes and all designs at ${width}px`,async({page},info)=>{
 const errors=[],http=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)http.push(r.url());});
 await page.setViewportSize({width,height:844});const timings=[];
 for(const scene of ['exterior','entry','living','kitchen','bedroom','garden']){
  const hashes=[];
  for(const [state,style]of [['before',0],['complete',0],['complete',1],['complete',2],['building',0]]){
   const start=Date.now();await page.goto(`/tests/fixtures/house-v7-review.html?scene=${scene}&state=${state}&style=${style}`);
   await expect(page.locator('body')).toHaveAttribute('data-ready','true');
   timings.push({scene,state,style,readyMs:Date.now()-start});
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
   const paths=await page.locator('[data-object] image').evaluateAll(es=>es.map(e=>e.getAttribute('href')).join('|'));hashes.push(paths);
   const ids=await page.locator('[id]').evaluateAll(es=>es.map(e=>e.id));expect(new Set(ids).size).toBe(ids.length);
   if(state==='building')await expect(page.locator('[data-state="building"]')).toHaveCount(1);
  }
  expect(new Set(hashes.slice(0,4)).size).toBe(4);
 }
 expect(errors).toEqual([]);expect(http).toEqual([]);
 console.log('V7_RENDER_METRICS='+JSON.stringify({browser:info.project.name,width,timings}));
});

test('v7 every repair has three persistent independent designs and bounded loading',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});const fixture=newHome();fixture.home.reached=50;
 for(let n=1;n<=50;n++)fixture.progress.completed[`pz-${100000+n}`]={reward:1,bestTurns:1,revision:1};
 for(const t of TASKS){fixture.progress.town[t.id]=t.cost;fixture.home.done[t.id]=true;}
 fixture.home.completionSeen=true;
 await page.addInitScript(({key,save})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(save));},{key:HOME_KEY,save:fixture});
 const started=Date.now();await page.goto('/adventure.html');await expect(page.locator('.house-world')).toHaveAttribute('data-art-ready','true');const initialMs=Date.now()-started;
 const initialImages=await page.locator('.house-world image').count();expect(initialImages).toBeLessThan(12);
 const switching=[];
 for(const area of ['entry','living','kitchen','bedroom','garden']){
  const start=Date.now();await page.locator(`[data-area="${area}"]`).click();await expect(page.locator('#home-screen')).toHaveAttribute('data-scene',area);await expect(page.locator('.house-world')).toHaveAttribute('data-art-ready','true');switching.push({area,ms:Date.now()-start});
  await openRepairs(page);
  for(const task of TASKS.filter(t=>t.area===area))for(let i=0;i<3;i++){
   await page.locator(`[data-style="${task.id}"][data-choice="${i}"]`).click();
   await expect(page.locator(`[data-object="${task.id}"]`)).toHaveAttribute('data-variant',['a','b','c'][i]);
   await expect(page.locator('#home-balance')).toHaveText('10');
  }
  await page.locator('#close-repairs').click();
 }
 await page.reload();await expect(page.locator('#home-balance')).toHaveText('10');
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),HOME_KEY);for(const t of TASKS)expect(saved.home.styles[t.id]).toBe(2);
 const resources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>/assets\/house\//.test(e.name)).map(e=>({name:e.name.split('/assets/')[1],bytes:e.transferSize,duration:e.duration})));
 let heap=null;if(info.project.name==='chromium'){const cdp=await page.context().newCDPSession(page);const usage=await cdp.send('Runtime.getHeapUsage');heap={usedSize:usage.usedSize,totalSize:usage.totalSize};}
 console.log('V7_APP_METRICS='+JSON.stringify({browser:info.project.name,initialMs,initialImages,switching,resources,jsHeapBytes:heap,device:'GitHub Actions desktop browser; not iPhone hardware',network:'local HTTP, no throttling'}));
});

test('v7 missing runtime image shows a load error, never a false ready state',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.route('**/assets/house/v7/backgrounds/forest-fixed-v1.webp',route=>route.fulfill({status:404,body:'unavailable'}));
 await page.goto('/adventure.html');
 await expect(page.locator('#home-screen')).toBeVisible();
 await expect(page.locator('.house-world')).toHaveAttribute('data-art-ready','error');
 await expect(page.locator('.house-world')).not.toHaveAttribute('data-art-ready','true');
});


test('v7 mobile art gallery loads all 30 views from root without changing saves',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const httpErrors=[];
 page.on('response',response=>{
  if(response.status()>=400&&/\.(webp|png)(\?|$)/.test(response.url()))httpErrors.push(response.status()+' '+response.url());
 });
 await page.goto('/tests/fixtures/house-v7-gallery.html');
 await expect(page.locator('body')).toHaveAttribute('data-ready','true');
 const initialStore=await page.evaluate(()=>({...localStorage}));
 for(const area of ['exterior','entry','living','kitchen','bedroom','garden']){
  await page.locator('[data-scene="'+area+'"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-ready','true');
  for(const state of ['before','building','a','b','c']){
   await page.locator('#states button[data-state="'+state+'"]').click();
   await expect(page.locator('body')).toHaveAttribute('data-ready','true');
   await expect(page.locator('#status')).toContainText('読み込み済み');
   const urlCheck=await page.locator('#preview image').evaluateAll(images=>({
    count:images.length,
    paths:images.map(image=>new URL(image.getAttribute('href'),document.baseURI).pathname),
   }));
   expect(urlCheck.count).toBeGreaterThan(0);
   expect(urlCheck.paths.every(path=>path.startsWith('/assets/'))).toBe(true);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  }
 }
 expect(httpErrors).toEqual([]);
 expect(await page.evaluate(()=>({...localStorage}))).toEqual(initialStore);
});


test('approved art comparison keeps current puzzle rules and home appearance untouched',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/adventure.html?art=approved');
 await expect(page.locator('html')).toHaveClass(/art-review-approved/);
 await expect(page.locator('#home-screen')).toBeVisible();
 await expect(page.locator('.house-world')).toHaveAttribute('data-art-ready','true');
 await page.locator('#play-next').click();
 await expect(page.locator('.game-panel')).toBeVisible();
 await expect(page.locator('#board')).toHaveAttribute('data-stage','1');
 const boardStyle=await page.locator('#board').evaluate(el=>getComputedStyle(el).backgroundImage);
 expect(boardStyle).toContain('linear-gradient');
 const background=await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundImage);
 expect(background).toContain('ice-world-mobile.webp');
 expect(await page.locator('#board .cell').count()).toBe(16);
 await page.screenshot({animations:'disabled',path:info.outputPath('approved-ice-puzzle-mobile.png'),fullPage:true});
 await page.locator('[data-dir="1"]').click();
 await expect(page.locator('#notice')).toBeVisible();
 await expect(page.locator('#notice-title')).toHaveText('クリア！');
 await page.locator('#notice-primary').click();
 await expect(page.locator('#home-screen')).toBeVisible();
 await page.goto('/adventure.html');
 await expect(page.locator('html')).not.toHaveClass(/art-review-approved/);
 await expect(page.locator('#home-screen')).toBeVisible();
});


test('approved-art stage 14 keeps a tall puzzle on screen and animates a legal slide',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const fixture=newHome();
 fixture.home.reached=14;
 for(let n=1;n<=13;n++)fixture.progress.completed['pz-'+(100000+n)]={reward:1,bestTurns:4,revision:1};
 await page.addInitScript(({key,save})=>{
  if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(save));
 },{key:HOME_KEY,save:fixture});
 await page.addInitScript(()=>{
  const original=Element.prototype.animate;
  window.__previewSlideAnimations=0;
  if(typeof original==='function'){
   Element.prototype.animate=function(frames,options){
    if(this.matches?.('.cell img'))window.__previewSlideAnimations++;
    return original.call(this,frames,options);
   };
  }
 });
 await page.goto('/adventure.html?art=approved');
 await page.locator('#play-next').click();
 await expect(page.locator('#board')).toHaveAttribute('data-stage','14');
 await expect(page.locator('.tap-hint')).toBeVisible();
 const approvedSize=await page.locator('#board').boundingBox();
 expect(approvedSize.height).toBeLessThan(550);
 expect(approvedSize.width).toBeLessThan(300);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await perform(page,proofs[13].actions[0]);
 await expect(page.locator('#moves')).toHaveText('1');
 expect(await page.evaluate(()=>window.__previewSlideAnimations)).toBeGreaterThanOrEqual(1);
 await page.goto('/adventure.html');
 await page.locator('#play-next').click();
 await expect(page.locator('.tap-hint')).toBeHidden();
 expect(await page.locator('#board').evaluate(el=>el.style.maxWidth)).toBe('');
});


test('independent ten-stage puzzle lab can be completed on mobile without writing game saves',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});
 const bundle=JSON.parse(fs.readFileSync(new URL('../../data/chapters/chapter-01/fun-candidates-v1.json',import.meta.url)));
 const failed=[];
 page.on('pageerror',error=>failed.push(String(error)));
 page.on('response',response=>{if(response.status()>=400)failed.push(response.status()+' '+response.url());});
 await page.goto('/fun-lab.html');
 await expect(page.locator('#fun-title')).toHaveText(bundle.stages[0].chapter.title);
 const initial=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
 for(const stage of bundle.stages){
  await expect(page.locator('#fun-board')).toHaveAttribute('data-stage',String(stage.chapter.number));
  await expect(page.locator('#fun-title')).toHaveText(stage.chapter.title);
  const box=await page.locator('#fun-board').boundingBox();
  expect(box.height).toBeLessThanOrEqual(420);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const action of stage.proof){
   const kind=action.prep.type;
   await page.locator('[data-fun-mode="'+kind+'"]').click();
   if(kind==='wall'){
    await page.locator('#fun-board [data-cell="'+action.prep.from+'"]').click();
    await page.locator('#fun-board [data-cell="'+action.prep.to+'"]').click();
   }else if(kind==='ice'){
    await page.locator('#fun-board [data-cell="'+action.prep.to+'"]').click();
   }
   await page.locator('[data-fun-dir="'+action.dir+'"]').click();
   await expect(page.locator('#fun-retry')).toBeEnabled();
  }
  await expect(page.locator('#fun-result')).toBeVisible();
  await expect(page.locator('#fun-stars')).toHaveText('0');
  if(stage.chapter.number===6){
   await page.screenshot({animations:'disabled',path:info.outputPath('fun-lab-stage6-390.png'),fullPage:true});
  }
  await page.locator('#fun-next').click();
 }
 await expect(page.locator('#fun-board')).toHaveAttribute('data-stage','1');
 expect(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))).toEqual(initial);
 expect(failed).toEqual([]);
});


test('16 and 19-turn experimental puzzles are playable with iPhone controls and no save writes',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});
 const bundle=JSON.parse(fs.readFileSync(new URL('../../data/chapters/chapter-01/long-candidates-v1.json',import.meta.url)));
 const pageErrors=[];
 page.on('pageerror',error=>pageErrors.push(String(error)));
 page.on('response',r=>{if(r.status()>=400)pageErrors.push(r.status()+' '+r.url());});
 await page.goto('/long-lab.html');
 await expect(page.locator('#fun-board')).toHaveAttribute('data-stage','1');
 await expect(page.locator('#fun-goal')).toBeVisible();
 await expect(page.locator('#fun-pass-target')).toHaveText('20手以内');
 await expect(page.locator('#fun-remaining')).toHaveText('合格ラインまで残り 20手');
 await expect(page.locator('#fun-benchmark')).toBeHidden();
 const arrows={};
 for(const dir of ['0','1','2','3'])arrows[dir]=await page.locator('[data-fun-dir="'+dir+'"]').boundingBox();
 expect(arrows['0'].y).toBeLessThan(arrows['3'].y);
 expect(arrows['3'].x).toBeLessThan(arrows['1'].x);
 expect(arrows['2'].y).toBeGreaterThan(arrows['1'].y);
 expect(Math.abs(arrows['0'].x-arrows['2'].x)).toBeLessThan(2);
 
 const initial=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
 for(const candidate of bundle.stages){
  await expect(page.locator('#fun-title')).toHaveText(candidate.chapter.title);
  for(let i=0;i<candidate.proof.length;i++){
   const a=candidate.proof[i],kind=a.prep.type;
   await page.locator('[data-fun-mode="'+kind+'"]').click();
   if(kind==='wall'){
    await page.locator('#fun-board [data-cell="'+a.prep.from+'"]').click();
    await page.locator('#fun-board [data-cell="'+a.prep.to+'"]').click();
   }
   await page.locator('[data-fun-dir="'+a.dir+'"]').click();
   await expect(page.locator('#fun-moves')).toHaveText(String(i+1));
   await expect(page.locator('#fun-retry')).toBeEnabled();
  }
  await expect(page.locator('#fun-result')).toBeVisible();
  await expect(page.locator('#fun-rank')).toHaveText('Sランク合格！');
  // iPhone must actually reveal the rank and retry action, not only add offscreen DOM.
  await expect(page.locator('#fun-rank')).toBeFocused();
  await expect.poll(async()=>page.locator('#fun-result').evaluate(el=>{
   const rect=el.getBoundingClientRect();
   return rect.top>=0 && rect.bottom <= window.innerHeight-16;
  }),{timeout:5000}).toBe(true);
  await expect(page.locator('#fun-benchmark')).toContainText('最短 '+candidate.challenge.minimumTurns+'手');
  await expect(page.locator('#fun-benchmark')).toContainText('合格 '+candidate.challenge.passThrough+'手以内');
  await expect(page.locator('#fun-again')).toBeVisible();
  await expect(page.locator('#fun-best')).toHaveText('今回の試遊での自己ベスト '+candidate.challenge.minimumTurns+'手');
  await expect(page.locator('#fun-finish')).toContainText('考える＋操作する時間');
  await expect(page.locator('#fun-finish')).toContainText('Undo 0回');
  await expect(page.locator('#fun-finish')).toContainText('ヒント 0回');
  await expect(page.locator('#fun-stars')).toHaveText('0');
  const board=await page.locator('#fun-board').boundingBox();
  expect(board.height).toBeLessThanOrEqual(430);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(candidate.chapter.number===1){
   await page.screenshot({path:info.outputPath('long-puzzle-stage1-390.png'),animations:'disabled',fullPage:true});
  }
  await page.locator('#fun-next').click();
  if(candidate.chapter.number===1){
   await expect(page.locator('#fun-pass-target')).toHaveText('24手以内');
   await expect(page.locator('#fun-benchmark')).toBeHidden();
  }
  if(candidate.chapter.number===2){
   await expect(page.locator('#fun-pass-target')).toHaveText('20手以内');
   await expect(page.locator('#fun-title')).toHaveText('氷壁のバトン');
  }
 }
 await expect(page.locator('#fun-board')).toHaveAttribute('data-stage','1');
 expect(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))).toEqual(initial);
 expect(pageErrors).toEqual([]);
});

test('four-tier hints on iPhone reveal only requested steps and do not change S scoring or saves',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const pack=JSON.parse(fs.readFileSync(new URL('../../data/chapters/chapter-01/long-candidates-v1.json',import.meta.url)));
 const stage=pack.stages.find(s=>s.id==='fun-long-03-v1');
 await page.goto('/long-lab.html?stage=3');
 await expect(page.locator('#fun-title')).toHaveText('氷壁のバトン');
 const original=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
 await expect(page.locator('#fun-feedback')).toBeHidden();
 await expect(page.locator('#fun-hint')).toHaveText('ヒント 1/4');
 await page.locator('#fun-hint').click();
 await expect(page.locator('#fun-hint')).toHaveAttribute('data-hint-step','1');
 await expect(page.locator('#fun-feedback')).toContainText('ヒント① 考え方');
 await expect(page.locator('#fun-feedback ol li')).toHaveCount(0);
 await page.locator('#fun-hint').click();
 await expect(page.locator('#fun-hint')).toHaveAttribute('data-hint-step','2');
 await expect(page.locator('#fun-feedback')).toContainText('5手目、D1');
 await expect(page.locator('#fun-feedback ol li')).toHaveCount(0);
 await page.locator('#fun-hint').click();
 await expect(page.locator('#fun-feedback')).toContainText('ヒント③ 出発の手順');
 await expect(page.locator('#fun-feedback ol li')).toHaveCount(5);
 await expect(page.locator('#fun-feedback ol li').last()).toContainText('D1 ⭐星取得');
 await page.locator('#fun-hint').click();
 await expect(page.locator('#fun-feedback')).toContainText('答え 最短16手');
 await expect(page.locator('#fun-feedback ol li')).toHaveCount(16);
 await expect(page.locator('#fun-hint')).toHaveAttribute('data-hint-step','4');
 await page.locator('#fun-hint').click();
 await expect(page.locator('#fun-hint')).toHaveAttribute('data-hint-step','4');
 for(const a of stage.proof){
  await page.locator('[data-fun-mode="'+a.prep.type+'"]').click();
  if(a.prep.type==='wall'){
   await page.locator('#fun-board [data-cell="'+a.prep.from+'"]').click();
   await page.locator('#fun-board [data-cell="'+a.prep.to+'"]').click();
  }
  await page.locator('[data-fun-dir="'+a.dir+'"]').click();
  await expect(page.locator('#fun-retry')).toBeEnabled();
 }
 await expect(page.locator('#fun-rank')).toHaveText('Sランク合格！');
 await expect(page.locator('#fun-finish')).toContainText('ヒント 4回');
 // Undo from the finished screen reopens the puzzle without stopping its timer.
 await page.locator('#fun-undo').click();
 await expect(page.locator('#fun-result')).toBeHidden();
 await expect(page.locator('#fun-moves')).toHaveText('15');
 await expect(page.locator('#fun-hint')).toBeEnabled();
 await page.locator('[data-fun-dir="0"]').click();
 await expect(page.locator('#fun-rank')).toHaveText('Sランク合格！');
 await expect(page.locator('#fun-finish')).toContainText('Undo 1回');
 await expect(page.locator('#fun-finish')).toContainText('ヒント 4回');
 await page.locator('#fun-again').click();
 await expect(page.locator('#fun-hint')).toHaveText('ヒント 1/4');
 await expect(page.locator('#fun-hint')).toHaveAttribute('data-hint-step','0');
 await expect(page.locator('#fun-feedback')).toBeHidden();
 expect(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)))).toEqual(original);
});
