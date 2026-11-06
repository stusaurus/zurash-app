import test from 'node:test';
import assert from 'node:assert/strict';
import {readChapter,verifyChapter} from '../scripts/chapter-one-verify.js';
import {createCatalog,sha256} from '../src/puzzle/catalog.js';
import {validateChapterStage,validateCampaign,enterChapterStage,clearChapterStage,unlockedItems,canEnterChapterStage,chapterSaveKey} from '../src/puzzle/campaign.js';
import {newProgress,balance,saveProgress,loadProgress} from '../src/puzzle/progress.js';
const fixture=await readChapter();
test('all 50 chapter stages solve, replay, respect unlocks and build the town exactly once',async()=>{
  const r=await verifyChapter();assert.equal(r.solved,50);assert.equal(r.unresolved,0);assert.equal(r.finalStarBalance,41);
});
test('items remain locked until 10/20/30, including sockets and portals',()=>{
  const {stages,campaign,chapter}=fixture;
  const before=structuredClone(stages[8]);before.inventory.iceBlock=1;before.iceSockets=[before.stars[0]+1];
  assert.throws(()=>validateChapterStage(campaign,chapter,before));
  const p=structuredClone(stages[18]);p.inventory.powerGlove=1;
  assert.throws(()=>validateChapterStage(campaign,chapter,p),/before unlock/);
  const w=structuredClone(stages[28]);w.inventory.warpCrystal=1;
  assert.throws(()=>validateChapterStage(campaign,chapter,w));
  const bad=structuredClone(campaign);bad.unlocks[1].item='iceBlock';assert.throws(()=>validateCampaign(bad));
});
test('chapter access cannot skip stages or spend on a future unlock',()=>{
  const {campaign,chapter,stages}=fixture,s=newProgress();
  assert.ok(canEnterChapterStage(chapter,s,1));assert.ok(!canEnterChapterStage(chapter,s,10));
  assert.throws(()=>enterChapterStage(campaign,chapter,stages[9],s,{preview:true}),/locked/);
  assert.throws(()=>enterChapterStage(campaign,chapter,stages[0],s),/preview/);
  assert.deepEqual(unlockedItems(campaign,s),[]);assert.equal(balance(s),0);
  assert.ok(!canEnterChapterStage({...chapter,requires:['pz-099999']},s,1));
});
test('introduction does not award a star before clearing; unlock and spend survive reload',()=>{
  const {campaign,chapter,stages,proofs}=fixture;let s=newProgress();
  for(let i=0;i<9;i++)s=clearChapterStage(campaign,chapter,stages[i],s,proofs.stages[i].actions,{preview:true}).progress;
  assert.equal(balance(s),9);
  const entered=enterChapterStage(campaign,chapter,stages[9],s,{preview:true});assert.equal(balance(entered.progress),6);
  assert.deepEqual(unlockedItems(campaign,entered.progress),['iceBlock']);assert.equal(Object.keys(entered.progress.completed).length,9);
  const storage={data:new Map(),setItem(k,v){this.data.set(k,v);},getItem(k){return this.data.get(k)??null;}};
  const key=chapterSaveKey(chapter,true);saveProgress(storage,entered.progress,key);
  s=loadProgress(storage,key);assert.equal(balance(enterChapterStage(campaign,chapter,stages[9],s,{preview:true}).progress),6);
  assert.notEqual(chapterSaveKey(chapter,true),chapterSaveKey(chapter,false));assert.equal(storage.getItem('zurash-app:puzzle-progress:v1'),null);
  assert.throws(()=>clearChapterStage(campaign,chapter,stages[9],s,[],{preview:true}),/not cleared/);
});
test('stable chapter IDs are independent from ordinal numbers and legacy catalog still works',async()=>{
  const {stages}=fixture;const data=JSON.stringify([stages[1],stages[0]]);
  const m={version:1,count:2,chunks:[{first:1,last:2,count:2,path:'chunks/test.json',ids:[stages[1].id,stages[0].id],sha256:await sha256(data)}]};
  const c=createCatalog(m,async()=>data,{allowCandidates:true});assert.equal((await c.get(1)).id,stages[1].id);assert.equal((await c.get(2)).id,stages[0].id);
  assert.throws(()=>createCatalog({...m,chunks:[{...m.chunks[0],ids:[stages[0].id,stages[0].id]}]},async()=>data));
});
