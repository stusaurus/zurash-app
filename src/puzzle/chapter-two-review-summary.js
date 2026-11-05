// Pure display model: only verified save records and explicit human feedback.
export const REVIEW_STAGES=Object.freeze([
 {number:54,question:'長い滑走中も「考えること」が続いた？',contrast:null},
 {number:57,question:'氷扉を3回切り替えるひらめきは気持ちよかった？',contrast:67},
 {number:59,question:'最後のワープは「発見」だった？ それともただの作業？',contrast:65},
 {number:70,question:'最終面にふさわしい達成感と、道具を連携するひらめきはあった？',contrast:null}
]);
const enjoyment={fun:'面白かった',okay:'ふつう',poor:'改善してほしい'};
const difficulty={easy:'簡単',balanced:'ちょうどいい',hard:'難しい'};
const insights={strong:'発見があって気持ちよかった',some:'少し発見があった',none:'作業に感じた'};
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
   insight:human?(insights[human.insight]??'未評価'):'未評価',
   note:typeof human?.note==='string'?human.note:'',
   hasReview:Boolean(human)
  };
 });
}

export function stage54ComparisonRows(campaignStages,remixStages,reviews){
 const original=campaignStages.find(s=>s.chapter?.number===54);
 if(!original||remixStages?.length!==2||remixStages.some(s=>s.chapter?.number!==54))
  throw Error('Three verified stage54 candidates are required');
 const ordered=[
  {key:'original',stage:original,label:'現行54面',url:'./chapter-two.html?trial=1&practice=1&stage=54',status:'本編の現行候補'},
  {key:'a',stage:remixStages[0],label:'改良案A',url:'./stage54-remix-lab.html?stage=1',status:'研究用・未採用'},
  {key:'b',stage:remixStages[1],label:'改良案B',url:'./stage54-remix-lab.html?stage=2',status:'研究用・未採用'}
 ];
 const keys=ordered.map(x=>x.stage.id);
 if(new Set(keys).size!==3||!remixStages.every(s=>s.status==='candidate'))
  throw Error('Duplicate or non-candidate stage54 comparison');
 return ordered.map(({key,stage,label,url,status})=>{
  const record=reviews?.[stage.id]??null;
  const actionCount=stage.proof.filter(a=>a.prep.type==='wall'||a.prep.type==='glove').length;
  return {key,id:stage.id,label,url,status,title:stage.chapter.title,
   minimumTurns:stage.challenge.minimumTurns,wallActions:actionCount,
   hasReview:Boolean(record),rating:record?enjoyment[record.enjoyment]??'未評価':'未評価',
   difficulty:record?difficulty[record.difficulty]??'未評価':'未評価',
   insight:record?insights[record.insight]??'未評価':'未評価',
   note:typeof record?.note==='string'?record.note:''};
 });
}

export function stage59ComparisonRows(campaignStages,remixStages,reviews){
 const original=campaignStages.find(s=>s.chapter?.number===59);
 if(!original||remixStages?.length!==2||remixStages.some(s=>s.chapter?.number!==59))
  throw Error('Three verified stage59 candidates are required');
 const ordered=[
  {key:'original',stage:original,label:'現行59面',url:'./chapter-two.html?trial=1&practice=1&stage=59',status:'本編の現行候補'},
  {key:'a',stage:remixStages[0],label:'改良案A',url:'./stage59-return-lab.html?stage=1',status:'研究用・未採用'},
  {key:'b',stage:remixStages[1],label:'改良案B',url:'./stage59-return-lab.html?stage=2',status:'研究用・未採用'}
 ];
 const keys=ordered.map(x=>x.stage.id);
 if(new Set(keys).size!==3||!remixStages.every(s=>s.status==='candidate'))
  throw Error('Duplicate or non-candidate stage59 comparison');
 return ordered.map(({key,stage,label,url,status})=>{
  const record=reviews?.[stage.id]??null;
  const actionCount=stage.proof.filter(a=>a.prep.type==='wall'||a.prep.type==='glove').length;
  return {key,id:stage.id,label,url,status,title:stage.chapter.title,
   minimumTurns:stage.challenge.minimumTurns,wallActions:actionCount,
   hasReview:Boolean(record),rating:record?enjoyment[record.enjoyment]??'未評価':'未評価',
   difficulty:record?difficulty[record.difficulty]??'未評価':'未評価',
   insight:record?insights[record.insight]??'未評価':'未評価',
   note:typeof record?.note==='string'?record.note:''};
 });
}

export function stage57ComparisonRows(campaignStages,remixStages,reviews){
 const original=campaignStages.find(s=>s.chapter?.number===57);
 if(!original||remixStages?.length!==2||remixStages.some(s=>s.chapter?.number!==57))
  throw Error('Three verified stage57 candidates are required');
 const ordered=[
  {key:'original',stage:original,label:'現行57面',url:'./chapter-two.html?trial=1&practice=1&stage=57',status:'本編の現行候補'},
  {key:'a',stage:remixStages[0],label:'改良案A',url:'./stage57-remix-lab.html?stage=1',status:'研究用・未採用'},
  {key:'b',stage:remixStages[1],label:'改良案B',url:'./stage57-remix-lab.html?stage=2',status:'研究用・未採用'}
 ];
 const keys=ordered.map(x=>x.stage.id);
 if(new Set(keys).size!==3||!remixStages.every(s=>s.status==='candidate'))
  throw Error('Duplicate or non-candidate stage57 comparison');
 return ordered.map(({key,stage,label,url,status})=>{
  const record=reviews?.[stage.id]??null;
  const actionCount=stage.proof.filter(a=>a.prep.type==='wall'||a.prep.type==='glove').length;
  return {key,id:stage.id,label,url,status,title:stage.chapter.title,
   minimumTurns:stage.challenge.minimumTurns,wallActions:actionCount,
   hasReview:Boolean(record),rating:record?enjoyment[record.enjoyment]??'未評価':'未評価',
   difficulty:record?difficulty[record.difficulty]??'未評価':'未評価',
   insight:record?insights[record.insight]??'未評価':'未評価',
   note:typeof record?.note==='string'?record.note:''};
 });
}

export function stage70ComparisonRows(campaignStages,remixStages,reviews){
 const original=campaignStages.find(s=>s.chapter?.number===70);
 if(!original||remixStages?.length!==2||remixStages.some(s=>s.chapter?.number!==70))
  throw Error('Three verified stage70 candidates are required');
 const ordered=[
  {key:'original',stage:original,label:'現行70面',url:'./chapter-two.html?trial=1&practice=1&stage=70',status:'本編の現行候補'},
  {key:'a',stage:remixStages[0],label:'改良案A',url:'./stage70-finale-lab.html?stage=1',status:'研究用・未採用'},
  {key:'b',stage:remixStages[1],label:'改良案B',url:'./stage70-finale-lab.html?stage=2',status:'研究用・未採用'}
 ];
 const keys=ordered.map(x=>x.stage.id);
 if(new Set(keys).size!==3||!remixStages.every(s=>s.status==='candidate'))
  throw Error('Duplicate or non-candidate stage70 comparison');
 return ordered.map(({key,stage,label,url,status})=>{
  const record=reviews?.[stage.id]??null;
  const actionCount=stage.proof.filter(a=>a.prep.type==='wall'||a.prep.type==='glove').length;
  return {key,id:stage.id,label,url,status,title:stage.chapter.title,
   minimumTurns:stage.challenge.minimumTurns,wallActions:actionCount,
   hasReview:Boolean(record),rating:record?enjoyment[record.enjoyment]??'未評価':'未評価',
   difficulty:record?difficulty[record.difficulty]??'未評価':'未評価',
   insight:record?insights[record.insight]??'未評価':'未評価',
   note:typeof record?.note==='string'?record.note:''};
 });
}


/**
 * Share only the twelve reviewed, verified stage variants as human-readable text.
 * This is a pure formatter: no persistence, network calls or automated adoption.
 */
export function formatChapterTwoComparisonText(rows){
 if(!Array.isArray(rows)||rows.length!==12)throw Error('Expected 12 verified comparison variants');
 const stageNumbers=[54,57,59,70],ids=new Set();
 const rated=rows.filter(row=>row.hasReview).length;
 const lines=['ズラッシュ！｜第2章 比較試遊の感想','評価済み '+rated+'/12案','※ 改良A/Bは研究用・未採用。最短手数のみで正式採用は決めません。'];
 for(const n of stageNumbers){
  const group=rows.filter(row=>row.stageNumber===n);
  if(group.length!==3||group.map(row=>row.key).join(',')!=='original,a,b')
   throw Error('Missing or out-of-order comparison variants for stage '+n);
  lines.push('','【第'+n+'面】');
  for(const row of group){
   if(typeof row.id!=='string'||ids.has(row.id))throw Error('Duplicated or invalid comparison ID');
   ids.add(row.id);
   if(!row.hasReview){lines.push('・'+row.label+'：未評価');continue;}
   lines.push('・'+row.label+'（'+row.title+'）：面白さ '+row.rating+
    '／難しさ '+row.difficulty+'／ひらめき '+row.insight);
   if(row.note)lines.push('  感想：'+row.note);
  }
 }
 return lines.join('\n')+'\n';
}
