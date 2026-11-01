import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {step} from '../src/engine.js';
import {validateGateStage,initialGate,applyGate,replayGate,solveGate} from '../src/puzzle/gate-v2.js';
import {verifyGateClosure} from '../src/puzzle/gate-closure-certification.js';
import {verifySwitchMinimum} from '../src/puzzle/gate-cycle-certification.js';
import {validateChallenge,evaluateChallenge} from '../src/puzzle/challenge-grade.js';
import {buildGateHints} from '../src/puzzle/gate-hints.js';
const pack=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/gate-closure-candidates-v1.json',import.meta.url),'utf8'));
const stage=pack.stages[0];
test('stage58 is a separate candidate and does not persist progress',()=>{
 assert.equal(pack.release,'experimental-unapproved');
 assert.equal(pack.saveWrites,false);
 assert.equal(stage.status,'candidate');
 assert.equal(stage.chapter.number,58);
 assert.equal(stage.stars.length,6);
 validateGateStage(stage);
});
test('stage58 is 17 turns by the official BFS and all 17 proof actions replay legally',()=>{
 const solution=solveGate(stage,{maxNodes:160000,maxMs:60000});
 assert.equal(solution.status,'solved',JSON.stringify(solution));
 assert.equal(solution.optimalTurns,17);
 assert.equal(stage.proof.length,17);
 assert.equal(replayGate(stage,stage.proof).cleared,true);
 assert.equal(validateChallenge(stage).minimumTurns,17);
 assert.equal(evaluateChallenge(stage,17).rank,'S');
 assert.equal(evaluateChallenge(stage,19).rank,'A');
 assert.equal(evaluateChallenge(stage,22).rank,'B');
});
test('closing the gate is necessary: latch-open counterfactual is exhausted',()=>{
 const proof=verifyGateClosure(stage,{mode:'latch-open',maxNodes:160000,maxMs:60000});
 assert.equal(proof.status,'unsolvable','A budget stop never proves necessity: '+JSON.stringify(proof));
 assert.ok(proof.expanded>1000);
});
test('after reopening then closing, a CLOSED-gate stopper is mandatory in ALL solutions',()=>{
 const proof=verifyGateClosure(stage,{mode:'forbid-reclosed-stop',maxNodes:160000,maxMs:60000});
 assert.equal(proof.status,'unsolvable','A budget stop never proves mandatory stopper: '+JSON.stringify(proof));
 assert.ok(proof.excluded>0,'Counterfactual must really exclude stops');
 assert.ok(proof.expanded>1000);
 const canOpenOnce=verifySwitchMinimum(stage,{maxSwitches:1,maxNodes:160000,maxMs:60000});
 assert.equal(canOpenOnce.status,'required-more',JSON.stringify(canOpenOnce));
 const canClose=verifySwitchMinimum(stage,{maxSwitches:2,maxNodes:160000,maxMs:60000});
 assert.equal(canClose.status,'possible',JSON.stringify(canClose));
});
test('proof opens turn 2, closes turn 16 and wins turn 17 BY STOPPING against the closed gate',()=>{
 let state=initialGate(stage);const toggles=[],starTurns=[];let wallMoves=0;
 for(let index=0;index<stage.proof.length;index++){
  const prior=state,action=stage.proof[index];
  state=applyGate(stage,state,action);
  if(prior.gateOpen!==state.gateOpen)toggles.push({turn:index+1,open:state.gateOpen});
  if(state.stars.length<prior.stars.length)starTurns.push(index+1);
  if(action.prep.type==='wall')wallMoves++;
  if(index===15){assert.equal(state.position,stage.gate.switch);assert.equal(state.gateOpen,false);assert.equal(state.stars.length,1);}
  if(index===16){
    assert.equal(prior.gateOpen,false);
    assert.equal(state.position,10);
    assert.equal(step(state.position,action.dir,stage.board),stage.gate.tile);
    assert.equal(state.stars.length,0);
  }
 }
 assert.deepEqual(toggles,[{turn:2,open:true},{turn:16,open:false}]);
 assert.deepEqual(starTurns,[4,5,8,10,14,17]);
 assert.equal(wallMoves,8);
 const hints=buildGateHints(stage);
 assert.equal(hints.length,4);
 assert.equal(hints[3].steps.length,17);
 assert.match(hints[3].steps[15],/ゲートが閉じた/);
 assert.match(hints[3].steps[16],/⭐星取得/);
});
test('search budget exhaustion reports unverified, never unsolvable',()=>{
 for(const mode of ['latch-open','forbid-reclosed-stop']){
  assert.equal(verifyGateClosure(stage,{mode,maxNodes:1,maxMs:60000}).status,'unverified');
 }
});
