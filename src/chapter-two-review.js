import {loadChapterTwoReviews,exportChapterTwoReviews} from './puzzle/chapter-two-playtest.js';
import {loadChapterTwo} from './puzzle/chapter-two-progress.js';
import {REVIEW_STAGES,reviewCards} from './puzzle/chapter-two-review-summary.js';
const $=id=>document.getElementById(id);
const root=new URL('../',import.meta.url);
const data=await fetch(new URL('data/chapters/chapter-02/adventure-v1.json',root));
if(!data.ok)throw Error('Comparison stage data: HTTP '+data.status);
const {stages}=await data.json();
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
 const reviewed=rows.filter(r=>r.hasReview).length;
 $('review-summary').textContent='3面中 '+reviewed+'面の感想を記録しました。'+(reviewed===3?'比較用の記録がそろいました。':'どの順番でも遊べます。');
 $('export-review').disabled=!reviewed||!$('review-error').hidden;
}
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
