import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {TASKS,newHome,HOME_KEY} from '../../src/puzzle/house.js';
const id='home-living-2';
function priorRepairs(){
 const save=newHome();save.home.reached=50;
 for(let n=1;n<=50;n++)save.progress.completed[`pz-${100000+n}`]={reward:1,bestTurns:1,revision:1};
 for(const t of TASKS.slice(0,5)){save.home.done[t.id]=true;save.progress.town[t.id]=t.cost;}
 return save;
}
for(const width of [320,390,1440])test(`bookshelf art in the playable room, designs and repair target ${width}px`,async({page},info)=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 const save=priorRepairs(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({key,save})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(save));},{key:HOME_KEY,save});
 const open=async()=>{await page.goto('/adventure.html');await page.locator('[data-area="living"]').click();await expect(page.locator('.house-world')).toHaveAttribute('data-art-ready','true');};
 const shot=async label=>{
  await expect(page.locator('.house-world')).toHaveAttribute('data-art-ready','true');
  const body=await page.locator('.house-world').screenshot({animations:'disabled'});
  await info.attach(label,{body,contentType:'image/png'});
  if(process.env.ZURASH_REVIEW_OUTPUT){const root=path.resolve(process.env.ZURASH_REVIEW_OUTPUT);fs.mkdirSync(root,{recursive:true});fs.writeFileSync(path.join(root,`${info.project.name}-${width}-${label}.png`),body);}
 };
 // Old sprite in the same real game scene; no copied renderer or simulated UI.
 await page.route('**/home-living-2-before-v2.webp',route=>route.fulfill({path:path.resolve('assets/house/v7/living/home-living-2-before-v1.webp'),contentType:'image/webp'}));
 await open();await shot('legacy-before');
 const assets=await page.locator('.house-world image').evaluateAll(es=>es.map(e=>e.getAttribute('href')));
 await page.unroute('**/home-living-2-before-v2.webp');await open();await shot('damaged-before');
 expect(await page.locator('.house-world image').evaluateAll(es=>es.map(e=>e.getAttribute('href')))).toEqual(assets);
 const world=await page.locator('.house-world').boundingBox();
 const target=await page.locator(`[data-edit-object="${id}"]`).boundingBox();
 const shelfRight=world.x+world.width*392/480;
 expect(target.width).toBeGreaterThanOrEqual(44);expect(target.x).toBeGreaterThanOrEqual(shelfRight-1);
 const stored=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),HOME_KEY);
 const initial=await stored();
 await page.locator(`[data-edit-object="${id}"]`).click();
 for(const choice of [0,1,2]){
  await page.locator(`[data-style="${id}"][data-choice="${choice}"]`).click();
  await expect(page.locator(`.house-world [data-object="${id}"]`)).toHaveAttribute('data-variant',['a','b','c'][choice]);
  expect(await stored()).toEqual(initial);await shot(`preview-${choice}`);
 }
 await page.locator(`[data-repair="${id}"]`).click();
 await expect(page.locator(`.house-world [data-object="${id}"]`)).toHaveAttribute('data-state','complete');
 await expect(page.locator('#home-balance')).toHaveText('34');
 await page.locator('#house-room-celebration-next').click();await page.locator('[data-area="living"]').click();
 for(const choice of [0,1,2]){
  if(await page.locator('#home-repairs').isHidden())await page.locator('#repair-menu').click();
  await page.locator(`[data-style="${id}"][data-choice="${choice}"]`).click();
  await page.locator(`[data-apply-style="${id}"]`).click();await shot(`finished-${choice}`);
  await expect(page.locator('#home-balance')).toHaveText('34');
 }
 await page.reload();await page.locator('[data-area="living"]').click();
 await expect(page.locator(`.house-world [data-object="${id}"]`)).toHaveAttribute('data-variant','c');
 expect((await stored()).home.styles[id]).toBe(2);expect((await stored()).progress.completed).toEqual(initial.progress.completed);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
});
