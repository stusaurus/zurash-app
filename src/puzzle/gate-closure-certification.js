// Counterfactual exhaustive searches for a research-only solo-v2-gate stage.
// This reuses the official gateSuccessors and legal slides; it does not modify the game engine.
import {step} from '../engine.js';
import {initialGate,gateSuccessors,gateKey} from './gate-v2.js';
import {solved} from './engine.js';

const modes=new Set(['latch-open','forbid-reclosed-stop']);
export function verifyGateClosure(stage,{mode,maxNodes=160000,maxMs=60000}={}){
 if(!modes.has(mode)||!Number.isInteger(maxNodes)||maxNodes<1||
    !Number.isFinite(maxMs)||maxMs<=0)throw Error('Invalid gate closure certification options');
 const started=performance.now(),initial=initialGate(stage);
 const queue=[{state:initial,opened:false}],seen=new Set([gateKey(initial)+'|0']);
 let expanded=0,excluded=0;
 for(let cursor=0;cursor<queue.length;cursor++){
  if(performance.now()-started>=maxMs)
   return {status:'unverified',reason:'time',mode,expanded,discovered:queue.length,excluded};
  expanded++;
  const {state,opened}=queue[cursor];
  for(const next of gateSuccessors(stage,state)){
   // A gate which opened once is artificially locked OPEN afterwards.
   // Original successors are already computed with the gate's pre-slide state.
   // Their post-slide switch closure can be suppressed without changing the slide.
   if(mode==='forbid-reclosed-stop'&&opened&&!state.gateOpen&&
      step(next.state.position,next.action.dir,stage.board)===stage.gate.tile){
    excluded++;
    continue;
   }
   const successor=mode==='latch-open'
    ? {...next.state,gateOpen:state.gateOpen||next.state.gateOpen}
    : next.state;
   if(solved(successor))
    return {status:'possible',mode,expanded,discovered:queue.length,excluded};
   const hasOpened=opened||successor.gateOpen;
   const key=gateKey(successor)+'|'+(mode==='forbid-reclosed-stop'&&hasOpened?'1':'0');
   if(seen.has(key))continue;
   if(queue.length>=maxNodes)
    return {status:'unverified',reason:'nodes',mode,expanded,discovered:queue.length,excluded};
   seen.add(key);queue.push({state:successor,opened:hasOpened});
  }
 }
 return {status:'unsolvable',mode,expanded,discovered:queue.length,excluded};
}
