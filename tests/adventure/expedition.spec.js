import {test,expect} from '@playwright/test';import fs from 'node:fs';
import {newChapterTwo,checkpointTwo,CHAPTER_TWO_KEY} from '../../src/puzzle/chapter-two-progress.js';
import {newHome,HOME_KEY} from '../../src/puzzle/house.js';
const entries=JSON.parse(fs.readFileSync(new URL('../../data/chapters/chapter-02/adventure-v1.json',import.meta.url))).stages;
async function act(page,a){
 await page.locator('[data-fun-mode="'+a.prep.type+'"]').click();
 if(['wall','glove'].includes(a.prep.type))await page.locator('[data-cell="'+a.prep.from+'"]').click();
 if(a.prep.to!==undefined)await page.locator('[data-cell="'+a.prep.to+'"]').click();
 await page.locator('[data-fun-dir="'+a.dir+'"]').click();await expect(page.locator('#fun-retry')).toBeEnabled();
}
for(const width of [320,390,1440])test('expedition rewards: milestone, replay, reload, home keepsake and practice separation at '+width,async({page})=>{
 await page.setViewportSize({width,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 // Four legitimately replayed proofs prepare the milestone; actual stage55 is played below.
 let save=newChapterTwo();for(const s of entries.slice(0,4))save=checkpointTwo(save,entries,s,s.proof);
 const home=newHome(),homeRaw=JSON.stringify(home);
 await page.addInitScript(({save,key,homeRaw,homeKey})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(save));if(!localStorage.getItem(homeKey))localStorage.setItem(homeKey,homeRaw);},{save,key:CHAPTER_TWO_KEY,homeRaw,homeKey:HOME_KEY});
 await page.goto('/chapter-two.html?trial=1&stage=55');await expect(page.locator('#fun-count')).toHaveText('STAGE 55');
 const stage=entries[4];for(const a of stage.proof)await act(page,a);
 await expect(page.locator('#expedition-reward')).toContainText('結晶 +1');await expect(page.locator('#expedition-reward')).toContainText('雪道の道しるべに灯りがともった');
 await page.reload();await expect(page.locator('#expedition-reward')).toContainText('獲得済み');
 await page.locator('.chapter-map summary').click();await expect(page.locator('#expedition-map [data-lit=true]')).toHaveCount(1);
 await expect(page.locator('#expedition-map')).toContainText('結晶 5/20個');
 const normal=await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY);
 await page.goto('/adventure.html');await expect(page.locator('#expedition-home')).toBeVisible();await expect(page.locator('#expedition-home [data-lit=true]')).toHaveCount(1);
 expect(await page.evaluate(key=>localStorage.getItem(key),HOME_KEY)).toBe(homeRaw);
 await page.goto('/chapter-two.html?trial=1&practice=1&stage=55');for(const a of stage.proof)await act(page,a);
 await expect(page.locator('#expedition-reward')).toContainText('自由試遊');
 expect(await page.evaluate(key=>localStorage.getItem(key),CHAPTER_TWO_KEY)).toBe(normal);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
