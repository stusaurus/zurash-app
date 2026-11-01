// Isolated Chapter 2 switch-gate mechanics. Never mutate solo-v1 stages.
// A tile gate is impassable while closed. Landing on its paired switch toggles it.
// No movable wall can occupy the gate or switch. A gate never closes on its occupant.
import {validateStage,initialPuzzle} from './schema.js';
import {successors,applyPuzzle,solved,stateKey} from './engine.js';
const fail=message=>{throw Error('Invalid gate puzzle: '+message);};
export function validateGateStage(stage){
 if(!stage||stage.rulesVersion!=='solo-v2-gate'||stage.schemaVersion!==2)fail('version');
 const base={...stage,rulesVersion:'solo-v1',schemaVersion:1};
 validateStage(base);
 const tile=stage.gate?.tile,sw=stage.gate?.switch;
 if(!Number.isInteger(tile)||!Number.isInteger(sw)||tile===sw)fail('tiles');
 const mask=new Set(stage.board.playableCells??Array.from({length:stage.board.width*stage.board.height},(_,i)=>i));
 if(!mask.has(tile)||!mask.has(sw))fail('unplayable');
 const occupied=new Set([stage.start,...stage.walls,...stage.fixed,...stage.stars,...stage.iceSockets,...stage.portals.flat()]);
 if(occupied.has(tile)||occupied.has(sw))fail('gate overlaps');
 if(stage.gate.initialOpen!==false)fail('starting gate must be closed');
 return stage;
}
function virtualStage(stage,open,locked=false){
 return {...stage,schemaVersion:1,rulesVersion:'solo-v1',
  fixed:open&&!locked?[...stage.fixed]:[...stage.fixed,stage.gate.tile]};
}
export function initialGate(stage){
 validateGateStage(stage);
 return {...initialPuzzle(virtualStage(stage,false)),gateOpen:false};
}
export const gateKey=s=>stateKey(s)+'|'+(s.gateOpen?'1':'0');
export function gateSuccessors(stage,s,{locked=false}={}){
 if(solved(s))return [];
 const base=virtualStage(stage,s.gateOpen,locked),out=[];
 for(const next of successors(base,s)){
  const prep=next.action.prep;
  if(['wall','glove','ice'].includes(prep.type)&&[stage.gate.tile,stage.gate.switch].includes(prep.to))continue;
  const toggles=!locked&&next.state.position===stage.gate.switch;
  const afterOpen=locked?false:toggles?!s.gateOpen:s.gateOpen;
  if(!afterOpen&&(next.state.walls.includes(stage.gate.tile)||next.state.ice.includes(stage.gate.tile)||next.state.position===stage.gate.tile))continue;
  out.push({action:next.action,state:{...next.state,gateOpen:afterOpen}});
 }
 return out;
}
export function applyGate(stage,s,action){
 const available=gateSuccessors(stage,s);
 const next=available.find(x=>JSON.stringify(x.action)===JSON.stringify(action));
 if(!next)throw Error('Invalid gate action');
 return structuredClone(next.state);
}
export function replayGate(stage,actions){
 let state=initialGate(stage);
 for(const action of actions)state=applyGate(stage,state,action);
 return {state,cleared:solved(state)};
}
export function solveGate(stage,{maxNodes=100000,maxMs=30000,locked=false}={}){
 const started=performance.now(),root=initialGate(stage);
 const nodes=[{state:root,parent:-1,action:null,depth:0}],seen=new Set([gateKey(root)]);
 let expanded=0;
 for(let cursor=0;cursor<nodes.length;cursor++){
  if(performance.now()-started>=maxMs)return {status:'budget',reason:'time',expanded,discovered:nodes.length};
  const node=nodes[cursor];expanded++;
  for(const next of gateSuccessors(stage,node.state,{locked})){
   const key=gateKey(next.state);
   if(seen.has(key))continue;
   if(solved(next.state)){
    const actions=[next.action];
    for(let at=cursor;nodes[at].parent!==-1;at=nodes[at].parent)actions.push(nodes[at].action);
    actions.reverse();
    if(!locked&&!replayGate(stage,actions).cleared)throw Error('Gate certificate replay failed');
    return {status:'solved',optimalTurns:node.depth+1,actions,expanded,discovered:nodes.length};
   }
   if(nodes.length>=maxNodes)return {status:'budget',reason:'nodes',expanded,discovered:nodes.length};
   seen.add(key);nodes.push({state:next.state,parent:cursor,action:next.action,depth:node.depth+1});
  }
 }
 return {status:'unsolvable',expanded,discovered:nodes.length};
}
