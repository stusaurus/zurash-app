import {test} from 'node:test';import assert from 'node:assert/strict';
import {chapterTwoMilestone} from '../src/puzzle/chapter-two-story.js';
test('chapter two milestones only narrate earned stage clears',()=>{
 assert.equal(chapterTwoMilestone(51),null);
 for(const id of [55,60,65,70]){
  const row=chapterTwoMilestone(id);
  assert.ok(row?.title?.length>4);
  assert.ok(row?.body?.length>14);
 }
 assert.match(chapterTwoMilestone(70).title,/全20ステージクリア/);
 assert.equal(chapterTwoMilestone(71),null);
});
