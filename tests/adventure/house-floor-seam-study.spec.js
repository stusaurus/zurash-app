import {test,expect} from '@playwright/test';
import {newHome,TASKS} from '../../src/puzzle/house.js';

// Artistic A/B study only: the shipping renderer is never modified.
// The crop removes floor-sprite foreground decoration, not game world geometry.
for(const width of [320,390]){
 test('house floor seams art study '+width+'px',async({page},info)=>{
  await page.setViewportSize({width,height:900});
  await page.goto('/adventure.html');
  for(const [style,name] of [[0,'A'],[1,'B'],[2,'C']]){
   for(const mode of ['original','crop-305','crop-335']){
    await page.evaluate(async({style,mode})=>{
     const [{newHome,TASKS},{renderLayeredScene}]=await Promise.all([
      import('./src/puzzle/house.js'),import('./src/house-layered-art.js')
     ]);
     const save=newHome();
     for(const t of TASKS){save.home.done[t.id]=true;save.home.styles[t.id]=0;}
     save.home.styles['ice-crane']=style;
     const host=document.createElement('main');
     host.id='floor-study';
     host.style.cssText='display:block;width:390px;max-width:100%;margin:0 auto';
     host.innerHTML=renderLayeredScene(save,'living');
     const scene=host.querySelector('svg');
     scene.style.cssText='display:block;width:100%;height:auto';
     document.body.replaceChildren(host);
     document.body.style.cssText='margin:0;background:#172e43';
     const floor=host.querySelector('[data-object="ice-crane"] image');
     if(!floor)throw new Error('Missing actual floor asset');
     const href=floor.getAttribute('href');
     if(mode!=='original'){
      const xmlns='http://www.w3.org/2000/svg';
      const clipBottom=Number(mode.split('-')[1]);
      // Keep source art at its original 640x427 size, and only vary
      // which source Y range maps to the game floor.
      const viewport=document.createElementNS(xmlns,'svg');
      for(const [k,v] of Object.entries({x:0,y:324,width:480,height:216,viewBox:'0 0 640 '+clipBottom,
        preserveAspectRatio:'none','data-floor-experiment':mode}))viewport.setAttribute(k,String(v));
      const source=document.createElementNS(xmlns,'image');
      for(const [k,v] of Object.entries({href,x:0,y:0,width:640,height:427,preserveAspectRatio:'none'}))source.setAttribute(k,String(v));
      viewport.append(source);
      floor.replaceWith(viewport);
     }
     const sources=[...new Set([...host.querySelectorAll('image[href]')].map(e=>e.getAttribute('href')))];
     await Promise.all(sources.map(async src=>{
      const img=new Image();img.src=new URL(src,location.href).href;await img.decode();
     }));
    },{style,mode});
    await expect(page.locator('#floor-study svg[data-scene-art="living"]')).toBeVisible();
    await expect(page.locator('[data-object="ice-crane"]')).toHaveAttribute('data-state','complete');
    await expect(page.locator('[data-floor-experiment]')).toHaveCount(mode==='original'?0:1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await info.attach('living-floor-'+name+'-'+mode+'-'+width,{
     body:await page.locator('#floor-study').screenshot({animations:'disabled'}),
     contentType:'image/png'
    });
   }
  }
 });
}
