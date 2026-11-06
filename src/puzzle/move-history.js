// A player-only, spoiler-free reconstruction of the last moves.
// Derived solely from validated actions, never from the stored proof/solution.
import {initialPuzzle} from './schema.js';
import {applyPuzzle} from './engine.js';
import {initialGate,applyGate} from './gate-v2.js';

const directions=['上','右','下','左'];
const point=(stage,cell)=>'左'+(cell%stage.board.width+1)+'列・上'+(Math.floor(cell/stage.board.width)+1)+'段';
function actionDescription(stage,action){
 const prep=action.prep;
 const direction=directions[action.dir];
 if(!direction||!prep)throw Error('Invalid move for history');
 switch(prep.type){
  case 'none':return 'そのまま'+direction+'へ滑走';
  case 'wall':return '壁 '+point(stage,prep.from)+' → '+point(stage,prep.to)+'、'+direction+'へ滑走';
  case 'glove':return 'グローブで壁 '+point(stage,prep.from)+' → '+point(stage,prep.to)+'、'+direction+'へ滑走';
  case 'ice':return 'アイス '+point(stage,prep.to)+'、'+direction+'へ滑走';
  case 'warp':return 'ワープ '+point(stage,prep.to)+'、'+direction+'へ滑走';
  default:throw Error('Unknown move type: '+prep.type);
 }
}
export function summarizeMoveHistory(stage,actions,{limit=5}={}){
 if(!stage||!Array.isArray(actions)||!Number.isInteger(limit)||limit<1||limit>50)
  throw Error('Invalid move-history inputs');
 const gate=stage.rulesVersion==='solo-v2-gate';
 let state=gate?initialGate(stage):initialPuzzle(stage);
 const entries=[];
 for(let i=0;i<actions.length;i++){
  const action=actions[i],before=state;
  state=gate?applyGate(stage,before,action):applyPuzzle(stage,before,action);
  const stars=before.stars.length-state.stars.length;
  const gateChange=gate&&before.gateOpen!==state.gateOpen?(state.gateOpen?'氷扉が開いた':'氷扉が閉じた'):null;
  const notes=[];
  if(stars>0)notes.push('★'+stars+'個獲得');
  if(gateChange)notes.push(gateChange);
  entries.push({
   turn:i+1,
   action:actionDescription(stage,action),
   destination:point(stage,state.position),
   stars,
   gateChange,
   notes
  });
 }
 return {total:actions.length,entries:entries.slice(-limit)};
}
