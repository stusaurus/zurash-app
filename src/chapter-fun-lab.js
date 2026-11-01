import {initialPuzzle,validateStage} from './puzzle/schema.js';
import {successors,applyPuzzle,solved,replay} from './puzzle/engine.js';
import {validateChallenge,evaluateChallenge} from './puzzle/challenge-grade.js';
import {buildProgressiveHints} from './puzzle/progressive-hints.js';

const $=id=>document.getElementById(id);
const modeNames={none:'そのまま滑る',wall:'壁をずらす',ice:'氷を置く'};
const longMode=location.pathname.endsWith('/long-lab.html');
let entries=[],stage,state,number=1,trace=[],mode='none',selectedWall=null,selectedPrep={type:'none'},busy=false;
let activeMs=0,activeSince=null,hintUses=0,undoUses=0,hintLevel=0;
// Session-only personal bests; never write to the real chapter save.
const sessionBestTurns=new Map();
const activeTime=()=>activeMs+(activeSince===null?0:performance.now()-activeSince);
const formattedTime=ms=>{const seconds=Math.floor(ms/1000);return Math.floor(seconds/60)+'分'+String(seconds%60).padStart(2,'0')+'秒';};
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){if(activeSince!==null)activeMs+=performance.now()-activeSince;activeSince=null;}
 else if(stage&&!solved(state)&&activeSince===null)activeSince=performance.now();
});
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const currentOptions=()=>solved(state)?[]:successors(stage,state);
const root=new URL('../',import.meta.url);

function say(message,error=false){
 $('fun-prompt').textContent=message;
 $('fun-prompt').style.color=error?'#aa4538':'';
}
function showSelection(){
 $('stage-choices').replaceChildren();
 for(let n=1;n<=entries.length;n++){
  const button=document.createElement('button');
  button.type='button';button.textContent=String(n);
  button.setAttribute('aria-current',n===number?'step':'false');
  button.setAttribute('aria-label','候補ステージ'+n);
  button.addEventListener('click',()=>setStage(n));
  $('stage-choices').append(button);
 }
}
function setStage(n){
 if(!entries[n-1])return;
 number=n;stage=entries[n-1];state=initialPuzzle(stage);trace=[];
 activeMs=0;activeSince=document.hidden?null:performance.now();hintUses=0;undoUses=0;hintLevel=0;
 mode='none';selectedWall=null;selectedPrep={type:'none'};busy=false;
 const query=new URL(location.href);
 query.searchParams.set('stage',String(n));
 history.replaceState(null,'',query.pathname+query.search);
 $('fun-result').hidden=true;$('fun-feedback').hidden=true;
 $('fun-feedback').replaceChildren();
 if(longMode){$('fun-hint').textContent='ヒント 1/4';$('fun-hint').dataset.hintStep='0';}
 showSelection();render();
 say(number===1?'右へ滑って星を取ろう。':'光る停止マスをタップ。壁は選んで1マス動かせるよ。');
}
function paintBoard(options){
 const w=stage.board.width,h=stage.board.height;
 const maxH=Math.min(390,Math.max(270,innerHeight*.40));
 const availableWidth=Math.min(innerWidth-52,460);
 const width=Math.min(availableWidth,((maxH-26)/h)*w+26);
 const board=$('fun-board');
 board.style.width=Math.floor(width)+'px';
 board.style.gridTemplateColumns='repeat('+w+',minmax(0,1fr))';
 board.setAttribute('data-stage',String(number));
 board.setAttribute('aria-label',w+'列'+h+'段の候補パズル');
 const playable=new Set(stage.board.playableCells??Array.from({length:w*h},(_,i)=>i));
 const visual={position:state.position,walls:[...state.walls],ice:[...state.ice]};
 if(selectedPrep?.type==='wall')visual.walls=visual.walls.map(c=>c===selectedPrep.from?selectedPrep.to:c);
 if(selectedPrep?.type==='ice')visual.ice.push(selectedPrep.to);
 const optionsOfMode=options.filter(o=>o.action.prep.type===mode).map(o=>o.action.prep);
 const hotspots=new Set(optionsOfMode.filter(p=>mode!=='wall'||p.from===selectedWall).map(p=>p.to));
 const matches=options.filter(o=>same(o.action.prep,selectedPrep));
 const arrivals=new Set(matches.map(o=>o.state.position));
 let cells='';
 for(let c=0;c<w*h;c++){
  if(!playable.has(c)){cells+='<span class="hole" aria-hidden="true"></span>';continue;}
  const wall=visual.walls.includes(c),ice=visual.ice.includes(c),star=state.stars.includes(c),player=visual.position===c,arrive=arrivals.has(c)&&!player;
  const socket=stage.iceSockets.includes(c)&&!ice;
  const klass=['cell',wall?'wall':'',ice?'ice':'',socket?'socket':'',hotspots.has(c)?'hot':'',selectedWall===c?'selected':'',arrive?'arrival':''].filter(Boolean).join(' ');
  const label=['左から'+(c%w+1)+'、上から'+(Math.floor(c/w)+1),wall?'動く壁':'',player?'トリケン':'',star?'星':'',socket?'氷を置ける':'',hotspots.has(c)?'準備の移動先':'',arrive?'ここへ滑る':''].filter(Boolean).join('・');
  cells+='<button type="button" class="'+klass+'" data-cell="'+c+'" aria-label="'+label+'" '+(busy?'disabled':'')+'>'+
   (star?'<span class="star" aria-hidden="true">★</span>':'')+
   (player?'<img src="./assets/triken-orange-80.png" alt="" draggable="false">':'')+
   '</button>';
 }
 board.innerHTML=cells;
}
function render(){
 const options=currentOptions();
 const goal=validateChallenge(stage);
 const target=$('fun-goal');
 if(target){
  target.hidden=!goal;
  if(goal){
   $('fun-pass-target').textContent=goal.passThrough+'手以内';
   const rest=goal.passThrough-trace.length;
   $('fun-remaining').textContent=rest>=0?'合格ラインまで残り '+rest+'手':'合格ラインを '+Math.abs(rest)+'手超過';
   $('fun-remaining').dataset.over=String(rest<0);
   const best=sessionBestTurns.get(stage.id);
   $('fun-best').textContent=best===undefined?'':'今回の試遊での自己ベスト '+best+'手';
  }
 }

 $('fun-title').textContent=stage.chapter.title;
 $('fun-count').textContent=number+' / '+entries.length;
 $('fun-focus').textContent=stage.chapter.focus;
 $('fun-moves').textContent=trace.length;
 $('fun-stars').textContent=state.stars.length;
 $('fun-shifts').textContent=trace.filter(a=>a.prep.type==='wall').length;
 paintBoard(options);
 for(const button of document.querySelectorAll('[data-fun-mode]')){
  const key=button.dataset.funMode;
  button.hidden=key==='ice'&&!stage.inventory.iceBlock;
  button.disabled=busy||solved(state)||(key!=='none'&&!options.some(o=>o.action.prep.type===key));
  button.setAttribute('aria-pressed',String(mode===key));
 }
 for(const button of document.querySelectorAll('[data-fun-dir]')){
  const dir=Number(button.dataset.funDir);
  button.disabled=busy||!selectedPrep||!options.some(o=>same(o.action.prep,selectedPrep)&&o.action.dir===dir);
 }
 $('fun-undo').disabled=busy||trace.length===0;
 $('fun-retry').disabled=busy;
 if(longMode)$('fun-hint').disabled=busy||solved(state);
}
function changeMode(next){
 if(busy||solved(state))return;
 mode=next;selectedWall=null;selectedPrep=next==='none'?{type:'none'}:null;
 render();
 say(next==='wall'?'動かす壁をタップ → 光る移動先をタップ → 滑る方向を選ぼう。':next==='ice'?'氷を置く光るソケットをタップしよう。':'停止先の光るマスをタップして滑ろう。');
}
function selectCell(cell){
 if(busy||solved(state))return;
 const options=currentOptions();
 if(selectedPrep){
  const arrival=options.find(o=>same(o.action.prep,selectedPrep)&&o.state.position===cell);
  if(arrival){takeStep(arrival.action);return;}
 }
 const preps=options.map(o=>o.action.prep).filter(p=>p.type===mode);
 if(mode==='wall'){
  if(selectedWall!==null){
   const prep=preps.find(p=>p.from===selectedWall&&p.to===cell);
   if(prep){selectedPrep=prep;render();say('壁をずらす準備ができた！ 光る停止マスか方向を選ぼう。');return;}
  }
  if(preps.some(p=>p.from===cell)){selectedWall=cell;selectedPrep=null;render();say('光る移動先をタップしよう。');return;}
 }
 if(mode==='ice'){
  const prep=preps.find(p=>p.to===cell);
  if(prep){selectedPrep=prep;render();say('氷を置く準備ができた！ 滑る方向を決めよう。');return;}
 }
 if(mode==='none'&&state.walls.includes(cell)){changeMode('wall');selectCell(cell);return;}
 if(mode==='none'&&stage.iceSockets.includes(cell)){changeMode('ice');selectCell(cell);return;}
 say('光るマスを選ぶか、右の十字キーで滑ろう。');
}
async function takeStep(action){
 if(busy||solved(state))return;
 if(!currentOptions().some(o=>same(o.action,action)))return;
 busy=true;
 const beforeSprite=$('fun-board').querySelector('.cell img');
 const startRect=beforeSprite?.getBoundingClientRect();
 const oldStarCount=state.stars.length;
 try{
  state=applyPuzzle(stage,state,action);trace.push(action);
  mode='none';selectedWall=null;selectedPrep={type:'none'};
  render();
  const afterSprite=$('fun-board').querySelector('.cell img');
  const finishRect=afterSprite?.getBoundingClientRect();
  if(startRect&&finishRect&&afterSprite&&typeof afterSprite.animate==='function'&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
   const dx=startRect.left+startRect.width/2-finishRect.left-finishRect.width/2;
   const dy=startRect.top+startRect.height/2-finishRect.top-finishRect.height/2;
   const length=Math.hypot(dx,dy);
   if(length>1){
    const animation=afterSprite.animate(
     [{transform:'translate('+dx+'px,'+dy+'px) scale(.94)'},{transform:'translate(0,0) scale(1)'}],
     {duration:Math.min(460,220+length*.5),easing:'cubic-bezier(.17,.65,.2,1)'});
    await animation.finished.catch(()=>{});
   }
  }
  if(state.stars.length<oldStarCount){
   const box=afterSprite?.closest('.cell');
   box?.classList.add('land');
  }
  if(solved(state)){
   $('fun-result').hidden=false;
   const elapsed=activeTime();activeMs=elapsed;activeSince=null;
   const grade=evaluateChallenge(stage,trace.length);
   if(grade){
    const previousBest=sessionBestTurns.get(stage.id);
    if(previousBest===undefined||trace.length<previousBest)sessionBestTurns.set(stage.id,trace.length);
    $('fun-rank').textContent=grade.passed?grade.rank+'ランク合格！':'星は全部獲得！ 合格は次の挑戦';
    $('fun-rank').dataset.rank=grade.rank;
    $('fun-benchmark').textContent='今回 '+grade.turns+'手 ／ 合格 '+grade.passThrough+'手以内 ／ 最短 '+grade.minimumTurns+'手（＋'+grade.extraTurns+'手）';
    $('fun-next-objective').textContent=
      grade.rank==='S'?'最短手数で完全攻略！':
      grade.passed?'Sランクまであと'+grade.extraTurns+'手！ 別の止まり方を探そう。':
      'Bランク合格まであと'+(grade.turns-grade.passThrough)+'手！';
    $('fun-again').hidden=false;
    say(grade.passed?'合格！ 次はSランクを目指そう。':'すべての星を獲得！ 合格手数を目指して再挑戦しよう。');
   }else{
    say('すべての星をゲット！');
   }
   $('fun-finish').textContent=trace.length+'手でクリア！ 壁移動'+trace.filter(a=>a.prep.type==='wall').length+'回 ／ 考える＋操作する時間 '+formattedTime(elapsed)+' ／ Undo '+undoUses+'回 ／ ヒント '+hintUses+'回';
   $('fun-next').textContent=number<entries.length?'次のステージへ':'最初からもう一度';
  }else say('次の1手を考えよう。');
 }catch(e){console.error(e);say('操作を続けられませんでした。最初からやり直してみてください。',true);}
 finally{
  busy=false;render();
  // Show the result in the visible iPhone viewport instead of leaving it under
  // the game controls and Netlify's preview toolbar.
  if(solved(state)){
   requestAnimationFrame(()=>{
    const result=$('fun-result');
    if(!result.hidden){
     result.scrollIntoView({
      behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',
      block:'center'
     });
     $('fun-rank')?.focus({preventScroll:true});
    }
   });
  }
 }
}
function undo(){
 if(busy||!trace.length)return;
 trace.pop();undoUses++;state=replay(stage,trace).state;mode='none';selectedWall=null;selectedPrep={type:'none'};
 $('fun-result').hidden=true;render();say('1手戻しました。');
}
$('fun-tools').addEventListener('click',e=>{
 const b=e.target.closest('[data-fun-mode]');
 if(b&&!b.disabled)changeMode(b.dataset.funMode);
});
$('fun-board').addEventListener('click',e=>{
 const b=e.target.closest('[data-cell]');if(b&&!b.disabled)selectCell(Number(b.dataset.cell));
});
$('fun-dpad').addEventListener('click',e=>{
 const b=e.target.closest('[data-fun-dir]');
 if(b&&!b.disabled&&selectedPrep)takeStep({prep:selectedPrep,dir:Number(b.dataset.funDir)});
});
$('fun-undo').addEventListener('click',undo);
$('fun-retry').addEventListener('click',()=>setStage(number));
$('fun-hint').addEventListener('click',()=>{
 if(!stage||busy||(longMode&&solved(state)))return;
 const panel=$('fun-feedback');
 if(!longMode){hintUses++;panel.hidden=false;panel.textContent=stage.chapter.hint;return;}
 const hints=buildProgressiveHints(stage);
 if(hintLevel<hints.length){hintLevel++;hintUses++;}
 const hint=hints[hintLevel-1];
 const heading=document.createElement('strong');
 heading.textContent=hint.title;
 const description=document.createElement('p');
 description.textContent=hint.body;
 panel.replaceChildren(heading,description);
 if(hint.steps.length){
  const ordered=document.createElement('ol');
  for(const line of hint.steps){const item=document.createElement('li');item.textContent=line;ordered.append(item);}
  panel.append(ordered);
 }
 const caveat=document.createElement('small');
 caveat.textContent='ヒントを使ってもSランクの判定は手数だけで決まります。';
 panel.append(caveat);
 panel.hidden=false;
 $('fun-hint').dataset.hintStep=String(hintLevel);
 $('fun-hint').textContent=hintLevel===4?'答えを見直す':hintLevel===3?'最短解を見る 4/4':'次のヒント '+(hintLevel+1)+'/4';
 if(hintLevel>=3)panel.scrollIntoView({behavior:'smooth',block:'nearest'});
});
$('fun-next').addEventListener('click',()=>setStage(number===entries.length?1:number+1));
$('fun-again')?.addEventListener('click',()=>setStage(number));
window.addEventListener('resize',()=>{if(stage)render();});
document.addEventListener('keydown',e=>{
 if(!stage||busy)return;
 const dir={ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3}[e.key];
 if(dir!==undefined&&selectedPrep&&!e.target.closest('button')){e.preventDefault();takeStep({prep:selectedPrep,dir});}
});
try{
 const res=await fetch(new URL('data/chapters/chapter-01/'+(longMode?'long-candidates-v1.json':'fun-candidates-v1.json'),root));
 if(!res.ok)throw Error('HTTP '+res.status);
 const bundle=await res.json();
 if(bundle.version!==1||bundle.stages?.length!==(longMode?3:10))throw Error('候補データが不完全です');
 entries=bundle.stages;
 for(const s of entries){
  validateStage(s);
  if(longMode&&!validateChallenge(s))throw Error('最短手数と合格手数の検証情報がありません');
 }
 const selected=Number(new URLSearchParams(location.search).get('stage'));
 setStage(Number.isInteger(selected)&&selected>=1&&selected<=entries.length?selected:1);
}catch(error){
 console.error(error);
 $('fun-title').textContent='候補を表示できませんでした';
 say('通信を確認してページを再読み込みしてください。',true);
}
