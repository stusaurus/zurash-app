import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {validateGateStage,initialGate,gateSuccessors,solveGate,replayGate} from '../src/puzzle/gate-v2.js';
import {verifySwitchLimit,solveGateStickyOpen} from '../src/puzzle/gate-switch-necessity.js';
import {evaluateChallenge,validateChallenge} from '../src/puzzle/challenge-grade.js';
const pack=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/stage57-remix-candidates-v1.json',import.meta.url),'utf8'));
const original=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/adventure-v1.json',import.meta.url),'utf8')).stages.find(s=>s.chapter.number===57);
test('unchanged original 57 is 19 turns, 8 wall shifts, 7 stars and 3 forced gate toggles',()=>{
 assert.equal(original.id,'gate-cycle-57-v1');
 assert.equal(original.challenge.minimumTurns,19);
 assert.equal(original.proof.filter(a=>a.prep.type==='wall').length,8);
 assert.deepEqual(original.provenance.toggleTurns,[7,16,18]);
 assert.equal(pack.release,'candidate-unapproved');
 assert.equal(pack.saveWrites,false);
 assert.deepEqual(pack.stages.map(s=>s.challenge.minimumTurns),[16,17]);
});
for(const [index,s] of pack.stages.entries()){
 test('official gate-v2 BFS proves S route and three switch events: '+s.id,()=>{
  validateGateStage(s);validateChallenge(s);
  const res=solveGate(s,{maxNodes:120000,maxMs:20000});
  assert.equal(res.status,'solved',JSON.stringify(res));
  assert.equal(res.optimalTurns,s.challenge.minimumTurns);
  assert.equal(replayGate(s,s.proof).cleared,true);
  assert.equal(evaluateChallenge(s,s.proof.length).rank,'S');
  let state=initialGate(s),changes=[],pickups=[];
  for(const [i,action]of s.proof.entries()){
   const next=gateSuccessors(s,state).find(x=>JSON.stringify(x.action)===JSON.stringify(action));
   assert.ok(next,'Invalid step '+(i+1));
   if(state.gateOpen!==next.state.gateOpen)changes.push(i+1);
   if(state.stars.length>next.state.stars.length)pickups.push(i+1);
   state=next.state;
  }
  assert.deepEqual(changes,s.provenance.toggleTurns);
  assert.deepEqual(pickups,s.provenance.starTurns);
  assert.equal(s.proof.filter(a=>a.prep.type==='wall').length,index===0?6:4);
 });
 test('with <= 2 switches a complete traversal proves impossible: '+s.id,()=>{
  const r=verifySwitchLimit(s,{maxSwitches:2,maxNodes:120000,maxMs:20000});
  assert.equal(r.status,'required-more','Incomplete search is NOT proof '+JSON.stringify(r));
  assert.ok(r.discovered>1000);
 });
 test('permanently-open gate shortcut is transparently disclosed: '+s.id,()=>{
  const r=solveGateStickyOpen(s,{maxNodes:120000,maxMs:20000});
  assert.equal(r.status,'solved',JSON.stringify(r));
  assert.equal(r.optimalTurns,s.provenance.permanentlyOpenMin);
  assert.ok(r.optimalTurns<s.challenge.minimumTurns);
 });
}
test('truncated search is unverified rather than falsely impossible',()=>{
 const r=verifySwitchLimit(pack.stages[0],{maxSwitches:2,maxNodes:1});
 assert.equal(r.status,'unverified');
 assert.throws(()=>verifySwitchLimit(pack.stages[0],{maxSwitches:-1}),/Invalid/);
});
