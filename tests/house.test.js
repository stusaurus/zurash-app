import test from 'node:test';import assert from 'node:assert/strict';
import {readChapter} from '../scripts/chapter-one-verify.js';
import {newHome,validateHome,beginRepair,finishRepair,decorate,homeComplete,budget,TASKS,available,HOUSE_CHAPTERS,houseChapterProgress,HOUSE_EXPANSIONS,accessibleHouseAreas,nextHouseExpansion,nextRepairMission,loadHome,saveHome,HOME_KEY,OLD_KEY} from '../src/puzzle/house.js';
import {enterChapterStage,clearChapterStage} from '../src/puzzle/campaign.js';
import {balance} from '../src/puzzle/progress.js';
import {renderExteriorGrowth,EXTERIOR_GROWTH_ORDER} from '../src/house-expansion-art.js';
import {renderLayeredScene} from '../src/house-layered-art.js';
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

test('five chapter milestones are derived only from credited repairs, including legacy out-of-order saves',()=>{
 const s=playAll(newHome());
 const chapters=houseChapterProgress(s);
 assert.deepEqual(chapters.map(x=>x.id),['entry','living','kitchen','bedroom','garden']);
 assert.deepEqual(chapters.map(x=>x.doneCount),[0,0,0,0,0]);
 assert.deepEqual(chapters.map(x=>x.complete),[false,false,false,false,false]);
 for(const task of TASKS.slice(0,3)){s.progress.town[task.id]=task.cost;s.home.done[task.id]=true;}
 assert.deepEqual(houseChapterProgress(s).map(x=>x.doneCount),[3,0,0,0,0]);
 assert.equal(houseChapterProgress(s)[0].complete,true);
 s.progress.town[TASKS[6].id]=TASKS[6].cost;s.home.done[TASKS[6].id]=true;
 assert.deepEqual(houseChapterProgress(s).map(x=>x.doneCount),[3,0,1,0,0]);
 assert.equal(HOUSE_CHAPTERS.length,5);
 assert.equal(s.version,2);
});

test('outside-only opening locks interior door even after fifty puzzle clears',()=>{
 const s=playAll(newHome());
 assert.deepEqual(accessibleHouseAreas(newHome()),['exterior']);
 assert.deepEqual(accessibleHouseAreas(s),['exterior']);
 assert.equal(nextHouseExpansion(s).area,'entry');
 assert.equal(nextHouseExpansion(s).previousDone,false);
 assert.equal(nextHouseExpansion(s).missingStages,0);
 assert.equal(HOUSE_EXPANSIONS.length,5);
 assert.deepEqual(HOUSE_EXPANSIONS.map(x=>x.stage),[0,10,20,30,40]);
});
test('the three exterior tasks open the front door, but the living room waits until stage ten',()=>{
 let s=newHome();
 for(let i=0;i<8;i++)s.progress=clearChapterStage(f.campaign,f.chapter,f.stages[i],s.progress,f.proofs.stages[i].actions,{preview:true,houseMode:true}).progress;
 for(const t of TASKS.slice(0,3))s=finishRepair(beginRepair(s,t.id));
 assert.deepEqual(accessibleHouseAreas(s),['exterior','entry']);
 assert.deepEqual(nextHouseExpansion(s),{area:'living',stage:10,previousDone:true,missingStages:2});
 for(let i=8;i<10;i++)s.progress=clearChapterStage(f.campaign,f.chapter,f.stages[i],s.progress,f.proofs.stages[i].actions,{preview:true,houseMode:true}).progress;
 assert.deepEqual(accessibleHouseAreas(s),['exterior','entry','living']);
 assert.equal(nextHouseExpansion(s).area,'kitchen');
 assert.equal(nextHouseExpansion(s).previousDone,false);
 assert.equal(s.version,2);
});
test('every room unlocks in sequence while preserving the 40-of-50 star budget',()=>{
 let s=playAll(newHome());
 assert.deepEqual(accessibleHouseAreas(s),['exterior']);
 for(let i=0;i<5;i++){
  const tasks=TASKS.slice(i*3,i*3+3);
  for(const task of tasks)s=finishRepair(beginRepair(s,task.id));
  assert.deepEqual(accessibleHouseAreas(s),['exterior',...HOUSE_EXPANSIONS.slice(0,Math.min(5,i+2)).map(x=>x.area)]);
 }
 assert.equal(nextHouseExpansion(s),null);
 assert.equal(balance(s.progress),10);
 assert.equal(homeComplete(s),true);
});
test('legacy out-of-order work and pending repairs never disappear behind a newly locked room',()=>{
 let s=playAll(newHome());
 const old=TASKS.find(t=>t.area==='kitchen');
 s.progress.town[old.id]=old.cost;s.home.done[old.id]=true;
 assert.deepEqual(accessibleHouseAreas(s),['exterior','entry','living','kitchen']);
 const oldPending=TASKS.find(t=>t.area==='garden');
 s.progress.town[oldPending.id]=oldPending.cost;s.home.pending=oldPending.id;
 assert.deepEqual(accessibleHouseAreas(s),['exterior','entry','living','kitchen','bedroom','garden']);
 assert.equal(nextHouseExpansion(s),null);
 assert.ok(validateHome(s));
});

test('approved painted exterior gains architectural pieces only when a room opens',()=>{
 let s=playAll(newHome());
 assert.deepEqual(EXTERIOR_GROWTH_ORDER,['living','kitchen','bedroom','garden']);
 assert.equal(renderExteriorGrowth(s).match(/data-house-growth-area=/g),null);
 assert.match(renderLayeredScene(s,'exterior'),/data-growth-count="0"/);
 for(let i=0;i<5;i++){
  for(const task of TASKS.slice(i*3,i*3+3))s=finishRepair(beginRepair(s,task.id));
  const art=renderExteriorGrowth(s);
  const expected=EXTERIOR_GROWTH_ORDER.slice(0,Math.min(i+1,4));
  for(const area of EXTERIOR_GROWTH_ORDER){
   assert.equal(art.includes('data-house-growth-area="'+area+'"'),expected.includes(area),area+' visibility');
  }
  assert.match(art,new RegExp('data-growth-count="'+expected.length+'"'));
  assert.doesNotMatch(art,/triken-orange-80|data-art-layer="triken"/);
 }
 assert.match(renderLayeredScene(s,'exterior'),/data-house-growth-area="garden"/);
 assert.match(renderLayeredScene(s,'garden'),/data-house-growth-area="garden"/);
 assert.doesNotMatch(renderLayeredScene(s,'living'),/data-house-growth-area=/);
 assert.equal(s.version,2);
 assert.equal(balance(s.progress),10);
});
test('existing future-room repairs reveal architectural progress without spending new stars',()=>{
 let s=playAll(newHome());
 const kitchen=TASKS.find(task=>task.area==='kitchen');
 s.progress.town[kitchen.id]=kitchen.cost;
 s.home.done[kitchen.id]=true;
 const before=structuredClone(s);
 const exterior=renderExteriorGrowth(s);
 assert.match(exterior,/data-house-growth-area="living"/);
 assert.match(exterior,/data-house-growth-area="kitchen"/);
 assert.doesNotMatch(exterior,/data-house-growth-area="bedroom"/);
 assert.deepEqual(s,before);
});

test('outside repairs open the front door one time and keep the home save version',()=>{
 let s=playAll(newHome());
 for(const t of TASKS.slice(0,2)){
  s=finishRepair(beginRepair(s,t.id));
  assert.deepEqual(accessibleHouseAreas(s),['exterior']);
  assert.equal(nextHouseExpansion(s).area,'entry');
 }
 s=finishRepair(beginRepair(s,TASKS[2].id));
 assert.deepEqual(accessibleHouseAreas(s).slice(0,2),['exterior','entry']);
 assert.equal(s.version,2);
 assert.equal(s.home.pending,null);
 assert.equal(s.home.done['home-entry-2'],true);
 const loaded=JSON.parse(JSON.stringify(s));
 assert.deepEqual(accessibleHouseAreas(loaded),accessibleHouseAreas(s));
});

test('repair style is paid atomically, persists during pending resume, and cannot double charge',()=>{
 const base=playAll(newHome()),original=structuredClone(base),id=TASKS[0].id;
 const pending=beginRepair(base,id,2);
 assert.deepEqual(base,original);
 assert.equal(pending.home.styles[id],2);
 assert.equal(balance(pending.progress),47);
 const finished=finishRepair(validateHome(JSON.parse(JSON.stringify(pending))));
 assert.equal(finished.home.styles[id],2);
 assert.deepEqual(beginRepair(finished,id,1),finished);
 assert.deepEqual(finishRepair(finished),finished);
 assert.equal(balance(decorate(finished,id,1).progress),47);
 assert.throws(()=>beginRepair(base,id,3),/decoration/);
 assert.equal(beginRepair(base,id).home.styles[id],undefined);
});

test('only real light repairs alter ambient brightness',()=>{
 const s=newHome(),unchanged=structuredClone(s);
 const ambient=scene=>{
  const art=renderLayeredScene(s,scene);
  const match=art.match(/data-art-layer="atmosphere"[^>]*opacity="([^"]+)"/);
  assert.ok(match,'atmosphere in '+scene);
  return {opacity:Number(match[1]),glow:art.includes('data-art-layer="light"')};
 };
 for(const scene of ['living','kitchen','garden']){
  assert.deepEqual(ambient(scene),{opacity:0,glow:false});
 }
 for(const scene of ['exterior','entry','bedroom']){
  assert.deepEqual(ambient(scene),{opacity:.24,glow:false});
 }
 s.home.done['home-living-2']=true;
 s.home.done['home-kitchen-2']=true;
 s.home.done['home-garden-2']=true;
 for(const scene of ['living','kitchen','garden']){
  assert.deepEqual(ambient(scene),{opacity:0,glow:false});
 }
 s.home.done['home-entry-2']=true;
 s.home.done['home-bedroom-2']=true;
 for(const scene of ['exterior','entry','bedroom']){
  assert.deepEqual(ambient(scene),{opacity:0,glow:true});
 }
 assert.equal(s.version,unchanged.version);
 assert.deepEqual(s.progress,unchanged.progress);
});
