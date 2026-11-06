import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {summarizeMoveHistory} from '../src/puzzle/move-history.js';
import {initialGate,applyGate} from '../src/puzzle/gate-v2.js';
import {initialPuzzle} from '../src/puzzle/schema.js';
import {applyPuzzle} from '../src/puzzle/engine.js';

function read(name){
 return JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/'+name,import.meta.url),'utf8')).stages;
}
const chapter=read('adventure-v1.json');
const remixes=read('stage54-remix-candidates-v1.json');
const finale=read('stage70-finale-candidates-v1.json');

test('journal starts empty and includes only the actual first move, not the solution',()=>{
 const stage=remixes[0];
 const empty=summarizeMoveHistory(stage,[]);
 assert.deepEqual(empty,{total:0,entries:[]});
 const first=summarizeMoveHistory(stage,stage.proof.slice(0,1));
 assert.equal(first.total,1);
 assert.equal(first.entries[0].turn,1);
 assert.match(first.entries[0].action,/アイス/);
 assert.match(first.entries[0].action,/下へ滑走/);
 assert.ok(first.entries[0].destination.includes('列'));
 assert.equal(first.entries.length,1);
});
test('long puzzles show the most recent five actions, correct star and gate changes, with no mutation',()=>{
 for(const stage of [chapter.find(s=>s.chapter.number===54),chapter.find(s=>s.chapter.number===57),remixes[0],remixes[1],...finale]){
  const before=JSON.stringify(stage);
  const gate=stage.rulesVersion==='solo-v2-gate';
  let state=gate?initialGate(stage):initialPuzzle(stage);
  let totalStars=0,totalSwitches=0;
  for(const action of stage.proof){
   const old=state;
   state=gate?applyGate(stage,state,action):applyPuzzle(stage,state,action);
   totalStars+=old.stars.length-state.stars.length;
   if(gate&&old.gateOpen!==state.gateOpen)totalSwitches++;
  }
  const full=summarizeMoveHistory(stage,stage.proof,{limit:50});
  const compact=summarizeMoveHistory(stage,stage.proof);
  assert.equal(full.total,stage.proof.length);
  assert.equal(compact.total,stage.proof.length);
  assert.deepEqual(compact.entries,full.entries.slice(-5));
  assert.equal(full.entries.reduce((n,e)=>n+e.stars,0),totalStars);
  assert.equal(totalStars,stage.stars.length);
  assert.equal(full.entries.filter(e=>e.gateChange!==null).length,totalSwitches);
  assert.ok(full.entries.every((row,i)=>row.turn===i+1));
  assert.ok(full.entries.every(row=>row.action.includes('滑走')));
  assert.equal(JSON.stringify(stage),before);
  assert.equal(state.stars.length,0);
 }
});
test('undo, stage reset and saved resume reconstruct the journal without any separate journal save',()=>{
 const stage=finale[0];
 const first=summarizeMoveHistory(stage,stage.proof.slice(0,4));
 const undone=summarizeMoveHistory(stage,stage.proof.slice(0,3));
 const resumed=summarizeMoveHistory(stage,structuredClone(stage.proof.slice(0,4)));
 assert.equal(first.total,4);
 assert.equal(undone.total,3);
 assert.deepEqual(first,resumed);
 assert.deepEqual(summarizeMoveHistory(stage,[]).entries,[]);
});
test('history refuses invalid limits and illegal moves instead of inventing descriptions',()=>{
 const stage=finale[0];
 assert.throws(()=>summarizeMoveHistory(stage,[],{limit:0}),/Invalid move-history/);
 assert.throws(()=>summarizeMoveHistory(stage,[],{limit:51}),/Invalid move-history/);
 assert.throws(()=>summarizeMoveHistory(stage,[{prep:{type:'none'},dir:99}]),/Invalid/);
});
