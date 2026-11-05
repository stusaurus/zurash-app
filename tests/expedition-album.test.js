import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newChapterTwo,checkpointTwo,validateChapterTwo} from '../src/puzzle/chapter-two-progress.js';
import {expeditionAlbum} from '../src/puzzle/expedition-album.js';
const entries=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/adventure-v1.json',import.meta.url),'utf8')).stages;
function clearFirst(n){
 let save=newChapterTwo();
 for(const s of entries.slice(0,n))save=checkpointTwo(save,entries,s,s.proof);
 return validateChapterTwo(save,entries);
}
test('the fresh adventure provides only a legal first-stage target, without future story spoilers',()=>{
 const album=expeditionAlbum(entries,newChapterTwo());
 assert.deepEqual([album.completed,album.earned,album.lit,album.sRanks,album.complete],[0,0,0,0,false]);
 assert.deepEqual(album.milestones.map(s=>s.cleared),[0,0,0,0]);
 assert.equal(album.milestones[0].nextStage,51);
 assert.equal(album.milestones[0].nextAction,'続きを遊ぶ');
 assert.equal(album.milestones[1].nextStage,null);
 assert.ok(album.milestones.every(s=>s.story===null));
});
test('the first genuine clear unlocks the next move without writing saves or showing future memories',()=>{
 const save=clearFirst(1),before=JSON.stringify(save);
 const album=expeditionAlbum(entries,save);
 assert.equal(album.sRanks,1);
 assert.equal(album.milestones[0].cleared,1);
 assert.equal(album.milestones[0].sRanks,1);
 assert.equal(album.milestones[0].nextStage,52);
 assert.equal(album.milestones[1].nextStage,null);
 assert.ok(album.milestones.every(m=>!m.lit&&!m.story));
 assert.equal(JSON.stringify(save),before);
});
test('five cleared stages reveal exactly one earned story and keep next playable target legal',()=>{
 const save=clearFirst(5),album=expeditionAlbum(entries,save);
 assert.equal(album.completed,5);
 assert.equal(album.lit,1);
 assert.equal(album.milestones[0].sRanks,5);
 assert.match(album.milestones[0].story,/雪の向こうに/);
 assert.equal(album.milestones[0].nextStage,51);
 assert.equal(album.milestones[0].nextAction,'もう一度遊ぶ');
 assert.equal(album.milestones[1].nextStage,56);
 assert.equal(album.milestones[1].nextAction,'続きを遊ぶ');
 assert.equal(album.milestones[1].story,null);
});
test('all twenty genuine clears yield four earned stories and S-rank replay routes',()=>{
 const save=clearFirst(20),original=JSON.stringify(save);
 const album=expeditionAlbum(entries,save);
 assert.equal(album.completed,20);
 assert.equal(album.complete,true);
 assert.equal(album.sRanks,20);
 assert.equal(album.lit,4);
 assert.deepEqual(album.milestones.map(m=>m.nextStage),[51,56,61,66]);
 assert.ok(album.milestones.every(m=>m.lit&&m.story&&m.sRanks===5&&m.nextAction==='もう一度遊ぶ'));
 assert.equal(JSON.stringify(save),original);
});
test('a non-S clear is prioritized for replay, without changing the actual reward ledger',()=>{
 const save=clearFirst(20),sample=entries[8];
 const modified=structuredClone(save);
 modified.completed[sample.id].bestTurns=sample.challenge.minimumTurns+1;
 const album=expeditionAlbum(entries,modified);
 assert.equal(album.sRanks,19);
 assert.equal(album.milestones[1].sRanks,4);
 assert.equal(album.milestones[1].nextStage,sample.chapter.number);
 assert.equal(album.milestones[1].nextAction,'Sランクに再挑戦');
 assert.equal(album.earned,20);
});
test('practice comparison data and obsolete revisions cannot create false album rewards',()=>{
 const save=clearFirst(20),practice=expeditionAlbum(entries,save,{practice:true});
 assert.equal(practice.earned,0);
 assert.equal(practice.lit,0);
 assert.equal(practice.sRanks,0);
 assert.ok(practice.milestones.every(s=>s.story===null));
 const obsolete=structuredClone(save);
 obsolete.completed[entries[0].id].revision=entries[0].revision-1;
 const view=expeditionAlbum(entries,obsolete);
 assert.equal(view.earned,0);
 assert.equal(view.milestones[0].nextStage,51);
 assert.equal(view.milestones[0].sRanks,0);
 assert.throws(()=>expeditionAlbum([],newChapterTwo()),/Invalid chapter-two album/);
});
