import {assetPath,ART_PLACEMENTS} from './house-layered-art.js';
import {TASKS,AREAS,HOUSE_CHAPTERS,HOUSE_EXPANSIONS,houseChapterProgress,accessibleHouseAreas,nextHouseExpansion,available,nextRepairMission,beginRepair,finishRepair,decorate,homeComplete,clears} from './puzzle/house.js';
import {balance} from './puzzle/progress.js';
import {SCENES,SCENE_LINKS,renderHouseScene,designOptions} from './house-scenes.js';
const icons={exterior:'⌂',entry:'▯',living:'▱',kitchen:'♧',bedroom:'☾',garden:'❀'};
function thumbnail(task,i){
 const sample={home:{done:{[task.id]:true},styles:{[task.id]:i}}};
 return `<img src="${assetPath(sample,task.id)}" alt="" width="74" height="56" loading="lazy" decoding="async"/>`;
}

const objectTargets=Object.fromEntries(Object.entries(ART_PLACEMENTS).map(([scene,rs])=>[scene,TASKS.filter(t=>t.area===(scene==='exterior'?'entry':scene)).map(t=>({id:t.id,x:(rs[t.slot][0]+rs[t.slot][2]/2)/4.8,y:(rs[t.slot][1]+rs[t.slot][3]/2)/5.4}))]));
objectTargets.exterior[1]={id:'home-entry-1',x:67,y:64};
objectTargets.entry[1]={id:'home-entry-1',x:79,y:51};
objectTargets.living[0]={id:'ice-crane',x:79,y:94};
// Keep the 44px repair control beside the small shelf, where it cannot hide damage.
objectTargets.living[2]={id:'home-living-2',x:89,y:66};
objectTargets.bedroom[1]={id:'home-bedroom-1',x:85,y:29};
function repairDetail(save,scene,task){
 const caption=save.home.pending===task.id?'修復中…':save.home.done[task.id]?designOptions(task)[save.home.styles[task.id]??0].name:'修復前';
 return `<figure class="repair-preview" id="preview-${task.id}"><svg class="repair-detail" viewBox="0 0 160 142" style="--detail-ratio:${160/142}" role="img" aria-label="${task.label}の現在の見た目"><image href="${assetPath(save,task.id)}" x="0" y="0" width="160" height="142" preserveAspectRatio="xMidYMid meet"/></svg><figcaption>${caption}</figcaption></figure>`;
}

// The whole room is the reward, not only the third repaired object.
// SVG definitions are namespaced because both pictures coexist with the live
// house SVG. Strip noninteractive data attributes so global UI selectors
// keep targeting the real house, never the miniature comparison.
function isolatedScene(save,scene,prefix){
 return renderHouseScene(save,scene)
  .replace(/\sid="([^"]+)"/g,(_,id)=>` id="${prefix}-${id}"`)
  .replace(/url\(#([^)]*)\)/g,(_,id)=>`url(#${prefix}-${id})`)
  .replace(/\s(?:href|xlink:href)="#([^"]+)"/g,(_,id)=>` href="#${prefix}-${id}"`)
  .replace(/\sdata-[\w-]+="[^"]*"/g,'')
  .replace('<svg ','<svg aria-hidden="true" focusable="false" ');
}
function completedRoomSnapshot(save,chapter,phase,view='card'){
 const snapshot=structuredClone(save);
 if(phase==='before')for(const task of TASKS.filter(t=>t.area===chapter.id)){
  delete snapshot.home.done[task.id];
  delete snapshot.home.styles[task.id];
 }
 const prefix=`compare-${chapter.id}-${phase}-${view}`;
 return isolatedScene(snapshot,chapter.id==='entry'?'exterior':chapter.id,prefix);
}
function roomCompletionHtml(chapter,task,save,nextAction){
 const before=completedRoomSnapshot(save,chapter,'before');
 const after=completedRoomSnapshot(save,chapter,'after');
 const message=chapter.id==='entry'
  ?'ボロボロだった家が、こんなにあたたかい姿に。'
  :chapter.id==='garden'
   ?'最後の一か所まで、ていねいに直せたね。'
   :'3か所の修復で、部屋が生まれかわった！';
 return `<section class='house-room-celebration' role='status' aria-label='エリアの修復完成'>
  <span class='eyebrow'>✦ 3か所の修復が完了</span>
  <h2 id='house-room-celebration-title'>🎉 ${chapter.name}が完成！</h2>
  <p class='house-room-reveal-note'>${message}</p>
  <div class='house-room-comparison' aria-label='${chapter.name}全体の修復前後'>
   <figure class='house-room-snapshot' data-phase='before'><button class='house-room-snapshot-open' type='button' data-comparison-open='before' aria-label='修復前の家を拡大して比較'><div class='house-room-snapshot-art'>${before}</div><span class='house-room-zoom-label' aria-hidden='true'>拡大</span></button><figcaption>修復まえ</figcaption></figure>
   <span class='house-room-arrow' aria-hidden='true'>→</span>
   <figure class='house-room-snapshot' data-phase='after'><button class='house-room-snapshot-open' type='button' data-comparison-open='after' aria-label='完成した家を拡大して比較'><div class='house-room-snapshot-art'>${after}</div><span class='house-room-zoom-label' aria-hidden='true'>拡大</span></button><figcaption>完成！</figcaption></figure>
  </div>
  <button id='house-room-celebration-next' class='primary' type='button'>${nextAction==='enter'?'玄関から家に入る':nextAction==='open'?'次の部屋を見に行く':nextAction==='locked'?'パズルでエリアをひらく':'家をながめる'}</button>
  <dialog id='house-room-detail-dialog' aria-label='${chapter.name}の修復前後を拡大して比較'>
   <div class='house-room-detail-panel'>
    <header class='house-room-detail-header'><strong>${chapter.name}のビフォーアフター</strong><button type='button' data-detail-close aria-label='拡大比較を閉じる'>閉じる ×</button></header>
    <div class='house-room-detail-art' aria-label='拡大した家の画像'></div>
    <div class='house-room-detail-switch' role='group' aria-label='比較する家の状態'>
      <button type='button' data-detail-phase='before' aria-pressed='false'>修復まえ</button>
      <button type='button' data-detail-phase='after' aria-pressed='false'>完成！</button>
    </div>
   </div>
  </dialog>
 </section>`;
}
export function createHouseView({element,getSave,setSave,onPlay,onComplete,onError}){
 let current='exterior',timer,selected=null,lastScene=null,menuOpen=false,guidedMode=false,roomCelebration=null,previousAreas=null,justOpenedArea=null,recentlyCompleted=null,navigation=0,frame=0,previewStyles={},comparison=null,showBefore=false,repairBefore=null,transitionBefore=null;
 async function ready(art){const paths=[...new Set([...art.matchAll(/href="([^"]+)"/g)].map(m=>m[1]))];await Promise.all(paths.map(path=>new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=()=>reject(new Error(`画像を読み込めません: ${path}`));image.src=path;if(image.complete){if(image.naturalWidth>0)resolve();else reject(new Error(`画像を読み込めません: ${path}`));}})));}
 const area=()=>current==='exterior'?'entry':current;
 async function navigate(id){if(id===current)return;if(!accessibleHouseAreas(getSave()).includes(id))return;const ticket=++navigation;const world=element.querySelector('.house-world');world?.setAttribute('aria-busy','true');try{await ready(renderHouseScene(getSave(),id));}catch(error){if(ticket===navigation){world?.setAttribute('aria-busy','false');onError(error);}return;}if(ticket!==navigation)return;current=id;comparison=null;showBefore=false;previewStyles={};selected=null;menuOpen=false;guidedMode=false;roomCelebration=null;if(id!=='exterior')justOpenedArea=null;render();element.querySelector('#scene-heading')?.focus({preventScroll:true});element.scrollIntoView({block:'start',behavior:'instant'});}
 function openMenu(id=null,asGuided=false){showBefore=false;comparison=null;previewStyles={};selected=id;menuOpen=true;guidedMode=asGuided;render();const target=element.querySelector(id?`#repair-${id}`:'.restoration-sheet');target?.scrollIntoView({block:'nearest',behavior:'instant'});(element.querySelector(id?`[data-repair="${id}"]:not(:disabled), [data-style="${id}"]`:'#close-repairs')??element.querySelector('#close-repairs'))?.focus({preventScroll:true});}
 function render(){
 const s=getSave(),done=s.home.done,count=clears(s),sceneName=SCENES.find(([id])=>id===current)[1],tasks=TASKS.filter(t=>t.area===area()),mission=nextRepairMission(s),entered=lastScene!==current;
 const chapters=houseChapterProgress(s),activeChapter=chapters.find(ch=>ch.id===mission.task?.area)??chapters.at(-1),roomsComplete=chapters.filter(ch=>ch.complete).length;
 const visibleAreas=accessibleHouseAreas(s),expansion=nextHouseExpansion(s);
 const newArea=previousAreas?visibleAreas.find(id=>!previousAreas.includes(id)):null;
 if(newArea)justOpenedArea=newArea;
 previousAreas=visibleAreas;
 const missionRoom=mission.task?AREAS.find(([id])=>id===mission.task.area)?.[1]:null;
 const missionNumber=mission.task?TASKS.findIndex(t=>t.id===mission.task.id)+1:15;
 // The locked hall is still today's *exterior* repair location. Hide future
 // rooms, not the three visible jobs on the front wall/door/lamp.
 const exteriorJob=mission.task?.area==='entry'&&current==='exterior';
 const hiddenGoal=Boolean(mission.task&&!exteriorJob&&!visibleAreas.includes(mission.task.area));
 const missionDescription=mission.state==='complete'?'15個の修復が完成！ この家での冒険を続けよう。':
   mission.state==='building'?'修復中。完成すると家の景色が変わるよ。':
   mission.state==='stages'?`ステージ${mission.task.at}まであと${mission.missingStages}面。パズルをクリアして修復を解放しよう。`:
   mission.state==='stars'?`必要な星は${mission.task.cost}個。あと${mission.missingStars}個集めると修復できるよ。`:
   mission.state==='ready'?`星${mission.task.cost}個を使って、家の${missionRoom}を修復しよう。`:
   '先に前の修復を完成させよう。';
 const missionAction=mission.state==='complete'?'家づくり完成！':mission.state==='building'?'修復中…':
   mission.state==='ready'?'この場所を直す':'パズルで星を集める';
 const shownTasks=guidedMode&&mission.task?.area===area()?[mission.task]:tasks;
 const roomFinished=tasks.every(t=>done[t.id]);
 const completedChapter=roomCelebration&&chapters.find(ch=>ch.id===roomCelebration.area&&ch.complete);
 const completedTask=completedChapter&&TASKS.find(t=>t.id===roomCelebration.taskId);
 // Transient feedback is consumed once per actual completed repair. The
 // saved house and artwork are never modified to store this visual effect.
 const freshRepair=recentlyCompleted&&TASKS.find(t=>t.id===recentlyCompleted&&done[t.id]);
 const repairMarker=freshRepair&&objectTargets[current]?.find(target=>target.id===freshRepair.id);
 recentlyCompleted=null;
 const display=structuredClone(s);
 const previewTask=selected&&TASKS.find(t=>t.id===selected);
 if(menuOpen&&previewTask&&Object.hasOwn(previewStyles,selected)){
  display.home.done[selected]=true;display.home.styles[selected]=previewStyles[selected];
 }
 const compareSave=comparison?.scene===current?comparison.before:null;
 const worldArt=showBefore&&compareSave?isolatedScene(compareSave,current,'history'):renderHouseScene(display,current);
 const transition=transitionBefore;transitionBefore=null;
 lastScene=current;
 element.dataset.scene=current;element.dataset.repairMenu=String(menuOpen);element.dataset.missionState=mission.state;
 element.innerHTML=`<div class="home-bar"><div><span class="eyebrow">CHAPTER 01 · トリケンの家</span><h1 id="scene-heading" tabindex="-1">${sceneName}</h1></div><strong aria-label="家づくりの星">★ <span id="home-balance">${balance(s.progress)}</span></strong></div>
 <div class="house-world ${entered?'scene-enter':''}" ${current==='exterior'&&justOpenedArea?`data-growth-reveal="${justOpenedArea}"`:''}>${worldArt}${transition?`<div class="house-repair-transition" aria-hidden="true">${isolatedScene(transition,current,'repair-transition')}</div>`:''}
 ${current!=='exterior'?'<button class="scene-back" data-scene-to="exterior" aria-label="外観に戻る">‹ 家の外へ</button>':''}
 ${(showBefore?[]:SCENE_LINKS[current]??[]).filter(link=>visibleAreas.includes(link.to)).map(link=>`<button class="scene-hotspot" data-scene-to="${link.to}" style="--x:${link.x}%;--y:${link.y}%" aria-label="${link.label}"><span aria-hidden="true">${icons[link.to]}</span><b>${link.label}</b></button>`).join('')}
 ${(showBefore?[]:objectTargets[current]??[]).filter(target=>roomFinished||mission.task?.id===target.id).map(target=>{const t=TASKS.find(t=>t.id===target.id);return `<button class="object-target" data-edit-object="${t.id}" style="--x:${target.x}%;--y:${target.y}%" aria-label="${t.label}：修復・デザイン変更"><span aria-hidden="true">${done[t.id]?'✎':'＋'}</span></button>`;}).join('')}
 ${s.home.pending?'<div class="repair-status" role="status"><i></i> 家を修復中…</div>':''}
 ${repairMarker?`<div class="house-repair-reveal" data-task-id="${freshRepair.id}" style="--x:${repairMarker.x}%;--y:${repairMarker.y}%" aria-hidden="true"><span aria-hidden="true">✧</span><b>できた！</b></div>`:''}
 <span class="scene-counter">${showBefore?'最初の家':`${TASKS.filter(t=>done[t.id]).length}<small> / 15 修復</small>`}</span></div>
 <div class="house-compare-tools" aria-label="修復前後の比較">
 ${TASKS.some(t=>done[t.id])?`<button id="house-history" type="button" aria-pressed="${comparison?.kind==='initial'}">最初とくらべる</button>`:''}
 ${compareSave?`<button id="house-compare-toggle" type="button" aria-pressed="${showBefore}">${showBefore?'今の家を見る':'修復まえを見る'}</button><span role="status">${showBefore?(comparison.kind==='initial'?'最初の家':'今回の修復まえ'):'今の家'}</span>`:''}
 </div>
 <nav class="room-tabs" aria-label="家のシーン">${SCENES.filter(([id])=>visibleAreas.includes(id)).map(([id,name])=>`<button ${id==='exterior'?'data-scene-to="exterior"':`data-area="${id}"`} aria-pressed="${current===id}"><span aria-hidden="true">${icons[id]}</span>${name}</button>`).join('')}</nav>
 ${justOpenedArea?`<div id="house-area-unlocked" class="house-area-unlocked" role="status"><span>✨ 新しいエリア「${SCENES.find(([id])=>id===justOpenedArea)?.[1]}」がひらいた！</span>${current==='exterior'&&!completedTask?'<button id="house-growth-enter" type="button">新しい部屋へ ›</button>':''}</div>`:''}
 <div class="house-expansion-meter" aria-label="家のエリア拡張">
  <span id="house-area-count">ひろがったエリア ${visibleAreas.length-1} / 5</span>
  <span class="house-expansion-dots" aria-hidden="true">${HOUSE_EXPANSIONS.map(e=>visibleAreas.includes(e.area)?'<i class="unlocked"></i>':'<i></i>').join('')}</span>
  ${expansion&&expansion.previousDone&&expansion.missingStages>0?`<small id="house-next-expansion">あと${expansion.missingStages}面で新しいエリアがひらく！</small>`:''}
 </div>
 <section class="house-mission" aria-label="次の家づくりミッション">
  <div class='house-mission-top'><span class='eyebrow'>🏠 第${HOUSE_CHAPTERS.findIndex(ch=>ch.id===activeChapter.id)+1}話 · ${hiddenGoal?'???':activeChapter.name}</span><span class='house-mission-totals'><b id='house-mission-room-progress'>${activeChapter.doneCount} / 3</b><small id='house-mission-rooms'>${roomsComplete} / 5 エリア完成</small><strong id='house-mission-progress'>${mission.doneCount} / ${mission.total}</strong></span></div>
  <div class="house-mission-meter" role="progressbar" aria-label="修復達成数" aria-valuemin="0" aria-valuemax="15" aria-valuenow="${mission.doneCount}"><span style="width:${mission.doneCount/15*100}%"></span></div>
  <p class='house-mission-story'>${hiddenGoal?'この先に、まだ見ぬエリアがあるよ。':`${activeChapter.goal}。${activeChapter.doneCount===0?activeChapter.intro:''}`}</p>
  <h2 id="house-mission-title">${hiddenGoal?'つぎのエリアを見つけよう！':mission.task?`つぎは「${mission.task.label}」`:'トリケンの家、完成！'}</h2>
  <p id="house-mission-copy" role="status">${missionDescription}</p>
  <button id="house-mission-next" class="primary" type="button" ${mission.state==='building'||mission.state==='complete'?'disabled':''}>${missionAction}</button>
  ${mission.task?`<small class="house-mission-meta">修復 ${missionNumber}/15 · ${hiddenGoal?'未発見エリア':missionRoom}</small>`:''}
 </section>
 ${completedTask?roomCompletionHtml(completedChapter,completedTask,s,completedChapter.id==='entry'?'enter':!mission.task?null:visibleAreas.includes(mission.task.area)?'open':'locked'):''}
 <div class="home-bottom"><button id="repair-menu" aria-expanded="${menuOpen}" aria-controls="home-repairs"><span aria-hidden="true">✧</span> 修復一覧・もよう替え<small>${count} / 50 クリア · ${tasks.filter(t=>done[t.id]).length}/3 修復</small></button><button class="primary" id="play-next"><small>★ 星を集めに</small>${count===50?'もう一度パズルへ':'ステージ '+Math.min(50,count+1)+' へ'} <span aria-hidden="true">›</span></button></div>
 <section id="home-repairs" class="restoration-sheet" aria-labelledby="repair-title" ${menuOpen?'':'hidden'}><div class="repair-heading"><div><span class="eyebrow">${current==='exterior'?'WELCOME HOME':'MAKE YOURSELF AT HOME'}</span><h2 id="repair-title">${current==='exterior'?'玄関から、家をあたたかく。':`${sceneName}を整えよう`}</h2></div><button id="close-repairs" aria-label="修復メニューを閉じて家を眺める">家を眺める ×</button></div>
 <p class="home-copy">${area()==='entry'?'扉・外壁・玄関灯の修復は、家の外と中に反映されます。': 'ひとつ直すたび、ここが好きになる。'} 3つから好きなデザインを選んで直そう。完成後の変更は無料です。</p>
 <div id="repair-tasks">${shownTasks.map(t=>`<article class="repair ${done[t.id]?'finished':''} ${selected===t.id?'selected':''}" id="repair-${t.id}"><div class="repair-line"><div><b>${done[t.id]?'<span class="repair-check">✓</span> ':''}${t.label}</b><small>${done[t.id]?'完成 · もよう替えできます':s.home.pending===t.id?'建設中…':available(s,t)?balance(s.progress)<t.cost?'パズルで星を集めよう':'星を使って修復できます':`${t.at}面クリア後${t.requires.length?'・前の修復が必要':''}`}</small></div>${!done[t.id]?`<button data-repair="${t.id}" ${!available(s,t)||s.home.pending||balance(s.progress)<t.cost?'disabled':''}>★ ${t.cost}<span>直す</span></button>`:''}</div>${menuOpen?repairDetail(selected===t.id&&Object.hasOwn(previewStyles,t.id)?display:s,current,t):''}${selected===t.id&&Object.hasOwn(previewStyles,t.id)?`<figure class="design-house-preview">${isolatedScene(display,current,'design-preview')}<figcaption>プレビュー · まだ保存していません</figcaption></figure>`:''}${menuOpen&&!s.home.pending&&(done[t.id]||mission.task?.id===t.id)?`<div class="swatches" aria-label="${t.label}のデザイン">${designOptions(t).map((choice,i)=>`<button data-style="${t.id}" data-choice="${i}" aria-label="${choice.name}：${choice.material}" aria-pressed="${(previewStyles[t.id]??s.home.styles[t.id]??0)===i}">${thumbnail(t,i)}<b>${choice.name}</b><small>${choice.material}</small><span class="choice-tick" aria-hidden="true">✓</span></button>`).join('')}</div><p class="design-preview-note">家で見ためを確認してから、${done[t.id]?'「このデザインにする」':'「直す」'}を押そう。</p>${done[t.id]?`<button data-apply-style="${t.id}" type="button">このデザインにする</button>`:''}`:''}</article>`).join('')}</div></section>`;
 const token=++frame,world=element.querySelector('.house-world');world.dataset.artReady='false';ready(world.innerHTML).then(()=>{if(frame===token&&world.isConnected)world.dataset.artReady='true';}).catch(error=>{if(frame===token&&world.isConnected){world.dataset.artReady='error';console.error('House art load failed',error);}});
 const detailDialog=element.querySelector('#house-room-detail-dialog');
 if(detailDialog&&completedChapter){
  const detailArt=detailDialog.querySelector('.house-room-detail-art');
  const selectDetailPhase=phase=>{
   detailArt.innerHTML=completedRoomSnapshot(getSave(),completedChapter,phase,'detail');
   detailDialog.dataset.phase=phase;
   detailDialog.querySelectorAll('[data-detail-phase]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.detailPhase===phase)));
  };
  element.querySelectorAll('[data-comparison-open]').forEach(b=>b.onclick=()=>{
   selectDetailPhase(b.dataset.comparisonOpen);
   detailDialog.showModal();
  });
  detailDialog.querySelectorAll('[data-detail-phase]').forEach(b=>b.onclick=()=>selectDetailPhase(b.dataset.detailPhase));
  detailDialog.querySelector('[data-detail-close]').onclick=()=>detailDialog.close();
  detailDialog.onclick=e=>{if(e.target===detailDialog)detailDialog.close();};
 }
 const celebrationNext=element.querySelector('#house-room-celebration-next');
 if(celebrationNext)celebrationNext.onclick=()=>{
  if(completedChapter?.id==='entry'){
   roomCelebration=null;
   void navigate('entry');
   return;
  }
  roomCelebration=null;
  const nextRoom=nextRepairMission(getSave()).task?.area;
  if(nextRoom&&accessibleHouseAreas(getSave()).includes(nextRoom)&&nextRoom!==current)void navigate(justOpenedArea===nextRoom?'exterior':nextRoom);
  else if(nextRoom&&!accessibleHouseAreas(getSave()).includes(nextRoom)){render();onPlay();}
  else render();
 };
 const growthEnter=element.querySelector('#house-growth-enter');
 if(growthEnter)growthEnter.onclick=()=>{const destination=justOpenedArea; if(destination&&accessibleHouseAreas(getSave()).includes(destination))void navigate(destination);};
 const missionButton=element.querySelector('#house-mission-next');
 missionButton.hidden=Boolean(completedTask);
 missionButton.onclick=async()=>{
  if(!mission.task||mission.state==='building'||mission.state==='complete')return;
  if(mission.state!=='ready'){onPlay();return;}
  // Entry's three repair jobs belong outside. The door itself unlocks only
  // after all three are done; guide repairs without going through that door.
  const target=mission.task.area==='entry'&&!accessibleHouseAreas(getSave()).includes('entry')?'exterior':mission.task.area;
  await navigate(target);
  // A failed image load or interrupted room switch must not open the wrong
  // repair screen. Navigate safely before displaying the guided repair.
  if(!element.isConnected||current!==target)return;
  // Navigation can change the view; independently recheck the save after it.
  const now=nextRepairMission(getSave());
  if(now.state==='ready'&&now.task?.id===mission.task.id)openMenu(mission.task.id,true);
 };
 element.querySelector('#play-next').onclick=onPlay;
 element.querySelector('#repair-menu').onclick=()=>{if(menuOpen){menuOpen=false;guidedMode=false;render();element.querySelector('#repair-menu').focus();}else openMenu();};
 element.querySelector('#close-repairs').onclick=()=>{menuOpen=false;guidedMode=false;render();element.querySelector('#repair-menu').focus({preventScroll:true});element.scrollIntoView({block:'start',behavior:'instant'});};
 element.querySelectorAll('[data-area],[data-room],[data-scene-to]').forEach(b=>{const go=()=>navigate(b.dataset.area??b.dataset.room??b.dataset.sceneTo);b.onclick=go;if(b.tagName!=='BUTTON')b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};});
 element.querySelector('#house-history')?.addEventListener('click',()=>{
  const before=structuredClone(getSave());before.home.done={};before.home.styles={};before.home.pending=null;before.progress.completed={};
  comparison={scene:current,before,kind:'initial'};showBefore=true;menuOpen=false;render();
 });
 element.querySelector('#house-compare-toggle')?.addEventListener('click',()=>{showBefore=!showBefore;render();});
 element.querySelectorAll('[data-repair]').forEach(b=>b.onclick=()=>{try{
  selected=b.dataset.repair;const before=structuredClone(getSave());
  const next=beginRepair(getSave(),selected,previewStyles[selected]);setSave(next);repairBefore=before;comparison=null;showBefore=false;render();resume();
 }catch(e){onError(e);}});
 element.querySelectorAll('[data-style]').forEach(b=>b.onclick=()=>{selected=b.dataset.style;previewStyles[selected]=Number(b.dataset.choice);const top=window.scrollY;render();element.querySelector(`[data-style="${selected}"][data-choice="${b.dataset.choice}"]`)?.focus({preventScroll:true});window.scrollTo(0,top);});
 element.querySelectorAll('[data-apply-style]').forEach(b=>b.onclick=()=>{try{
  selected=b.dataset.applyStyle;setSave(decorate(getSave(),selected,previewStyles[selected]??getSave().home.styles[selected]??0));previewStyles={};render();
 }catch(e){onError(e);}});
 element.querySelectorAll('[data-object],[data-edit-object]').forEach(b=>b.onclick=e=>{e.stopPropagation();openMenu(b.dataset.editObject??b.dataset.object);});
 element.querySelector('.restoration-sheet').onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();menuOpen=false;guidedMode=false;render();element.querySelector('#repair-menu').focus();}};
 if(homeComplete(s)&&!s.home.completionSeen&&!roomCelebration){const n=structuredClone(s);n.home.completionSeen=true;setSave(n);onComplete();}
 }
 function resume(){
  if(timer)clearTimeout(timer);
  if(getSave().home.pending)timer=setTimeout(()=>{
   try{
    const pendingId=getSave().home.pending;
    const finished=finishRepair(getSave());
    setSave(finished);
    recentlyCompleted=pendingId;
    const before=repairBefore??structuredClone(finished);
    if(!repairBefore){delete before.home.done[pendingId];before.home.pending=null;}
    comparison={scene:current,before,kind:'repair'};showBefore=false;transitionBefore=before;repairBefore=null;previewStyles={};

    const task=TASKS.find(t=>t.id===pendingId);
    if(task?.slot===2&&TASKS.filter(t=>t.area===task.area).every(t=>finished.home.done[t.id])){
     roomCelebration={area:task.area,taskId:task.id};
     guidedMode=false;menuOpen=false;selected=null;
    }else if(guidedMode){guidedMode=false;menuOpen=false;selected=null;}
    render();
    if(roomCelebration&&!homeComplete(finished)){
     element.querySelector('.house-room-celebration')?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    }
   }catch(e){onError(e);}
  },matchMedia('(prefers-reduced-motion: reduce)').matches?0:1000);
 }
 return {render,resume,renderHome(){++navigation;current='exterior';comparison=null;showBefore=false;previewStyles={};selected=null;menuOpen=false;guidedMode=false;roomCelebration=null;render();}};
}
