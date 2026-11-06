import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateGateStage,initialGate,applyGate,replayGate,solveGate,gateSuccessors} from '../src/puzzle/gate-v2.js';
import {validateChallenge,evaluateChallenge} from '../src/puzzle/challenge-grade.js';
import {buildGateHints} from '../src/puzzle/gate-hints.js';
import {step} from '../src/engine.js';
const pack=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/gate-long-candidates-v1.json',import.meta.url),'utf8'));
const stage=pack.stages[0];

test('long gate stage is a separate candidate, not chapter-one or the 11-turn tutorial',()=>{
 assert.equal(pack.release,'experimental-unapproved');
 assert.equal(pack.saveWrites,false);
 assert.equal(stage.status,'candidate');
 assert.equal(stage.chapter.number,56);
 assert.equal(stage.rulesVersion,'solo-v2-gate');
 assert.equal(stage.stars.length,6);
 assert.equal(validateGateStage(stage),stage);
 assert.equal(initialGate(stage).gateOpen,false);
});
test('full gate-v2 BFS certifies minimum 16 and locked gate is proven unsolvable',()=>{
 const certified=validateChallenge(stage);
 assert.equal(certified.minimumTurns,16);
 const optimal=solveGate(stage,{maxNodes:140000,maxMs:30000});
 assert.equal(optimal.status,'solved',JSON.stringify(optimal));
 assert.equal(optimal.optimalTurns,certified.minimumTurns);
 assert.equal(stage.proof.length,certified.minimumTurns);
 assert.equal(replayGate(stage,stage.proof).cleared,true);
 const locked=solveGate(stage,{locked:true,maxNodes:140000,maxMs:30000});
 assert.equal(locked.status,'unsolvable','Budget result is NOT gate indispensability: '+JSON.stringify(locked));
 assert.equal(evaluateChallenge(stage,16).rank,'S');
 assert.equal(evaluateChallenge(stage,18).rank,'A');
 assert.equal(evaluateChallenge(stage,20).rank,'B');
});
test('switch is pressed on turn 8, and turn 9 traverses the open gate',()=>{
 let state=initialGate(stage);
 const pickups=[],toggles=[],crossings=[];
 let wallMoves=0;
 for(let i=0;i<stage.proof.length;i++){
  const action=stage.proof[i],previous=state;
  const options=gateSuccessors(stage,previous);
  assert.ok(options.some(option=>JSON.stringify(option.action)===JSON.stringify(action)),'legal action '+(i+1));
  state=applyGate(stage,previous,action);
  if(state.stars.length<previous.stars.length)pickups.push(i+1);
  if(state.gateOpen!==previous.gateOpen)toggles.push(i+1);
  if(action.prep.type==='wall')wallMoves++;
  const board={...stage.board};
  let pos=action.prep.type==='warp'?action.prep.to:previous.position;
  let passed=false;
  for(let n=0;n<stage.board.width*stage.board.height;n++){
   if(pos===state.position)break;
   const candidate=step(pos,action.dir,board);
   if(candidate===null)break;
   if(candidate===stage.gate.tile)passed=true;
   pos=candidate;
  }
  if(passed&&previous.gateOpen)crossings.push(i+1);
 }
 assert.deepEqual(pickups,[1,6,7,10,13,16]);
 assert.deepEqual(toggles,[8]);
 assert.deepEqual(crossings,[9]);
 assert.equal(wallMoves,8);
 assert.equal(state.stars.length,0);
 assert.equal(state.gateOpen,true);
 const hints=buildGateHints(stage);
 assert.equal(hints.length,4);
 assert.equal(hints[0].steps.length,0);
 assert.match(hints[1].body,/8手目/);
 assert.equal(hints[2].steps.length,8);
 assert.equal(hints[3].steps.length,16);
});
