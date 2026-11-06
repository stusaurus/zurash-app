import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateGateStage,initialGate,applyGate,solveGate,replayGate} from '../src/puzzle/gate-v2.js';
import {verifyGateItemNecessity} from '../src/puzzle/gate-item-certification.js';
import {validateChallenge,evaluateChallenge} from '../src/puzzle/challenge-grade.js';
import {buildGateHints} from '../src/puzzle/gate-hints.js';
const pack=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/gate-warp-candidates-v1.json',import.meta.url),'utf8'));
const stage=pack.stages[0];
test('59 is research-only with one warp and an isolated island',()=>{
 assert.equal(pack.release,'experimental-unapproved');
 assert.equal(pack.saveWrites,false);
 assert.equal(stage.chapter.number,59);
 assert.equal(stage.status,'candidate');
 assert.equal(stage.rulesVersion,'solo-v2-gate');
 assert.equal(stage.inventory.warpCrystal,1);
 assert.deepEqual(stage.portals,[[0,14]]);
 assert.equal(stage.board.width,8);
 assert.equal(stage.stars.length,7);
 validateGateStage(stage);
});
test('full official gate-v2 search certifies minimum 20 and replays all 20 legal turns',()=>{
 const r=solveGate(stage,{maxNodes:180000,maxMs:60000});
 assert.equal(r.status,'solved',JSON.stringify(r));
 assert.equal(r.optimalTurns,20);
 assert.equal(stage.proof.length,20);
 assert.equal(replayGate(stage,stage.proof).cleared,true);
 assert.equal(validateChallenge(stage).minimumTurns,20);
 assert.equal(evaluateChallenge(stage,20).rank,'S');
 assert.equal(evaluateChallenge(stage,22).rank,'A');
 assert.equal(evaluateChallenge(stage,25).rank,'B');
});
test('WITHOUT warp no route reaches isolated final star: exhaust all gate-v2 reachable states',()=>{
 const r=verifyGateItemNecessity(stage,'warpCrystal',{maxNodes:180000,maxMs:60000});
 assert.equal(r.status,'required','Do not confuse budget with proof: '+JSON.stringify(r));
 assert.ok(r.excluded>0);
 assert.ok(r.expanded>1000);
});
test('WITHOUT open gate even using warp it is provably impossible',()=>{
 const r=solveGate(stage,{locked:true,maxNodes:180000,maxMs:60000});
 assert.equal(r.status,'unsolvable','Budget is not a valid proof: '+JSON.stringify(r));
 assert.ok(r.expanded>0);
});
test('minimum proof opens gate at move 8, uses warp only on move 20 and never writes saves',()=>{
 let current=initialGate(stage),wallMoves=0,warpMoves=[],toggles=[],pickupTurns=[];
 for(let i=0;i<stage.proof.length;i++){
  const before=current,act=stage.proof[i];
  current=applyGate(stage,before,act);
  if(current.gateOpen!==before.gateOpen)toggles.push(i+1);
  if(current.stars.length<before.stars.length)pickupTurns.push(i+1);
  if(act.prep.type==='wall')wallMoves++;
  if(act.prep.type==='warp')warpMoves.push(i+1);
 }
 assert.equal(current.stars.length,0);
 assert.equal(current.position,15);
 assert.equal(current.inventory.warpCrystal,0);
 assert.deepEqual(toggles,[8]);
 assert.deepEqual(warpMoves,[20]);
 assert.deepEqual(pickupTurns,[1,6,7,10,13,16,20]);
 assert.equal(wallMoves,9);
 const h=buildGateHints(stage);
 assert.equal(h.length,4);
 assert.equal(h[2].steps.length,8);
 assert.equal(h[3].steps.length,20);
 assert.match(h[3].steps[19],/ワープ/);
});
test('certifier never treats exhausted budget as item necessity',()=>{
 assert.equal(verifyGateItemNecessity(stage,'warpCrystal',{maxNodes:1,maxMs:60000}).status,'unverified');
 assert.throws(()=>verifyGateItemNecessity(stage,'iceBlock'),/Invalid/);
});
