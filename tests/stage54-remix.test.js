import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateStage} from '../src/puzzle/schema.js';
import {solve} from '../src/puzzle/solver.js';
import {replay} from '../src/puzzle/engine.js';
import {validateChallenge,evaluateChallenge} from '../src/puzzle/challenge-grade.js';
import {verifyPreparationMandatory} from '../src/puzzle/prepare-certification.js';
const pack=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/stage54-remix-candidates-v1.json',import.meta.url),'utf8'));
const original=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/adventure-v1.json',import.meta.url),'utf8')).stages.find(x=>x.chapter.number===54);
test('two distinct level54 remixes are research-only, original remains 19 turns and zero wall moves',()=>{
 assert.equal(pack.release,'experimental-unapproved');
 assert.equal(pack.saveWrites,false);
 assert.equal(pack.stages.length,2);
 assert.equal(original.id,'ch02-dual-ice-warp-v1');
 assert.equal(original.challenge.minimumTurns,19);
 assert.equal(original.proof.filter(a=>a.prep.type==='wall').length,0);
 for(const s of pack.stages){validateStage(s);assert.equal(s.status,'candidate');assert.equal(s.chapter.number,54);
  assert.equal(s.inventory.iceBlock,1);assert.equal(s.inventory.warpCrystal,1);assert.equal(s.walls.length,1);}
});
for(const s of pack.stages){
 test('official solo-v1 complete BFS certifies shortest and replay for '+s.id,()=>{
  const result=solve(s,{maxNodes:150000,maxMs:15000});
  assert.equal(result.status,'solved',JSON.stringify(result));
  assert.equal(result.optimalTurns,s.challenge.minimumTurns);
  assert.equal(replay(s,s.proof).cleared,true);
  validateChallenge(s);
  assert.equal(evaluateChallenge(s,s.proof.length).rank,'S');
  assert.ok(s.proof.filter(a=>a.prep.type==='wall').length>=4);
 });
 for(const excluded of ['wall','ice','warp'])test('without '+excluded+' it is PROVABLY unsolvable: '+s.id,()=>{
  const result=verifyPreparationMandatory(s,excluded,{maxNodes:120000,maxMs:15000});
  assert.equal(result.status,'required','Budget is NOT proof: '+JSON.stringify(result));
  assert.ok(result.excluded>0);
 });
}
test('a resource cap is unverified, not a false necessity proof',()=>{
 const result=verifyPreparationMandatory(pack.stages[0],'wall',{maxNodes:1,maxMs:15000});
 assert.equal(result.status,'unverified');
 assert.throws(()=>verifyPreparationMandatory(pack.stages[0],'invalid'));
});
