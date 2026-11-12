import {test,expect} from '@playwright/test';
import {TASKS,newHome} from '../../src/puzzle/house.js';

// A visual review fixture, not a substitute for human art direction.
// Captures the real layered renderer using the existing 15 repair IDs and saved styles.
const scenes=['exterior','entry','living','kitchen','bedroom','garden'];
const sceneForTask=task=>task.area==='entry'?'exterior':task.area;
const fresh=()=>newHome();
const completed=style=>{
 const s=fresh();
 for(const task of TASKS){s.home.done[task.id]=true;s.home.styles[task.id]=style;}
 return s;
};

async function showArt(page,scene,save){
 await page.evaluate(async({scene,save})=>{
  const {renderLayeredScene}=await import('./src/house-layered-art.js');
  const host=document.createElement('main');
  host.id='house-art-audit';
  host.style.cssText='display:block;width:390px;max-width:100%;margin:0 auto';
  host.innerHTML=renderLayeredScene(save,scene);
  document.body.replaceChildren(host);
  document.body.style.cssText='margin:0;background:#152942';
  const svg=host.querySelector('svg');
  svg.style.cssText='display:block;width:100%;height:auto';
  const urls=[...new Set([...host.querySelectorAll('image[href]')].map(el=>el.getAttribute('href')))];
  await Promise.all(urls.map(async url=>{
   const image=new Image();
   image.src=new URL(url,location.href).href;
   await image.decode(); // Art asset failures must fail the visual review.
  }));
 },{scene,save});
 await expect(page.locator('#house-art-audit svg')).toHaveAttribute('data-scene-art',scene);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}

async function capture(page,info,label){
 const png=await page.locator('#house-art-audit').screenshot({animations:'disabled'});
 await info.attach(label,{body:png,contentType:'image/png'});
}

test('house visual audit all six scenes and approved design variations',async({page},info)=>{
 await page.setViewportSize({width:390,height:850});
 await page.goto('/adventure.html');
 for(const scene of scenes){
  await showArt(page,scene,fresh());
  await capture(page,info,scene+'-unrepaired');
  for(const style of [0,1,2]){
   const save=completed(style),initial=structuredClone(save);
   await showArt(page,scene,save);
   await capture(page,info,scene+'-finished-'+String.fromCharCode(65+style));
   expect(save).toEqual(initial);
  }
 }
});

test('house visual audit all fifteen repairs before and after',async({page},info)=>{
 await page.setViewportSize({width:390,height:850});
 await page.goto('/adventure.html');
 const save=fresh();
 for(const [index,task] of TASKS.entries()){
  const scene=sceneForTask(task);
  const prior=structuredClone(save);
  await showArt(page,scene,save);
  await expect(page.locator('[data-object="'+task.id+'"]')).toHaveAttribute('data-state','before');
  await capture(page,info,String(index+1).padStart(2,'0')+'-'+task.id+'-before');
  expect(save).toEqual(prior);
  save.home.done[task.id]=true;
  save.home.styles[task.id]=0;
  await showArt(page,scene,save);
  await expect(page.locator('[data-object="'+task.id+'"]')).toHaveAttribute('data-state','complete');
  await capture(page,info,String(index+1).padStart(2,'0')+'-'+task.id+'-after');
 }
 expect(TASKS).toHaveLength(15);
});
