import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {newChapterTwo,canEnterTwo,checkpointTwo,loadChapterTwo,writeChapterTwo,replayChapterTwo,CHAPTER_TWO_KEY,practiceSaveKey,recoverInvalidChapterTwo} from '../src/puzzle/chapter-two-progress.js';
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
test('free practice permits direct stage70 without unlocking or overwriting adventure progress',()=>{
 const stage=entries.at(-1),options={practice:true},storage=new Map();storage.setItem=storage.set.bind(storage);storage.getItem=k=>storage.get(k)??null;
 const adventure=newChapterTwo();writeChapterTwo(storage,adventure);
 const practice=checkpointTwo(newChapterTwo(),entries,stage,stage.proof,options);writeChapterTwo(storage,practice,options);
 assert.equal(loadChapterTwo(storage,entries,options).completed[stage.id].bestTurns,stage.challenge.minimumTurns);
 assert.deepEqual(loadChapterTwo(storage,entries),adventure);assert.equal(canEnterTwo(entries,adventure,entries.length-1),false);
});

test('invalid version is backed up before a user-authorized new save; chapter one untouched',()=>{
 const storage=new Map([
 [CHAPTER_TWO_KEY,'{"version":999,"future":"preserve all bytes"}'],
 ['zurash-app:home-preview:ice-town:v2','chapter-one-intact']
 ]);
 storage.getItem=k=>storage.get(k)??null;storage.setItem=storage.set.bind(storage);
 const result=recoverInvalidChapterTwo(storage,entries);
 assert.equal(result.save.version,1);
 assert.deepEqual(loadChapterTwo(storage,entries),newChapterTwo());
 assert.equal(storage.getItem(result.backupKey),'{"version":999,"future":"preserve all bytes"}');
 assert.equal(storage.getItem('zurash-app:home-preview:ice-town:v2'),'chapter-one-intact');
 assert.throws(()=>recoverInvalidChapterTwo(storage,entries),/valid/);
});
test('practice recovery never modifies adventure save; backups never collide',()=>{
 const data='not-valid-json',storage=new Map([[practiceSaveKey,data],[CHAPTER_TWO_KEY,JSON.stringify(newChapterTwo())]]);
 storage.getItem=k=>storage.get(k)??null;storage.setItem=storage.set.bind(storage);
 const first=recoverInvalidChapterTwo(storage,entries,{practice:true});
 assert.equal(storage.getItem(first.backupKey),data);
 assert.equal(storage.getItem(CHAPTER_TWO_KEY),JSON.stringify(newChapterTwo()));
 storage.setItem(practiceSaveKey,'{"version":3}');
 const second=recoverInvalidChapterTwo(storage,entries,{practice:true});
 assert.notEqual(first.backupKey,second.backupKey);
 assert.equal(storage.getItem(second.backupKey),'{"version":3}');
 assert.equal(storage.getItem(first.backupKey),data);
});
test('backup storage failure preserves corrupted record and never overwrites it',()=>{
 const old='{"version":3}',stored=new Map([[CHAPTER_TWO_KEY,old]]);
 const storage={getItem:k=>stored.get(k)??null,setItem:(key,value)=>{
  if(key!==CHAPTER_TWO_KEY)throw Error('Storage is full');
  stored.set(key,value);
 }};
 assert.throws(()=>recoverInvalidChapterTwo(storage,entries),/full/);
 assert.equal(storage.getItem(CHAPTER_TWO_KEY),old);
});
