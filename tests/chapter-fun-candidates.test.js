import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initialPuzzle,validateStage} from '../src/puzzle/schema.js';
import {successors,replay,solved,stateKey} from '../src/puzzle/engine.js';
import {solve} from '../src/puzzle/solver.js';

const pkg=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-01/fun-candidates-v1.json',import.meta.url),'utf8'));
const fixture=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-01/chunks/chapter-01-1.json',import.meta.url),'utf8'));

function canFinishWithout(stage,forbidden){
 const root=initialPuzzle(stage),key=stateKey(root),seen=new Set([key]),queue=[root];
 for(let cursor=0;cursor<queue.length;cursor++){
  const s=queue[cursor];
  for(const option of successors(stage,s)){
   if(forbidden.includes(option.action.prep.type))continue;
   if(solved(option.state))return true;
   const k=stateKey(option.state);
   if(!seen.has(k)){seen.add(k);queue.push(option.state);}
  }
  assert.ok(queue.length<15000,'Unexpectedly large baseline-only search');
 }
 return false;
}

test('experimental pack is separate from shipping chapter data',()=>{
 assert.equal(pkg.stages.length,10);
 assert.equal(new Set(pkg.stages.map(s=>s.id)).size,10);
 assert.ok(pkg.stages.every(s=>!fixture.some(old=>old.id===s.id)));
 assert.ok(pkg.stages.every(s=>s.status==='candidate'&&s.provenance.status==='unapproved-playtest-candidate'));
 assert.ok(pkg.stages.every((s,i)=>s.chapter.number===i+1));
});
for(const stage of pkg.stages){
 test('experimental stage '+stage.chapter.number+' proof is legal and shortest',()=>{
  validateStage(stage);
  const result=replay(stage,stage.proof);
  assert.equal(result.cleared,true,'Curated route must collect every star');
  const optimal=solve(stage,{maxNodes:24000,maxMs:12000});
  assert.equal(optimal.status,'solved',JSON.stringify(optimal));
  assert.equal(optimal.optimalTurns,stage.proof.length,'Curated route must be optimal');
  if(stage.chapter.number>1&&stage.chapter.number<10){
   assert.ok(stage.proof.some(a=>a.prep.type==='wall'),'Wall movement should have a visible purpose');
   assert.equal(canFinishWithout(stage,['wall']),false,'Without wall shifts the stars must remain unreachable');
  }
  if(stage.chapter.number===10){
   assert.ok(stage.proof.some(a=>a.prep.type==='ice'));
   assert.equal(canFinishWithout(stage,['ice']),false,'Ice must enable a genuinely new stopping position');
  }
 });
}
