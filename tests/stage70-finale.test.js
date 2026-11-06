import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateGateStage,initialGate,gateSuccessors,solveGate,replayGate} from '../src/puzzle/gate-v2.js';
import {verifyGateItemNecessity} from '../src/puzzle/gate-item-certification.js';
import {validateChallenge,evaluateChallenge} from '../src/puzzle/challenge-grade.js';
const pack=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/stage70-finale-candidates-v1.json',import.meta.url),'utf8'));
const original=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/adventure-v1.json',import.meta.url),'utf8')).stages.find(s=>s.chapter.number===70);
function track(stage,actions){
 let state=initialGate(stage),starTurns=[],toggleTurns=[],wallOps=0;
 for(const [i,action] of actions.entries()){
  const next=gateSuccessors(stage,state).find(t=>JSON.stringify(t.action)===JSON.stringify(action));
  assert.ok(next,'Action '+(i+1)+' must be legal');
  if(next.state.stars.length<state.stars.length)starTurns.push(i+1);
  if(next.state.gateOpen!==state.gateOpen)toggleTurns.push(i+1);
  if(['wall','glove'].includes(action.prep.type))wallOps++;
  state=next.state;
 }
 const lastStar=starTurns.at(-1)??0,points=[0,...starTurns,actions.length+1];
 return {starTurns,toggleTurns,wallOps,shortestNoStar:Math.max(...points.slice(1).map((v,i)=>v-points[i]-1)),cleared:state.stars.length===0,lastStar};
}
test('the existing 70th finale stays 18-turn and all 3-item certified',()=>{
 assert.equal(original.id,'ch02-70-v1');
 assert.equal(original.challenge.minimumTurns,18);
 assert.deepEqual(original.stars,[2,19,4]);
 assert.equal(original.certification.necessity.iceBlock.status,'required');
 assert.equal(original.certification.necessity.powerGlove.status,'required');
 assert.equal(original.certification.necessity.warpCrystal.status,'required');
 assert.equal(pack.release,'candidate-unapproved');
 assert.equal(pack.saveWrites,false);
 assert.deepEqual(pack.stages.map(s=>s.challenge.minimumTurns),[14,18]);
});
for(const [i,s] of pack.stages.entries()){
 test('exact gate BFS and official replay prove optimal solution: '+s.id,()=>{
  validateGateStage(s);validateChallenge(s);
  const r=solveGate(s,{maxNodes:100000,maxMs:15000});
  assert.equal(r.status,'solved',JSON.stringify(r));
  assert.equal(r.optimalTurns,s.challenge.minimumTurns);
  assert.equal(replayGate(s,s.proof).cleared,true);
  assert.equal(evaluateChallenge(s,s.proof.length).rank,'S');
  const observed=track(s,s.proof);
  assert.equal(observed.cleared,true);
  assert.deepEqual(observed.starTurns,s.provenance.starPickupTurns);
  assert.deepEqual(observed.toggleTurns,s.provenance.gateToggleTurns);
  assert.equal(observed.wallOps,s.provenance.wallOrGloveMoves);
  assert.equal(observed.shortestNoStar,s.provenance.maxConsecutiveNoStar);
  assert.ok(observed.shortestNoStar<12);
 });
 for(const item of ['iceBlock','powerGlove','warpCrystal']){
  test('exhaustive absence of '+item+' proves necessity in '+s.id,()=>{
   const r=verifyGateItemNecessity(s,item,{maxNodes:100000,maxMs:15000});
   assert.equal(r.status,'required','Do not treat budget as proof: '+JSON.stringify(r));
  });
 }
 test('locked gate cannot clear and search must exhaust: '+s.id,()=>{
  const r=solveGate(s,{locked:true,maxNodes:100000,maxMs:15000});
  assert.equal(r.status,'unsolvable',JSON.stringify(r));
 });
}
