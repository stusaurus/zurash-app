import {CHAPTER_TWO_KEY,loadChapterTwo} from './puzzle/chapter-two-progress.js';
import {validateChapterOneChallenges,challengeForChapterOneStage,gradeChapterOneClear,gradeChapterOneBest,chapterOneRankLabel} from './puzzle/chapter-one-challenges.js';
import {renderExpedition} from './expedition-view.js';
import {renderExpeditionAlbum} from './expedition-album-view.js';
import {loadHome,saveHome,nextRepairMission} from './puzzle/house.js';
import {createHouseView} from './house-view.js';
import {itemsAvailableAt} from './puzzle/campaign.js';
import {createCatalog} from './puzzle/catalog.js';
import {initialPuzzle} from './puzzle/schema.js';
import {applyPuzzle,replay,solved,successors} from './puzzle/engine.js';
import {newProgress,balance,loadProgress,saveProgress} from './puzzle/progress.js';
import {validateCampaign,validateChapterStage,enterChapterStage,clearChapterStage,unlockedItems,canEnterChapterStage,chapterSaveKey} from './puzzle/campaign.js';

const root=new URL('../',import.meta.url),chapterRoot=new URL('data/chapters/chapter-01/',root),preview=true;
const $=id=>document.getElementById(id);
const itemModes={ice:'iceBlock',glove:'powerGlove',warp:'warpCrystal'};
const itemNames={iceBlock:'アイスブロック',powerGlove:'パワーグローブ',warpCrystal:'ワープクリスタル'};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
let homeSave,houseView;
let showExpeditionOnArrival=new URLSearchParams(location.search).get('view')==='expedition';
let campaign,chapter,catalog,chapterChallenges=null,stage,state,progress,trace=[],mode='none',selectedPrep={type:'none'},selectedWall=null,busy=false,saveError=false;
const json=async url=>{const r=await fetch(url);if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json();};
function tell(message,error=false){$('message').textContent=message;$('message').classList.toggle('saving-error',error);}
function persist(){
  try{homeSave.progress=progress;saveHome(localStorage,homeSave);saveError=false;}
  catch{saveError=true;tell('この端末に保存できませんでした。画面を閉じる前に保存容量を確認してください。',true);}
}
function showNotice(kicker,title,text,label,action,secondary=null,grade=null) {
  if($('notice').open)$('notice').close();
  $('notice-kicker').textContent=kicker;$('notice-title').textContent=title;$('notice-text').textContent=text;
  $('notice-primary').textContent=label;$('notice-primary').onclick=()=>{$('notice').close();action?.();};
  $('notice-secondary').hidden=!secondary;
  $('notice-secondary').onclick=()=>{$('notice').close();secondary?.();};
  const rankPanel=$('notice-rank');
  rankPanel.hidden=!grade;
  if(grade){
    rankPanel.dataset.rank=grade.rank;
    $('notice-rank-label').textContent=grade.rank==='S'?'S':'未クリア';
    $('notice-rank-detail').textContent=grade.rank==='S'
      ? `最短${grade.minimumTurns}手でクリア！`
      : `最短は${grade.minimumTurns}手。もう一度挑戦してみよう！`;
  }
  $('notice').showModal();
}
async function openStage(number) {
  if(busy)return;busy=true;
  try{
    const next=await catalog.get(number-chapter.firstStage+1);validateChapterStage(campaign,chapter,next);
    const oldReached=homeSave.home.reached;
    const entered=enterChapterStage(campaign,chapter,next,progress,{preview,houseMode:true});
    homeSave.home.reached=Math.max(oldReached,number);
    entered.events=campaign.unlocks.filter(e=>e.stageNumber===number&&oldReached<number);
    stage=next;progress=entered.progress;state=initialPuzzle(stage);trace=[];mode='none';selectedPrep={type:'none'};selectedWall=null;
    persist();render();if(!saveError)tell(stage.chapter.tutorialItem?'新しい道具を使ってみよう。':'準備を選んで、方向ボタンで滑ろう。');
    if(entered.events.length) {
      const event=entered.events.at(-1);
      showNotice(`STAGE ${number} ・ 新しい道具`,'新しい道具を見つけた！',`${{iceBlock:'玄関の道具箱に、氷を置く道具が見つかった！',powerGlove:'家の古い作業台から、力持ちのグローブを見つけた！',warpCrystal:'寝室の窓に、クリスタルの光が差しこんだ！'}[event.item]} 星は使いません。`, '使ってみる');
    }
  }catch(error){tell('ステージを開けませんでした。通信を確認して、もう一度選んでください。',true);console.error(error);}
  finally{busy=false;}
}
let expeditionCatalog=null;
async function refreshHomeExpedition(){
 const panel=$('expedition-home');
 try{
  if(!localStorage.getItem(CHAPTER_TWO_KEY)){panel.hidden=true;return;}
  expeditionCatalog??=json(new URL('data/chapters/chapter-02/adventure-v1.json',root));
  const entries=(await expeditionCatalog).stages,save=loadChapterTwo(localStorage,entries);
  if($('home-screen').hidden)return;
  if(!Object.keys(save.completed).length){panel.hidden=true;return;}
  panel.hidden=false;
  const journey=renderExpedition(panel,entries,save);
  const title=document.createElement('h2');
  title.textContent=journey.complete?'おかえり！ 氷海の冒険の思い出':'氷海の冒険の思い出';
  title.tabIndex=-1;panel.prepend(title);
  const album=document.createElement('section');
  album.id='expedition-memory-album';
  renderExpeditionAlbum(album,entries,save);
  panel.append(album);
  const link=document.createElement('a');link.href='./chapter-two.html?trial=1';link.textContent='氷海の冒険へ戻る';panel.append(link);
  const houseLink=document.createElement('a');houseLink.href='#home-screen';houseLink.className='expedition-house-link';houseLink.textContent='トリケンの家を眺める';panel.append(houseLink);
  if(showExpeditionOnArrival){
   showExpeditionOnArrival=false;
   panel.dataset.arrival='true';
   requestAnimationFrame(()=>{
    if(!panel.hidden&&document.contains(panel)){
     panel.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
     title.focus({preventScroll:true});
    }
   });
  }
 }catch{panel.hidden=$('home-screen').hidden;panel.textContent='冒険の記録を読み込めませんでした。元の記録は保持しています。';}
}
function showHome(){
 const unlocked=chapter.stageIds.every(id=>Object.hasOwn(progress.completed,id));
 const chapterTwoLink=$('chapter-two-link');
 // Always offer an accessible, honest entry. Trial mode never gives campaign rewards.
 chapterTwoLink.hidden=false;
 chapterTwoLink.href=unlocked?'./chapter-two.html':'./chapter-two.html?trial=1&practice=1&stage=51';
 chapterTwoLink.textContent=unlocked?'❄ 第2章・氷海':'❄ 第2章・おためし';
 $('chapter-two-lock').textContent=unlocked?'第2章が解放されました！':'通常冒険は第1章50面クリアで解放。おためしは報酬なしで遊べます。';
 document.querySelector('.game-panel').hidden=true;
 $('home-screen').hidden=false;
 houseView.renderHome();
 void refreshHomeExpedition();
}
function currentOptions(){return solved(state)?[]:successors(stage,state);}
function renderModes(options) {
  const unlocked=itemsAvailableAt(campaign,homeSave.home.reached);
  const entries=[['none','そのまま滑る','壁移動を省略'],['wall','壁ずらし','1マス'],['ice','氷を置く',''],['glove','グローブ',''],['warp','ワープ','']];
  $('modes').innerHTML=entries.map(([key,label,sub])=>{
    let disabled=solved(state),note=sub;
    if(key==='wall')disabled||=!options.some(o=>o.action.prep.type==='wall');
    if(itemModes[key]) {
      const item=itemModes[key],available=unlocked.includes(item);
      disabled||=!available||!state.inventory[item];
      note=!available?`${campaign.unlocks.find(e=>e.item===item).stageNumber}面で解放`:state.inventory[item]?`あと ${state.inventory[item]} 回`:'この面では使えません';
    }
    return `<button class="mode ${mode===key?'active':''}" data-mode="${key}" aria-pressed="${mode===key}" ${disabled?'disabled':''}>${label}<small>${note}</small></button>`;
  }).join('');
}
function renderBoard(options) {
  const p=selectedPrep,visual={position:state.position,walls:[...state.walls],ice:[...state.ice]};
  if(p?.type==='wall'||p?.type==='glove')visual.walls=visual.walls.map(c=>c===p.from?p.to:c);
  if(p?.type==='ice')visual.ice.push(p.to);
  if(p?.type==='warp')visual.position=p.to;
  const preps=options.map(o=>o.action.prep).filter(p=>p.type===mode);
  const hotspots=preps.filter(p=>mode==='ice'||mode==='warp'||p.from===selectedWall).map(p=>p.to);
  const width=stage.board.width,height=stage.board.height,playable=new Set(stage.board.playableCells??Array.from({length:width*height},(_,i)=>i));
  $('board').style.gridTemplateColumns=`repeat(${width},minmax(0,1fr))`;
  // The comparison view fits tall boards into a phone viewport; normal gameplay stays unchanged.
  // Cells remain tappable (approximately >=44 CSS px on common phone viewports).
  if(document.documentElement.classList.contains('art-review-approved')&&window.innerWidth<=600){
    const maxHeight=Math.min(500,window.innerHeight*.55);
    const fittedWidth=Math.min(470,Math.floor((maxHeight-24)*width/height)+24);
    $('board').style.maxWidth=`${Math.max(175,fittedWidth)}px`;
  }else $('board').style.removeProperty('max-width');
  $('board').setAttribute('data-stage',stage.chapter.number);$('board').setAttribute('aria-label',`ステージ${stage.chapter.number}、横${width}マス、縦${height}マス`);
  const selectedOptions=options.filter(o=>same(o.action.prep,selectedPrep));
  const arrivals=new Set(selectedOptions.map(o=>o.state.position));
  const cells=[];
  for(let c=0;c<width*height;c++) {
    if(!playable.has(c)){cells.push('<span class="hole" aria-hidden="true"></span>');continue;}
    const wall=visual.walls.includes(c),ice=visual.ice.includes(c),star=state.stars.includes(c),socket=stage.iceSockets.includes(c)&&!ice;
    const pair=stage.portals.findIndex(pair=>pair.includes(c)),player=visual.position===c;
    const classes=['cell',wall?'wall':'',ice?'ice':'',socket?'socket':'',pair>=0?'portal':'',hotspots.includes(c)?'hot':'',selectedWall===c?'selected':'',arrivals.has(c)&&!player?'arrival':''].filter(Boolean).join(' ');
    const label=[`左から${c%width+1}、上から${Math.floor(c/width)+1}`,player?'トリケン':'',wall?'壁':'',ice?'設置した氷':'',star?'星':'',socket?'氷ソケット':'',pair>=0?'ポータル':'',hotspots.includes(c)?'準備の移動先':''].filter(Boolean).join('、');
    cells.push(`<button class="${classes}" data-cell="${c}" ${pair>=0?`data-pair="${pair+1}"`:''} aria-label="${label}" ${solved(state)?'disabled':''}>${star?'<span class="star" aria-hidden="true">★</span>':''}${player?'<img src="./assets/triken-orange-80.png" alt="" draggable="false">':''}</button>`);
  }
  $('board').innerHTML=cells.join('');
  for(const button of document.querySelectorAll('[data-dir]'))button.disabled=!selectedOptions.some(o=>o.action.dir===Number(button.dataset.dir));
}
function renderTown(){
  const names=['氷細工工房','氷の荷揚げ場','転送門'],icons=['⚒','⚙','◇'];
  $('town').innerHTML=campaign.unlocks.map((e,i)=>{
    const built=Object.hasOwn(progress.town,e.projectId);
    return `<div class="building ${built?'built':''}" data-project="${e.projectId}" data-built="${built}"><span class="building-icon" aria-hidden="true">${icons[i]}</span><strong>${names[i]}</strong><small>${built?itemNames[e.item]+' 解放済み':e.stageNumber+'面で完成'}</small></div>`;
  }).join('');
  $('completion').textContent=`${chapter.stageIds.filter(id=>Object.hasOwn(progress.completed,id)).length} / ${chapter.count} クリア`;
}
function render(){
  const options=currentOptions();
  $('stage-number').textContent=`STAGE ${String(stage.chapter.number).padStart(2,'0')} / ${chapter.count}`;
  $('stage-title').textContent=stage.chapter.title;$('focus').textContent=stage.chapter.focus;
  $('moves').textContent=trace.length;$('remaining').textContent=state.stars.length;$('balance').textContent=balance(progress);
  const best=gradeChapterOneBest(chapterChallenges,stage,progress.completed[stage.id]);
  $('chapter-one-best').hidden=!best;
  if(best)$('chapter-one-best').textContent=`ベスト ${chapterOneRankLabel(best)}（${best.turns}手）`;
  $('stage-list').disabled=false;$('retry').disabled=false;$('hint').disabled=false;$('undo').disabled=!trace.length||solved(state);
  renderModes(options);renderBoard(options);renderTown();
  $('ice-legend').hidden=!stage.iceSockets.length;$('warp-legend').hidden=!stage.portals.length;
  $('instruction').textContent=selectedPrep&&selectedPrep.type!=='none'?'準備中です。方向を選ぶと、この手が確定します。':mode==='wall'||mode==='glove'?'壁 → 光る移動先 → 滑る方向の順に選ぼう。':mode==='ice'?'光るソケット → 滑る方向の順に選ぼう。':mode==='warp'?'ポータルの上でワープを選び、滑る方向を決めよう。':'方向を選んで滑ろう。壁を動かす手も選べるよ。';
}
function selectMode(nextMode){
  mode=nextMode;selectedWall=null;selectedPrep=mode==='none'?{type:'none'}:null;
  if(mode==='warp')selectedPrep=currentOptions().map(o=>o.action.prep).find(p=>p.type==='warp')??null;
  render();if(mode==='warp'&&!selectedPrep)tell('先にポータルへ滑ってから、ワープを選ぼう。');else if(!saveError)tell('');
}
function selectCell(cell){
  if(solved(state))return;
  const options=currentOptions(),preps=options.map(o=>o.action.prep).filter(p=>p.type===mode);
  const arrival=selectedPrep&&options.find(o=>same(o.action.prep,selectedPrep)&&o.state.position===cell);
  if(arrival){move(arrival.action.dir);return;}
  const chosen=preps.find(p=>p.to===cell&&((mode==='wall'||mode==='glove')?p.from===selectedWall:true));
  if(chosen){selectedPrep=chosen;render();tell('準備を選びました。滑る方向を決めよう。');return;}
  if((mode==='wall'||mode==='glove')&&preps.some(p=>p.from===cell)){selectedWall=cell;selectedPrep=null;render();tell('光る移動先を選ぼう。');return;}
  if(mode==='none'&&state.walls.includes(cell)){selectMode('wall');selectCell(cell);return;}
  tell(mode==='none'?'方向ボタンで滑れます。':'光るマスを選ぼう。準備をやめるなら「そのまま滑る」。');
}
function move(dir){
  if(busy||!selectedPrep||solved(state))return;
  const action={prep:selectedPrep,dir},legal=currentOptions().some(o=>same(o.action,action));if(!legal)return;
  const approved=document.documentElement.classList.contains('art-review-approved');
  const fromSprite=approved?$('board').querySelector('.cell img'):null;
  const startRect=fromSprite?.getBoundingClientRect();
  const oldStarCount=state.stars.length;
  state=applyPuzzle(stage,state,action);trace.push(action);mode='none';selectedPrep={type:'none'};selectedWall=null;render();
  // Visual-only FLIP: move the approved Triken image along the validated slide path.
  // Do not change game timing, rules, score, undo or saved progress.
  if(approved&&startRect&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    const sprite=$('board').querySelector('.cell img');
    const cell=sprite?.closest('.cell'),finishRect=sprite?.getBoundingClientRect();
    if(sprite&&finishRect&&typeof sprite.animate==='function'){
      const dx=startRect.left+startRect.width/2-finishRect.left-finishRect.width/2;
      const dy=startRect.top+startRect.height/2-finishRect.top-finishRect.height/2;
      const travel=Math.hypot(dx,dy);
      sprite.animate([
        {transform:`translate(${dx}px, ${dy}px) scale(.92)`,opacity:.92},
        {transform:'translate(0px, 0px) scale(1)',opacity:1},
      ],{duration:Math.min(400,210+travel*.35),easing:'cubic-bezier(.2,.7,.2,1)'});
    }
    if(oldStarCount>state.stars.length&&cell){
      cell.classList.add('star-landing');
      setTimeout(()=>{if(cell.isConnected)cell.classList.remove('star-landing');},650);
    }
  }
  if(solved(state)) {
    // Collecting all stars is a finished attempt, not a campaign clear unless
    // the exact independently certified minimum was achieved.
    const grade=chapterChallenges?gradeChapterOneClear(chapterChallenges,stage,trace.length):null;
    if(grade?.rank!=='S'){
      const hint=grade?`最短は${grade.minimumTurns}手。あと${grade.extraTurns}手減らせばクリア！`:'最短手数を確認できません。通信を確認してください。';
      showNotice('RETRY','まだクリアではありません',
        `${trace.length}手で星を全部集めた！ ${hint} 家づくりの星と次のステージは解放されません。`,
        'もう一度挑戦',()=>openStage(stage.chapter.number),null,grade);
      return;
    }
    const already=Object.hasOwn(progress.completed,stage.id);
    progress=clearChapterStage(campaign,chapter,stage,progress,trace,{preview,houseMode:true,minimumTurns:grade.minimumTurns}).progress;persist();render();
    const last=stage.chapter.number===chapter.firstStage+chapter.count-1;
    const nextHome=nextRepairMission(homeSave);
    const homeCue=nextHome.state==='ready'?
      ` 家に帰ると「${nextHome.task.label}」を直せるよ！`:
      nextHome.state==='stars'?` 次の家づくりまで星あと${nextHome.missingStars}個。`:
      nextHome.state==='stages'?` 次の修復はステージ${nextHome.task.at}で解放されるよ。`:'';
    const noticeCopy=`最短${trace.length}手で完全クリア！ ${already?'このステージの家づくりの星は獲得済みです。':'家づくりの星を1個獲得しました。'}${saveError?' 今回の記録は端末に保存できていません。':homeCue}`;
    showNotice(last?'CHAPTER CLEAR':'STAGE CLEAR',last?'50ステージクリア！':'クリア！',noticeCopy,nextHome.state==='ready'?'家を直す':'家に帰る',()=>showHome(),()=>openStage(stage.chapter.number),grade);
  }else if(!saveError)tell('次の準備と、滑る方向を選ぼう。');
}
$('modes').addEventListener('click',e=>{const button=e.target.closest('[data-mode]');if(button&&!button.disabled)selectMode(button.dataset.mode);});
$('board').addEventListener('click',e=>{const button=e.target.closest('[data-cell]');if(button&&!button.disabled)selectCell(Number(button.dataset.cell));});
for(const button of document.querySelectorAll('[data-dir]'))button.addEventListener('click',()=>move(Number(button.dataset.dir)));
$('undo').addEventListener('click',()=>{if(!trace.length||solved(state))return;trace.pop();state=replay(stage,trace).state;mode='none';selectedPrep={type:'none'};selectedWall=null;render();tell('1手もどりました。');});
$('retry').addEventListener('click',()=>openStage(stage.chapter.number));
$('hint').addEventListener('click',()=>tell(stage.chapter.hint));
$('stage-list').addEventListener('click',()=>{
  $('stage-grid').innerHTML=chapter.stageIds.map((id,i)=>{
    const number=chapter.firstStage+i,event=campaign.unlocks.find(e=>e.stageNumber===number),cleared=Object.hasOwn(progress.completed,id);
    const record=chapterChallenges?.stages[i];
    const best=record?gradeChapterOneBest(chapterChallenges,{id,revision:record.revision,chapter:{number}},progress.completed[id]):null;
    const rank=best?chapterOneRankLabel(best):'';
    return `<button data-go="${number}" class="${cleared?'cleared':''} ${stage.chapter.number===number?'current':''}" ${event?'data-unlock="'+event.item+'"':''} ${canEnterChapterStage(chapter,progress,number)?'':'disabled'} aria-label="ステージ${number}${cleared?' クリア済み':''}${rank?' ランク'+rank:''}">${number}${rank?`<small class="stage-rank" data-rank="${best.rank}">${rank}</small>`:''}${event?'<small>道具解放</small>':''}</button>`;
  }).join('');$('stage-dialog').showModal();
});
$('stage-grid').addEventListener('click',e=>{const button=e.target.closest('[data-go]');if(button&&!button.disabled){$('stage-dialog').close();openStage(Number(button.dataset.go));}});
document.querySelector('[data-close-stages]').addEventListener('click',()=>$('stage-dialog').close());
document.addEventListener('keydown',e=>{
  if(document.querySelector('.game-panel').hidden||$('notice').open||$('stage-dialog').open||!state)return;
  const dir={ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3}[e.key];if(dir!==undefined){e.preventDefault();move(dir);}
});
try{
  [campaign,chapter]=await Promise.all([json(new URL('data/campaign.json',root)),json(new URL('chapter.json',chapterRoot))]);validateCampaign(campaign);
  const manifest=await json(new URL(chapter.catalog,chapterRoot));
  // Challenge metadata is optional UI enhancement. A failed certificate must
  // never lock players out of Chapter 1 or change saved stars.
  try {
    chapterChallenges=validateChapterOneChallenges(await json(new URL('challenges-v1.json',chapterRoot)));
  } catch(error) {
    chapterChallenges=null;
    console.warn('Chapter 1 challenge grades unavailable:',error);
  }
  catalog=createCatalog(manifest,async path=>{const r=await fetch(new URL(path,chapterRoot));if(!r.ok)throw Error('Stage request failed');return r.text();},{allowCandidates:preview});
  try{homeSave=loadHome(localStorage);progress=homeSave.progress;}
  catch{throw Error('この章の記録を読み込めません。別のブラウザでお試しください。既存の記録は消去していません。');}
  houseView=createHouseView({element:$('home-screen'),getSave:()=>homeSave,setSave:n=>{saveHome(localStorage,n);homeSave=n;progress=n.progress;},onPlay:()=>{
    $('home-screen').hidden=true;$('expedition-home').hidden=true;document.querySelector('.game-panel').hidden=false;
    const first=chapter.stageIds.findIndex(id=>!Object.hasOwn(progress.completed,id));openStage(first<0?50:first+1);
  },onComplete:()=>showNotice('CHAPTER COMPLETE','トリケンの家が完成！','50の冒険と、あなたが選んだ家具。ここがトリケンの大切な居場所になりました。次はご近所へ！','家を眺める',()=>{showHome();$('scene-heading')?.focus({preventScroll:true});$('home-screen').scrollIntoView({block:'start',behavior:'instant'});}),onError:e=>showNotice('お知らせ','修復を確認してください',e.message,'閉じる')});
  $('return-home').onclick=showHome;showHome();houseView.resume();

}catch(error){$('stage-title').textContent='読み込みを確認してください';tell(error.message,true);console.error(error);}
