import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {starJourney} from '../src/puzzle/star-journey.js';
import {initialGate,applyGate} from '../src/puzzle/gate-v2.js';
import {initialPuzzle} from '../src/puzzle/schema.js';
import {applyPuzzle} from '../src/puzzle/engine.js';
const get=(name)=>JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/'+name,import.meta.url),'utf8')).stages;
test('54/57/70 campaign and candidate routes show real collected-star progress each move',()=>{
 const stages=[
  ...get('stage54-remix-candidates-v1.json'),
  ...get('stage57-remix-candidates-v1.json'),
  ...get('stage70-finale-candidates-v1.json'),
  ...get('adventure-v1.json').filter(x=>[51,54,57,59,70].includes(x.chapter.number))
 ];
 for(const stage of stages){
  const gate=stage.rulesVersion==='solo-v2-gate';
  let state=gate?initialGate(stage):initialPuzzle(stage);
  let previous=0;
  const before=JSON.stringify(stage);
  assert.deepEqual(starJourney(stage,state),{collected:0,remaining:stage.stars.length,total:stage.stars.length,complete:false});
  for(const action of stage.proof){
   state=gate?applyGate(stage,state,action):applyPuzzle(stage,state,action);
   const p=starJourney(stage,state);
   assert.equal(p.collected+p.remaining,p.total);
   assert.ok(p.collected>=previous);
   previous=p.collected;
  }
  const result=starJourney(stage,state);
  assert.equal(result.collected,stage.stars.length);
  assert.equal(result.complete,true);
  assert.equal(JSON.stringify(stage),before);
 }
});
test('Undo and replay derive star progress without storing a separate counter',()=>{
 const stage=get('stage70-finale-candidates-v1.json')[0];
 let state=initialGate(stage),trace=[];
 for(const action of stage.proof.slice(0,6)){
  state=applyGate(stage,state,action);trace.push(action);
 }
 const before=starJourney(stage,state);
 let replayed=initialGate(stage);
 for(const action of trace)replayed=applyGate(stage,replayed,action);
 assert.deepEqual(starJourney(stage,replayed),before);
 trace.pop();replayed=initialGate(stage);
 for(const action of trace)replayed=applyGate(stage,replayed,action);
 const undone=starJourney(stage,replayed);
 assert.ok(undone.collected<=before.collected);
 assert.equal(starJourney(stage,initialGate(stage)).collected,0);
});
test('bad star state is rejected rather than displaying an invented completion',()=>{
 const stage=get('stage54-remix-candidates-v1.json')[0];
 const original=initialPuzzle(stage);
 assert.throws(()=>starJourney(stage,{...original,stars:[-1]}),/inconsistent/);
 assert.throws(()=>starJourney(stage,{...original,stars:[stage.stars[0],stage.stars[0]]}),/inconsistent/);
 assert.throws(()=>starJourney(null,original),/Invalid star journey/);
});
