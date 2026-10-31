import {TASKS,available,beginRepair,finishRepair,decorate,homeComplete,clears} from './puzzle/house.js';
import {balance} from './puzzle/progress.js';
import {SCENES,SCENE_LINKS,renderHouseScene,designOptions} from './house-scenes.js';
const icons={exterior:'⌂',entry:'▯',living:'▱',kitchen:'♧',bedroom:'☾',garden:'❀'};
function thumbnail(task,i){
 if(task.area!=='entry')return `<span class="material-chip chip-${i}" aria-hidden="true"></span>`;
 const door=[`<path d="M14 44V17Q27-8 40 17v27Z" fill="#bc915f"/><path d="M21 13v29m12-29v29" stroke="#88613e"/><circle cx="35" cy="29" r="2" fill="#f9df9a"/>`,`<rect x="14" y="4" width="26" height="40" rx="2" fill="#648f81"/><path d="M18 9h18v19H18Z" fill="#cce5d8"/><path d="M27 9v19m-9-10h18" stroke="#739889" stroke-width="2"/><path d="M18 33h18v7H18Z" fill="#a5c8ad"/>`,`<rect x="14" y="4" width="26" height="40" rx="2" fill="#365469"/><path d="M21 6v36m12-36v36" stroke="#677e8c"/><circle cx="27" cy="17" r="9" fill="#c6976e"/><circle cx="27" cy="17" r="6" fill="#a9d4d9"/>`];
 const wall=[`<path d="M6 10h42v33H6Z" fill="#f2dbb2"/><path d="M10 10v33m34-33v33M6 18h42m-27-8v33" stroke="#a27749" stroke-width="4"/>`,`<path d="M6 10h42v33H6Z" fill="#9fbcaa"/><path d="M6 17h42M6 25h42M6 33h42M6 41h42" stroke="#678b79" stroke-width="2"/>`,`<path d="M6 10h42v33H6Z" fill="#c9bca0"/><path d="M6 20h42M6 31h42M19 10v10m15-10v10M12 20v11m15-11v11m15-11v11M21 31v12m14-12v12" stroke="#f3e9d2" stroke-width="2"/>`];
 const light=[`<path d="M27 5v9M15 19l12-8 12 8-4 21H19Z" fill="#f3d68c" stroke="#896c42" stroke-width="3"/><path d="M15 19h24m-12 0v21" stroke="#896c42" stroke-width="2"/>`,`<path d="M27 5v10" stroke="#896244" stroke-width="3"/><path d="M10 28q7-26 34 0Z" fill="#b27d55"/><path d="M10 28h34" stroke="#ebc995" stroke-width="4"/><circle cx="27" cy="35" r="6" fill="#f9e2a4"/>`,`<path d="M27 5v9m-7-9h14" stroke="#436362" stroke-width="3"/><circle cx="27" cy="28" r="14" fill="#fff0cd" stroke="#bca777" stroke-width="2"/><path d="M23 43h8" stroke="#436362" stroke-width="3"/>`];
 return `<svg viewBox="0 0 54 48" aria-hidden="true">${[door,wall,light][task.slot][i]}</svg>`;
}
const objectTargets={
 exterior:[{id:'home-entry-0',x:44,y:52},{id:'home-entry-1',x:67,y:64},{id:'home-entry-2',x:59,y:50}],
 entry:[{id:'home-entry-0',x:51,y:43},{id:'home-entry-1',x:61,y:29},{id:'home-entry-2',x:28,y:42}],
};
// Reuse the actual scene renderer for close-ups, with isolated SVG definitions.
// No saved state is introduced, and these images carry no interactive data attrs.
const detailCameras={exterior:[[156,235,113,173],[64,210,279,185],[244,246,72,103]],entry:[[181,191,112,178],[76,149,328,208],[94,180,79,109]]};
function repairDetail(save,scene,task){
 if(!detailCameras[scene])return '';
 const prefix=`detail-${scene}-${task.id}-`,rect=detailCameras[scene][task.slot],camera=rect.join(' '),ratio=rect[2]/rect[3];
 const art=renderHouseScene(save,scene)
  .replace(/<g data-art-layer="triken">[\s\S]*?<\/g>/,'')
  .replace(/viewBox="[^"]*"/,`viewBox="${camera}"`)
  .replace(/class="illustrated-scene"/,`class="repair-detail" style="--detail-ratio:${ratio}"`)
  .replace(/\sdata-[\w-]+="[^"]*"/g,'')
  .replace(/id="([^"]+)"/g,(_,id)=>`id="${prefix}${id}"`)
  .replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${prefix}${id})`)
  .replace(/aria-label="[^"]*"/,`aria-label="${task.label}の現在の見た目"`);
 const caption=save.home.pending===task.id?'修復中…':save.home.done[task.id]?designOptions(task)[save.home.styles[task.id]??0].name:'修復前';
 return `<figure class="repair-preview" id="preview-${task.id}">${art}<figcaption>${caption}</figcaption></figure>`;
}
export function createHouseView({element,getSave,setSave,onPlay,onComplete,onError}){
 let current='exterior',timer,selected=null,lastScene=null,menuOpen=false;
 const area=()=>current==='exterior'?'entry':current;
 function navigate(id){if(!SCENES.some(([key])=>key===id))return;current=id;selected=null;menuOpen=false;render();element.querySelector('#scene-heading')?.focus({preventScroll:true});element.scrollIntoView({block:'start',behavior:'instant'});}
 function openMenu(id=null){selected=id;menuOpen=true;render();const target=element.querySelector(id?`#repair-${id}`:'.restoration-sheet');target?.scrollIntoView({block:'nearest',behavior:'instant'});(element.querySelector(id?`[data-repair="${id}"]:not(:disabled), [data-style="${id}"]`:'#close-repairs')??element.querySelector('#close-repairs'))?.focus({preventScroll:true});}
 function render(){
 const s=getSave(),done=s.home.done,count=clears(s),sceneName=SCENES.find(([id])=>id===current)[1],tasks=TASKS.filter(t=>t.area===area()),entered=lastScene!==current;lastScene=current;
 element.dataset.scene=current;element.dataset.repairMenu=String(menuOpen);
 element.innerHTML=`<div class="home-bar"><div><span class="eyebrow">CHAPTER 01 · トリケンの家</span><h1 id="scene-heading" tabindex="-1">${sceneName}</h1></div><strong aria-label="家づくりの星">★ <span id="home-balance">${balance(s.progress)}</span></strong></div>
 <div class="house-world ${entered?'scene-enter':''}">${renderHouseScene(s,current)}
 ${current!=='exterior'?'<button class="scene-back" data-scene-to="exterior" aria-label="外観に戻る">‹ 家の外へ</button>':''}
 ${(SCENE_LINKS[current]??[]).map(link=>`<button class="scene-hotspot" data-scene-to="${link.to}" style="--x:${link.x}%;--y:${link.y}%" aria-label="${link.label}"><span aria-hidden="true">${icons[link.to]}</span><b>${link.label}</b></button>`).join('')}
 ${(objectTargets[current]??[]).map(target=>{const t=TASKS.find(t=>t.id===target.id);return `<button class="object-target" data-edit-object="${t.id}" style="--x:${target.x}%;--y:${target.y}%" aria-label="${t.label}：修復・デザイン変更"><span aria-hidden="true">${done[t.id]?'✎':'＋'}</span></button>`;}).join('')}
 ${s.home.pending?'<div class="repair-status" role="status"><i></i> トリケンと修復中…</div>':''}
 <span class="scene-counter">${TASKS.filter(t=>done[t.id]).length}<small> / 15 修復</small></span></div>
 <nav class="room-tabs" aria-label="家のシーン">${SCENES.map(([id,name])=>`<button ${id==='exterior'?'data-scene-to="exterior"':`data-area="${id}"`} aria-pressed="${current===id}"><span aria-hidden="true">${icons[id]}</span>${name}</button>`).join('')}</nav>
 <div class="home-bottom"><button id="repair-menu" aria-expanded="${menuOpen}" aria-controls="home-repairs"><span aria-hidden="true">✧</span> 修復・もよう替え<small>${count} / 50 クリア · ${tasks.filter(t=>done[t.id]).length}/3 修復</small></button><button class="primary" id="play-next"><small>★ 星を集めに</small>${count===50?'もう一度パズルへ':'ステージ '+Math.min(50,count+1)+' へ'} <span aria-hidden="true">›</span></button></div>
 <section id="home-repairs" class="restoration-sheet" aria-labelledby="repair-title" ${menuOpen?'':'hidden'}><div class="repair-heading"><div><span class="eyebrow">${current==='exterior'?'WELCOME HOME':'MAKE YOURSELF AT HOME'}</span><h2 id="repair-title">${current==='exterior'?'玄関から、家をあたたかく。':`${sceneName}を整えよう`}</h2></div><button id="close-repairs" aria-label="修復メニューを閉じて家を眺める">家を眺める ×</button></div>
 <p class="home-copy">${area()==='entry'?'扉・外壁・玄関灯の修復は、家の外と中に反映されます。': 'ひとつ直すたび、ここが好きになる。'} 完成後の模様替えは無料です。</p>
 <div id="repair-tasks">${tasks.map(t=>`<article class="repair ${done[t.id]?'finished':''} ${selected===t.id?'selected':''}" id="repair-${t.id}"><div class="repair-line"><div><b>${done[t.id]?'<span class="repair-check">✓</span> ':''}${t.label}</b><small>${done[t.id]?'完成 · デザインをタップして変更':s.home.pending===t.id?'建設中…':available(s,t)?balance(s.progress)<t.cost?'パズルで星を集めよう':'星を使って修復できます':`${t.at}面クリア後${t.requires.length?'・前の修復が必要':''}`}</small></div>${!done[t.id]?`<button data-repair="${t.id}" ${!available(s,t)||s.home.pending||balance(s.progress)<t.cost?'disabled':''}>★ ${t.cost}<span>直す</span></button>`:''}</div>${menuOpen?repairDetail(s,current,t):''}${done[t.id]?`<div class="swatches" aria-label="${t.label}のデザイン">${designOptions(t).map((choice,i)=>`<button data-style="${t.id}" data-choice="${i}" aria-label="${choice.name}：${choice.material}" aria-pressed="${(s.home.styles[t.id]??0)===i}">${thumbnail(t,i)}<b>${choice.name}</b><small>${choice.material}</small><span class="choice-tick" aria-hidden="true">✓</span></button>`).join('')}</div>`:''}</article>`).join('')}</div></section>`;
 element.querySelector('#play-next').onclick=onPlay;
 element.querySelector('#repair-menu').onclick=()=>{if(menuOpen){menuOpen=false;render();element.querySelector('#repair-menu').focus();}else openMenu();};
 element.querySelector('#close-repairs').onclick=()=>{menuOpen=false;render();element.querySelector('#repair-menu').focus({preventScroll:true});element.scrollIntoView({block:'start',behavior:'instant'});};
 element.querySelectorAll('[data-area],[data-room],[data-scene-to]').forEach(b=>{const go=()=>navigate(b.dataset.area??b.dataset.room??b.dataset.sceneTo);b.onclick=go;if(b.tagName!=='BUTTON')b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};});
 element.querySelectorAll('[data-repair]').forEach(b=>b.onclick=()=>{try{selected=b.dataset.repair;setSave(beginRepair(getSave(),selected));render();resume();}catch(e){onError(e);}});
 element.querySelectorAll('[data-style]').forEach(b=>b.onclick=()=>{try{selected=b.dataset.style;setSave(decorate(getSave(),selected,Number(b.dataset.choice)));const top=window.scrollY;render();element.querySelector(`[data-style="${selected}"][data-choice="${b.dataset.choice}"]`)?.focus({preventScroll:true});window.scrollTo(0,top);}catch(e){onError(e);}});
 element.querySelectorAll('[data-object],[data-edit-object]').forEach(b=>b.onclick=e=>{e.stopPropagation();openMenu(b.dataset.editObject??b.dataset.object);});
 element.querySelector('.restoration-sheet').onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();menuOpen=false;render();element.querySelector('#repair-menu').focus();}};
 if(homeComplete(s)&&!s.home.completionSeen){const n=structuredClone(s);n.home.completionSeen=true;setSave(n);onComplete();}
 }
 function resume(){if(timer)clearTimeout(timer);if(getSave().home.pending)timer=setTimeout(()=>{try{setSave(finishRepair(getSave()));render();}catch(e){onError(e);}},matchMedia('(prefers-reduced-motion: reduce)').matches?0:1000);}
 return {render,resume,renderHome(){current='exterior';selected=null;menuOpen=false;render();}};
}
