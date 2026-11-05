import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {clearPresentation} from '../src/puzzle/clear-presentation.js';
const chapter=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/adventure-v1.json',import.meta.url),'utf8')).stages;
const candidates=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/stage70-finale-candidates-v1.json',import.meta.url),'utf8')).stages;
test('verified S, A, B and non-passing ranks have distinct honest feedback',()=>{
 const expected={
  S:'最短ルートを発見！',
  A:'見事な攻略！',
  B:'星を集め切った！',
  unqualified:'すべての星を集めた！',
  clear:'クリア！'
 };
 for(const [rank,label] of Object.entries(expected)){
  const before=JSON.stringify(chapter[0]);
  const row=clearPresentation({stage:chapter[0],nextStage:chapter[1],rank,adventureMode:true});
  assert.equal(row.rank,rank);
  assert.equal(row.label,label);
  assert.equal(row.stageTitle,chapter[0].chapter.title);
  assert.match(row.next,/第52面/);
  assert.match(row.next,/グローブの連鎖/);
  assert.equal(JSON.stringify(chapter[0]),before);
 }
});
test('comparison candidates are never mislabeled as adopted campaign stages',()=>{
 const next=clearPresentation({stage:candidates[0],nextStage:candidates[1],rank:'S',adventureMode:false,comparisonMode:true});
 assert.match(next.next,/次の比較候補/);
 assert.doesNotMatch(next.next,/次の冒険|正式採用/);
 const last=clearPresentation({stage:candidates[1],nextStage:null,rank:'A',adventureMode:false,comparisonMode:true});
 assert.match(last.next,/最後の候補まで到達/);
 assert.doesNotMatch(last.next,/正式採用/);
});
test('stage 70 finale points back to home, without inventing rewards',()=>{
 const last=clearPresentation({stage:chapter[19],nextStage:null,rank:'S',adventureMode:true});
 assert.match(last.next,/家で道しるべの思い出/);
 assert.doesNotMatch(last.next,/結晶 \+1/);
});
test('bad ranks and incomplete source data are rejected',()=>{
 assert.throws(()=>clearPresentation({stage:chapter[0],rank:'gold'}),/Invalid clear result/);
 assert.throws(()=>clearPresentation({stage:null,rank:'S'}),/Invalid clear result/);
});
