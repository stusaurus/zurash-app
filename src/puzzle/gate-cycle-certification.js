// Exhaustive, counted switch search for research-only solo-v2-gate stages.
// A search budget is NOT evidence that a gate requires extra toggles.
import {initialGate,gateKey,gateSuccessors} from './gate-v2.js';
import {solved} from './engine.js';

export function verifySwitchMinimum(stage,{maxSwitches=2,maxNodes=180000,maxMs=40000}={}){
 if(!Number.isInteger(maxSwitches)||maxSwitches<0||
    !Number.isInteger(maxNodes)||maxNodes<1||!Number.isFinite(maxMs)||maxMs<=0)
  throw Error('Invalid gate switch search budget');
 const started=performance.now();
 const initial=initialGate(stage);
 const queue=[{state:initial,count:0}],seen=new Set([gateKey(initial)+'|0']);
 let expanded=0;
 for(let cursor=0;cursor<queue.length;cursor++){
  if(performance.now()-started>=maxMs)
   return {status:'unverified',reason:'time',maxSwitches,expanded,discovered:queue.length};
  expanded++;
  const {state,count}=queue[cursor];
  for(const next of gateSuccessors(stage,state)){
   const nextCount=count+Number(state.gateOpen!==next.state.gateOpen);
   if(nextCount>maxSwitches)continue;
   if(solved(next.state))
    return {status:'possible',maxSwitches,usedSwitches:nextCount,expanded,discovered:queue.length};
   const key=gateKey(next.state)+'|'+nextCount;
   if(seen.has(key))continue;
   if(queue.length>=maxNodes)
    return {status:'unverified',reason:'nodes',maxSwitches,expanded,discovered:queue.length};
   seen.add(key);queue.push({state:next.state,count:nextCount});
  }
 }
 return {status:'required-more',maxSwitches,expanded,discovered:queue.length};
}
