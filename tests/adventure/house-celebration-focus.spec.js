import {test,expect} from '@playwright/test';
import {HOME_KEY,TASKS,newHome} from '../../src/puzzle/house.js';

for(const width of [320,390])test('house celebration focuses the before after reward and a single action '+width+'px',async({page},info)=>{
 const save=newHome();
 save.home.reached=8;
 for(let i=1;i<=8;i++)save.progress.completed[`pz-${100000+i}`]={reward:1,bestTurns:1,revision:1};
 for(const task of TASKS.slice(0,2)){
  save.home.done[task.id]=true;
  save.progress.town[task.id]=task.cost;
 }
 await page.setViewportSize({width,height:900});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(({key,snapshot})=>localStorage.setItem(key,JSON.stringify(snapshot)),{key:HOME_KEY,snapshot:save});
 await page.goto('/adventure.html');
 await expect(page.locator('#home-balance')).toHaveText('3');
 await page.locator('#house-mission-next').click();
 await page.locator('[data-repair="home-entry-2"]').click();
 await expect(page.locator('#house-room-celebration-title')).toContainText('外まわりが完成！');
 const milestone=page.locator('.house-room-celebration');
 await expect(milestone).toBeVisible();
 await expect(page.locator('.house-mission')).toBeHidden();
 await expect(page.locator('.house-expansion-meter')).toBeHidden();
 await expect(page.locator('.home-bottom')).toBeHidden();
 await expect(page.locator('.house-room-snapshot[data-phase="before"] svg')).toBeVisible();
 await expect(page.locator('.house-room-snapshot[data-phase="after"] svg')).toBeVisible();
 await expect(page.locator('#house-room-celebration-next')).toHaveText('玄関から家に入る');
 await expect(page.locator('footer')).toBeHidden();
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await info.attach('room-complete-'+width+'px',{body:await milestone.screenshot({animations:'disabled'}),contentType:'image/png'});
 const balance=await page.locator('#home-balance').textContent();
 await page.locator('#house-room-celebration-next').click();
 await expect(page.locator('#home-screen')).toHaveAttribute('data-scene','entry');
 await expect(page.locator('.house-mission')).toBeVisible();
 await expect(page.locator('#home-balance')).toHaveText(balance);
});
