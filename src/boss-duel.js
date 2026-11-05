import {initial,actions,apply,DIRS} from './engine.js';
import {CPU_PRESETS,resolveCpuLevel,cpuAction,cpuRng} from './boss-cpu-settings.js';

const $=id=>document.getElementById(id);
let state=initial(0,0),turnSerial=0,cpuTimer=null,busy=false;
let pendingWall=null,preparedWall=undefined,history=[],lastAction=null;
let cpuLevel=resolveCpuLevel(new URLSearchParams(location.search).get('cpu'));
let rng=cpuRng(cpuLevel),lastScorePly=0;
let cpuWorker=null,pendingCpu=null,cpuWatchdog=null,cpuToken=0,workerDisabled=false;
const sameWall=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const legal=()=>actions(state);
const notice=text=>{$('boss-message').textContent=text;};

function paint(){
 const w=7,cells=[];
 const allowed=state.winner===null&&state.turn===0&&!busy?legal():[];
 const options=pendingWall===null?[]:allowed.filter(a=>a.wall?.wall===pendingWall).map(a=>a.wall.to);
 const destinations=new Set(options);
 const wallByCell=new Map(state.walls.map((position,index)=>[position,index]));
 for(let c=0;c<49;c++){
  const wall=wallByCell.has(c),star=state.stars.includes(c),p=state.players.indexOf(c),hot=destinations.has(c);
  const classes=['boss-cell',wall?'wall':'',star?'star-tile':'',p>=0?'player':'',hot?'target':'',wall&&pendingWall===wallByCell.get(c)?'selected':''].filter(Boolean).join(' ');
  const label='左から'+(c%w+1)+'・上から'+(Math.floor(c/w)+1)+(wall?'・動く壁':'')+(star?'・星':'')+(p===0?'・トリケン':p===1?'・ライバル':'')+(hot?'・壁の移動先':'');
  cells.push('<button type="button" class="'+classes+'" data-cell="'+c+'" aria-label="'+label+'" '+(busy||state.turn!==0||state.winner!==null?'disabled':'')+'>'+
    (star?'<span class="boss-star" aria-hidden="true">★</span>':'')+
    (p>=0?'<img src="./assets/triken-'+(p===0?'orange':'aqua')+'-80.png" alt="" draggable="false">':'')+'</button>');
 }
 $('boss-board').innerHTML=cells.join('');
 $('boss-board').dataset.turn=String(state.turn);
 $('boss-board').dataset.ply=String(state.ply);
 $('boss-score-human').textContent=String(state.scores[0]);
 $('boss-score-cpu').textContent=String(state.scores[1]);
 $('boss-turns').textContent=String(state.ply);
 $('boss-side').textContent=state.winner!==null?'決着！':state.turn===0?'あなたの番':'ライバルの番';
 $('boss-skip').disabled=busy||state.turn!==0||state.winner!==null;
 $('boss-reset').disabled=false;
 for(const button of document.querySelectorAll('[data-boss-dir]')){
  const dir=Number(button.dataset.bossDir);
  button.disabled=busy||state.turn!==0||state.winner!==null||preparedWall===undefined||
    !allowed.some(a=>a.dir===dir&&sameWall(a.wall,preparedWall));
 }
 $('boss-wall-label').textContent=preparedWall===undefined?
  pendingWall===null?'壁を動かすか、そのまま滑るを選ぼう。':'光るマスへ壁を動かそう。':
  preparedWall===null?'壁を動かさずに滑る方向を選ぼう。':'壁をずらした！ 滑る方向を選ぼう。';
}
function stopCpuWork(){
 clearTimeout(cpuTimer);
 clearTimeout(cpuWatchdog);
 pendingCpu=null;
 if(cpuWorker){cpuWorker.terminate();cpuWorker=null;}
}
function reset(){
 ++turnSerial;stopCpuWork();state=initial(0,0);rng=cpuRng(cpuLevel);lastScorePly=0;busy=false;history=[];
 pendingWall=null;preparedWall=undefined;lastAction=null;$('boss-result').hidden=true;
 notice('CPU：'+CPU_PRESETS[cpuLevel].label+'。最初はトリケンの番。壁をずらすか、そのまま滑ろう！');paint();
}
function finishBattle(){
 if(state.winner===null)return;
 const won=state.winner===0;
 $('boss-result-title').textContent=won?'ライバルに勝利！':'ライバルの勝利！';
 $('boss-result-message').textContent=won?'すごい！ ボードゲーム版につながる対戦ルールを体験した。':'惜しい！ 壁の配置と星を取る順番を変えて再挑戦しよう。';
 $('boss-result').hidden=false;
 notice(won?'星を先に3個取得して勝利！':'CPUが先に星を3個取得。再挑戦しよう。');
 requestAnimationFrame(()=>$('boss-result').scrollIntoView({behavior:'smooth',block:'nearest'}));
}
function cpuFailed(error){
 console.error(error);
 busy=false;
 notice('CPUの操作に失敗しました。対戦をやり直してください。');
 paint();
}
function commitCpuTurn(serial,act){
 if(serial!==turnSerial||state.winner!==null||!busy)return;
 if(!act){busy=false;notice('合法な行動がありません。新しい対戦を始めてください。');paint();return;}
 try{
  if(!legal().some(option=>JSON.stringify(option)===JSON.stringify(act)))throw Error('CPU attempted illegal action');
  const before=state.scores[0]+state.scores[1];
  state=apply(state,act);
  if(state.scores[0]+state.scores[1]>before)lastScorePly=state.ply;
 }catch(error){cpuFailed(error);return;}
 history.push(act);busy=false;
 notice(state.winner!==null?'対戦終了！': 'ライバルが'+(act.wall?'壁をずらして':'壁を動かさずに')+DIRS[act.dir].name+'へ滑った。あなたの番！');
 paint();finishBattle();
}
function fallbackCpuTurn(serial){
 if(serial!==turnSerial||state.winner!==null||!busy)return;
 try{
  const act=cpuAction(state,cpuLevel,rng,{scorelessPlies:state.ply-lastScorePly});
  commitCpuTurn(serial,act);
 }catch(error){cpuFailed(error);}
}
function abandonWorker(){
 workerDisabled=true;
 clearTimeout(cpuWatchdog);
 if(cpuWorker){cpuWorker.terminate();cpuWorker=null;}
 const requested=pendingCpu;
 pendingCpu=null;
 if(requested)fallbackCpuTurn(requested.serial);
}
function cpuTurn(serial){
 if(serial!==turnSerial||state.winner!==null||!busy)return;
 // The module worker keeps expensive search off the main animation thread.
 // An unsupported or broken worker reverts to the same validated CPU policy.
 if(workerDisabled||typeof Worker!=='function'){fallbackCpuTurn(serial);return;}
 try{
  if(!cpuWorker){
   cpuWorker=new Worker(new URL('./boss-cpu-worker.js',import.meta.url),{type:'module'});
   cpuWorker.addEventListener('message',event=>{
    const answer=event.data??{},request=pendingCpu;
    if(!request||request.token!==answer.token)return;
    pendingCpu=null;
    clearTimeout(cpuWatchdog);
    if(answer.type!=='result'){workerDisabled=true;cpuWorker?.terminate();cpuWorker=null;fallbackCpuTurn(request.serial);return;}
    commitCpuTurn(request.serial,answer.action);
   });
   cpuWorker.addEventListener('error',()=>abandonWorker());
   cpuWorker.postMessage({type:'init',level:cpuLevel});
  }
  const token=++cpuToken;
  pendingCpu={token,serial};
  cpuWorker.postMessage({type:'choose',token,state,scorelessPlies:state.ply-lastScorePly});
  cpuWatchdog=setTimeout(()=>{
   if(pendingCpu?.token===token)abandonWorker();
  },5000);
 }catch(error){
  console.warn('Worker unavailable; using main-thread CPU',error);
  if(pendingCpu)abandonWorker();
  else{workerDisabled=true;cpuWorker?.terminate();cpuWorker=null;fallbackCpuTurn(serial);}
 }
}
function humanTurn(dir){
 if(busy||state.turn!==0||state.winner!==null||preparedWall===undefined)return;
 const act=legal().find(a=>a.dir===dir&&sameWall(a.wall,preparedWall));
 if(!act)return;
 try{const before=state.scores[0]+state.scores[1];state=apply(state,act);if(state.scores[0]+state.scores[1]>before)lastScorePly=state.ply;}catch(error){console.error(error);notice('その手は実行できませんでした。');return;}
 history.push(act);pendingWall=null;preparedWall=undefined;
 if(state.winner!==null){paint();finishBattle();return;}
 busy=true;paint();notice('ライバルが考えています…');
 const serial=turnSerial;
 cpuTimer=setTimeout(()=>cpuTurn(serial),450);
}
$('boss-board').addEventListener('click',e=>{
 const button=e.target.closest('[data-cell]');if(!button||button.disabled||busy||state.turn!==0)return;
 const cell=Number(button.dataset.cell);
 const wall=state.walls.indexOf(cell);
 if(wall>=0){pendingWall=wall;preparedWall=undefined;paint();notice('壁の移動先を選ぼう。');return;}
 if(pendingWall===null)return;
 const candidate=legal().find(a=>a.wall?.wall===pendingWall&&a.wall.to===cell);
 if(candidate){preparedWall={wall:pendingWall,to:cell};pendingWall=null;paint();notice('滑る方向を選ぼう。');}
});
$('boss-skip').addEventListener('click',()=>{
 if(busy||state.turn!==0||state.winner!==null)return;
 pendingWall=null;preparedWall=null;paint();notice('壁を動かさずに滑る方向を選ぼう。');
});
$('boss-directions').addEventListener('click',e=>{
 const button=e.target.closest('[data-boss-dir]');
 if(button&&!button.disabled)humanTurn(Number(button.dataset.bossDir));
});
$('boss-difficulty').value=cpuLevel;
$('boss-difficulty').addEventListener('change',()=>{
 cpuLevel=resolveCpuLevel($('boss-difficulty').value);
 const url=new URL(location.href);
 url.searchParams.set('cpu',cpuLevel);
 window.history.replaceState(null,'',url.pathname+url.search);
 reset();
});
$('boss-reset').addEventListener('click',reset);
$('boss-again').addEventListener('click',reset);
reset();
