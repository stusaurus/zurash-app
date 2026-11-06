/**
 * One-time first-arrival copy for a friend-invited chapter-two practice stage.
 * Pure presentation: no puzzle hints, proof steps, stage changes or save writes.
 */
export function invitationGuide(stage){
 const chapter=stage?.chapter;
 if(!Number.isSafeInteger(chapter?.number)||chapter.number<51||chapter.number>70||
    typeof chapter.title!=='string'||!chapter.title.trim())
  throw Error('Invalid invitation stage');
 return Object.freeze({
  headline:'✉ トリケンからの挑戦状！',
  stageLabel:'STAGE '+chapter.number+' 「'+chapter.title.trim()+'」',
  steps:Object.freeze([
   '① そのまま滑る・壁・道具から選ぶ',
   '② ▲ ▶ ▼ ◀ で滑る',
   '③ 星のあるマスで止まって、全部集めよう'
  ]),
  privacy:'これは自由試遊。冒険の結晶や家の記録は変わりません。',
  action:'さっそく挑戦！'
 });
}
