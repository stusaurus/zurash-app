import {loadChapterTwoReviews,exportChapterTwoReviews} from './puzzle/chapter-two-playtest.js';
import {loadChapterTwo} from './puzzle/chapter-two-progress.js';
import {REVIEW_STAGES,reviewCards,stage54ComparisonRows,stage59ComparisonRows,stage57ComparisonRows,stage70ComparisonRows,formatChapterTwoComparisonText} from './puzzle/chapter-two-review-summary.js';
const $=id=>document.getElementById(id);
const root=new URL('../',import.meta.url);
const data=await fetch(new URL('data/chapters/chapter-02/adventure-v1.json',root));
if(!data.ok)throw Error('Comparison stage data: HTTP '+data.status);
const {stages}=await data.json();
const remixResponse=await fetch(new URL('data/chapters/chapter-02/stage54-remix-candidates-v1.json',root));
if(!remixResponse.ok)throw Error('Stage54 remixes: HTTP '+remixResponse.status);
const {stages:remixStages}=await remixResponse.json();
const returnResponse=await fetch(new URL('data/chapters/chapter-02/stage59-return-candidates-v1.json',root));
if(!returnResponse.ok)throw Error('Stage59 returns: HTTP '+returnResponse.status);
const {stages:returnStages}=await returnResponse.json();
const gateResponse=await fetch(new URL('data/chapters/chapter-02/stage57-remix-candidates-v1.json',root));
if(!gateResponse.ok)throw Error('Stage57 research: HTTP '+gateResponse.status);
const {stages:gateResearch}=await gateResponse.json();
const finaleResponse=await fetch(new URL('data/chapters/chapter-02/stage70-finale-candidates-v1.json',root));
if(!finaleResponse.ok)throw Error('Stage70 finale data: HTTP '+finaleResponse.status);
const {stages:finaleStages}=await finaleResponse.json();
const container=$('review-cards');
const make=(tag,cls,content)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=content;return el;};
function readCompleted(practice){
 try{return loadChapterTwo(localStorage,stages,{practice}).completed;}
 catch(e){$('review-error').hidden=false;$('review-error').textContent='冒険の保存記録を読み取れませんでした。記録は変更しません。第2章の画面から安全に復旧できます。';return {};}
}
function render(){
 container.replaceChildren();
 let reviews={};
 try{
  reviews=loadChapterTwoReviews(localStorage).reviews;
  $('review-error').hidden=true;
 }catch(e){
  $('review-error').hidden=false;
  $('review-error').textContent='感想の保存記録を読み取れませんでした。元の感想は変更せず、書き出しを停止しています。';
  $('export-review').disabled=true;
 }
 const adventure=readCompleted(false),practice=readCompleted(true);
 const rows=reviewCards(stages,reviews,{adventure,practice});
 for(const row of rows){
  const card=make('article','card');
  card.setAttribute('data-review-stage',String(row.number));
  const stage=make('span','stage','STAGE '+row.number+' · 最短'+row.minimumTurns+'手');
  card.append(stage,make('h2','',row.title),make('p','',row.question));
  const recordText='通常の記録 '+(row.bestAdventure===null?'—':row.bestAdventure+'手')+
    ' ／ 自由試遊 '+(row.bestPractice===null?'—':row.bestPractice+'手');
  card.append(make('p','metric',recordText));
  const label=make('p','metric',row.hasReview?'感想：'+row.rating+' ／ 難しさ：'+row.difficulty:'感想：まだ記録していません');
  label.setAttribute('data-review-label',String(row.number));card.append(label);
  if(row.note){const note=make('p','note',row.note);note.setAttribute('data-review-note',String(row.number));card.append(note);}
  const actions=make('div','review-row');
  const play=make('a','primary','この面を自由試遊して評価');
  play.href='./chapter-two.html?trial=1&practice=1&stage='+row.number;
  actions.append(play);
  if(row.contrast){
   const reference=make('a','',''+row.contrast+'面と比べる');
   reference.href='./chapter-two.html?trial=1&practice=1&stage='+row.contrast;
   actions.append(reference);
  }
  card.append(actions);
  container.append(card);
 }
 const comparisons=stage54ComparisonRows(stages,remixStages,reviews);
 const comparisonList=$('stage54-variants');comparisonList.replaceChildren();
 for(const row of comparisons){
  const card=make('article','card');card.dataset.variant=row.key;
  card.append(make('span','stage',row.label+' · '+row.status),make('h3','',row.title));
  card.append(make('p','metric','最短'+row.minimumTurns+'手 ／ 壁・グローブ操作'+row.wallActions+'回'));
  const result=make('p','metric',row.hasReview?
    '面白さ：'+row.rating+' ／ 難しさ：'+row.difficulty+' ／ ひらめき：'+row.insight:'感想：未評価');
  result.dataset.variantReview=row.key;card.append(result);
  if(row.note){const note=make('p','note',row.note);note.dataset.variantNote=row.key;card.append(note);}
  const link=make('a','variant-play','この案を遊んで感想を残す');link.href=row.url;card.append(link);
  comparisonList.append(card);
 }
 const ratedComparisons=comparisons.filter(r=>r.hasReview).length;
 $('stage54-compare-status').textContent='54面の3案中 '+ratedComparisons+'案の感想を記録。'+(ratedComparisons===3?
  '3案の記録がそろいました。どれが面白いか比較して判断してください。':
  '現行案・A・Bをそれぞれ試してください。');
 const returnRows=stage59ComparisonRows(stages,returnStages,reviews);
 const returnList=$('stage59-variants');returnList.replaceChildren();
 for(const row of returnRows){
  const card=make('article','card');card.dataset.variant59=row.key;
  card.append(make('span','stage',row.label+' · '+row.status),make('h3','',row.title));
  card.append(make('p','metric','最短'+row.minimumTurns+'手 ／ 壁・グローブ操作'+row.wallActions+'回'));
  const rating=make('p','metric',row.hasReview?
    '面白さ：'+row.rating+' ／ 難しさ：'+row.difficulty+' ／ ひらめき：'+row.insight:
    '感想：未評価');
  rating.dataset.variant59Review=row.key;card.append(rating);
  if(row.note){const note=make('p','note',row.note);note.dataset.variant59Note=row.key;card.append(note);}
  const link=make('a','variant-play','この案を遊んで感想を残す');link.href=row.url;card.append(link);
  returnList.append(card);
 }
 const rated59=returnRows.filter(row=>row.hasReview).length;
 $('stage59-compare-status').textContent='59面の3案中 '+rated59+'案の感想を記録。'+(rated59===3?
  '人間の試遊感想で採否を判断してください。':'現行案と改良A/Bを比較してください。');
 const gateRows=stage57ComparisonRows(stages,gateResearch,reviews);
 const gateList=$('stage57-variants');gateList.replaceChildren();
 for(const row of gateRows){
  const card=make('article','card');card.dataset.variant57=row.key;
  card.append(make('span','stage',row.label+' · '+row.status),make('h3','',row.title));
  card.append(make('p','metric','最短'+row.minimumTurns+'手 ／ 壁移動'+row.wallActions+'回'));
  const label=make('p','metric',row.hasReview?'面白さ：'+row.rating+' ／ 難しさ：'+row.difficulty+' ／ ひらめき：'+row.insight:'感想：未評価');
  label.dataset.variant57Review=row.key;card.append(label);
  if(row.note){const note=make('p','note',row.note);note.dataset.variant57Note=row.key;card.append(note);}
  const link=make('a','variant-play','この案を遊んで感想を残す');link.href=row.url;card.append(link);
  gateList.append(card);
 }
 const rated57=gateRows.filter(row=>row.hasReview).length;
 $('stage57-compare-status').textContent='57面の3案中 '+rated57+'案の感想を記録。'+(rated57===3?'比較結果をもとに採否を判断してください。':'現行案と改良A/Bを比べてください。');
 const finaleRows=stage70ComparisonRows(stages,finaleStages,reviews);
 const finaleList=$('stage70-variants');finaleList.replaceChildren();
 for(const row of finaleRows){
  const card=make('article','card');card.dataset.variant70=row.key;
  card.append(make('span','stage',row.label+' · '+row.status),make('h3','',row.title));
  card.append(make('p','metric','最短'+row.minimumTurns+'手 ／ 壁・グローブ操作'+row.wallActions+'回'));
  const label=make('p','metric',row.hasReview?'面白さ：'+row.rating+' ／ 難しさ：'+row.difficulty+' ／ ひらめき：'+row.insight:'感想：未評価');
  label.dataset.variant70Review=row.key;card.append(label);
  if(row.note){const note=make('p','note',row.note);note.dataset.variant70Note=row.key;card.append(note);}
  const link=make('a','variant-play','この案を遊んで感想を残す');link.href=row.url;card.append(link);
  finaleList.append(card);
 }
 const rated70=finaleRows.filter(x=>x.hasReview).length;
 $('stage70-compare-status').textContent='70面の3案中 '+rated70+'案の感想を記録。'+(rated70===3?'最終面の達成感を比較して判断してください。':'現行案と改良A/Bを比べてください。');
 const reviewOrder=[
  ...comparisons.map(row=>({...row,stageNumber:54})),
  ...gateRows.map(row=>({...row,stageNumber:57})),
  ...returnRows.map(row=>({...row,stageNumber:59})),
  ...finaleRows.map(row=>({...row,stageNumber:70}))
 ];
 const rated=new Set(reviewOrder.filter(row=>row.hasReview).map(row=>row.id));
 const reviewed=rows.filter(row=>row.hasReview).length;
 $('review-summary').textContent='現行版 '+reviewed+'/4面、12案中 '+rated.size+'案の感想を記録。'+
  (rated.size===12?'全案の評価がそろいました。感想を比較して採否を判断してください。':'未評価の案から続けて遊べます。');
 const next=reviewOrder.find(row=>!row.hasReview);
 const nextLink=$('next-unreviewed');
 nextLink.hidden=!next;
 if(next){
  nextLink.href=next.url;
  nextLink.textContent='次に遊ぶ：第'+next.stageNumber+'面 '+next.label+'（未評価）';
 }
 // Candidate-only feedback is exportable even if the campaign stages have no reviews.
 const canShare=Boolean(rated.size)&&$('review-error').hidden;
 $('export-review').disabled=!canShare;
 $('copy-review').disabled=!canShare;
}
$('copy-review').addEventListener('click',async()=>{
 const status=$('export-status'),manual=$('share-manual-copy'),label=$('share-manual-copy-label');
 let text;
 // Re-read storage at the moment of the explicit user action; never copy stale or corrupt feedback.
 try{
  const feedback=loadChapterTwoReviews(localStorage).reviews;
  const ordered=[
   ...stage54ComparisonRows(stages,remixStages,feedback).map(row=>({...row,stageNumber:54})),
   ...stage57ComparisonRows(stages,gateResearch,feedback).map(row=>({...row,stageNumber:57})),
   ...stage59ComparisonRows(stages,returnStages,feedback).map(row=>({...row,stageNumber:59})),
   ...stage70ComparisonRows(stages,finaleStages,feedback).map(row=>({...row,stageNumber:70}))
  ];
  if(!ordered.some(row=>row.hasReview))throw Error('No human reviews to copy');
  text=formatChapterTwoComparisonText(ordered);
 }catch(error){
  status.textContent='感想を読み取れませんでした。元の保存データは変更していません。';
  return;
 }
 try{
  if(!navigator.clipboard?.writeText)throw Error('Clipboard API unavailable');
  await navigator.clipboard.writeText(text);
  manual.hidden=true;label.hidden=true;
  status.textContent='比較試遊の感想をコピーしました。チャットに貼り付けて共有できます。';
 }catch(error){
  // Safari can refuse clipboard permission. Show selectable text instead of losing the result.
  manual.value=text;manual.hidden=false;label.hidden=false;
  manual.focus();manual.select();
  status.textContent='自動コピーが使えないため、文章を表示しました。長押ししてコピーできます。';
 }
});
$('export-review').addEventListener('click',()=>{
 try{
  const body=exportChapterTwoReviews(localStorage);
  const url=URL.createObjectURL(new Blob([body],{type:'application/json;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='zurash-chapter-two-comparison-reviews.json';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  $('export-status').textContent='感想をダウンロードしました。自動送信は行っていません。';
 }catch(e){$('export-status').textContent='書き出せませんでした。感想の保存データは変更していません。';}
});
window.addEventListener('pageshow',render);
window.addEventListener('focus',render);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
render();
