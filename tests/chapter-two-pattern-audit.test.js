import {test} from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';
import {auditChapterTwoProof,auditChapterTwoCollection} from '../scripts/chapter-two-pattern-audit.js';
const stages=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/adventure-v1.json',import.meta.url),'utf8')).stages;
test('all 20 proof routes are legal, replay to clear, and preserve minimum turn counts',()=>{
 const stats=auditChapterTwoCollection(stages);
 assert.equal(stats.length,20);
 for(const [i,row]of stats.entries()){
  assert.equal(row.number,51+i);
  assert.equal(row.minimumTurns,stages[i].challenge.minimumTurns);
  assert.equal(row.starTurns.length,row.stars);
  assert.ok(row.uniqueStoppingCells>0);
  assert.ok(row.revisitedStops>=0);
  assert.equal(row.iceUses+row.warpUses+row.regularWallMoves+row.gloveMoves+
   stages[i].proof.filter(a=>a.prep.type==='none').length,row.minimumTurns);
 }
});
test('objective 54/57/59 patterns are measurable and not equated with fun',()=>{
 const rows=auditChapterTwoCollection(stages);
 const s54=rows.find(x=>x.number===54),s57=rows.find(x=>x.number===57),s59=rows.find(x=>x.number===59);
 assert.equal(s54.minimumTurns,19);
 assert.equal(s54.movableWallPreparations,0);
 assert.equal(s54.longestUnmodifiedSlideStreak,9);
 assert.equal(s57.gateToggles,3);
 assert.equal(s57.minimumTurns,19);
 assert.equal(s59.minimumTurns,20);
 assert.deepEqual(s59.warpTurns,[20]);
 assert.equal(s59.movableWallPreparations,9);
 assert.deepEqual(rows.find(x=>x.number===65).warpTurns,[2,6]);
 assert.equal(rows.find(x=>x.number===67).gateToggles,3);
});
test('audit rejects modified or invalid proof rather than reporting a score',()=>{
 const original=stages.find(x=>x.chapter.number===57);
 assert.throws(()=>auditChapterTwoProof({...original,proof:original.proof.slice(0,2)}),/did not clear|Invalid/);
 assert.throws(()=>auditChapterTwoCollection(stages.slice(0,19)),/51-70/);
});
