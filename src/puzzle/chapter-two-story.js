// Narrative interludes are presentation-only: do not mutate stage medals,
// home stars, save versions, or chapter unlock rules.
const milestones=new Map([
 [55,{title:'ふたつの道具を使いこなした！',body:'氷の冒険はまだ始まったばかり。これまで覚えた技を組み合わせ、次は不思議な氷扉に挑もう。'}],
 [60,{title:'氷扉の仕組みが見えてきた！',body:'扉を開くだけでなく、壁をどこに動かすかが道を決める。新しい仕掛けを読み解きながら先へ進もう。'}],
 [65,{title:'離れ小島から無事に帰還！',body:'道具を使う順番まで考えて、氷海の難所を越えた。残るステージは5面。'}],
 [70,{title:'第2章・全20ステージクリア！',body:'氷の向こうへの冒険を最後までやり遂げた！ 星やランクをもっと集めるならステージ選択から再挑戦。家の修復に使う星は第1章の記録を維持しています。'}]
]);
export function chapterTwoMilestone(stageNumber){
 return milestones.get(stageNumber)??null;
}
