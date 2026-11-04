import {evaluateChallenge} from './challenge-grade.js';

// A shareable result, not an answer sheet or a save. Never includes a private
// playtest review, a solver proof, device identifiers or a deployment URL.
export function formatClearShare({stage,turns,mode='research'}={}){
 if(!stage?.chapter?.title||!Number.isSafeInteger(stage.chapter.number)||
    !Number.isSafeInteger(turns)||turns<1||
    !['adventure','practice','candidate','research'].includes(mode))
  throw Error('Invalid clear share');
 const grade=evaluateChallenge(stage,turns);
 const kind={
  adventure:'第2章・第'+stage.chapter.number+'面',
  practice:'第2章・自由試遊 第'+stage.chapter.number+'面',
  candidate:'研究候補（正式採用前）・第'+stage.chapter.number+'面',
  research:'研究パズル・第'+stage.chapter.number+'面'
 }[mode];
 const outcome=grade?.rank==='unqualified'?'星を全部集めた！（合格手数は未達）':
  grade?grade.rank+'ランクを達成！':'クリア！';
 // Keep line lengths and labels human-readable, without copying any solution.
 return '❄️ ズラッシュ！\n【'+kind+'】「'+stage.chapter.title.trim()+'」\n'+turns+'手で'+outcome+'\n#ズラッシュ';
}
