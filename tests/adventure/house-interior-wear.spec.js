import {test,expect} from '@playwright/test';

const rooms=['living','kitchen','bedroom'];
async function showRoom(page,scene,repaired,{allFinished=false,style=2}={}){
  await page.evaluate(async({scene,repaired,allFinished,style})=>{
    const [{newHome,TASKS},{renderLayeredScene},{INTERIOR_WEAR_REPAIRS}]=await Promise.all([
      import('./src/puzzle/house.js'),import('./src/house-layered-art.js'),import('./src/house-interior-wear.js')
    ]);
    const save=newHome();
    if(allFinished){for(const task of TASKS){save.home.done[task.id]=true;save.home.styles[task.id]=style;}}
    else if(repaired)save.home.done[INTERIOR_WEAR_REPAIRS[scene]]=true;
    const host=document.createElement('main');
    host.id='room-visual';
    host.style.cssText='width:min(100%,390px);margin:0 auto';
    host.innerHTML=renderLayeredScene(save,scene);
    document.body.replaceChildren(host);
    document.body.style.cssText='margin:0;background:#162b44';
    host.querySelector('svg').style.cssText='display:block;width:100%;height:auto';
    const paths=[...host.querySelectorAll('image[href]')].map(x=>x.getAttribute('href'));
    await Promise.all(paths.map(async path=>{
      const img=new Image();img.src=new URL(path,location.href).href;
      await img.decode();
    }));
  },{scene,repaired,allFinished,style});
}

for(const width of [320,390])test('house evolution interior wear before and after '+width+'px',async({page},info)=>{
  await page.setViewportSize({width,height:950});
  await page.goto('/adventure.html');
  for(const scene of rooms){
    for(const repaired of [false,true]){
      await showRoom(page,scene,repaired);
      await expect(page.locator('#room-visual svg')).toHaveAttribute('data-scene-art',scene);
      await expect(page.locator('[data-house-interior-wear]')).toHaveCount(repaired?0:1);
      await info.attach(scene+(repaired?'-after':'-before')+'-'+width,
        {body:await page.locator('#room-visual').screenshot({animations:'disabled'}),contentType:'image/png'});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
  }
});

test('house evolution all 15 repairs render complete interiors in all three styles at 390px',async({page},info)=>{
  await page.setViewportSize({width:390,height:950});
  await page.goto('/adventure.html');
  for(const scene of rooms){
    for(const style of [0,1,2]){
      await showRoom(page,scene,true,{allFinished:true,style});
      await expect(page.locator('[data-house-interior-wear]')).toHaveCount(0);
      await expect(page.locator('[data-furniture-contact]')).toHaveCount(({living:1,kitchen:1,bedroom:2})[scene]);
      const variants=await page.locator('#room-visual [data-object]').evaluateAll(es=>es.filter(e=>e.hasAttribute('data-variant')).map(e=>e.getAttribute('data-variant')));
      expect(variants).toHaveLength(3);
      expect(variants).toEqual([String.fromCharCode(97+style),String.fromCharCode(97+style),String.fromCharCode(97+style)]);
      if(scene==='bedroom')await expect(page.locator('[data-repaired-detail="bedroom-wall"]')).toHaveCount(1);
      if(scene==='kitchen')await expect(page.locator('[data-repaired-detail="kitchen-counter-contact"]')).toHaveCount(1);
      await info.attach('finished-'+scene+'-style-'+String.fromCharCode(97+style),
        {body:await page.locator('#room-visual').screenshot({animations:'disabled'}),contentType:'image/png'});
    }
  }
});
