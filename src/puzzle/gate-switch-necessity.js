import {initialGate,gateSuccessors,gateKey} from './gate-v2.js';
import {solved} from './engine.js';
// Exhaustive reachability under a strict switch budget. Budget != impossibility proof.
export function verifySwitchLimit(stage,{maxSwitches=2,maxNodes=120000,maxMs=30000}={}){
 if(!Number.isInteger(maxSwitches)||maxSwitches<0||maxSwitches>10||
 !Number.isInteger(maxNodes)||maxNodes<1||!Number.isFinite(maxMs)||maxMs<=0)
  throw Error('Invalid switch-limit options');
 const root=initialGate(stage),queue=[{state:root,count:0}],seen=new Set([gateKey(root)+'#0']);
 const started=performance.now();let expanded=0;
 for(let i=0;i<queue.length;i++){
  if(performance.now()-started>=maxMs)return {status:'unverified',reason:'time',expanded,discovered:queue.length};
  const cur=queue[i];expanded++;
  for(const next of gateSuccessors(stage,cur.state)){
   const count=cur.count+Number(next.state.gateOpen!==cur.state.gateOpen);
   if(count>maxSwitches)continue;
   if(solved(next.state))return {status:'possible',expanded,discovered:queue.length,switches:count};
   const key=gateKey(next.state)+'#'+count;
   if(seen.has(key))continue;
   if(queue.length>=maxNodes)return {status:'unverified',reason:'nodes',expanded,discovered:queue.length};
   seen.add(key);queue.push({state:next.state,count});
  }
 }
 return {status:'required-more',expanded,discovered:queue.length,minRequired:maxSwitches+1};
}
// Counterfactual: once opened, the gate never closes, even if the switch is hit again.
// This model demonstrates whether forced re-closing *helps*, not current game legality.
export function solveGateStickyOpen(stage,{maxNodes=120000,maxMs=30000}={}){
 if(!Number.isInteger(maxNodes)||maxNodes<1||!Number.isFinite(maxMs)||maxMs<=0)throw Error('Invalid search budget');
 const root=initialGate(stage),queue=[{state:root,depth:0}],seen=new Set([gateKey(root)]),started=performance.now();let expanded=0;
 for(let i=0;i<queue.length;i++){
  if(performance.now()-started>=maxMs)return {status:'budget',reason:'time',expanded,discovered:queue.length};
  const cur=queue[i];expanded++;
  for(const next of gateSuccessors(stage,cur.state)){
   const state={...next.state,gateOpen:cur.state.gateOpen||next.state.gateOpen};
   if(solved(state))return {status:'solved',optimalTurns:cur.depth+1,expanded,discovered:queue.length};
   const key=gateKey(state);
   if(seen.has(key))continue;
   if(queue.length>=maxNodes)return {status:'budget',reason:'nodes',expanded,discovered:queue.length};
   seen.add(key);queue.push({state,depth:cur.depth+1});
  }
 }
 return {status:'unsolvable',expanded,discovered:queue.length};
}
