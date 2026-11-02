import {test} from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import {reviewCards,REVIEW_STAGES} from '../src/puzzle/chapter-two-review-summary.js';
const stages=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/adventure-v1.json',import.meta.url))).stages;
test('three comparison stages are exactly 54, 57, 59, keeping official stage names',()=>{
 assert.deepEqual(REVIEW_STAGES.map(x=>x.number),[54,57,59]);
 const rows=reviewCards(stages,{});
 assert.equal(rows.length,3);
 for(const r of rows){
  assert.ok(r.minimumTurns>=1);
  assert.ok(r.title.length>1);
  assert.equal(r.rating,'未評価');
  assert.equal(r.bestAdventure,null);
 }
 assert.equal(rows[1].contrast,67);
 assert.equal(rows[2].contrast,65);
});
test('ratings and both verified completion ledgers are displayed separately without mutation',()=>{
 const s=stages.find(x=>x.chapter.number===57),review={enjoyment:'fun',difficulty:'hard',note:'三度開いた'};
 const ratings={[s.id]:review},normal={[s.id]:{bestTurns:19}},practice={[s.id]:{bestTurns:21}};
 const before=JSON.stringify({ratings,normal,practice});
 const rows=reviewCards(stages,ratings,{adventure:normal,practice});
 assert.equal(rows[1].rating,'面白かった');assert.equal(rows[1].difficulty,'難しい');
 assert.equal(rows[1].bestAdventure,19);assert.equal(rows[1].bestPractice,21);
 assert.equal(rows[1].note,'三度開いた');
 assert.equal(rows[0].hasReview,false);
 assert.equal(before,JSON.stringify({ratings,normal,practice}));
});
test('missing candidate data is a hard error, never silently invented',()=>{
 assert.throws(()=>reviewCards(stages.filter(x=>x.chapter.number!==59),{}),/Missing comparison stage 59/);
});
