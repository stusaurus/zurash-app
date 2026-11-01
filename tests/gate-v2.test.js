import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateGateStage,initialGate,gateSuccessors,applyGate,replayGate,solveGate} from '../src/puzzle/gate-v2.js';
import {validateChallenge,evaluateChallenge} from '../src/puzzle/challenge-grade.js';
const collection=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/gate-candidates-v1.json',import.meta.url),'utf8'));
const stage=collection.stages[0];
test('gate engine is research-only and isolated from chapter one',()=>{
 assert.equal(collection.release,'experimental-unapproved');
 assert.equal(collection.saveWrites,false);
 assert.equal(stage.chapter.number,56);
 assert.equal(stage.rulesVersion,'solo-v2-gate');
 validateGateStage(stage);
 assert.equal(initialGate(stage).gateOpen,false);
 assert.equal(validateChallenge(stage).minimumTurns,11);
});
test('stage-56 prototype is exactly eleven turns and gate switch must be used',()=>{
 const solved=solveGate(stage,{maxNodes:140000,maxMs:30000});
 assert.equal(solved.status,'solved',JSON.stringify(solved));
 assert.equal(solved.optimalTurns,stage.challenge.minimumTurns);
 assert.equal(stage.proof.length,solved.optimalTurns);
 const solution=replayGate(stage,stage.proof);
 assert.equal(solution.cleared,true);
 assert.equal(evaluateChallenge(stage,stage.proof.length).rank,'S');
 let current=initialGate(stage),opened=false,pickups=[],wasClosed=true;
 for(let i=0;i<stage.proof.length;i++){
  const next=applyGate(stage,current,stage.proof[i]);
  if(next.gateOpen&&!current.gateOpen)opened=true;
  if(next.stars.length<current.stars.length)pickups.push(i+1);
  current=next;
 }
 assert.equal(opened,true);
 assert.deepEqual(pickups,[3,4,8,11]);
 const locked=solveGate(stage,{locked:true,maxNodes:140000,maxMs:30000});
 assert.equal(locked.status,'unsolvable',JSON.stringify(locked));
});
test('closed gates block sliding, and no wall can occupy a gate or its switch',()=>{
 const root=initialGate(stage);
 const transitions=gateSuccessors(stage,root);
 assert.ok(transitions.length>0);
 assert.ok(transitions.every(x=>!x.state.walls.includes(stage.gate.tile)));
 assert.ok(transitions.every(x=>!x.state.walls.includes(stage.gate.switch)));
 const forged=structuredClone(stage);
 forged.gate.tile=forged.start;
 assert.throws(()=>validateGateStage(forged),/overlaps/);
 assert.throws(()=>applyGate(stage,root,{prep:{type:'wall',from:3,to:0},dir:99}),/Invalid gate action/);
});
