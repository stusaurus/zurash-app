import {evaluateChallenge} from './challenge-grade.js';

// A shareable result, not an answer sheet or a save. Never includes a private
// playtest review, a solver proof, device identifiers or a deployment URL.
export function formatClearShare({stage,turns,mode='research',playUrl=null}={}){
 if(!stage?.chapter?.title||!Number.isSafeInteger(stage.chapter.number)||
    !Number.isSafeInteger(turns)||turns<1||
    !['adventure','practice','candidate','research'].includes(mode))
  throw Error('Invalid clear share');
 if(playUrl!==null){
  let url;
  try{url=new URL(playUrl);}catch{throw Error('Invalid share URL');}
  if(url.protocol!=='https:'||url.username||url.password||
     url.hostname==='localhost'||url.hostname.endsWith('.localhost')||
     !/^\/[a-z0-9/_-]+\.html$/.test(url.pathname)||
     !url.searchParams.has('stage')||url.hash)
    throw Error('Invalid share URL');
 }
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
 return '❄️ ズラッシュ！\n【'+kind+'】「'+stage.chapter.title.trim()+'」\n'+turns+'手で'+outcome+'\n#ズラッシュ'+(playUrl?'\nこの面に挑戦：'+playUrl:'');
}
