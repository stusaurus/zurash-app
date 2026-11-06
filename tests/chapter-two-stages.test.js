import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {solveGate,replayGate,initialGate,applyGate} from '../src/puzzle/gate-v2.js';
import {verifyGateItemNecessity} from '../src/puzzle/gate-item-certification.js';
const stages=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/adventure-v1.json',import.meta.url))).stages.filter(s=>s.chapter.number>=61);
for(const stage of stages)test('stage '+stage.chapter.number+' shortest + all items and gate necessity',()=>{
 const r=solveGate(stage);assert.equal(r.status,'solved');assert.equal(r.optimalTurns,stage.challenge.minimumTurns);assert.equal(replayGate(stage,stage.proof).cleared,true);
 for(const item of stage.requiredItems)assert.equal(verifyGateItemNecessity(stage,item).status,'required');
 assert.equal(solveGate(stage,{locked:true}).status,'unsolvable');
 if([64,68,70].includes(stage.chapter.number)){
  const item={64:'iceBlock',68:'warpCrystal',70:'iceBlock'}[stage.chapter.number];assert.equal(verifyGateItemNecessity(stage,item,{goal:'open'}).status,'required');
 }
 if([65,70].includes(stage.chapter.number))assert.equal(solveGate({...stage,inventory:{...stage.inventory,warpCrystal:1}}).status,'unsolvable');
});
test('short 67 uses three switches; stage 70 uses ALL tools with a round-trip warp',()=>{
 for(const number of [67,70]){
 const stage=stages.find(s=>s.chapter.number===number);if(!stage)continue;let state=initialGate(stage),toggles=0;const counts={};
 for(const action of stage.proof){const old=state;state=applyGate(stage,state,action);if(old.gateOpen!==state.gateOpen)toggles++;counts[action.prep.type]=(counts[action.prep.type]??0)+1;}
 if(number===67)assert.equal(toggles,3);else{assert.equal(counts.warp,2);assert.equal(counts.ice,1);assert.equal(counts.glove,1);}
 }
});
