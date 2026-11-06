import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {describeMoveEffects} from '../src/puzzle/move-effects.js';
import {initialPuzzle} from '../src/puzzle/schema.js';
import {applyPuzzle} from '../src/puzzle/engine.js';
import {initialGate,applyGate} from '../src/puzzle/gate-v2.js';

const stages=name=>JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/'+name,import.meta.url),'utf8')).stages;

function playAndDescribe(stage){
 const gate=stage.rulesVersion==='solo-v2-gate';
 let state=gate?initialGate(stage):initialPuzzle(stage);
 const labels=[];
 for(const action of stage.proof){
  const previous=state;
  state=gate?applyGate(stage,state,action):applyPuzzle(stage,state,action);
  labels.push(...describeMoveEffects(previous,state,action));
 }
 return {state,labels};
}
test('item feedback describes only moves that actually use tools',()=>{
 const stage=stages('stage54-remix-candidates-v1.json')[0];
 const before=initialPuzzle(stage);
 const after=applyPuzzle(stage,before,stage.proof[0]);
 const beforeCopy=structuredClone(before);
 const afterCopy=structuredClone(after);
 const labels=describeMoveEffects(before,after,stage.proof[0]);
 assert.ok(labels.some(s=>s.includes('アイスを置いた')));
 assert.deepEqual(before,beforeCopy);
 assert.deepEqual(after,afterCopy);
});
test('actual solved paths show a star, gate transition, warp, and glove only when triggered',()=>{
 const stage=stages('stage70-finale-candidates-v1.json')[0];
 const {state,labels}=playAndDescribe(stage);
 assert.equal(state.stars.length,0);
 assert.ok(labels.some(s=>s.includes('星を')));
 assert.ok(labels.some(s=>s.includes('氷扉が開いた')));
 assert.ok(labels.some(s=>s.includes('ワープ成功')));
 assert.ok(labels.some(s=>s.includes('グローブ成功')));
 assert.ok(labels.some(s=>s.includes('アイスを置いた')));
 assert.ok(labels.every(s=>!s.includes('最短')));
});
test('no star, gate or item transition produces no celebration',()=>{
 const stage=stages('stage70-finale-candidates-v1.json')[0];
 const start=initialGate(stage);
 assert.deepEqual(describeMoveEffects(start,start,{prep:{type:'none'},dir:0}),[]);
});
test('invalid input is not converted into a misleading success animation',()=>{
 assert.throws(()=>describeMoveEffects(null,{stars:[]},{prep:{type:'none'}}),/require/);
 assert.throws(()=>describeMoveEffects({stars:[]},{stars:[]},null),/require/);
});
