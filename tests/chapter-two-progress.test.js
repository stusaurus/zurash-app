import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {newChapterTwo,canEnterTwo,checkpointTwo,loadChapterTwo,writeChapterTwo,replayChapterTwo,CHAPTER_TWO_KEY} from '../src/puzzle/chapter-two-progress.js';
const entries=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/adventure-v1.json',import.meta.url))).stages;
test('sequential unlock, best rank, undo checkpoint and exact legal resume for mixed engines',()=>{
 let save=newChapterTwo();assert.equal(canEnterTwo(entries,save,1),false);
 for(const [i,stage]of entries.entries()){
  assert.equal(canEnterTwo(entries,save,i),true);
  const partial=stage.proof.slice(0,-1);save=checkpointTwo(save,entries,stage,partial);
  const storage=new Map();storage.setItem=storage.set.bind(storage);storage.getItem=k=>storage.get(k)??null;
  writeChapterTwo(storage,save);save=loadChapterTwo(storage,entries);
  assert.equal(replayChapterTwo(stage,save.active.actions).cleared,false);
  save=checkpointTwo(save,entries,stage,stage.proof);
  assert.equal(save.completed[stage.id].bestTurns,stage.challenge.minimumTurns);
  const count=Object.keys(save.completed).length;
  save=checkpointTwo(save,entries,stage,[]);assert.equal(Object.keys(save.completed).length,count);
 }
 assert.equal(Object.keys(save.completed).length,entries.length);
});
test('corrupt and future saves remain intact; impossible traces and forged unlocks rejected',()=>{
 for(const raw of ['{',JSON.stringify({version:2,completed:{},active:null}),JSON.stringify({version:1,completed:{},active:{id:entries[1].id,revision:1,actions:[]}})]){
 const storage={getItem:()=>raw,setItem:()=>{throw Error('must not write');}};assert.throws(()=>loadChapterTwo(storage,entries));assert.equal(storage.getItem(CHAPTER_TWO_KEY),raw);
 }
 assert.throws(()=>checkpointTwo(newChapterTwo(),entries,entries[1],[]),/locked/);
});
