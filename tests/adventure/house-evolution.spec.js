import {test,expect} from '@playwright/test';
import {TASKS,newHome,HOME_KEY} from '../../src/puzzle/house.js';
import fs from 'node:fs';
for(const width of [320,390,1440])test(`house evolution previews, one repair, comparison and persistence ${width}px`,async({page},info)=>{
 const fixture=newHome();fixture.home.reached=50;
 for(let n=1;n<=50;n++)fixture.progress.completed[`pz-${100000+n}`]={reward:1,bestTurns:1,revision:1};
 await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(({key,save})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(save));},{key:HOME_KEY,save:fixture});
 await page.goto('/adventure.html');await expect(page.locator('.house-world')).toHaveAttribute('data-art-ready','true');
 const stored=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),HOME_KEY);
 const snap=async name=>{const body=await page.locator('.house-world').screenshot({animations:'disabled'});await info.attach(name,{body,contentType:'image/png'});if(info.project.name==='chromium'&&width===390){fs.mkdirSync('reports/house-evolution',{recursive:true});fs.writeFileSync(`reports/house-evolution/${name}.png`,body);}};
 await snap('before');
 const unchanged=await stored();
 for(const [index,t] of TASKS.entries()){
  await page.locator('#house-mission-next').click();
  await expect(page.locator(`[data-style="${t.id}"]`)).toHaveCount(3);
  const beforePreview=await stored();
  await page.locator(`[data-style="${t.id}"][data-choice="2"]`).click();
  expect(await stored()).toEqual(beforePreview);
  const previewBefore=await stored();expect(previewBefore.home.done[t.id]).toBeUndefined();
  await expect(page.locator(`.house-world [data-object="${t.id}"]`)).toHaveAttribute('data-variant','c');
  if(index===0){
   const sheet=await page.locator('#home-repairs').screenshot();
   await info.attach('design-preview-sheet',{body:sheet,contentType:'image/png'});
   if(info.project.name==='chromium'&&width===390)fs.writeFileSync('reports/house-evolution/design-preview.png',sheet);
   await page.locator('#close-repairs').click();expect(await stored()).toEqual(unchanged);
   await expect(page.locator(`.house-world [data-object="${t.id}"]`)).toHaveAttribute('data-state','before');
   await page.locator('#house-mission-next').click();await page.locator(`[data-style="${t.id}"][data-choice="2"]`).click();
  }
  await page.locator(`[data-repair="${t.id}"]`).click();
  await expect(page.locator(`.house-world [data-object="${t.id}"]`)).toHaveAttribute('data-state','complete');
  const saved=await stored();expect(saved.home.styles[t.id]).toBe(2);
  expect(Object.keys(saved.home.done)).toHaveLength(index+1);
  if(index===0){
   expect(saved.home.done['home-entry-1']).toBeUndefined();await snap('door-only');
   const current=await page.locator('.house-world').boundingBox();await page.locator('#house-compare-toggle').click();
   expect(await page.locator('.house-world').boundingBox()).toEqual(current);expect(await stored()).toEqual(saved);
   await page.locator('#house-compare-toggle').click();
  }
  if(index===2){await snap('exterior-restored');}
  if(t.slot===2&&index<14)await page.locator('#house-room-celebration-next').click();
 }
 // A final room celebration finishes before the chapter notice is shown.
 await page.locator('#house-room-celebration-next').click();
 await page.locator('#notice-primary').click();await expect(page.locator('.house-world')).toHaveAttribute('data-art-ready','true');await snap('complete');
 await expect(page.locator('#home-balance')).toHaveText('10');
 const completed=await stored();await page.locator('#house-history').click();await snap('initial-revisited');
 expect(await stored()).toEqual(completed);await page.locator('#house-compare-toggle').click();
 await page.locator('#repair-menu').click();await page.locator('[data-style="home-entry-0"][data-choice="1"]').click();
 expect(await stored()).toEqual(completed);await page.locator('[data-apply-style="home-entry-0"]').click();
 await page.reload();const loaded=await stored();expect(loaded.home.styles['home-entry-0']).toBe(1);expect(loaded.progress).toEqual(completed.progress);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const ids=await page.locator('[id]').evaluateAll(es=>es.map(e=>e.id));expect(new Set(ids).size).toBe(ids.length);
});

test('house evolution selected design survives interrupted construction without another charge',async({page})=>{
 const save=newHome();save.home.reached=8;
 for(let n=1;n<=8;n++)save.progress.completed[`pz-${100000+n}`]={reward:1,bestTurns:1,revision:1};
 await page.addInitScript(({key,save})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(save));},{key:HOME_KEY,save});
 await page.goto('/adventure.html');await page.locator('#house-mission-next').click();
 await page.locator('[data-style="home-entry-0"][data-choice="1"]').click();
 await page.locator('[data-repair="home-entry-0"]').click();await page.reload();
 await expect(page.locator('.house-world [data-object="home-entry-0"]')).toHaveAttribute('data-state','complete');
 await expect(page.locator('.house-world [data-door-design]')).toHaveAttribute('data-door-design','glass');
 await expect(page.locator('#home-balance')).toHaveText('5');
 await page.reload();await expect(page.locator('#home-balance')).toHaveText('5');
});

test('house evolution lighting follows actual lamps, not bookshelf or furniture',async({page},info)=>{
 await page.setViewportSize({width:390,height:850});
 await page.goto('/adventure.html');
 for(const area of ['living','kitchen','garden']){
  for(const phase of ['before-final','completed']){
   const save=newHome();
   const tasks=TASKS.filter(t=>t.area===area);
   for(const task of tasks.slice(0,phase==='completed'?3:2))save.home.done[task.id]=true;
   await page.evaluate(async({scene,save})=>{
    const {renderLayeredScene}=await import('./src/house-layered-art.js');
    const host=document.createElement('main');host.id='lighting-review';
    host.style.cssText='width:min(100%,390px);margin:0 auto';
    host.innerHTML=renderLayeredScene(save,scene);
    document.body.replaceChildren(host);document.body.style.cssText='margin:0;background:#173044';
    host.querySelector('svg').style.cssText='display:block;width:100%;height:auto';
    const paths=[...new Set([...host.querySelectorAll('image[href]')].map(x=>x.getAttribute('href')))];
    await Promise.all(paths.map(async path=>{const image=new Image();image.src=new URL(path,location.href).href;await image.decode();}));
   },{scene:area,save});
   await expect(page.locator('[data-art-layer="atmosphere"]')).toHaveAttribute('opacity','0.000');
   await expect(page.locator('[data-art-layer="light"]')).toHaveCount(0);
   await info.attach('lighting-'+area+'-'+phase,{body:await page.locator('#lighting-review').screenshot({animations:'disabled'}),contentType:'image/png'});
   // Recreate the pre-change global dimming for side-by-side art direction.
   if(phase==='before-final'){
    await page.locator('[data-art-layer="atmosphere"]').evaluate(el=>el.setAttribute('opacity','0.240'));
    await info.attach('legacy-dark-'+area+'-'+phase,{body:await page.locator('#lighting-review').screenshot({animations:'disabled'}),contentType:'image/png'});
   }
  }
 }
});
