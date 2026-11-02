import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {newChapterTwo,checkpointTwo,loadChapterTwo,writeChapterTwo} from '../src/puzzle/chapter-two-progress.js';
import {expeditionProgress,expeditionReward} from '../src/puzzle/expedition.js';
const entries=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/adventure-v1.json',import.meta.url))).stages;
test('20 genuine clears earn 20 crystals and light four stops; replay and Undo never pay twice',()=>{
 let save=newChapterTwo(),payments=0,lights=0;
 for(const [i,stage]of entries.entries()){
  const before=save;save=checkpointTwo(save,entries,stage,stage.proof);
  const reward=expeditionReward(entries,before,save,stage);payments+=reward.crystals;lights+=reward.newStops.length;
  assert.equal(reward.crystals,1);assert.equal(reward.progress.earned,i+1);assert.equal(reward.progress.balance,(i+1)%5);
  const undone=checkpointTwo(save,entries,stage,stage.proof.slice(0,-1));assert.deepEqual(expeditionProgress(entries,undone),expeditionProgress(entries,save));
  const repeated=checkpointTwo(undone,entries,stage,stage.proof);assert.equal(expeditionReward(entries,undone,repeated,stage).crystals,0);assert.equal(expeditionReward(entries,undone,repeated,stage).newStops.length,0);
 }
 assert.equal(payments,20);assert.equal(lights,4);assert.equal(expeditionProgress(entries,save).spent,20);assert.equal(expeditionProgress(entries,save).complete,true);
});
test('existing v1 saves restore rewards without migration, writes or modifying home currency',()=>{
 let save=newChapterTwo();for(const s of entries.slice(0,10))save=checkpointTwo(save,entries,s,s.proof);
 const raw=JSON.stringify(save),storage={getItem:()=>raw,setItem:()=>{throw Error('read must not write');}};
 const restored=loadChapterTwo(storage,entries);assert.equal(expeditionProgress(entries,restored).lit,2);assert.equal(storage.getItem(),raw);
});
test('free practice, missing predecessors and obsolete revisions do not award adventure lamps',()=>{
 let save=newChapterTwo();const last=entries.at(-1);save=checkpointTwo(save,entries,last,last.proof,{practice:true});
 assert.equal(expeditionProgress(entries,save,{practice:true}).earned,0);
 assert.equal(expeditionProgress(entries,save).earned,0);
 assert.equal(expeditionReward(entries,newChapterTwo(),save,last,{practice:true}).crystals,0);
 const first=entries[0];save.completed[first.id]={revision:first.revision-1};assert.equal(expeditionProgress(entries,save).earned,0);
});
