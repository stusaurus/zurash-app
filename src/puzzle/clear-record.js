/**
 * Honest replay feedback, derived from the player's measured result.
 * It does not change certified minima, any record, rewards or persistence.
 */
export function describePersonalRecord({turns,previousBest=null,resumed=false,scope='adventure',saved=true}={}){
 if(!Number.isSafeInteger(turns)||turns<1||
    (previousBest!==null&&(!Number.isSafeInteger(previousBest)||previousBest<1))||
    !['adventure','practice','session'].includes(scope)||
    typeof resumed!=='boolean'||typeof saved!=='boolean')
  throw Error('Invalid personal record');
 const currentBest=previousBest===null?turns:Math.min(turns,previousBest);
 const state=resumed?'resumed':previousBest===null?'first':turns<previousBest?'improved':turns===previousBest?'matched':'slower';
 const prefix=scope==='adventure'?'自己ベスト':scope==='practice'?'自由試遊のベスト':'この試遊中のベスト';
 const labels={
  resumed:prefix+' '+currentBest+'手（クリア記録を再表示中）',
  first:'初クリア！ '+prefix+' '+turns+'手',
  improved:'自己ベスト更新！ 以前のベスト'+previousBest+'手から'+(previousBest-turns)+'手短縮',
  matched:prefix+'と同じ '+turns+'手！',
  slower:prefix+'は'+previousBest+'手。あと'+(turns-previousBest)+'手短縮できる！'
 };
 return {
  state,
  bestTurns:currentBest,
  text:labels[state]+(!saved&&scope==='adventure'?' ／ この記録は端末に保存できていません':''),
  saved:scope==='adventure'?saved:true
 };
}
