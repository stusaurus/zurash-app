import {test,expect} from '@playwright/test';
import {newHome,TASKS} from '../../src/puzzle/house.js';

// Rendering study: use the actual SVG renderer. No saved progress or geometry changes.
for(const width of [320,390,1440]){
 test('living floor B C aligned before-after at '+width+'px',async({page},info)=>{
  await page.setViewportSize({width,height:960});
  await page.goto('/adventure.html');
  const show=async(floorStyle)=>{
   await page.evaluate(async style=>{
    const {renderLayeredScene}=await import('./src/house-layered-art.js');
    const {newHome,TASKS}=await import('./src/puzzle/house.js');
    const save=newHome();
    for(const t of TASKS){save.home.done[t.id]=true;save.home.styles[t.id]=0;}
    if(style===null)delete save.home.done['ice-crane'];
    else save.home.styles['ice-crane']=style;
    const host=document.createElement('main');
    host.id='floor-b-review';
    host.style.cssText='width:480px;max-width:100%;margin:0 auto';
    host.innerHTML=renderLayeredScene(save,'living');
    document.body.replaceChildren(host);
    document.body.style.cssText='margin:0;background:#152b40';
    host.querySelector('svg').style.cssText='display:block;width:100%;height:auto';
    const paths=[...new Set([...host.querySelectorAll('image[href]')].map(img=>img.getAttribute('href')))];
    await Promise.all(paths.map(async path=>{
     const img=new Image();img.src=new URL(path,location.href).href;await img.decode();
    }));
   },floorStyle);
   await expect(page.locator('#floor-b-review svg')).toHaveAttribute('data-scene-art','living');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  };

  // Control: the existing unrepaired floor and A stay unchanged.
  for(const [style,label] of [[null,'before'],[0,'A']]){
   await show(style);
   await info.attach('living-floor-'+label+'-'+width,{
    body:await page.locator('#floor-b-review').screenshot({animations:'disabled'}),
    contentType:'image/png'
   });
  }

  // B/C revisions: the actual room and the same camera; the image URI alone
  // is swapped to capture the previous art as a fair before/after baseline.
  for(const [style,label] of [[1,'B'],[2,'C']]){
   await show(style);
   const floor=page.locator('#floor-b-review [data-object="ice-crane"] image');
   await expect(floor).toHaveAttribute('href','./assets/house/v7/living/ice-crane-'+label.toLowerCase()+'-v2.webp');
   const candidate=await page.locator('#floor-b-review').screenshot({animations:'disabled'});
   await info.attach('living-floor-'+label+'-new-'+width,{body:candidate,contentType:'image/png'});
   const originalPath='./assets/house/v7/living/ice-crane-'+label.toLowerCase()+'-v1.webp';
   await floor.evaluate((el,src)=>el.setAttribute('href',src),originalPath);
   await page.evaluate(async src=>{
    const img=new Image();img.src=new URL(src,location.href).href;await img.decode();
   },originalPath);
   const original=await page.locator('#floor-b-review').screenshot({animations:'disabled'});
   await info.attach('living-floor-'+label+'-old-'+width,{body:original,contentType:'image/png'});
   expect(candidate.equals(original),'New '+label+' should not render identical to old '+label).toBe(false);
  }
 });
}
