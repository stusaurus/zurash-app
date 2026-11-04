import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {tapLanding,ambiguousTapCells} from '../src/puzzle/tap-landing.js';
import {initialPuzzle} from '../src/puzzle/schema.js';
import {initialGate,gateSuccessors,applyGate} from '../src/puzzle/gate-v2.js';
import {successors,applyPuzzle,solved} from '../src/puzzle/engine.js';
const opt=(dir,cell,stars)=>({action:{prep:{type:'none'},dir},state:{position:cell,stars,walls:[],inventory:{iceBlock:0,powerGlove:0,warpCrystal:0}}});
test('duplicate directions ending in same outcome are safely tappable',()=>{
 const options=[opt(0,12,[3]),opt(1,12,[3])];
 const result=tapLanding(options,{type:'none'},12);
 assert.equal(result.kind,'move');
 assert.deepEqual(result.action,options[0].action);
 assert.equal(ambiguousTapCells(options,{type:'none'}).size,0);
 assert.equal(tapLanding(options,{type:'wall'},12),null);
});
test('different outcomes on same tile require explicit direction',()=>{
 const options=[opt(0,12,[3]),opt(1,12,[])];
 const before=JSON.stringify(options);
 const result=tapLanding(options,{type:'none'},12);
 assert.equal(result.kind,'direction-required');
 assert.deepEqual(result.directions,[0,1]);
 assert.deepEqual([...ambiguousTapCells(options,{type:'none'})],[12]);
 assert.equal(JSON.stringify(options),before);
});
test('all 20 chapter-two proof paths remain tappable or have explicit direction fallback',()=>{
 const stages=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/adventure-v1.json',import.meta.url),'utf8')).stages;
 assert.equal(stages.length,20);
 let steps=0,checkedLegalActions=0,ambiguousLandingActions=0;
 for(const stage of stages){
  const gate=stage.rulesVersion==='solo-v2-gate';
  let state=gate?initialGate(stage):initialPuzzle(stage);
  for(const action of stage.proof){
   const options=gate?gateSuccessors(stage,state):successors(stage,state);
   // Every legal action at each visited state must remain available through
   // a tap (same resulting state) OR a fallback direction. A shortest proof
   // alone would miss inaccessible alternatives and Undo/retry strategies.
   for(const option of options){
    const hit=tapLanding(options,option.action.prep,option.state.position);
    assert.ok(hit,stage.id+' missing legal landing');
    if(hit.kind==='direction-required'){
     ambiguousLandingActions++;
     assert.ok(hit.directions.includes(option.action.dir),stage.id+' fallback direction missing');
    }else{
     assert.equal(hit.kind,'move');
     assert.deepEqual(
      gate?applyGate(stage,state,hit.action):applyPuzzle(stage,state,hit.action),
      option.state,stage.id+' alternate legal action state changed'
     );
    }
    checkedLegalActions++;
   }
   const next=gate?applyGate(stage,state,action):applyPuzzle(stage,state,action);
   const tap=tapLanding(options,action.prep,next.position);
   assert.ok(tap,stage.id+' proof landing has no tap');
   if(tap.kind==='move'){
    const tapped=gate?applyGate(stage,state,tap.action):applyPuzzle(stage,state,tap.action);
    assert.deepEqual(tapped,next,stage.id+' landing tap must have identical effect');
   }else{
    assert.equal(tap.kind,'direction-required');
    assert.ok(tap.directions.includes(action.dir));
   }
   state=next;steps++;
  }
  assert.ok(solved(state),stage.id+' proof is not solved');
 }
 assert.ok(steps>=100);
 assert.ok(checkedLegalActions>=steps);
 assert.ok(ambiguousLandingActions>=0);
 console.info('Tap audit: '+steps+' verified solution turns; '+checkedLegalActions+' legal actions at their visited states; '+ambiguousLandingActions+' need explicit direction.');
});
