// Pure display model: only verified save records and explicit human feedback.
export const REVIEW_STAGES=Object.freeze([
 {number:54,question:'長い滑走中も「考えること」が続いた？',contrast:null},
 {number:57,question:'氷扉を3回切り替えるひらめきは気持ちよかった？',contrast:67},
 {number:59,question:'最後のワープは「発見」だった？ それともただの作業？',contrast:65}
]);
const enjoyment={fun:'面白かった',okay:'ふつう',poor:'改善してほしい'};
const difficulty={easy:'簡単',balanced:'ちょうどいい',hard:'難しい'};
export function reviewCards(entries,reviews,{adventure={},practice={}}={}){
 return REVIEW_STAGES.map(focus=>{
  const stage=entries.find(s=>s.chapter?.number===focus.number);
  if(!stage)throw Error('Missing comparison stage '+focus.number);
  const human=reviews?.[stage.id]??null;
  const normal=adventure?.[stage.id]??null;
  const trial=practice?.[stage.id]??null;
  return {
   ...focus,id:stage.id,title:stage.chapter.title,minimumTurns:stage.challenge.minimumTurns,
   bestAdventure:Number.isInteger(normal?.bestTurns)?normal.bestTurns:null,
   bestPractice:Number.isInteger(trial?.bestTurns)?trial.bestTurns:null,
   rating:human?enjoyment[human.enjoyment]??'未評価':'未評価',
   difficulty:human?(difficulty[human.difficulty]??'未評価'):'未評価',
   note:typeof human?.note==='string'?human.note:'',
   hasReview:Boolean(human)
  };
 });
}
