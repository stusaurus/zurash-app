/**
 * Presentation only: no solver hints, save writes or changes to rank thresholds.
 * A research candidate is a comparison option, not a main-campaign milestone.
 */
export function clearPresentation({stage,nextStage,rank,adventureMode=false,comparisonMode=false}){
 if(!stage?.chapter?.title||!['S','A','B','unqualified','clear'].includes(rank))
  throw Error('Invalid clear result');
 const label={
  S:'最短ルートを発見！',
  A:'見事な攻略！',
  B:'星を集め切った！',
  unqualified:'すべての星を集めた！',
  clear:'クリア！'
 }[rank];
 const sub={
  S:'ひらめきが、最短手数につながった。',
  A:'あと少しの工夫で、最短ルートが見えてくる。',
  B:'次は一手ずつの止まり方を見直してみよう。',
  unqualified:'次は合格手数を目指して再挑戦しよう。',
  clear:'ひらめきが冒険を進めた。'
 }[rank];
 const next=nextStage?.chapter?.title?
  (adventureMode?'次の冒険・第'+nextStage.chapter.number+'面':comparisonMode?'次の比較候補':'次のパズル')+'「'+nextStage.chapter.title+'」':
  adventureMode?'第2章の冒険を達成。家で道しるべの思い出を振り返ろう。':
  comparisonMode?'最後の候補まで到達。もう一度遊び、違いを確かめよう。':'最後のパズルをクリア。もう一度挑戦してみよう。';
 return {rank,label,sub,next,stageTitle:stage.chapter.title};
}
