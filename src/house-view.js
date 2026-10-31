import {AREAS,TASKS,available,beginRepair,finishRepair,decorate,homeComplete,clears} from './puzzle/house.js';
import {balance} from './puzzle/progress.js';
function scene(s,area){
 const rooms={entry:[160,400,190,130],living:[160,205,270,195],kitchen:[430,205,270,195],bedroom:[160,55,540,150],garden:[700,205,155,325]},colors=['#e2bd8b','#8ac5b4','#b6a1cf'];
 const p=(x,y,z=0)=>[350+x*.85-y*.5,30+x*.32+y*.5-z];
 const points=a=>a.map(v=>p(...v).join(',')).join(' ');
 const poly=(a,fill,stroke='#647b85',extra='')=>`<polygon points="${points(a)}" fill="${fill}" stroke="${stroke}" stroke-width="2" ${extra}/>`;
 const box=(x,y,w,h,z,c)=>poly([[x,y,0],[x+w,y,0],[x+w,y,z],[x,y,z]],'#8e9fac')+poly([[x+w,y,0],[x+w,y+h,0],[x+w,y+h,z],[x+w,y,z]],'#708999')+poly([[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z]],c);
 const text=(x,y,z,t)=>{const q=p(x,y,z);return `<text x="${q[0]}" y="${q[1]}" fill="#294c5b" font-size="18" font-weight="700" paint-order="stroke" stroke="#f2fbff" stroke-width="4">${t}</text>`;};
 let art=poly([[100,0,-12],[900,0,-12],[900,570,-12],[100,570,-12]],'#dfedf0');
 art+=poly([[160,55,0],[700,55,0],[700,55,55],[160,55,55]],'#dce8ed');
 art+=poly([[160,55,0],[160,400,0],[160,400,40],[160,55,40]],'#b8ced7');
 // Windows are on the same back wall in every state.
 art+=poly([[220,55,15],[295,55,15],[295,55,43],[220,55,43]],'#a0def1','#fff');
 art+=poly([[560,55,15],[635,55,15],[635,55,43],[560,55,43]],'#a0def1','#fff');
 for(const [id,name]of AREAS){
  const [x,y,w,h]=rooms[id],ts=TASKS.filter(t=>t.area===id),done=ts.filter(t=>s.home.done[t.id]).length;
  art+=`<g data-room="${id}" role="button" tabindex="0" aria-label="${name}">`;
  art+=box(x,y,w,h,3,done?colors[s.home.styles[ts[0].id]??0]:'#adb7b9');
  art+=poly([[x,y,4],[x+w,y,4],[x+w,y+h,4],[x,y+h,4]],'transparent',id===area?'#f5c84a':'#8199a0');
  if(id!=='garden')for(let n=30;n<w;n+=40)art+=poly([[x+n,y,4],[x+n+2,y,4],[x+n+2,y+h,4],[x+n,y+h,4]],'#ffffff28','none');
  if(s.home.done[ts[1].id]&&['entry','bedroom'].includes(id))art+=poly([[x,y,4],[x+w,y,4],[x+w,y,35],[x,y,35]],colors[s.home.styles[ts[1].id]??0]);
  art+=text(x+10,y+20,8,name);
  for(let j=0;j<3;j++){
   const t=ts[j],cx=x+22+j*(w-65)/3,cy=y+60+j*12,c=colors[s.home.styles[t.id]??0];
   if(!s.home.done[t.id]&&s.home.pending!==t.id){art+=box(cx,cy,18,18,7,'#849395');continue;}
   art+=`<g data-object="${t.id}" class="${s.home.pending===t.id?'building-now':''}">`;
   if(id==='bedroom'&&j===0){art+=box(cx,cy,100,65,18,c)+box(cx+4,cy+4,30,55,23,'#fff9ee')+box(cx+43,cy+2,54,61,22,c);}
   else if(id==='living'&&j===1){art+=box(cx,cy,85,48,22,c)+box(cx,cy+38,85,10,45,c)+box(cx,cy,10,48,32,c)+box(cx+75,cy,10,48,32,c);for(let k=0;k<3;k++)art+=box(cx+12+k*21,cy+5,19,28,25,c);}
   else if(id==='kitchen'&&j===1){art+=box(cx+5,cy+5,8,8,30,'#826949')+box(cx+55,cy+35,8,8,30,'#826949')+box(cx,cy,75,52,34,c);for(const off of [15,50]){const q=p(cx+off,cy+22,35);art+=`<ellipse cx="${q[0]}" cy="${q[1]}" rx="9" ry="5" fill="#fff9ee"/>`;}}
   else if(id==='garden'&&j===1){for(let k=0;k<3;k++){art+=box(cx+k*14,cy+k*8,18,18,10,'#a08265');const q=p(cx+k*14+8,cy+k*8+8,25);art+=`<circle cx="${q[0]}" cy="${q[1]}" r="13" fill="#64a780"/><circle cx="${q[0]-3}" cy="${q[1]-5}" r="4" fill="#f2b2b8"/>`;}}
   else if(id==='entry'&&j===0){art+=box(cx,cy,42,8,65,c);const q=p(cx+32,cy-2,30);art+=`<circle cx="${q[0]}" cy="${q[1]}" r="3" fill="#e9b94e"/>`;}
   else if(j===2){art+=box(cx,cy,40,32,24,c)+box(cx+12,cy+10,8,8,55,'#a38555')+box(cx+2,cy,30,28,63,'#ffdb88');}
   else art+=box(cx,cy,55,40,25,c);
   art+='</g>';
  }
  art+='</g>';
 }
 const a=rooms[area],q=p(a[0]+a[2]*.7,a[1]+a[3]*.7,5);art+=`<image href="./assets/triken-orange-80.png" x="${q[0]-30}" y="${q[1]-55}" width="60" height="60"/>`;
 return `<svg viewBox="150 70 870 540" aria-label="一軒の家。奥が寝室、中央左がリビング、右がキッチン、手前が玄関、外が庭">${art}</svg>`;
}

export function createHouseView({element,getSave,setSave,onPlay,onComplete,onError}){
 let area='entry',timer;
 const rects={entry:[160,400,190,130],living:[160,205,270,195],kitchen:[430,205,270,195],bedroom:[160,55,540,150],garden:[700,205,155,325]};
 const palettes=['#e7c597','#a2c9c0','#bca5cd'];
 function render(){
 const s=getSave(),done=s.home.done;
 const rooms=AREAS.map(([id,name])=>{const [x,y,w,h]=rects[id],tasks=TASKS.filter(t=>t.area===id),count=tasks.filter(t=>done[t.id]).length,color=count?palettes[s.home.styles[tasks[0].id]??0]:'#a2a7a8';
 const furniture=tasks.map((t,j)=>{if(!done[t.id]&&s.home.pending!==t.id)return `<path d="M${x+25+j*46} ${y+h-40}l18 -12m-18 0l18 12" stroke="#706f73" stroke-width="4"/>`;
 const accent=palettes[s.home.styles[t.id]??0],cx=x+22+j*(w-50)/3,cy=y+55+j*12;
 const details=id==='bedroom'&&j===0?`<rect x="${cx+4}" y="${cy+4}" width="23" height="12" rx="5" fill="white"/><path d="M${cx+3} ${cy+23}h60" stroke="#fff" stroke-width="3"/>`:id==='living'&&j===1?`<path d="M${cx+3} ${cy+15}h60m-40 0v28m20-28v28" stroke="#fff" stroke-width="4"/>`:id==='entry'&&j===0?`<circle cx="${cx+48}" cy="${cy+25}" r="4" fill="#b88930"/>`:id==='kitchen'&&j===1?`<circle cx="${cx+20}" cy="${cy+19}" r="10" fill="#fff"/><circle cx="${cx+48}" cy="${cy+19}" r="10" fill="#fff"/>`:j===2?`<path d="M${cx+30} ${cy+5}v38m-20-30l20-20 20 20z" stroke="#816940" fill="#ffdf91" stroke-width="3"/>`:'';
 return `<g class="${s.home.pending===t.id?'building-now':''}" data-object="${t.id}"><rect x="${cx}" y="${cy}" width="${Math.min(70,w/3)}" height="${Math.min(50,h/3)}" rx="8" fill="${accent}" stroke="#685d64" stroke-width="3"/><path d="M${cx} ${cy+15}h${Math.min(70,w/3)}" stroke="#fff9" stroke-width="4"/>${details}${id==='garden'?`<circle cx="${cx+15}" cy="${cy}" r="13" fill="#6baf88"/>`:''}</g>`;}).join('');
 return `<g data-room="${id}" role="button" tabindex="0" aria-label="${name}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" stroke="${id===area?'#f9ce6a':'#71828c'}" stroke-width="${id===area?7:4}"/><path d="M${x} ${y}v-18h${w}v18" fill="#dcebf2" stroke="#8fa7bb" stroke-width="4"/>${furniture}<text x="${x+12}" y="${y+26}" fill="#354756" font-size="17" font-weight="700">${name} ${count}/3</text></g>`;}).join('');
 element.innerHTML=`<div class="home-bar"><div><span class="eyebrow">第1章</span><h1>トリケンの家</h1></div><strong>★ <span id="home-balance">${balance(s.progress)}</span></strong></div><p class="home-copy">星で少しずつ、ぼくたちの居場所をつくろう。</p><div class="house-world">${scene(s,area)}</div><nav class="room-tabs">${AREAS.map(([id,name])=>`<button data-area="${id}" aria-pressed="${area===id}">${name}</button>`).join('')}</nav><div id="repair-tasks">${TASKS.filter(t=>t.area===area).map(t=>`<article class="repair ${done[t.id]?'finished':''}"><div><b>${t.label}</b><small>${done[t.id]?'完成':s.home.pending===t.id?'建設中…':available(s,t)?'修復できます':`${t.at}面クリア後・前の修復が必要`}</small></div>${done[t.id]?`<div class="swatches" aria-label="${t.label}のデザイン">${['ナチュラル','ミント','ラベンダー'].map((label,i)=>`<button data-style="${t.id}" data-choice="${i}" aria-label="${label}" aria-pressed="${(s.home.styles[t.id]??0)===i}" style="background:${palettes[i]}"></button>`).join('')}</div>`:`<button data-repair="${t.id}" ${!available(s,t)||s.home.pending||balance(s.progress)<t.cost?'disabled':''}>★ ${t.cost}で直す</button>`}</article>`).join('')}</div><div class="home-bottom"><span>${clears(s)} / 50 クリア ・ 修復 ${TASKS.filter(t=>done[t.id]).length}/15</span><button class="primary" id="play-next">${clears(s)===50?'パズルをもう一度':'ステージ '+Math.min(50,clears(s)+1)+' へ'}</button></div>`;
 element.querySelector('#play-next').onclick=onPlay;
 element.querySelectorAll('[data-area],[data-room]').forEach(b=>{const go=()=>{area=b.dataset.area??b.dataset.room;render();};b.onclick=go;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};});
 element.querySelectorAll('[data-repair]').forEach(b=>b.onclick=()=>{try{setSave(beginRepair(getSave(),b.dataset.repair));render();resume();}catch(e){onError(e);}});
 element.querySelectorAll('[data-style]').forEach(b=>b.onclick=()=>{try{setSave(decorate(getSave(),b.dataset.style,Number(b.dataset.choice)));render();}catch(e){onError(e);}});
 element.querySelectorAll('[data-object]').forEach(b=>b.onclick=e=>{e.stopPropagation();const task=TASKS.find(t=>t.id===b.dataset.object);area=task.area;render();element.querySelector(`[data-style="${task.id}"]`)?.focus();});
 if(homeComplete(s)&&!s.home.completionSeen){const n=structuredClone(s);n.home.completionSeen=true;setSave(n);onComplete();}
 }
 function resume(){if(timer)clearTimeout(timer);if(getSave().home.pending)timer=setTimeout(()=>{try{setSave(finishRepair(getSave()));render();}catch(e){onError(e);}},matchMedia('(prefers-reduced-motion: reduce)').matches?0:700);}
 return {render,resume};
}
