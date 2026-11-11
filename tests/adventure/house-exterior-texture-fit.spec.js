import {test,expect} from '@playwright/test';

for(const width of [320,390])test('house evolution exterior wall material uses the centre, '+width+'px',async({page},info)=>{
 await page.setViewportSize({width,height:860});
 await page.goto('/adventure.html');
 for(const design of ['before',0,1,2]){
  await page.evaluate(async style=>{
   const [{newHome,TASKS},{renderLayeredScene}]=await Promise.all([
    import('./src/puzzle/house.js'),
    import('./src/house-layered-art.js')
   ]);
   const save=newHome();
   if(style!=='before'){
    for(const task of TASKS.slice(0,3))save.home.done[task.id]=true;
    save.home.styles['home-entry-1']=style;
   }
   const host=document.createElement('main');
   host.id='exterior-review';
   host.style.cssText='width:min(100%,390px);margin:0 auto';
   host.innerHTML=renderLayeredScene(save,'exterior');
   const scene=host.querySelector('svg');
   scene.style.cssText='width:100%;height:auto;display:block';
   document.body.replaceChildren(host);
   document.body.style.cssText='margin:0;background:#192d45';
   const urls=[...host.querySelectorAll('image[href]')].map(el=>el.getAttribute('href'));
   await Promise.all(urls.map(async src=>{
    const image=new Image();
    image.src=new URL(src,location.href).href;
    await image.decode();
   }));
  },design);
  await expect(page.locator('#exterior-review [data-wall-texture-crop="front"]')).toHaveCount(1);
  await expect(page.locator('#exterior-review [data-wall-texture-crop="east"]')).toHaveCount(1);
  await expect(page.locator('#exterior-review [data-scene-art="exterior"]')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await info.attach('exterior-wall-'+design+'-'+width,{
   body:await page.locator('#exterior-review').screenshot({animations:'disabled'}),
   contentType:'image/png'
  });
 }
});
