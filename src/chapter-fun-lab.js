import {expeditionProgress,expeditionReward} from './puzzle/expedition.js';
import {renderExpedition} from './expedition-view.js';
import {loadHome,clears} from './puzzle/house.js';
import {CHAPTER_TWO_KEY,practiceSaveKey,newChapterTwo,canEnterTwo as canEnterTwoBase,checkpointTwo,loadChapterTwo,writeChapterTwo,recoverInvalidChapterTwo} from './puzzle/chapter-two-progress.js';
import {loadChapterTwoReviews,recordChapterTwoReview,exportChapterTwoReviews} from './puzzle/chapter-two-playtest.js';
import {initialPuzzle,validateStage} from './puzzle/schema.js';
import {successors,applyPuzzle,solved,replay} from './puzzle/engine.js';
import {validateChallenge,evaluateChallenge} from './puzzle/challenge-grade.js';
import {buildProgressiveHints} from './puzzle/progressive-hints.js';
import {initialGate,validateGateStage,gateSuccessors,applyGate,replayGate} from './puzzle/gate-v2.js';
import {buildGateHints} from './puzzle/gate-hints.js';

const $=id=>document.getElementById(id);
const modeNames={none:'そのまま滑る',wall:'壁をずらす',ice:'氷を置く',glove:'グローブ',warp:'ワープ'};
const pagePath=location.pathname.replace(/\/$/,'').replace(/\.html$/,'');
const adventureMode=pagePath.endsWith('/chapter-two');
const saveOptions={practice:new URLSearchParams(location.search).get('practice')==='1'};
const canEnterTwo=(entries,save,index)=>canEnterTwoBase(entries,save,index,saveOptions);
let chapterSave=newChapterTwo(),saveReadOnly=false;
const longMode=pagePath.endsWith('/long-lab');
const itemMode=pagePath.endsWith('/item-lab');
const itemLongMode=pagePath.endsWith('/item-long-lab');
const dualItemMode=pagePath.endsWith('/dual-item-lab');
const gateLongMode=pagePath.endsWith('/gate-long-lab');
const gateCycleMode=pagePath.endsWith('/gate-cycle-lab');
const gateClosureMode=pagePath.endsWith('/gate-closure-lab');
const gateGloveMode=pagePath.endsWith('/gate-glove-lab');
const gateWarpMode=pagePath.endsWith('/gate-warp-lab');
let gateMode=gateGloveMode||gateLongMode||gateCycleMode||gateClosureMode||gateWarpMode||pagePath.endsWith('/gate-lab');
const challengeMode=adventureMode||longMode||itemMode||gateMode||itemLongMode||dualItemMode;
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
const currentOptions=()=>solved(state)?[]:(gateMode?gateSuccessors(stage,state):successors(stage,state));
const root=new URL('../',import.meta.url);

function say(message,error=false){
 $('fun-prompt').textContent=message;
 $('fun-prompt').style.color=error?'#aa4538':'';
}
function showSelection(){
 $('stage-choices').replaceChildren();
 let completed=0,fullRank=0;
 for(let n=1;n<=entries.length;n++){
  const candidate=entries[n-1],best=sessionBestTurns.get(candidate.id);
  const button=document.createElement('button');
  button.type='button';
  button.textContent=String(adventureMode?candidate.chapter.number:n);
  if(adventureMode)button.disabled=!canEnterTwo(entries,chapterSave,n-1);
  button.setAttribute('data-stage-choice',String(n));
  button.setAttribute('aria-current',n===number?'step':'false');
  let label=(adventureMode?'ステージ'+candidate.chapter.number:'候補ステージ'+n)+(challengeMode?' '+candidate.chapter.title:'');
  if(challengeMode&&best!==undefined){
   const rank=evaluateChallenge(candidate,best).rank;
   const badge=document.createElement('span');
   badge.className='fun-rank-mark';
   badge.dataset.rank=rank;
   badge.textContent=rank==='unqualified'?'☆':rank;
   badge.setAttribute('aria-hidden','true');
   button.append(badge);
   label+=' 自己ベスト'+best+'手 '+(rank==='unqualified'?'合格前':rank+'ランク');
   completed++;
   if(rank==='S')fullRank++;
  }
  button.setAttribute('aria-label',label);
  button.addEventListener('click',()=>setStage(n));
  $('stage-choices').append(button);
 }
 const progress=$('fun-progress');
 if(adventureMode){const journey=renderExpedition($('expedition-map'),entries,chapterSave,saveOptions);$('expedition-story').textContent=saveOptions.practice?'道具をつなぐ謎を、好きな順番で試そう。':journey.complete?'4つの灯りをつないだ！ トリケンの家へ帰ろう。':journey.lit?journey.stops[journey.lit-1].story:'4つの道しるべに、灯りを戻そう。';}
 if(progress)progress.textContent=(adventureMode?'冒険の記録：クリア ':'この試遊中の記録：クリア ')+completed+'/'+entries.length+'面 ／ Sランク '+fullRank+'/'+entries.length+'面';
}
function showExpeditionReward(before=null){
 if(!adventureMode)return;
 const panel=$('expedition-reward'),journey=expeditionProgress(entries,chapterSave,saveOptions);
 if(saveOptions.practice){panel.textContent='自由試遊のクリア！ 冒険では初クリアで結晶が集まる。';return;}
 const reward=before?expeditionReward(entries,before,chapterSave,stage,saveOptions):null;
 panel.textContent=reward?.crystals?'✧ 初クリア！ 道しるべの結晶 +1':'この面の結晶は獲得済み。最短記録に挑戦しよう。';
 if(reward?.newStops.length)panel.textContent+=(journey.complete?' 第2章クリア！ ':' ')+reward.newStops.at(-1).name+'に灯りがともった！ '+reward.newStops.at(-1).story;
 else if(journey.complete)panel.textContent+=' 第2章クリア！ 4つの灯りをつないだ。冒険の思い出を持って、家へ帰ろう。';
 else panel.textContent+=' 次の灯りまで、あと'+(5-journey.balance)+'個。';
}
function updateReviewForm(){
 const form=$('playtest-form');if(!form||!stage)return;
 $('review-enjoyment').value='';$('review-difficulty').value='';$('review-note').value='';
 try{
  const row=loadChapterTwoReviews(localStorage).reviews[stage.id];
  if(row){
   $('review-enjoyment').value=row.enjoyment;
   $('review-difficulty').value=row.difficulty??'';
   $('review-note').value=row.note;
   $('review-status').textContent='このステージの評価は保存済みです。変更して再保存できます。';
  }else $('review-status').textContent='この感想は端末内だけに保存されます。ステージを途中でやめても記録できます。';
 }catch(e){$('review-status').textContent='以前の感想データを読み込めません。元の内容を上書きしないよう、新しい評価の保存を停止しています。';}
}
function persistAdventure(){
 if(!adventureMode)return;
 try{chapterSave=checkpointTwo(chapterSave,entries,stage,trace,saveOptions);if(!saveReadOnly)writeChapterTwo(localStorage,chapterSave,saveOptions);}
 catch(e){saveReadOnly=true;$('save-status').textContent='保存できませんでした。この画面では遊べますが、再読み込みで進行が失われる場合があります。';}
}
function setStage(n,{resume=false}={}){
 if(busy||!entries[n-1]||(adventureMode&&!canEnterTwo(entries,chapterSave,n-1)))return;
 if(adventureMode)gateMode=entries[n-1].rulesVersion==='solo-v2-gate';
 number=n;stage=entries[n-1];state=gateMode?initialGate(stage):initialPuzzle(stage);trace=[];
 if(adventureMode&&resume&&chapterSave.active?.id===stage.id){trace=structuredClone(chapterSave.active.actions);state=(gateMode?replayGate(stage,trace):replay(stage,trace)).state;}
 persistAdventure();
 activeMs=0;activeSince=document.hidden?null:performance.now();hintUses=0;undoUses=0;hintLevel=0;
 mode='none';selectedWall=null;selectedPrep={type:'none'};busy=false;
 const query=new URL(location.href);
 query.searchParams.set('stage',String(adventureMode?stage.chapter.number:n));
 history.replaceState(null,'',query.pathname+query.search);
 $('fun-result').hidden=true;$('fun-feedback').hidden=true;
 $('fun-feedback').replaceChildren();
 if(challengeMode){$('fun-hint').textContent='ヒント 1/4';$('fun-hint').dataset.hintStep='0';}
 showSelection();render();updateReviewForm();
 if(adventureMode&&solved(state)){showExpeditionReward();const grade=evaluateChallenge(stage,trace.length);$('fun-result').hidden=false;$('fun-rank').textContent=grade.passed?grade.rank+'ランク合格！':'星は全部獲得！';$('fun-rank').dataset.rank=grade.rank;$('fun-benchmark').textContent='今回 '+grade.turns+'手 ／ 合格 '+grade.passThrough+'手以内 ／ 最短 '+grade.minimumTurns+'手（＋'+grade.extraTurns+'手）';$('fun-finish').textContent=trace.length+'手でクリア！ 壁移動'+trace.filter(a=>['wall','glove'].includes(a.prep.type)).length+'回';$('fun-next').textContent=number<entries.length?'次のステージへ':'家に帰る';}
 say(solved(state)?'クリアした記録から再開しました。':gateMode?(state.gateOpen?'氷扉が開いている。続きの1手を考えよう。':'氷扉は閉じている。✦スイッチの上に止まる方法を考えよう。'):number===1?'右へ滑って星を取ろう。':'光る停止マスをタップ。壁は選んで1マス動かせるよ。');
}
function paintBoard(options){
 const w=stage.board.width,h=stage.board.height;
 const maxH=adventureMode?Math.min(350,Math.max(230,innerHeight*.32)):Math.min(390,Math.max(270,innerHeight*.40));
 const availableWidth=Math.min(innerWidth-52,460);
 const width=Math.min(availableWidth,((maxH-26)/h)*w+26);
 const board=$('fun-board');
 board.style.width=Math.floor(width)+'px';
 board.style.gridTemplateColumns='repeat('+w+',minmax(0,1fr))';
 board.setAttribute('data-stage',String(number));
 board.setAttribute('aria-label',w+'列'+h+'段のパズル');
 const playable=new Set(stage.board.playableCells??Array.from({length:w*h},(_,i)=>i));
 const visual={position:state.position,walls:[...state.walls],ice:[...state.ice]};
 if(['wall','glove'].includes(selectedPrep?.type))visual.walls=visual.walls.map(c=>c===selectedPrep.from?selectedPrep.to:c);
 if(selectedPrep?.type==='warp')visual.position=selectedPrep.to;
 if(selectedPrep?.type==='ice')visual.ice.push(selectedPrep.to);
 const optionsOfMode=options.filter(o=>o.action.prep.type===mode).map(o=>o.action.prep);
 const hotspots=new Set(optionsOfMode.filter(p=>!['wall','glove'].includes(mode)||p.from===selectedWall).map(p=>p.to));
 const matches=options.filter(o=>same(o.action.prep,selectedPrep));
 const arrivals=new Set(matches.map(o=>o.state.position));
 let cells='';
 for(let c=0;c<w*h;c++){
  if(!playable.has(c)){cells+='<span class="hole" aria-hidden="true"></span>';continue;}
  const wall=visual.walls.includes(c),fixed=stage.fixed.includes(c),portal=stage.portals.some(pair=>pair.includes(c)),gate=gateMode&&c===stage.gate.tile,switchTile=gateMode&&c===stage.gate.switch,ice=visual.ice.includes(c),star=state.stars.includes(c),player=visual.position===c,arrive=arrivals.has(c)&&!player;
  const socket=stage.iceSockets.includes(c)&&!ice;
  const klass=['cell',wall?'wall':'',fixed?'wall fixed-wall':'',portal?'portal-cell':'',gate?'gate-tile':'',gate&&!state.gateOpen?'gate-closed':'',switchTile?'switch-tile':'',ice?'ice':'',socket?'socket':'',hotspots.has(c)?'hot':'',selectedWall===c?'selected':'',arrive?'arrival':''].filter(Boolean).join(' ');
  const label=['左から'+(c%w+1)+'、上から'+(Math.floor(c/w)+1),wall?'動く壁':'',fixed?'動かせない壁':'',portal?'転送門':'',gate?(state.gateOpen?'開いた氷扉':'閉じた氷扉'):'',switchTile?'扉を切り替えるスイッチ':'',player?'トリケン':'',star?'星':'',socket?'氷を置ける':'',hotspots.has(c)?'準備の移動先':'',arrive?'ここへ滑る':''].filter(Boolean).join('・');
  cells+='<button type="button" class="'+klass+'" data-cell="'+c+'" aria-label="'+label+'" '+(busy?'disabled':'')+'>'+
   (star?'<span class="star" aria-hidden="true">★</span>':'')+
   (portal?'<span class="portal-indicator" aria-hidden="true">✧</span>':'')+
   (gate?'<span class="gate-indicator" aria-hidden="true">'+(state.gateOpen?'◇':'▦')+'</span>':'')+
   (switchTile?'<span class="switch-indicator" aria-hidden="true">✦</span>':'')+
   (ice?'<span class="ice-indicator" aria-hidden="true">◆</span>':'')+
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
   $('fun-best').textContent=best===undefined?'':(adventureMode?'自己ベスト ':'今回の試遊での自己ベスト ')+best+'手';
  }
 }

 $('fun-title').textContent=stage.chapter.title;
 $('fun-count').textContent=adventureMode?'STAGE '+stage.chapter.number:number+' / '+entries.length;
 $('fun-focus').textContent=stage.chapter.focus;
 $('fun-moves').textContent=trace.length;
 $('fun-stars').textContent=state.stars.length;
 $('fun-shifts').textContent=trace.filter(a=>['wall','glove'].includes(a.prep.type)).length;
 if(adventureMode)for(const [item,type]of [['iceBlock','ice'],['powerGlove','glove'],['warpCrystal','warp']]){const b=document.querySelector('[data-fun-mode="'+type+'"]');if(b)b.textContent=modeNames[type]+'（残り '+state.inventory[item]+'）';}
 const warpRemaining=$('fun-warp-remaining');
 if(warpRemaining)warpRemaining.textContent=state.inventory.warpCrystal;
 const gateStatus=$('fun-gate-status');
 if(gateStatus)gateStatus.hidden=!gateMode;
 if(gateStatus)gateStatus.textContent='氷の扉：'+(state.gateOpen?'開いている ◇':'閉じている ▦')+' ／ ✦スイッチで開閉';
 paintBoard(options);
 for(const button of document.querySelectorAll('[data-fun-mode]')){
  const key=button.dataset.funMode;
  button.hidden=['ice','glove','warp'].includes(key)&&!stage.inventory[{ice:'iceBlock',glove:'powerGlove',warp:'warpCrystal'}[key]];
  button.disabled=busy||solved(state)||(key!=='none'&&!options.some(o=>o.action.prep.type===key));
  button.setAttribute('aria-pressed',String(mode===key));
 }
 for(const button of document.querySelectorAll('[data-fun-dir]')){
  const dir=Number(button.dataset.funDir);
  button.disabled=busy||!selectedPrep||!options.some(o=>same(o.action.prep,selectedPrep)&&o.action.dir===dir);
 }
 $('fun-undo').disabled=busy||trace.length===0;
 $('fun-retry').disabled=busy;
 if(challengeMode)$('fun-hint').disabled=busy||solved(state);
}
function changeMode(next){
 if(busy||solved(state))return;
 mode=next;selectedWall=null;selectedPrep=next==='none'?{type:'none'}:null;
 render();
 say(['wall','glove'].includes(next)?'動かす壁 → 光る移動先 → 滑る方向を選ぼう。':next==='ice'?'氷を置く光るソケットをタップしよう。':next==='warp'?'移動先のポータルをタップ → 滑る方向を選ぼう。':'停止先の光るマスをタップして滑ろう。');
}
function selectCell(cell){
 if(busy||solved(state))return;
 const options=currentOptions();
 if(selectedPrep){
  const arrival=options.find(o=>same(o.action.prep,selectedPrep)&&o.state.position===cell);
  if(arrival){takeStep(arrival.action);return;}
 }
 const preps=options.map(o=>o.action.prep).filter(p=>p.type===mode);
 if(mode==='wall'||mode==='glove'){
  if(selectedWall!==null){
   const prep=preps.find(p=>p.from===selectedWall&&p.to===cell);
   if(prep){selectedPrep=prep;render();say('壁をずらす準備ができた！ 光る停止マスか方向を選ぼう。');return;}
  }
  if(preps.some(p=>p.from===cell)){selectedWall=cell;selectedPrep=null;render();say('光る移動先をタップしよう。');return;}
 }
 if(mode==='ice'||mode==='warp'){
  const prep=preps.find(p=>p.to===cell);
  if(prep){selectedPrep=prep;render();say('氷を置く準備ができた！ 滑る方向を決めよう。');return;}
 }
 if(mode==='none'&&state.walls.includes(cell)){changeMode('wall');selectCell(cell);return;}
 if(mode==='none'&&stage.iceSockets.includes(cell)&&stage.inventory.iceBlock){changeMode('ice');selectCell(cell);return;}
 if(mode==='none'&&stage.portals.some(pair=>pair.includes(cell))&&stage.inventory.warpCrystal){changeMode('warp');selectCell(cell);return;}
 say('光るマスを選ぶか、右の十字キーで滑ろう。');
}
async function takeStep(action){
 if(busy||solved(state))return;
 if(!currentOptions().some(o=>same(o.action,action)))return;
 busy=true;
 const beforeSprite=$('fun-board').querySelector('.cell img');
 const startRect=beforeSprite?.getBoundingClientRect();
 const oldStarCount=state.stars.length;
 const expeditionBefore=adventureMode?structuredClone(chapterSave):null;
 const gateWasOpen=gateMode?state.gateOpen:null;
 try{
  state=gateMode?applyGate(stage,state,action):applyPuzzle(stage,state,action);trace.push(action);
  mode='none';selectedWall=null;selectedPrep={type:'none'};
  persistAdventure();render();
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
   showExpeditionReward(expeditionBefore);
   $('fun-result').hidden=false;
   const elapsed=activeTime();activeMs=elapsed;activeSince=null;
   const grade=evaluateChallenge(stage,trace.length);
   if(grade){
    const previousBest=sessionBestTurns.get(stage.id);
    if(previousBest===undefined||trace.length<previousBest)sessionBestTurns.set(stage.id,trace.length);
    showSelection();
    $('fun-rank').textContent=grade.passed?grade.rank+'ランク合格！':'星は全部獲得！ 合格は次の挑戦';
    $('fun-rank').dataset.rank=grade.rank;
    $('fun-benchmark').textContent='今回 '+grade.turns+'手 ／ 合格 '+grade.passThrough+'手以内 ／ 最短 '+grade.minimumTurns+'手（＋'+grade.extraTurns+'手）';
    $('fun-next-objective').textContent=
      grade.rank==='S'?'最短手数で完全攻略！':
      grade.passed?'Sランクまであと'+grade.extraTurns+'手！ 別の止まり方を探そう。':
      'Bランク合格まであと'+(grade.turns-grade.passThrough)+'手！';
    $('fun-again').hidden=false;
    say(grade.rank==='S'?'最短手数でクリア！ 次の冒険へ進もう。':grade.passed?'合格！ 次はSランクを目指そう。':'すべての星を獲得！ 合格手数を目指して再挑戦しよう。');
   }else{
    say('すべての星をゲット！');
   }
   $('fun-finish').textContent=trace.length+'手でクリア！ 壁移動'+trace.filter(a=>['wall','glove'].includes(a.prep.type)).length+'回 ／ 考える＋操作する時間 '+formattedTime(elapsed)+' ／ Undo '+undoUses+'回 ／ ヒント '+hintUses+'回';
   $('fun-next').textContent=number<entries.length?'次のステージへ':adventureMode?'家に帰る':'最初からもう一度';
  }else say(gateMode&&state.gateOpen!==gateWasOpen?(state.gateOpen?'カチッ！氷扉が開いた！ 通れる道が変わったよ。':'カチッ！氷扉が閉じた！ 止まる場所を考え直そう。'):'次の1手を考えよう。');
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
 const wasSolved=solved(state);
 trace.pop();undoUses++;state=(gateMode?replayGate(stage,trace):replay(stage,trace)).state;mode='none';selectedWall=null;selectedPrep={type:'none'};
 if(wasSolved&&!document.hidden&&activeSince===null)activeSince=performance.now();
 $('fun-result').hidden=true;persistAdventure();render();say('1手戻しました。');
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
 if(!challengeMode){hintUses++;panel.hidden=false;panel.textContent=stage.chapter.hint;return;}
 const hints=gateMode?buildGateHints(stage):buildProgressiveHints(stage);
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
 requestAnimationFrame(()=>{
  if(!panel.hidden)panel.scrollIntoView({
   behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',
   block:'center'
  });
 });
});
$('fun-next').addEventListener('click',()=>{if(adventureMode&&number===entries.length){location.href='./adventure.html';return;}setStage(number===entries.length?1:number+1);});
$('fun-again')?.addEventListener('click',()=>setStage(number));
$('download-invalid-save')?.addEventListener('click',()=>{
 try{
  const raw=localStorage.getItem(saveOptions.practice?practiceSaveKey:CHAPTER_TWO_KEY);
  if(raw===null)throw Error('No saved record');
  const url=URL.createObjectURL(new Blob([raw],{type:'text/plain;charset=utf-8'}));
  const a=document.createElement('a');
  a.href=url;a.download='zurash-chapter-two-'+(saveOptions.practice?'practice-':'')+'original-record.txt';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  $('save-status').textContent='元の記録をテキストファイルに保存しました。記録はまだ変更していません。';
 }catch(e){$('save-status').textContent='記録を書き出せませんでした。元の保存データは変更していません。';}
});
$('playtest-form')?.addEventListener('submit',e=>{
 e.preventDefault();
 if(!stage)return;
 try{
  recordChapterTwoReview(localStorage,stage,{
   enjoyment:$('review-enjoyment').value,
   difficulty:$('review-difficulty').value||null,
   note:$('review-note').value
  });
  $('review-status').textContent='このステージの感想を端末内に保存しました。必要なら「感想をまとめて保存」から共有できます。';
 }catch(e){$('review-status').textContent='感想を保存できませんでした。以前の感想データは上書きしていません。';}
});
$('export-playtest-reviews')?.addEventListener('click',()=>{
 try{
  const content=exportChapterTwoReviews(localStorage);
  const url=URL.createObjectURL(new Blob([content],{type:'application/json;charset=utf-8'}));
  const a=document.createElement('a');
  a.href=url;a.download='zurash-chapter-two-playtest-reviews.json';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  $('review-status').textContent='感想をJSONファイルに保存しました。このファイルをチャットに添付すると、ステージ改善の評価資料として利用できます。';
 }catch(e){$('review-status').textContent='感想を書き出せませんでした。元のデータは変更していません。';}
});
$('reset-invalid-save')?.addEventListener('click',()=>{
 if(!confirm('第2章の記録を作り直しますか？ 元の記録は別のキーへ退避します。第1章の家や星には影響しません。'))return;
 try{
  const {save,backupKey}=recoverInvalidChapterTwo(localStorage,entries,saveOptions);
  chapterSave=save;saveReadOnly=false;sessionBestTurns.clear();
  $('save-recovery').hidden=true;
  $('save-status').textContent='第2章の記録を復旧しました。元の記録はこの端末の '+backupKey+' に退避しました。';
  setStage(1);
 }catch(e){
  saveReadOnly=true;
  $('save-status').textContent='復旧できませんでした。元の記録はそのままです。空き容量を確認し、必要なら記録を書き出してください。';
 }
});

window.addEventListener('resize',()=>{if(stage)render();});
document.addEventListener('keydown',e=>{
 if(!stage||busy)return;
 const dir={ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3}[e.key];
 if(dir!==undefined&&selectedPrep&&!e.target.closest('button')){e.preventDefault();takeStep({prep:selectedPrep,dir});}
});
try{
 if(adventureMode&&new URLSearchParams(location.search).get('trial')!=='1'&&clears(loadHome(localStorage))<50){
  $('fun-title').textContent='もうすぐ、新しい冒険へ';$('fun-focus').textContent='第1章50面をクリアすると、第2章が解放されます。';$('fun-board').hidden=true;$('fun-controls')?.setAttribute('hidden','');
  for(const el of document.querySelectorAll('.fun-controls,.fun-actions,.fun-stats,.fun-gate-status'))el.hidden=true;
  const link=document.createElement('a');link.href='./chapter-two.html?trial=1';link.textContent='第2章だけ先行試遊する';$('stage-choices').append(link);$('stage-choices').closest('details')?.setAttribute('open','');
 }else{
 const res=await fetch(new URL(adventureMode?'data/chapters/chapter-02/adventure-v1.json':gateMode?(gateGloveMode?'data/chapters/chapter-02/gate-glove-candidates-v1.json':gateWarpMode?'data/chapters/chapter-02/gate-warp-candidates-v1.json':gateClosureMode?'data/chapters/chapter-02/gate-closure-candidates-v1.json':gateCycleMode?'data/chapters/chapter-02/gate-cycle-candidates-v1.json':gateLongMode?'data/chapters/chapter-02/gate-long-candidates-v1.json':'data/chapters/chapter-02/gate-candidates-v1.json'):dualItemMode?'data/chapters/chapter-02/dual-item-candidates-v1.json':itemLongMode?'data/chapters/chapter-02/item-long-candidates-v1.json':itemMode?'data/chapters/chapter-02/item-required-candidates-v1.json':'data/chapters/chapter-01/'+(longMode?'long-candidates-v1.json':'fun-candidates-v1.json'),root));
 if(!res.ok)throw Error('HTTP '+res.status);
 const bundle=await res.json();
 if(bundle.version!==1||(!adventureMode&&bundle.stages?.length!==(gateMode?1:dualItemMode?2:itemLongMode?3:itemMode?3:longMode?4:10)))throw Error('候補データが不完全です');
 entries=bundle.stages;
 for(const s of entries){
  if(s.rulesVersion==='solo-v2-gate')validateGateStage(s);else validateStage(s);
  if(challengeMode&&!validateChallenge(s))throw Error('最短手数と合格手数の検証情報がありません');
 }
 if(adventureMode){
  if(saveOptions.practice)$('save-status').textContent='自由試遊：好きな面を選べます。冒険の進行とは別に記録します。';
  try{chapterSave=loadChapterTwo(localStorage,entries,saveOptions);}
  catch(e){saveReadOnly=true;$('save-status').textContent='第2章の保存データを読み込めませんでした。元の記録は保持しています。復旧操作を選ぶまで上書きしません。';if($('save-recovery'))$('save-recovery').hidden=false;}
  for(const [id,r]of Object.entries(chapterSave.completed))sessionBestTurns.set(id,r.bestTurns);
 }
 const selected=Number(new URLSearchParams(location.search).get('stage'));
 const activeIndex=entries.findIndex(s=>s.id===chapterSave.active?.id);
 const desired=adventureMode?entries.findIndex(s=>s.chapter.number===selected)+1:selected;
 const n=adventureMode?(desired>0&&canEnterTwo(entries,chapterSave,desired-1)?desired:activeIndex>=0?activeIndex+1:1):(Number.isInteger(desired)&&desired>=1&&desired<=entries.length?desired:1);
 setStage(n,{resume:adventureMode});
 }
}catch(error){
 console.error(error);
 $('fun-title').textContent='候補を表示できませんでした';
 say('通信を確認してページを再読み込みしてください。',true);
}
