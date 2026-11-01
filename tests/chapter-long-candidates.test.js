import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateStage,initialPuzzle} from '../src/puzzle/schema.js';
import {solved,replay,applyPuzzle,successors,stateKey} from '../src/puzzle/engine.js';
import {solve} from '../src/puzzle/solver.js';
import {validateChallenge,evaluateChallenge} from '../src/puzzle/challenge-grade.js';

const bundle=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-01/long-candidates-v1.json',import.meta.url),'utf8'));

function noWallSolution(stage){
 const root=initialPuzzle(stage),seen=new Set([stateKey(root)]),queue=[root];
 for(let i=0;i<queue.length;i++){
  for(const next of successors(stage,queue[i])){
   if(next.action.prep.type!=='none')continue;
   if(solved(next.state))return true;
   const key=stateKey(next.state);
   if(!seen.has(key)){seen.add(key);queue.push(next.state);}
  }
 }
 return false;
}

test('long experimental puzzles are not the original chapter stages',()=>{
 assert.equal(bundle.release,'experimental-unapproved');
 assert.equal(bundle.saveWrites,false);
 assert.equal(bundle.stages.length,3);
 assert.equal(new Set(bundle.stages.map(s=>s.id)).size,bundle.stages.length);
 for(const s of bundle.stages){
  assert.ok(s.id.startsWith('fun-long-'));
  assert.equal(s.status,'candidate');
  validateStage(s);
 }
});

for(const stage of bundle.stages){
 test('long candidate '+stage.id+' proof and 2-minute design metrics',()=>{
  const route=stage.proof,optimalTurns=stage.provenance.shortestReported;
  const targets=validateChallenge(stage);
  assert.ok(targets,'No challenge may ship without a certified BFS minimum');
  assert.equal(route.length,optimalTurns);
  assert.equal(targets.minimumTurns,optimalTurns);
  assert.equal(targets.aThrough,optimalTurns+Math.ceil(optimalTurns*.10));
  assert.equal(targets.passThrough,optimalTurns+Math.ceil(optimalTurns*.25));
  assert.ok(route.length>=16,'Five-turn micro-puzzles are no longer accepted as main challenges');
  assert.equal(replay(stage,route).cleared,true);
  const answer=solve(stage,{maxNodes:160000,maxMs:45000});
  assert.equal(answer.status,'solved',JSON.stringify(answer));
  assert.equal(answer.optimalTurns,optimalTurns,'Route needs to be genuinely long, not padded');
  assert.equal(answer.optimalTurns,targets.minimumTurns,'Published minimum must match a fresh complete BFS search');
  assert.equal(evaluateChallenge(stage,answer.optimalTurns).rank,'S');
  assert.equal(evaluateChallenge(stage,targets.aThrough).rank,'A');
  assert.equal(evaluateChallenge(stage,targets.passThrough).rank,'B');
  assert.equal(evaluateChallenge(stage,targets.passThrough+1).rank,'unqualified');
  assert.equal(noWallSolution(stage),false,'Wall movement should be necessary to clear');
  let s=initialPuzzle(stage),gap=0,maxGap=0,wallStreak=0,maxWallStreak=0,wallMoves=0;
  const pickups=[];
  for(let i=0;i<route.length;i++){
   const n=applyPuzzle(stage,s,route[i]);
   wallStreak=route[i].prep.type==='wall'?wallStreak+1:0;
   wallMoves+=Number(route[i].prep.type==='wall');
   maxWallStreak=Math.max(maxWallStreak,wallStreak);
   gap++;
   if(n.stars.length<s.stars.length){pickups.push(i+1);maxGap=Math.max(maxGap,gap);gap=0;}
   s=n;
  }
  assert.deepEqual(pickups,stage.provenance.starPickupTurns);
  assert.equal(wallMoves,stage.provenance.wallActionsOnProof);
  assert.ok(maxGap<=7,'Do not require more than seven empty turns between rewards');
  assert.ok(maxWallStreak<=4,'Avoid long repetitive wall pushing');
 });
}
