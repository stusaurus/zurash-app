import test from 'node:test';
import assert from 'node:assert/strict';
import {validateStage,initialPuzzle} from '../src/puzzle/schema.js';
import {applyPuzzle,successors,replay,stateKey} from '../src/puzzle/engine.js';
import {solve} from '../src/puzzle/solver.js';
import {generateCandidate,exactFingerprint,symmetryFingerprint} from '../scripts/puzzle-generation.js';
import {createCatalog,sha256} from '../src/puzzle/catalog.js';
import {newProgress,recordClear,completePuzzle,buildTown,balance,saveProgress,loadProgress} from '../src/puzzle/progress.js';
const stage=patch=>({schemaVersion:1,rulesVersion:'solo-v1',id:'pz-000001',revision:1,status:'candidate',board:{width:4,height:4},start:0,walls:[],stars:[3],fixed:[],iceSockets:[],portals:[],inventory:{iceBlock:0,powerGlove:0,warpCrystal:0},goal:{type:'collect-all'},...patch});
test('solo collects at the stopping cell, never on passage',()=>{
  const p=stage({stars:[1,3]});const n=applyPuzzle(p,initialPuzzle(p),{prep:{type:'none'},dir:1});
  assert.deepEqual(n.stars,[1]);assert.equal(n.position,3);
});
test('wall shifts exactly one cardinal cell, then a mandatory slide',()=>{
  const p=stage({walls:[7],stars:[2]});const before=initialPuzzle(p);
  const n=applyPuzzle(p,before,{prep:{type:'wall',from:7,to:3},dir:1});
  assert.deepEqual(n.stars,[]);assert.deepEqual(before.walls,[7]);
  assert.deepEqual(applyPuzzle(p,before,{dir:1,prep:{to:3,type:'wall',from:7}}),n);
  for(const prep of [{type:'wall',from:7,to:2},{type:'wall',from:7,to:6},{type:'wall',from:7,to:15}]) {
    if(prep.to===6)continue; // A legal left shift, unlike the other two.
    assert.throws(()=>applyPuzzle(p,before,{prep,dir:1}));
  }
  assert.throws(()=>applyPuzzle(p,before,{prep:{type:'none'},dir:0}));
});
test('ice socket, glove and crystal execute and consume one charge',()=>{
  const ice=stage({stars:[2],iceSockets:[3],inventory:{iceBlock:1,powerGlove:0,warpCrystal:0}});
  const i=applyPuzzle(ice,initialPuzzle(ice),{prep:{type:'ice',to:3},dir:1});
  assert.deepEqual(i.ice,[3]);assert.equal(i.inventory.iceBlock,0);assert.deepEqual(i.stars,[]);
  const glove=stage({walls:[11],stars:[2],inventory:{iceBlock:0,powerGlove:1,warpCrystal:0}});
  const g=applyPuzzle(glove,initialPuzzle(glove),{prep:{type:'glove',from:11,to:3},dir:1});
  assert.equal(g.inventory.powerGlove,0);assert.deepEqual(g.walls,[3]);assert.deepEqual(g.stars,[]);
  const warp=stage({stars:[15],portals:[[3,12]],inventory:{iceBlock:0,powerGlove:0,warpCrystal:1}});
  const result=replay(warp,[{prep:{type:'none'},dir:1},{prep:{type:'warp',to:12},dir:1}]);
  assert.ok(result.cleared);assert.equal(result.state.inventory.warpCrystal,0);
  assert.throws(()=>applyPuzzle(warp,initialPuzzle(warp),{prep:{type:'warp',to:12},dir:1}));
});
test('glove cannot jump a wall, star or hole, nor be used with no charge',()=>{
  for(const patch of [{fixed:[7]},{stars:[2,7]},{board:{width:4,height:4,playableCells:Array.from({length:16},(_,i)=>i).filter(i=>i!==7)}}]) {
    const p=stage({walls:[11],stars:[2],inventory:{iceBlock:0,powerGlove:1,warpCrystal:0},...patch});
    assert.throws(()=>applyPuzzle(p,initialPuzzle(p),{prep:{type:'glove',from:11,to:3},dir:1}));
  }
  const p=stage({walls:[11],stars:[2]});assert.throws(()=>applyPuzzle(p,initialPuzzle(p),{prep:{type:'glove',from:11,to:3},dir:1}));
});
test('rectangle and holes stop slides at the mask boundary',()=>{
  const p=stage({board:{width:5,height:3,playableCells:[0,1,2,5,6,7,10,11,12]},stars:[2]});
  assert.equal(applyPuzzle(p,initialPuzzle(p),{prep:{type:'none'},dir:1}).position,2);
});
test('validation rejects overlaps, malformed masks, unsupported versions and effects',()=>{
  for(const patch of [{walls:[3]},{stars:[99]},{board:{width:17,height:4}},{board:{width:4,height:4,playableCells:[0,0]}},{rulesVersion:'future'},{inventory:{iceBlock:0,powerGlove:0,warpCrystal:0,unknown:1}},{goal:{type:'escape'}},{portals:[[1,1]]}]) assert.throws(()=>validateStage(stage(patch)));
});
test('BFS shortest certificate, exhaustive impossible and budget remain distinct',()=>{
  const one=solve(stage({walls:[7],stars:[2]}));assert.equal(one.status,'solved');assert.equal(one.optimalTurns,1);assert.ok(replay(stage({walls:[7],stars:[2]}),one.actions).cleared);
  assert.equal(solve(stage({stars:[5]})).status,'unsolvable');
  assert.equal(solve(stage({stars:[15]}),{maxNodes:1}).status,'budget');
  assert.throws(()=>solve(stage(),{maxNodes:0}));
  assert.throws(()=>replay(stage(),[{prep:{type:'none'},dir:1},{prep:{type:'none'},dir:2}]));
});
test('generator deterministic; legal successors replay identically and do not mutate',()=>{
  for(let k=0;k<100;k++) {
    const p=generateCandidate(k);assert.deepEqual(p,generateCandidate(k));
    const s=initialPuzzle(p),before=structuredClone(s);
    for(const {action,state}of successors(p,s))assert.deepEqual(applyPuzzle(p,s,action),state);
    assert.deepEqual(s,before);
  }
});
test('10,000 candidates reserve enough cells even on small mixed-item T boards',()=>{
  for(let k=0;k<10000;k++)validateStage(generateCandidate(k));
});
test('identity ignores wall labels but includes inventory and permanent ice',()=>{
  const s=initialPuzzle(stage({walls:[5,6]}));assert.equal(stateKey(s),stateKey({...s,walls:[6,5]}));
  assert.notEqual(stateKey(s),stateKey({...s,ice:[9]}));assert.notEqual(stateKey(s),stateKey({...s,inventory:{...s.inventory,iceBlock:1}}));
});
test('duplicate detection ignores ids and normalizes rotation/reflection',()=>{
  const a=stage({walls:[5],stars:[3]});
  const b=stage({id:'pz-000002',start:3,walls:[6],stars:[0]});
  assert.notEqual(exactFingerprint(a),exactFingerprint(b));assert.equal(symmetryFingerprint(a),symmetryFingerprint(b));
  assert.equal(exactFingerprint(a),exactFingerprint({...a,id:'pz-000099'}));
});
test('chunk loading: integrity, candidate gate, parallel dedupe and LRU eviction',async()=>{
  const chunks=Array.from({length:4},(_,i)=>JSON.stringify([stage({id:`pz-${String(i+1).padStart(6,'0')}`})]));
  const manifest={version:1,count:4,chunks:await Promise.all(chunks.map(async(text,i)=>({first:i+1,last:i+1,count:1,path:`chunks/${i}.json`,sha256:await sha256(text)})))};
  let reads=0;const loader=async path=>{reads++;return chunks[Number(path.match(/(\d+)/)[1])];};
  const catalog=createCatalog(manifest,loader,{maxCachedChunks:2,allowCandidates:true});
  await Promise.all([catalog.get(1),catalog.get(1)]);assert.equal(reads,1);
  await catalog.get(2);await catalog.get(3);assert.equal(catalog.cacheSize(),2);await catalog.get(1);assert.equal(reads,4);
  await assert.rejects(()=>catalog.get(0));
  await assert.rejects(()=>createCatalog(manifest,loader).get(1),/Candidate/);
  await assert.rejects(()=>createCatalog(manifest,async()=>chunks[0]+' ').get(1),/integrity/);
  let tries=0;const retry=createCatalog(manifest,async()=>{if(!tries++)throw Error('offline');return chunks[0];},{allowCandidates:true});
  await assert.rejects(()=>retry.get(1));assert.equal((await retry.get(1)).id,'pz-000001');
});
test('progress survives reload, replay and revision without duplicate stars',()=>{
  const p=stage({status:'approved'});let s=recordClear(newProgress(),p,5);
  s=recordClear(s,{...p,revision:2},3);assert.equal(balance(s),1);assert.equal(s.completed[p.id].bestTurns,3);
  s=buildTown(s,'first-house',1);assert.equal(balance(s),0);assert.deepEqual(buildTown(s,'first-house',1),s);
  assert.throws(()=>buildTown(s,'second-house',1));assert.throws(()=>recordClear(s,stage(),4));
  const storage={value:null,setItem(k,v){this.value=v;},getItem(){return this.value;}};
  saveProgress(storage,s);assert.deepEqual(loadProgress(storage),s);
  storage.value='{bad';assert.throws(()=>loadProgress(storage));
  assert.throws(()=>saveProgress({setItem(){throw Error('quota');}},s),/quota/);
  const revised=recordClear(s,{...p,revision:3},8);assert.equal(revised.completed[p.id].bestTurns,8);assert.equal(balance(revised),0);
  assert.throws(()=>recordClear(revised,p,1),/Outdated/);
  assert.equal(balance(completePuzzle(newProgress(),p,[{prep:{type:'none'},dir:1}])),1);
  assert.throws(()=>completePuzzle(newProgress(),p,[{prep:{type:'none'},dir:2}]),/not cleared/);
});
