import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateChallenge,evaluateChallenge} from '../src/puzzle/challenge-grade.js';

const caseStage=(minimumTurns,aThrough,passThrough)=>({
  challenge:{minimumTurns,aThrough,passThrough,verifiedBy:'complete-bfs-solo-v1'},
});

test('minimum-turn grade boundaries are consistent for the 16-turn puzzle',()=>{
 const stage=caseStage(16,18,20);
 assert.deepEqual([16,17,18,19,20,21].map(n=>evaluateChallenge(stage,n).rank),
  ['S','A','A','B','B','unqualified']);
 assert.equal(evaluateChallenge(stage,20).passed,true);
 assert.equal(evaluateChallenge(stage,21).passed,false);
 assert.equal(evaluateChallenge(stage,20).extraTurns,4);
});
test('minimum-turn grade boundaries are consistent for the 19-turn puzzle',()=>{
 const stage=caseStage(19,21,24);
 assert.deepEqual([19,20,21,22,24,25].map(n=>evaluateChallenge(stage,n).rank),
  ['S','A','A','B','B','unqualified']);
 assert.equal(evaluateChallenge(stage,24).passed,true);
 assert.equal(evaluateChallenge(stage,25).passed,false);
});
test('challenge grading must reject unverified, impossible, or contradictory minima',()=>{
 assert.equal(validateChallenge({}),null);
 assert.equal(evaluateChallenge({},20),null);
 assert.throws(()=>evaluateChallenge(caseStage(16,18,20),15),/impossible turn/);
 assert.throws(()=>evaluateChallenge(caseStage(16,18,20),16.5),/impossible turn/);
 assert.throws(()=>validateChallenge(caseStage(16,21,20)),/Invalid certified/);
 assert.throws(()=>validateChallenge({challenge:{...caseStage(16,18,20).challenge,verifiedBy:'guess'}}),/Invalid certified/);
});
