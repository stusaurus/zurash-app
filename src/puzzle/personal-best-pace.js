/**
 * Motivating, spoiler-free personal-best pacing during an actual attempt.
 * Only verified numeric turn counts and previously earned personal bests.
 * This never changes the rank, state, certified minimum or save.
 */
export function personalBestPace({turns,bestTurns=null,minimumTurns,cleared=false}={}){
 if(!Number.isSafeInteger(turns)||turns<0||
    !Number.isSafeInteger(minimumTurns)||minimumTurns<1||
    (bestTurns!==null&&(!Number.isSafeInteger(bestTurns)||bestTurns<minimumTurns))||
    typeof cleared!=='boolean')
  throw Error('Invalid personal-best pace');
 if(cleared||bestTurns===null)return null;
 const fraction=Math.min(1,turns/bestTurns);
 if(bestTurns===minimumTurns){
  const left=bestTurns-turns;
  return {phase:left>0?'s-replay':'s-over',fraction,
   label:left>0?'Sランク再挑戦：あと'+left+'手で最短'+bestTurns+'手を再現しよう':
   '最短記録の手数に到達。星を集め切ろう！'};
 }
 const leftToImprove=bestTurns-1-turns;
 if(leftToImprove>0)
  return {phase:'improvable',fraction,label:'自己ベスト'+bestTurns+'手に挑戦：あと'+leftToImprove+'手以内にクリアで更新！'};
 if(leftToImprove===0)
  return {phase:'matching',fraction,label:'次の1手でクリアなら自己ベスト'+bestTurns+'手と同じ！'};
 return {phase:'over',fraction,label:'今回は自己ベスト'+bestTurns+'手を超えた。最後まで星を集めよう！'};
}
