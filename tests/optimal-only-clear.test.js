import test from 'node:test';
import assert from 'node:assert/strict';
import {replay} from '../src/puzzle/engine.js';
import {completePuzzle,newProgress,balance} from '../src/puzzle/progress.js';
import {newChapterTwo,checkpointTwo,validateChapterTwo,canEnterTwo} from '../src/puzzle/chapter-two-progress.js';

const stage={
  schemaVersion:1,rulesVersion:'solo-v1',id:'pz-000001',revision:1,status:'approved',
  board:{width:4,height:4},start:0,walls:[],stars:[3],fixed:[],
  iceSockets:[],portals:[],inventory:{iceBlock:0,powerGlove:0,warpCrystal:0},
  goal:{type:'collect-all'},chapter:{number:51,title:'Shortest-only test'},
  challenge:{minimumTurns:1,aThrough:2,passThrough:3,verifiedBy:'complete-bfs-solo-v1'}
};
const step=dir=>({prep:{type:'none'},dir});
const optimal=[step(1)];
const detour=[step(2),step(0),step(1)];

test('longer successful route is not awarded a Chapter 1 star when the certified minimum is required',()=>{
  assert.equal(replay(stage,optimal).cleared,true);
  assert.equal(replay(stage,detour).cleared,true);
  assert.throws(()=>completePuzzle(newProgress(),stage,detour,{minimumTurns:1}),/Shortest route required/);
  assert.throws(()=>completePuzzle(newProgress(),stage,optimal,{minimumTurns:0}),/Shortest route required/);
  const result=completePuzzle(newProgress(),stage,optimal,{minimumTurns:1});
  assert.equal(result.completed[stage.id].bestTurns,1);
  assert.equal(balance(result),1);
});

test('Chapter 2 preserves failed attempts but only an exact minimum unlocks the next stage',()=>{
  const entries=[stage,{...stage,id:'pz-000002',chapter:{number:52,title:'Next'}}];
  const missed=checkpointTwo(newChapterTwo(),entries,stage,detour);
  assert.deepEqual(missed.completed,{});
  assert.deepEqual(missed.active.actions,detour);
  assert.equal(canEnterTwo(entries,missed,1),false);
  assert.equal(validateChapterTwo(missed,entries),missed);
  const passed=checkpointTwo(missed,entries,stage,optimal);
  assert.equal(passed.completed[stage.id].bestTurns,1);
  assert.deepEqual(passed.completed[stage.id].proof,optimal);
  assert.equal(canEnterTwo(entries,passed,1),true);
  assert.equal(validateChapterTwo(passed,entries),passed);
});

test('old pre-rule completions are readable without deleting saves or revoking earlier progression',()=>{
  const entries=[stage,{...stage,id:'pz-000002',chapter:{number:52,title:'Next'}}];
  const legacy={version:1,completed:{[stage.id]:{revision:1,bestTurns:3,proof:detour}},active:null};
  assert.deepEqual(validateChapterTwo(legacy,entries),legacy);
  assert.equal(canEnterTwo(entries,legacy,1),true);
  const attempted=checkpointTwo(legacy,entries,stage,detour);
  assert.equal(attempted.completed[stage.id].bestTurns,3);
});
