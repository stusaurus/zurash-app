import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {solveGate,replayGate,initialGate,applyGate} from '../src/puzzle/gate-v2.js';
import {verifyGateItemNecessity} from '../src/puzzle/gate-item-certification.js';
import {buildGateHints} from '../src/puzzle/gate-hints.js';
const stage=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/gate-glove-candidates-v1.json',import.meta.url))).stages[0];
test('stage60 minimum 17, legal replay and four hints',()=>{
 const r=solveGate(stage);assert.equal(r.status,'solved');assert.equal(r.optimalTurns,17);
 assert.equal(replayGate(stage,stage.proof).cleared,true);assert.equal(buildGateHints(stage).length,4);
});
test('stage60 glove is required to OPEN gate, as well as to clear',()=>{
 for(const goal of ['open','clear'])assert.equal(verifyGateItemNecessity(stage,'powerGlove',{goal}).status,'required');
 assert.equal(solveGate(stage,{locked:true}).status,'unsolvable');
 assert.equal(verifyGateItemNecessity(stage,'powerGlove',{goal:'open',maxNodes:1}).status,'unverified');
});
test('stage60 uses glove on turn3 then toggles three times; wall planning remains meaningful',()=>{
 let s=initialGate(stage),toggles=[],gloves=[],walls=0;
 stage.proof.forEach((a,i)=>{const old=s;s=applyGate(stage,s,a);if(s.gateOpen!==old.gateOpen)toggles.push(i+1);if(a.prep.type==='glove')gloves.push(i+1);if(a.prep.type==='wall')walls++;});
 assert.deepEqual(gloves,[3]);assert.deepEqual(toggles,[6,8,10]);assert.equal(walls,7);
});
