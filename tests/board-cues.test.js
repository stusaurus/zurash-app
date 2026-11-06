import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {describeBoardCues} from '../src/puzzle/board-cues.js';
import {initialPuzzle} from '../src/puzzle/schema.js';
import {applyPuzzle} from '../src/puzzle/engine.js';
import {initialGate,applyGate} from '../src/puzzle/gate-v2.js';

function load(name){
 return JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/'+name,import.meta.url),'utf8')).stages;
}
test('ice placement highlights its real target without falsely awarding a star',()=>{
 const stage=load('stage54-remix-candidates-v1.json')[0];
 const before=initialPuzzle(stage),action=stage.proof[0];
 const after=applyPuzzle(stage,before,action);
 const beforeCopy=structuredClone(before),afterCopy=structuredClone(after);
 const cue=describeBoardCues(stage,before,after,action);
 assert.equal(cue.itemCell,action.prep.to);
 assert.equal(cue.itemKind,'ice');
 assert.equal(cue.gateCell,null);
 assert.equal(cue.starCell,after.stars.length<before.stars.length?after.position:null);
 assert.deepEqual(before,beforeCopy);
 assert.deepEqual(after,afterCopy);
});
test('70 finale cue events follow the proven played route and the gate tile',()=>{
 for(const stage of load('stage70-finale-candidates-v1.json')){
  let state=initialGate(stage),starEvents=0,gateEvents=0,itemEvents=0;
  for(const action of stage.proof){
   const before=state;
   state=applyGate(stage,state,action);
   const cue=describeBoardCues(stage,before,state,action);
   if(before.stars.length>state.stars.length){
    assert.ok(cue,'missing star cue');
    assert.equal(cue.starCell,state.position);
    starEvents++;
   }else assert.equal(cue?.starCell??null,null);
   if(before.gateOpen!==state.gateOpen){
    assert.equal(cue.gateCell,stage.gate.tile);
    assert.equal(cue.gateOpen,state.gateOpen);
    gateEvents++;
   }else assert.equal(cue?.gateCell??null,null);
   if(action.prep.type!=='none'){
    assert.equal(cue.itemCell,action.prep.to);
    assert.equal(cue.itemKind,action.prep.type);
    itemEvents++;
   }else assert.equal(cue?.itemCell??null,null);
  }
  assert.equal(state.stars.length,0);
  assert.equal(starEvents,stage.stars.length);
  assert.ok(gateEvents>0,'switch gate must change at least once');
  assert.ok(itemEvents>=3,'item actions should be represented');
 }
});
test('an unchanged no-item state needs no visual cue or accidental reward',()=>{
 const stage=load('stage70-finale-candidates-v1.json')[0];
 const state=initialGate(stage);
 assert.equal(describeBoardCues(stage,state,state,{prep:{type:'none'},dir:0}),null);
 assert.throws(()=>describeBoardCues(stage,null,state,{prep:{type:'none'}}),/requires a played move/);
});
