import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newChapterTwo,checkpointTwo,validateChapterTwo,CHAPTER_TWO_KEY,practiceSaveKey} from '../src/puzzle/chapter-two-progress.js';
import {retryChapterTwoSave} from '../src/puzzle/chapter-two-save-retry.js';

const entries=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/adventure-v1.json',import.meta.url),'utf8')).stages;
function storage(initial=[]){
 const data=new Map(initial);
 return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
}

test('a failed final checkpoint can be retried without replaying the puzzle or losing the prior save',()=>{
 const stage=entries[0],saved=checkpointTwo(newChapterTwo(),entries,stage,stage.proof.slice(0,-1));
 const before=JSON.stringify(saved),store=storage([[CHAPTER_TWO_KEY,before]]);
 const complete=checkpointTwo(saved,entries,stage,stage.proof);
 let rejectWrites=true;
 const guarded={getItem:store.getItem,setItem:(key,value)=>{
  if(rejectWrites)throw Object.assign(new Error('Storage full'),{name:'QuotaExceededError'});
  store.setItem(key,value);
 }};
 assert.throws(()=>retryChapterTwoSave(guarded,entries,complete,before),/Storage full/);
 assert.equal(store.getItem(CHAPTER_TWO_KEY),before);
 rejectWrites=false;
 const result=retryChapterTwoSave(guarded,entries,complete,before);
 assert.equal(result.save.completed[stage.id].bestTurns,stage.challenge.minimumTurns);
 assert.equal(result.raw,store.getItem(CHAPTER_TWO_KEY));
 assert.notStrictEqual(result.save,complete);
 assert.deepEqual(validateChapterTwo(JSON.parse(result.raw),entries),complete);
});

test('retry never overwrites a saved record changed by another tab',()=>{
 const stage=entries[0],before=JSON.stringify(newChapterTwo());
 const current=checkpointTwo(newChapterTwo(),entries,stage,stage.proof);
 const different=JSON.stringify(checkpointTwo(newChapterTwo(),entries,stage,stage.proof.slice(0,-1)));
 const store=storage([[CHAPTER_TWO_KEY,different]]);
 let writes=0;
 const guarded={getItem:store.getItem,setItem:()=>{writes++;throw Error('Unexpected write');}};
 assert.throws(()=>retryChapterTwoSave(guarded,entries,current,before),e=>e.code==='SAVE_CHANGED');
 assert.equal(writes,0);
 assert.equal(store.getItem(CHAPTER_TWO_KEY),different);
 assert.throws(()=>retryChapterTwoSave(guarded,entries,current,17),/Invalid previous save/);
});

test('practice retry writes practice ledger only; adventure save remains byte-for-byte unchanged',()=>{
 const stage=entries.at(-1),opts={practice:true};
 const current=checkpointTwo(newChapterTwo(),entries,stage,stage.proof,opts);
 const adventure=JSON.stringify(newChapterTwo()),store=storage([[CHAPTER_TWO_KEY,adventure]]);
 const result=retryChapterTwoSave(store,entries,current,null,opts);
 assert.equal(store.getItem(practiceSaveKey),result.raw);
 assert.equal(store.getItem(CHAPTER_TWO_KEY),adventure);
 assert.equal(result.save.completed[stage.id].bestTurns,stage.challenge.minimumTurns);
});

test('retry rejects forged completions before any persistent write',()=>{
 const stage=entries[0];
 const bad={...newChapterTwo(),completed:{[stage.id]:{revision:stage.revision,bestTurns:stage.challenge.minimumTurns,proof:[]}}};
 const store=storage([[CHAPTER_TWO_KEY,null]]);
 let writes=0;
 assert.throws(()=>retryChapterTwoSave({
  getItem:store.getItem,setItem:()=>{writes++;}
 },entries,bad,null),/Invalid chapter-two completion/);
 assert.equal(writes,0);
});
