import {test} from 'node:test';
import assert from 'node:assert/strict';
import {describePersonalRecord} from '../src/puzzle/clear-record.js';

test('first victory is celebrated, then previous best is compared rather than guessed',()=>{
 const first=describePersonalRecord({turns:21,scope:'adventure'});
 assert.equal(first.state,'first');
 assert.equal(first.bestTurns,21);
 assert.match(first.text,/初クリア/);
 const improved=describePersonalRecord({turns:16,previousBest:21,scope:'adventure'});
 assert.equal(improved.state,'improved');
 assert.equal(improved.bestTurns,16);
 assert.match(improved.text,/5手短縮/);
 assert.match(improved.text,/21手/);
 const matched=describePersonalRecord({turns:16,previousBest:16,scope:'adventure'});
 assert.equal(matched.state,'matched');
 assert.equal(matched.bestTurns,16);
 assert.doesNotMatch(matched.text,/初クリア|自己ベスト更新/);
 const slower=describePersonalRecord({turns:19,previousBest:16,scope:'adventure'});
 assert.equal(slower.state,'slower');
 assert.equal(slower.bestTurns,16);
 assert.match(slower.text,/あと3手短縮/);
 assert.doesNotMatch(slower.text,/自己ベスト更新/);
});

test('reloading an already finished game never falsely claims a new record',()=>{
 const resume=describePersonalRecord({turns:19,previousBest:16,resumed:true});
 assert.equal(resume.state,'resumed');
 assert.equal(resume.bestTurns,16);
 assert.match(resume.text,/再表示中/);
 assert.doesNotMatch(resume.text,/初クリア|自己ベスト更新/);
 const exact=describePersonalRecord({turns:16,previousBest:16,resumed:true});
 assert.equal(exact.state,'resumed');
 assert.match(exact.text,/16手/);
});

test('free practice and research candidates never claim main campaign rewards',()=>{
 for(const scope of ['practice','session']){
  const row=describePersonalRecord({turns:20,scope});
  assert.equal(row.state,'first');
  assert.match(row.text,scope==='practice'?/自由試遊のベスト/:/この試遊中のベスト/);
  assert.doesNotMatch(row.text,/結晶|報酬|冒険の進行/);
  assert.equal(row.saved,true);
 }
});

test('save failure stays visible even when gameplay succeeds',()=>{
 const row=describePersonalRecord({turns:21,saved:false,scope:'adventure'});
 assert.equal(row.saved,false);
 assert.match(row.text,/端末に保存できていません/);
 assert.doesNotMatch(row.text,/保存しました/);
});

test('inconsistent or impossible records are rejected',()=>{
 for(const input of [
  {turns:0},{turns:-1},{turns:1.5},{turns:2,previousBest:0},
  {turns:2,previousBest:2.5},{turns:2,previousBest:'2'},
  {turns:2,scope:'research-with-rewards'},{turns:2,resumed:1},
  {turns:2,saved:null}
 ])assert.throws(()=>describePersonalRecord(input),/Invalid personal record/);
});
