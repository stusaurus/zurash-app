// Item indispensability: exhaustive search with the item action forbidden.
// "required" only means ALL reachable non-item states were exhausted.
// A node/time budget never proves an item is required.
import {initialPuzzle} from './schema.js';
import {successors,solved,stateKey} from './engine.js';
const types={iceBlock:'ice',powerGlove:'glove',warpCrystal:'warp'};
export function verifyItemRequirement(stage,item,{maxNodes=120000,maxMs=35000}={}){
 const type=types[item];
 if(!type||!Number.isInteger(maxNodes)||maxNodes<1||!Number.isFinite(maxMs)||maxMs<=0)
  throw Error('Invalid item necessity check');
 if(!stage.inventory[item])throw Error('The tested item must be available in the stage');
 const started=performance.now(),root=initialPuzzle(stage),seen=new Set([stateKey(root)]),queue=[root];
 let expanded=0;
 for(let i=0;i<queue.length;i++){
  if(performance.now()-started>=maxMs)return {item,status:'unverified',reason:'time',expanded,discovered:queue.length};
  expanded++;
  for(const successor of successors(stage,queue[i])){
   if(successor.action.prep.type===type)continue;
   if(solved(successor.state))return {item,status:'optional',expanded,discovered:queue.length};
   const key=stateKey(successor.state);
   if(seen.has(key))continue;
   if(queue.length>=maxNodes)return {item,status:'unverified',reason:'nodes',expanded,discovered:queue.length};
   seen.add(key);queue.push(successor.state);
  }
 }
 return {item,status:'required',expanded,discovered:queue.length};
}
