import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateGateStage,initialGate,applyGate,replayGate,solveGate} from '../src/puzzle/gate-v2.js';
import {verifySwitchMinimum} from '../src/puzzle/gate-cycle-certification.js';
import {validateChallenge,evaluateChallenge} from '../src/puzzle/challenge-grade.js';
import {buildGateHints} from '../src/puzzle/gate-hints.js';

const pack=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/gate-cycle-candidates-v1.json',import.meta.url),'utf8'));
const stage=pack.stages[0];
test('stage57 remains isolated from first 50, stage56, repair saves and board research',()=>{
 assert.equal(pack.release,'experimental-unapproved');
 assert.equal(pack.saveWrites,false);
 assert.equal(stage.chapter.number,57);
 assert.equal(stage.status,'candidate');
 assert.equal(stage.gate.initialOpen,false);
 validateGateStage(stage);
});
test('official gate-v2 BFS certifies exactly 19 turns and replayable solution',()=>{
 const result=solveGate(stage,{maxNodes:160000,maxMs:40000});
 assert.equal(result.status,'solved',JSON.stringify(result));
 assert.equal(result.optimalTurns,19);
 assert.equal(stage.proof.length,19);
 assert.equal(replayGate(stage,stage.proof).cleared,true);
 const ch=validateChallenge(stage);
 assert.equal(ch.minimumTurns,19);
 assert.equal(evaluateChallenge(stage,19).rank,'S');
 assert.equal(evaluateChallenge(stage,21).rank,'A');
 assert.equal(evaluateChallenge(stage,24).rank,'B');
});
test('BFS exhausts every reachable state with 0-2 switch toggles: three are mandatory',()=>{
 const no2=verifySwitchMinimum(stage,{maxSwitches:2,maxNodes:180000,maxMs:40000});
 assert.equal(no2.status,'required-more',JSON.stringify(no2));
 assert.ok(no2.expanded>0);
 const allowed3=verifySwitchMinimum(stage,{maxSwitches:3,maxNodes:180000,maxMs:40000});
 assert.equal(allowed3.status,'possible',JSON.stringify(allowed3));
 assert.equal(allowed3.usedSwitches,3);
 assert.equal(verifySwitchMinimum(stage,{maxSwitches:2,maxNodes:1,maxMs:40000}).status,'unverified');
});
test('certified shortest route opens, closes and reopens at turns 7,16,18',()=>{
 let state=initialGate(stage);
 const changed=[],pickups=[];let wallMoves=0;
 for(let i=0;i<stage.proof.length;i++){
  const next=applyGate(stage,state,stage.proof[i]);
  if(next.gateOpen!==state.gateOpen)changed.push({turn:i+1,open:next.gateOpen});
  if(next.stars.length<state.stars.length)pickups.push(i+1);
  if(stage.proof[i].prep.type==='wall')wallMoves++;
  state=next;
 }
 assert.deepEqual(changed,[{turn:7,open:true},{turn:16,open:false},{turn:18,open:true}]);
 assert.deepEqual(pickups,[1,3,5,9,13,15,19]);
 assert.equal(wallMoves,8);
 assert.equal(state.stars.length,0);
 const hints=buildGateHints(stage);
 assert.equal(hints.length,4);
 assert.equal(hints[2].steps.length,7);
 assert.equal(hints[3].steps.length,19);
 assert.match(hints[3].steps[15],/ゲートが閉じた/);
 assert.match(hints[3].steps[17],/ゲートが開いた/);
});
