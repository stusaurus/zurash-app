import {test} from 'node:test';
import assert from 'node:assert/strict';
import {personalBestPace} from '../src/puzzle/personal-best-pace.js';

test('a stage with no prior achievement never invents a record',()=>{
 assert.equal(personalBestPace({turns:0,bestTurns:null,minimumTurns:8}),null);
 assert.equal(personalBestPace({turns:8,bestTurns:8,minimumTurns:8,cleared:true}),null);
});

test('a certified S best can only be replayed, never claimed improvable',()=>{
 const start=personalBestPace({turns:0,bestTurns:8,minimumTurns:8});
 assert.equal(start.phase,'s-replay');
 assert.match(start.label,/あと8手/);
 assert.doesNotMatch(start.label,/更新/);
 assert.equal(start.fraction,0);
 const one=personalBestPace({turns:1,bestTurns:8,minimumTurns:8});
 assert.equal(one.phase,'s-replay');
 assert.match(one.label,/あと7手/);
 assert.equal(one.fraction,1/8);
 const at=personalBestPace({turns:8,bestTurns:8,minimumTurns:8});
 assert.equal(at.phase,'s-over');
 assert.doesNotMatch(at.label,/更新可能/);
 const over=personalBestPace({turns:10,bestTurns:8,minimumTurns:8});
 assert.equal(over.phase,'s-over');
 assert.equal(over.fraction,1);
});

test('a non-minimum best has an accurate strict-beat budget and tie boundary',()=>{
 const start=personalBestPace({turns:0,bestTurns:21,minimumTurns:16});
 assert.equal(start.phase,'improvable');
 assert.match(start.label,/あと20手以内/);
 const edge=personalBestPace({turns:20,bestTurns:21,minimumTurns:16});
 assert.equal(edge.phase,'matching');
 assert.match(edge.label,/次の1手/);
 assert.doesNotMatch(edge.label,/更新/);
 const exceeded=personalBestPace({turns:21,bestTurns:21,minimumTurns:16});
 assert.equal(exceeded.phase,'over');
 assert.match(exceeded.label,/最後まで星を集めよう/);
 assert.equal(exceeded.fraction,1);
});

test('Undo rederives the correct budget without a separate save key',()=>{
 const input={bestTurns:21,minimumTurns:16};
 const at=personalBestPace({...input,turns:10});
 const undo=personalBestPace({...input,turns:9});
 assert.equal(at.phase,'improvable');
 assert.equal(undo.phase,'improvable');
 assert.match(at.label,/あと10手以内/);
 assert.match(undo.label,/あと11手以内/);
});

test('impossible best and invalid turn counts fail closed',()=>{
 for(const params of [
  {turns:-1,minimumTurns:8},{turns:1.25,minimumTurns:8},
  {turns:0,minimumTurns:0},{turns:0,minimumTurns:8,bestTurns:7},
  {turns:0,minimumTurns:8,bestTurns:'16'},
  {turns:0,minimumTurns:8,cleared:'no'}
 ])assert.throws(()=>personalBestPace(params),/Invalid personal-best pace/);
});
