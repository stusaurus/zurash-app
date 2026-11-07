import test from 'node:test';import assert from 'node:assert/strict';
import {readChapter} from '../scripts/chapter-one-verify.js';
import {newHome,beginRepair,finishRepair,decorate,homeComplete,budget,TASKS,available,nextRepairMission,loadHome,saveHome,HOME_KEY,OLD_KEY} from '../src/puzzle/house.js';
import {enterChapterStage,clearChapterStage} from '../src/puzzle/campaign.js';
import {balance} from '../src/puzzle/progress.js';
const f=await readChapter();
function playAll(s){for(let i=0;i<50;i++){const e=enterChapterStage(f.campaign,f.chapter,f.stages[i],s.progress,{preview:true,houseMode:true});s.progress=clearChapterStage(f.campaign,f.chapter,f.stages[i],e.progress,f.proofs.stages[i].actions,{preview:true,houseMode:true}).progress;}return s;}
test('50 unchanged puzzles remain playable without repairing; house costs 40 of 50 earned stars',()=>{let s=playAll(newHome());assert.equal(balance(s.progress),50);assert.equal(budget,40);for(const t of TASKS){assert.ok(available(s,t));s=beginRepair(s,t.id);assert.equal(s.home.pending,t.id);s=finishRepair(s);}assert.ok(homeComplete(s));assert.equal(balance(s.progress),10);assert.equal(Object.keys(s.home.done).length,15);});
test('legacy three automatic spends are credited; all history survives migration and only 31 more stars are needed',()=>{let p;for(let i=0;i<50;i++)p=clearChapterStage(f.campaign,f.chapter,f.stages[i],p??newHome().progress,f.proofs.stages[i].actions,{preview:true}).progress;assert.equal(balance(p),41);let s=newHome(p);assert.equal(Object.keys(s.home.done).length,3);assert.deepEqual(s.legacy.town,p.town);for(const t of TASKS)if(!s.home.done[t.id])s=finishRepair(beginRepair(s,t.id));assert.equal(balance(s.progress),10);assert.ok(homeComplete(s));assert.equal(Object.keys(s.progress.completed).length,50);});
test('pending construction survives reload; duplicate spend and free decoration changes',()=>{let s=playAll(newHome());s=beginRepair(s,TASKS[0].id);const after=balance(s.progress);assert.throws(()=>beginRepair(s,TASKS[0].id));const store={v:new Map(),getItem(k){return this.v.get(k)??null;},setItem(k,v){this.v.set(k,v);}};saveHome(store,s);s=finishRepair(loadHome(store));s=decorate(s,TASKS[0].id,2);s=decorate(s,TASKS[0].id,1);assert.equal(balance(s.progress),after);saveHome(store,s);assert.equal(loadHome(store).home.styles[TASKS[0].id],1);assert.ok(store.getItem(HOME_KEY));assert.equal(store.getItem(OLD_KEY),null);assert.equal(balance(beginRepair(s,TASKS[0].id).progress),after);assert.throws(()=>decorate(s,TASKS[1].id,2));});
test('locked and insufficient-star repairs cannot spend or block puzzle access',()=>{let s=newHome();assert.throws(()=>beginRepair(s,TASKS[14].id));assert.equal(balance(s.progress),0);assert.ok(enterChapterStage(f.campaign,f.chapter,f.stages[0],s.progress,{preview:true,houseMode:true}));});

test('migration retains milestone arrival without prematurely marking the next unlock as seen',()=>{let s=newHome();for(let i=0;i<9;i++)s.progress=clearChapterStage(f.campaign,f.chapter,f.stages[i],s.progress,f.proofs.stages[i].actions,{preview:true,houseMode:true}).progress;assert.equal(newHome(s.progress).home.reached,9);const old=enterChapterStage(f.campaign,f.chapter,f.stages[9],s.progress,{preview:true}).progress;assert.equal(newHome(old).home.reached,10);});

test('restoration is a 15-step story: later repairs cannot bypass the current objective',()=>{
 let s=playAll(newHome());
 const original=structuredClone(s);
 assert.deepEqual(nextRepairMission(s),{
  task:TASKS[0],doneCount:0,total:15,state:'ready',missingStages:0,missingStars:0
 });
 assert.equal(available(s,TASKS[1]),false);
 assert.equal(available(s,TASKS[12]),false);
 assert.throws(()=>beginRepair(s,TASKS[1].id),/locked/);
 assert.deepEqual(s,original);
 s=beginRepair(s,TASKS[0].id);
 assert.equal(nextRepairMission(s).state,'building');
 s=finishRepair(s);
 assert.equal(nextRepairMission(s).task.id,TASKS[1].id);
 assert.equal(nextRepairMission(s).doneCount,1);
 assert.equal(available(s,TASKS[1]),true);
 s=finishRepair(beginRepair(s,TASKS[1].id));
 assert.equal(nextRepairMission(s).task.id,TASKS[2].id);
 assert.equal(balance(s.progress),45);
});
test('guide identifies missing stage and star goals without changing saved progress',()=>{
 let s=newHome();
 const before=structuredClone(s);
 assert.equal(nextRepairMission(s).state,'stages');
 assert.equal(nextRepairMission(s).missingStages,1);
 assert.deepEqual(s,before);
 s.progress.completed['pz-100001']={reward:1,revision:1,bestTurns:1};
 const goal=nextRepairMission(s);
 assert.equal(goal.state,'stars');
 assert.equal(goal.missingStars,2);
 assert.equal(goal.task.id,TASKS[0].id);
});
test('old migrated repair records stay credited; guided order skips already repaired rooms',()=>{
 let s=playAll(newHome());
 const spent=structuredClone(s);
 // Already repaired rooms in a legacy save are honored; missing earlier jobs
 // remain the current mission and can be completed in sequence.
 for(const id of ['ice-crane','ice-workshop','crystal-gate']){
  const t=TASKS.find(t=>t.id===id);
  s.progress.town[id]=t.cost;
  s.home.done[id]=true;
 }
 assert.equal(nextRepairMission(s).task.id,TASKS[0].id);
 for(const t of TASKS.filter(t=>!s.home.done[t.id]))s=finishRepair(beginRepair(s,t.id));
 assert.equal(nextRepairMission(s).state,'complete');
 assert.equal(nextRepairMission(s).doneCount,15);
 assert.equal(Object.keys(s.progress.completed).length,Object.keys(spent.progress.completed).length);
});

test('a pre-existing pending repair is represented accurately even if an earlier step is unfinished',()=>{
 let s=playAll(newHome());
 const oldTask=TASKS[7];
 s.progress.town[oldTask.id]=oldTask.cost;
 s.home.pending=oldTask.id;
 const inProgress=nextRepairMission(s);
 assert.equal(inProgress.state,'building');
 assert.equal(inProgress.task.id,oldTask.id);
 s=finishRepair(s);
 const next=nextRepairMission(s);
 assert.equal(next.task.id,TASKS[0].id);
 assert.equal(next.state,'ready');
 assert.equal(s.home.done[oldTask.id],true);
});
