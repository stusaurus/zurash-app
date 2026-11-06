import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateStage,initialPuzzle} from '../src/puzzle/schema.js';
import {applyPuzzle,replay,solved,successors} from '../src/puzzle/engine.js';
import {solve} from '../src/puzzle/solver.js';
import {verifyItemRequirement} from '../src/puzzle/item-necessity.js';
import {validateChallenge} from '../src/puzzle/challenge-grade.js';
import {buildProgressiveHints} from '../src/puzzle/progressive-hints.js';

const bundle=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/item-required-candidates-v1.json',import.meta.url),'utf8'));
const expectedItems=['iceBlock','powerGlove','warpCrystal'];
const types={iceBlock:'ice',powerGlove:'glove',warpCrystal:'warp'};
test('item-mandatory laboratory is explicitly separate from existing 50-stage campaign',()=>{
 assert.equal(bundle.release,'experimental-unapproved');
 assert.equal(bundle.saveWrites,false);
 assert.deepEqual(bundle.stages.map(s=>s.chapter.number),[51,52,53]);
 assert.deepEqual(bundle.stages.map(s=>s.requiredItem),expectedItems);
 assert.equal(new Set(bundle.stages.map(s=>s.id)).size,bundle.stages.length);
});
for(const stage of bundle.stages){
 test(stage.chapter.title+' has a certified shortest solution and requires its specific item',()=>{
  validateStage(stage);
  const target=validateChallenge(stage);
  const proof=replay(stage,stage.proof);
  assert.equal(proof.cleared,true,'An actual replay must collect every star');
  assert.equal(stage.proof.length,target.minimumTurns);
  const solution=solve(stage,{maxNodes:120000,maxMs:30000});
  assert.equal(solution.status,'solved',JSON.stringify(solution));
  assert.equal(solution.optimalTurns,target.minimumTurns,'No claimed minimum without complete BFS');
  const used=stage.proof.filter(a=>a.prep.type===types[stage.requiredItem]);
  assert.equal(used.length,1,'The certified route must use the unique limited item once');
  const noItem=verifyItemRequirement(stage,stage.requiredItem,{maxNodes:120000,maxMs:30000});
  assert.equal(noItem.status,'required','Not enough to just make item use shorter: it must be indispensable');
  assert.ok(noItem.expanded>0);
  assert.equal(stage.inventory[stage.requiredItem],1);
  const hints=buildProgressiveHints(stage);
  assert.equal(hints.length,4);
  assert.equal(hints[0].steps.length,0);
  assert.equal(hints[3].steps.length,target.minimumTurns);
  assert.equal(stage.status,'candidate');
 });
}
test('item necessity distinguishes optional from required and budget exhaustion',()=>{
 const stage=structuredClone(bundle.stages[0]);
 // Replacing the item-required stars with a simple reachable edge star makes the item optional.
 stage.stars=[3];
 assert.equal(solve(stage,{maxNodes:10000,maxMs:10000}).status,'solved');
 assert.equal(verifyItemRequirement(stage,'iceBlock',{maxNodes:10000,maxMs:10000}).status,'optional');
 const original=bundle.stages[1];
 const tooSmall=verifyItemRequirement(original,'powerGlove',{maxNodes:1,maxMs:10000});
 assert.equal(tooSmall.status,'unverified');
 assert.equal(tooSmall.reason,'nodes');
 assert.throws(()=>verifyItemRequirement(original,'warpCrystal'),/must be available/);
});
