// Progressive hints are generated from a fully replayable, BFS-certified route.
// No hint is stored in browser saves or attached to the house economy.
import {initialPuzzle} from './schema.js';
import {applyPuzzle,solved} from './engine.js';
import {validateChallenge} from './challenge-grade.js';

const arrows=['↑','→','↓','←'];
export function cellName(cell,width) {
 if(!Number.isInteger(cell)||!Number.isInteger(width)||cell<0||width<1||width>26)
  throw Error('Invalid hint coordinate');
 return String.fromCharCode(65+(cell%width))+String(Math.floor(cell/width)+1);
}
export function formatHintAction(action,width) {
 const p=action.prep;
 const start=p.type==='none'?'そのまま滑る':
  p.type==='wall'?'壁 '+cellName(p.from,width)+' → '+cellName(p.to,width):
  p.type==='glove'?'グローブ '+cellName(p.from,width)+' → '+cellName(p.to,width):
  p.type==='ice'?'氷 '+cellName(p.to,width)+'に設置':
  p.type==='warp'?'ワープ '+cellName(p.to,width):
  (()=>{throw Error('Unknown hint preparation');})();
 if(!arrows[action.dir]) throw Error('Invalid hint direction');
 return start+' ／ 滑走 '+arrows[action.dir];
}
export function buildProgressiveHints(stage) {
 const challenge=validateChallenge(stage);
 if(!challenge||!Array.isArray(stage.proof)||stage.proof.length!==challenge.minimumTurns)
  throw Error('No certified shortest route for hints');
 const width=stage.board.width;
 let current=initialPuzzle(stage);
 const lines=[];
 let firstStar=null;
 for(let i=0;i<stage.proof.length;i++){
  const after=applyPuzzle(stage,current,stage.proof[i]);
  const picked=current.stars.filter(c=>!after.stars.includes(c));
  const name=cellName(after.position,width);
  const line=(i+1)+'手目：'+formatHintAction(stage.proof[i],width)+' → '+name+
   (picked.length?' ⭐星取得':'');
  lines.push(line);
  if(!firstStar&&picked.length)firstStar={turn:i+1,cell:picked[0]};
  current=after;
 }
 if(!solved(current)||!firstStar)throw Error('Hint route must clear all stars');
 const first=firstStar.turn;
 return [
  {title:'ヒント① 考え方',body:stage.chapter.hint??'壁を動かした後の停止位置に注目しよう。',steps:[]},
  {title:'ヒント② 最初の目標',
   body:'最短ルートでは最初の星を'+first+'手目、'+cellName(firstStar.cell,width)+'で取れます。そこへ止まれる壁の配置を考えよう。',
   steps:[]},
  {title:'ヒント③ 出発の手順',
   body:'初期配置から最初の星まで。途中で別の手を選んでいる場合は「最初から」で確認できます。',
   steps:lines.slice(0,first)},
  {title:'答え 最短'+challenge.minimumTurns+'手',
   body:'最初の配置からの全手順です。途中で別の手を選んでいる場合は「最初から」で確認してください。',
   steps:lines}
 ];
}
