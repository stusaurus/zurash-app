import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {validateGateStage,solveGate,replayGate,initialGate,gateSuccessors} from '../src/puzzle/gate-v2.js';
import {verifyGateItemNecessity} from '../src/puzzle/gate-item-certification.js';
import {evaluateChallenge,validateChallenge} from '../src/puzzle/challenge-grade.js';
const pack=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/stage59-return-candidates-v1.json',import.meta.url),'utf8'));
const original=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/adventure-v1.json',import.meta.url),'utf8')).stages.find(s=>s.chapter.number===59);
test('original 59 remains untouched, two candidates are distinct and research-only',()=>{
 assert.equal(pack.saveWrites,false);assert.equal(pack.release,'candidate-unapproved');assert.equal(pack.stages.length,2);
 assert.equal(original.id,'gate-warp-59-v1');assert.equal(original.challenge.minimumTurns,20);
 assert.deepEqual(original.proof.flatMap((a,i)=>a.prep.type==='warp'?[i+1]:[]),[20]);
 assert.deepEqual(pack.stages.map(s=>s.challenge.minimumTurns),[18,19]);
 assert.deepEqual(pack.stages.map(s=>s.stars.length),[7,8]);
});
for(const s of pack.stages){
 test('gate-v2 exhaustive BFS, legal S proof, warps 3/7 and gate opening 10: '+s.id,()=>{
  validateGateStage(s);validateChallenge(s);
  const proof=solveGate(s,{maxNodes:190000,maxMs:30000});
  assert.equal(proof.status,'solved',JSON.stringify(proof));
  assert.equal(proof.optimalTurns,s.challenge.minimumTurns);
  assert.equal(replayGate(s,s.proof).cleared,true);
  assert.equal(evaluateChallenge(s,s.proof.length).rank,'S');
  assert.deepEqual(s.proof.flatMap((a,i)=>a.prep.type==='warp'?[i+1]:[]),[3,7]);
  let state=initialGate(s),toggles=[];
  for(const [i,action] of s.proof.entries()){
   const prev=state;const next=gateSuccessors(s,state).find(x=>JSON.stringify(x.action)===JSON.stringify(action));
   assert.ok(next);state=next.state;if(prev.gateOpen!==state.gateOpen)toggles.push(i+1);
  }
  assert.deepEqual(toggles,[10]);
 });
 test('gate locked is exhaustively unsolvable: '+s.id,()=>{
  const r=solveGate(s,{maxNodes:190000,maxMs:30000,locked:true});
  assert.equal(r.status,'unsolvable',JSON.stringify(r));
 });
 test('no warp is exhaustively unsolvable: '+s.id,()=>{
  const r=verifyGateItemNecessity(s,'warpCrystal',{maxNodes:190000,maxMs:30000});
  assert.equal(r.status,'required',JSON.stringify(r));
 });
 test('one warp is solvable but costs 3 additional moves: '+s.id,()=>{
  const one={...s,inventory:{...s.inventory,warpCrystal:1}};
  const r=solveGate(one,{maxNodes:190000,maxMs:30000});
  assert.equal(r.status,'solved',JSON.stringify(r));
  assert.equal(r.optimalTurns,s.challenge.minimumTurns+3);
  assert.equal(r.optimalTurns,s.provenance.oneWarpMinimumTurns);
 });
}