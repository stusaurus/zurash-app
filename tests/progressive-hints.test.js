import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildProgressiveHints,cellName,formatHintAction} from '../src/puzzle/progressive-hints.js';
import {evaluateChallenge} from '../src/puzzle/challenge-grade.js';
const pack=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-01/long-candidates-v1.json',import.meta.url)));

test('coordinate labels and wall movements match the visible board orientation',()=>{
 assert.equal(cellName(0,7),'A1');
 assert.equal(cellName(3,7),'D1');
 assert.equal(cellName(48,7),'G7');
 assert.equal(formatHintAction({prep:{type:'wall',from:7,to:8},dir:2},7),'壁 A2 → B2 ／ 滑走 ↓');
});

for(const stage of pack.stages){
 test(stage.chapter.title+' reveals only progressively stronger certified hints',()=>{
  const hints=buildProgressiveHints(stage);
  assert.equal(hints.length,4);
  assert.equal(hints[0].steps.length,0,'concept must not leak exact shortest moves');
  assert.equal(hints[1].steps.length,0,'goal must not leak exact shortest moves');
  assert.match(hints[0].body,/.+/);
  assert.match(hints[1].body,/最初の星を[0-9]+手目/);
  assert.ok(hints[2].steps.length>=2);
  assert.equal(hints[3].steps.length,stage.challenge.minimumTurns);
  assert.deepEqual(hints[3].steps.slice(0,hints[2].steps.length),hints[2].steps);
  assert.ok(hints[3].steps.some(line=>line.includes('壁 ')),'a strategic wall-shift step must appear');
  assert.equal(hints[3].steps.filter(line=>line.includes('⭐星取得')).length,stage.stars.length);
  assert.equal(evaluateChallenge(stage,stage.challenge.minimumTurns).rank,'S','hints cannot modify turn-based rank');
 });
}
test('the ice-wall relay reveals its opening breakthrough and a complete 16-step route',()=>{
 const s=pack.stages.find(x=>x.id==='fun-long-03-v1');
 const hints=buildProgressiveHints(s);
 assert.match(hints[1].body,/5手目、D1/);
 assert.equal(hints[2].steps.length,5);
 assert.equal(hints[3].steps.length,16);
 assert.match(hints[2].steps[2],/壁 A2 → B2/);
 assert.match(hints[2].steps[4],/D1 ⭐星取得/);
});
test('a forged or incomplete proof cannot generate full-answer hints',()=>{
 const s=pack.stages[2];
 assert.throws(()=>buildProgressiveHints({...s,proof:s.proof.slice(0,15)}),/certified shortest route/);
 assert.throws(()=>buildProgressiveHints({...s,proof:[...s.proof.slice(0,15),{prep:{type:'none'},dir:999}]}),/Invalid/);
});
