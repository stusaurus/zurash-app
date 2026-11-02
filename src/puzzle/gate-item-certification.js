// Item necessity in the full solo-v2-gate rules, not the solo-v1 shortcut.
// Exhausts all states with one item preparation forbidden; budget != proof.
import {initialGate,gateKey,gateSuccessors} from './gate-v2.js';
import {solved} from './engine.js';
const kinds={iceBlock:'ice',powerGlove:'glove',warpCrystal:'warp'};
export function verifyGateItemNecessity(stage,item,{maxNodes=180000,maxMs=60000}={}){
 const type=kinds[item];
 if(!type||!stage.inventory?.[item]||!Number.isInteger(maxNodes)||maxNodes<1||
  !Number.isFinite(maxMs)||maxMs<=0)throw Error('Invalid gate item necessity options');
 const started=performance.now(),root=initialGate(stage),queue=[root],seen=new Set([gateKey(root)]);
 let expanded=0,excluded=0;
 for(let cursor=0;cursor<queue.length;cursor++){
  if(performance.now()-started>=maxMs)
   return {status:'unverified',item,reason:'time',expanded,discovered:queue.length,excluded};
  expanded++;
  for(const successor of gateSuccessors(stage,queue[cursor])){
   if(successor.action.prep.type===type){excluded++;continue;}
   if(solved(successor.state))
    return {status:'optional',item,expanded,discovered:queue.length,excluded};
   const key=gateKey(successor.state);
   if(seen.has(key))continue;
   if(queue.length>=maxNodes)
    return {status:'unverified',item,reason:'nodes',expanded,discovered:queue.length,excluded};
   seen.add(key);queue.push(successor.state);
  }
 }
 return {status:'required',item,expanded,discovered:queue.length,excluded};
}
