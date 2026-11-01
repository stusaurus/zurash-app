import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateStage} from '../src/puzzle/schema.js';
import {replay,solved} from '../src/puzzle/engine.js';
import {solve} from '../src/puzzle/solver.js';
import {verifyItemRequirement} from '../src/puzzle/item-necessity.js';
import {evaluateChallenge,validateChallenge} from '../src/puzzle/challenge-grade.js';
import {buildProgressiveHints} from '../src/puzzle/progressive-hints.js';

const pack=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/item-long-candidates-v1.json',import.meta.url),'utf8'));
test('long item candidates are isolated from chapter one and short item proofs',()=>{
 assert.equal(pack.release,'experimental-unapproved');
 assert.equal(pack.saveWrites,false);
 assert.deepEqual(pack.stages.map(s=>s.chapter.number),[51,52,53]);
 assert.deepEqual(pack.stages.map(s=>s.requiredItem),['iceBlock','powerGlove','warpCrystal']);
 assert.deepEqual(pack.stages.map(s=>s.challenge.minimumTurns),[19,16,20]);
 assert.equal(new Set(pack.stages.map(s=>s.id)).size,3);
});
const prepType={iceBlock:'ice',powerGlove:'glove',warpCrystal:'warp'};
for(const stage of pack.stages){
 test('certified shortest solution and strict indispensability: '+stage.chapter.title,()=>{
  validateStage(stage);
  const challenge=validateChallenge(stage);
  const replayed=replay(stage,stage.proof);
  assert.equal(replayed.cleared,true,'all stars actually collected');
  assert.equal(solved(replayed.state),true);
  assert.equal(stage.proof.length,challenge.minimumTurns);
  assert.equal(stage.proof.filter(a=>a.prep.type===prepType[stage.requiredItem]).length,1);
  const solution=solve(stage,{maxNodes:160000,maxMs:45000});
  assert.equal(solution.status,'solved','BFS result: '+JSON.stringify({status:solution.status,reason:solution.reason,discovered:solution.discovered}));
  assert.equal(solution.optimalTurns,stage.challenge.minimumTurns);
  const without=verifyItemRequirement(stage,stage.requiredItem,{maxNodes:160000,maxMs:45000});
  assert.equal(without.status,'required','Budget exhaustion cannot prove required: '+JSON.stringify(without));
  assert.ok(without.expanded>0);
  assert.equal(evaluateChallenge(stage,challenge.minimumTurns).rank,'S');
  assert.equal(evaluateChallenge(stage,challenge.aThrough).rank,challenge.aThrough===challenge.minimumTurns?'S':'A');
  assert.equal(evaluateChallenge(stage,challenge.passThrough).rank,challenge.passThrough===challenge.aThrough?'A':'B');
  const hints=buildProgressiveHints(stage);
  assert.equal(hints.length,4);
  assert.equal(hints[0].steps.length,0);
  assert.equal(hints[3].steps.length,challenge.minimumTurns);
  assert.equal(stage.status,'candidate');
 });
}
