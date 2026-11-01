import {initialGate,applyGate,replayGate} from './gate-v2.js';
import {cellName,formatHintAction} from './progressive-hints.js';
import {validateChallenge} from './challenge-grade.js';
export function buildGateHints(stage){
 const cert=validateChallenge(stage);
 if(!cert||!Array.isArray(stage.proof)||stage.proof.length!==cert.minimumTurns||!replayGate(stage,stage.proof).cleared)
  throw Error('A fully certified gate route is required for hints');
 let state=initialGate(stage),firstStar=null,firstSwitch=null;
 const rows=[];
 for(let i=0;i<stage.proof.length;i++){
  const before=state;
  state=applyGate(stage,state,stage.proof[i]);
  if(!firstStar&&state.stars.length<before.stars.length)firstStar={turn:i+1,cell:state.position};
  if(!firstSwitch&&state.gateOpen!==before.gateOpen)firstSwitch=i+1;
  rows.push((i+1)+'手目：'+formatHintAction(stage.proof[i],stage.board.width)+' → '+
   cellName(state.position,stage.board.width)+(state.stars.length<before.stars.length?' ⭐星取得':'')+
   (state.gateOpen!==before.gateOpen?' ✧ゲートが開いた！':''));
 }
 if(!firstStar||!firstSwitch)throw Error('Missing gate or first star');
 return [
  {title:'ヒント① 考え方',body:stage.chapter.hint,steps:[]},
  {title:'ヒント② スイッチの目標',body:'ゲートは最短ルートの'+firstSwitch+'手目に開く。最初の星は'+firstStar.turn+'手目、'+cellName(firstStar.cell,stage.board.width)+'。',steps:[]},
  {title:'ヒント③ 最初のスイッチまで',body:'最初の配置からゲートを開くところまで。違う操作をしている場合は「最初から」で確認。',steps:rows.slice(0,firstSwitch)},
  {title:'答え 最短'+cert.minimumTurns+'手',body:'最初の配置からの全手順。スイッチでゲートが切り替わるタイミングに注目。',steps:rows},
 ];
}
