// Exact counterfactual for standard solo-v1 rules. No heuristic pruning.
import {initialPuzzle} from './schema.js';
import {successors,solved,stateKey} from './engine.js';
export function verifyPreparationMandatory(stage,excludedType,{maxNodes=100000,maxMs=30000}={}){
 if(!['wall','ice','warp','glove'].includes(excludedType)||!Number.isInteger(maxNodes)||maxNodes<1||
  !Number.isFinite(maxMs)||maxMs<=0)throw Error('Invalid necessity test');
 const initial=initialPuzzle(stage),queue=[initial],keys=new Set([stateKey(initial)]);
 let expanded=0,excluded=0;
 const started=performance.now();
 for(let cursor=0;cursor<queue.length;cursor++){
  if(performance.now()-started>maxMs)return {status:'unverified',reason:'time',expanded,discovered:queue.length,excluded};
  expanded++;
  for(const next of successors(stage,queue[cursor])){
   if(next.action.prep.type===excludedType){excluded++;continue;}
   if(solved(next.state))return {status:'optional',expanded,discovered:queue.length,excluded};
   const key=stateKey(next.state);
   if(keys.has(key))continue;
   if(queue.length>=maxNodes)return {status:'unverified',reason:'nodes',expanded,discovered:queue.length,excluded};
   keys.add(key);queue.push(next.state);
  }
 }
 return {status:'required',expanded,discovered:queue.length,excluded};
}
