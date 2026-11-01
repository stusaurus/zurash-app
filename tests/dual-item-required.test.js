import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateStage} from '../src/puzzle/schema.js';
import {initialPuzzle} from '../src/puzzle/schema.js';
import {replay,applyPuzzle,solved} from '../src/puzzle/engine.js';
import {solve} from '../src/puzzle/solver.js';
import {verifyItemRequirement} from '../src/puzzle/item-necessity.js';
import {validateChallenge,evaluateChallenge} from '../src/puzzle/challenge-grade.js';
import {buildProgressiveHints} from '../src/puzzle/progressive-hints.js';

const pack=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/dual-item-candidates-v1.json',import.meta.url),'utf8'));
const prep={iceBlock:'ice',powerGlove:'glove',warpCrystal:'warp'};
test('dual candidates retain save separation and target slots 54–55',()=>{
 assert.equal(pack.release,'experimental-unapproved');
 assert.equal(pack.saveWrites,false);
 assert.deepEqual(pack.stages.map(s=>s.chapter.number),[54,55]);
 assert.deepEqual(pack.stages.map(s=>s.requiredItems),[['iceBlock','warpCrystal'],['powerGlove','warpCrystal']]);
});
for(const stage of pack.stages){
 test(stage.chapter.title+' needs BOTH tools, with independently proven shortest solution',()=>{
  validateStage(stage);
  const challenge=validateChallenge(stage);
  assert.ok(stage.requiredItems.length>=2);
  const replayed=replay(stage,stage.proof);
  assert.ok(replayed.cleared);
  assert.equal(stage.proof.length,challenge.minimumTurns);
  const results=solve(stage,{maxNodes:160000,maxMs:45000});
  assert.equal(results.status,'solved',JSON.stringify(results));
  assert.equal(results.optimalTurns,challenge.minimumTurns);
  for(const tool of stage.requiredItems){
   assert.equal(stage.inventory[tool],1);
   assert.equal(stage.proof.filter(a=>a.prep.type===prep[tool]).length,1);
   const denied=verifyItemRequirement(stage,tool,{maxNodes:160000,maxMs:45000});
   assert.equal(denied.status,'required',tool+' forbidden search must EXHAUST, not time out: '+JSON.stringify(denied));
  }
  assert.equal(evaluateChallenge(stage,challenge.minimumTurns).rank,'S');
  const hints=buildProgressiveHints(stage);
  assert.equal(hints.length,4);
  assert.equal(hints.at(-1).steps.length,challenge.minimumTurns);
  let state=initialPuzzle(stage);
  for(const action of stage.proof)state=applyPuzzle(stage,state,action);
  assert.equal(solved(state),true);
  assert.equal(stage.status,'candidate');
 });
}
