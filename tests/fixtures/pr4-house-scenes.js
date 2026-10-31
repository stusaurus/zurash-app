// Presentation only: all spending, completion and styles remain in puzzle/house.js.
import {legacyRoomScene} from '../../src/house-room-legacy.js';
export const SCENES=[['exterior','家の外観'],['entry','玄関'],['living','リビング'],['kitchen','キッチン'],['bedroom','寝室'],['garden','庭']];
// One storey, south-facing front door; east garden. Interior camera looks south,
// so east/kitchen is on screen left and west/living is on screen right.
export const HOUSE_PLAN=Object.freeze({front:'south',door:'south-center',frontWindow:'south-west',kitchenWindow:'east',living:'west',kitchen:'east',bedroom:'north',garden:'east',storeys:1});
export const ENTRY_DESIGNS=[
 [{name:'森のアーチ',material:'オークの板扉・真鍮',motif:'arch'},{name:'光の格子',material:'ガラス・塗装木枠',motif:'glass'},{name:'船の丸窓',material:'縦羽目板・銅',motif:'porthole'}],
 [{name:'山小屋の漆喰',material:'白い漆喰・オーク梁',motif:'timber'},{name:'湖畔の板張り',material:'横張りのシダー材',motif:'clapboard'},{name:'石積みの家',material:'石灰岩・砂岩',motif:'masonry'}],
 [{name:'小さなランタン',material:'真鍮・型ガラス',motif:'lantern'},{name:'銅のベルライト',material:'銅の傘・陶器',motif:'bell'},{name:'まあるい灯り',material:'乳白ガラス・鉄',motif:'globe'}],
];
export const designOptions=t=>t.area==='entry'?ENTRY_DESIGNS[t.slot]:[
 {name:'ナチュラル',material:'木のぬくもり'},{name:'ミント',material:'やわらかな色合い'},{name:'ラベンダー',material:'落ち着いた色合い'}];
const R=(x,y,w,h,fill,rx=0,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const P=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const C=(x,y,r,fill,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const defs=`<defs>
 <linearGradient id="sky" x2="0" y2="1"><stop stop-color="#91c9dd"/><stop offset="1" stop-color="#eaf4e8"/></linearGradient>
 <linearGradient id="snow" x2=".3" y2="1"><stop stop-color="#fffdf4"/><stop offset="1" stop-color="#b6d5d8"/></linearGradient>
 <linearGradient id="wall" x2=".7" y2="1"><stop stop-color="#fff1cb"/><stop offset="1" stop-color="#d9bd91"/></linearGradient>
 <linearGradient id="wood" x2="1" y2=".2"><stop stop-color="#bd8851"/><stop offset=".5" stop-color="#e1b77b"/><stop offset="1" stop-color="#b47a43"/></linearGradient>
 <linearGradient id="roof" x2=".5" y2="1"><stop stop-color="#497c80"/><stop offset="1" stop-color="#264e5c"/></linearGradient>
 <linearGradient id="glass" x2=".5" y2="1"><stop stop-color="#e6f7f5"/><stop offset=".5" stop-color="#91c4c9"/><stop offset="1" stop-color="#6799a6"/></linearGradient>
 <linearGradient id="hall" x2=".1" y2="1"><stop stop-color="#f6e8d0"/><stop offset="1" stop-color="#d8b990"/></linearGradient>
 <linearGradient id="floor" x2=".2" y2="1"><stop stop-color="#bc9567"/><stop offset="1" stop-color="#eed3a7"/></linearGradient>
 <radialGradient id="light"><stop stop-color="#fff9c4" stop-opacity=".85"/><stop offset="1" stop-color="#ffdf8c" stop-opacity="0"/></radialGradient>
 <filter id="shadow" x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="0" dy="9" stdDeviation="7" flood-color="#33505b" flood-opacity=".22"/></filter>
 <filter id="small-shadow" x="-50%" y="-50%" width="200%" height="220%"><feDropShadow dx="1" dy="3" stdDeviation="2" flood-color="#243c42" flood-opacity=".25"/></filter>
 <pattern id="siding" width="100" height="15" patternUnits="userSpaceOnUse">${R(0,0,100,15,'#96b6a9')}<path d="M0 13h100" stroke="#5d8276" stroke-width="2"/><path d="M0 1h100" stroke="#c7ddc5"/></pattern>
 <pattern id="stone" width="72" height="42" patternUnits="userSpaceOnUse">${R(0,0,72,42,'#eee1c4')}<path d="M0 0h72v21H0zm0 21h72v21H0M35 0v21M13 21v21M60 21v21" fill="#d7cbb1" stroke="#f3e8d0" stroke-width="3"/></pattern>
 <pattern id="grain" width="24" height="90" patternUnits="userSpaceOnUse"><path d="M3 0q5 25 0 50t0 40M18 0q-6 40 0 90" fill="none" stroke="#6c4c32" stroke-opacity=".13"/></pattern>
 </defs>`;
function windowArt(x,y,w,h){return `<g transform="translate(${x} ${y})" filter="url(#small-shadow)">${R(-5,-5,w+10,h+12,'#72573e',5)}${R(0,0,w,h,'url(#glass)',2)}${P(`M2 2h${w*.45}L2 ${h*.7}Z`,'#fff', 'opacity=".45"')}${R(w*.47,0,4,h,'#f7e5ba')}${R(0,h*.48,w,4,'#f7e5ba')}${P(`M0 0q${w*.3} ${h*.15} ${w*.22} ${h}H0Z`,'#f7f2df','opacity=".8"')}${P(`M${w} 0q-${w*.3} ${h*.15} -${w*.22} ${h}h${w*.22}Z`,'#f7f2df','opacity=".8"')}${R(-10,h+3,w+20,7,'#f9f0da',3)}</g>`;}
function doorArt(style,done,inside=false){
 const common=R(-6,-6,98,151,'#715b48',7)+R(-2,-2,90,143,'#f8e6c2',5)+R(3,3,80,136,'#443f38',3);
 let leaf='';
 if(!done)leaf=R(6,5,74,133,'#8e8a75',2)+P('M12 8v125m18-125v125m19-125v125m19-125v125','none','stroke="#696c5f" stroke-width="2"')+P('M8 35l69 64-4 11L7 47Z','#b0a28b')+P('M7 111l69-42 3 10-70 43Z','#b6a48a')+P('M43 7l-9 31 14 15-10 32','none','stroke="#4b5148" stroke-width="3"');
 else if(style===0)leaf=P('M7 137V40Q43-22 79 40v97Z','url(#wood)')+R(9,47,68,88,'url(#grain)')+P('M22 35v98m21-106v106m21-98v98','none','stroke="#8d613b" stroke-width="1.5"')+P('M14 69h58m-58 48h58','none','stroke="#977047" stroke-width="4"')+C(66,87,4,'#e9c778')+C(43,39,14,'#567e61')+C(43,39,9,'#bd9560')+P('M36 38l7 6 7-10','none','stroke="#e4d5a1" stroke-width="3"');
 else if(style===1){leaf=R(7,5,72,132,'#668f86',3)+R(13,11,60,68,'url(#glass)',2);for(const x of [32,53])leaf+=R(x,11,3,68,'#e1e6ca');leaf+=R(13,43,60,3,'#e1e6ca')+R(15,89,56,39,'#91b7a1',2)+R(20,94,46,29,'none',1,'stroke="#bfd3b7"')+R(65,83,4,14,'#e5c977',2);}
 else leaf=R(7,5,72,132,'#334f64',3)+P('M21 6v130m15-130v130m15-130v130m15-130v130','none','stroke="#61798a" stroke-width="2"')+C(43,44,25,'#c4976e')+C(43,44,19,'url(#glass)')+C(43,44,15,'none','stroke="#e5d3a2"')+C(66,92,4,'#d4a570')+R(13,117,60,5,'#c4976e',2);
 // The interior sees the reverse face: knob and asymmetric details mirror.
 return `<g data-door-design="${done?ENTRY_DESIGNS[0][style].motif:'unrepaired'}" data-face="${inside?'inside':'outside'}">${common}<g ${inside?'transform="translate(86 0) scale(-1 1)"':''}>${leaf}</g>${R(-8,139,102,8,'#9e8c72',2)}</g>`;
}
function lampArt(style,done){
 if(!done)return P('M0 0v17m-8-1h16l-5 14H-4Z','none','stroke="#6a706a" stroke-width="3"')+P('M-7 9l14 18','none','stroke="#735f48" stroke-width="3"');
 let a=C(0,22,46,'url(#light)');
 if(style===0)a+=P('M-5 0h11v4H-5m5 0v8m-12 4L0 8l12 8-3 27H-9Z','#f9de92','stroke="#795f3b" stroke-width="3"')+P('M-12 16h24M0 17v25','none','stroke="#795f3b" stroke-width="2"');
 if(style===1)a+=P('M0 0v9q0 5 7 5','none','stroke="#7b5a44" stroke-width="5"')+P('M-16 27q5-24 24-8l8 8Z','#b98155','stroke="#8b6245" stroke-width="2"')+R(-12,27,24,5,'#f1ca8e',2)+C(0,34,7,'#fff0bb');
 if(style===2)a+=P('M0 0v12m-8-12H8','none','stroke="#354f50" stroke-width="4"')+C(0,27,16,'#ffefc7','stroke="#d4b88a" stroke-width="2"')+R(-6,42,12,4,'#466164',2);
 return `<g data-light-design="${ENTRY_DESIGNS[2][style].motif}">${a}</g>`;
}
function foliage(x,y,scale=1){return `<g transform="translate(${x} ${y}) scale(${scale})">${P('M-5 0h10l4 70H-8Z','#826f53')}${P('M0-65L-40 8h20L-54 41h108L20 8h20Z','#527d76')}${P('M0-65L-27-12h54ZM-34 7l-13 23h94L34 7l-34 9Z','#e8f3e5')}${P('M-46 41h92l-7 6H-40Z','#bad7d0')}</g>`;}
function scaffold(){return `<g class="construction-art" aria-hidden="true"><path d="M86 230v180m82-180v180M78 269h98M78 337h98M86 235l82 95m-82 5l82-95" stroke="#b99b61" stroke-width="7" fill="none"/><path d="M72 270h110m-110 68h110" stroke="#e9c894" stroke-width="10"/><path d="M93 244l8-8 8 8-8 8Z" fill="#ffdd75"/></g>`;}
function stateGroup(s,id,art){return `<g data-object="${id}" data-state="${s.home.pending===id?'building':s.home.done[id]?'complete':'before'}" class="scene-object ${s.home.pending===id?'building-now':''}">${art}</g>`;}
function exterior(s){
 const done=s.home.done,style=id=>s.home.styles[id]??0,wallDone=done['home-entry-1'],wallStyle=style('home-entry-1');
 let art=R(0,0,480,540,'url(#sky)')+C(380,66,37,'#fff7d5','opacity=".8"')+P('M0 185l60-69 45 33 76-87 67 84 65-58 91 81 76-54v180H0Z','#bdd8d8')+P('M0 207l103-40 75 20 83-43 96 53 123-27v160H0Z','#88b6b4')+P('M0 279Q130 224 264 258T480 245V540H0Z','url(#snow)');
 art+=foliage(33,200,.85)+foliage(446,201,.8)+foliage(410,245,.65);
 art+=`<g filter="url(#shadow)">`+P('M41 415l289 33 126-78-247-81Z','#bed1c7')+P('M51 407l277 29 119-72-247-75Z','#e4e8d3');
 // Fixed envelope: south front, east kitchen window and garden gate.
 art+=P('M340 208l76-53v189l-76 50Z',wallDone?(wallStyle===1?'#7c9b8c':wallStyle===2?'#b1ad97':'#c4b18b'):'#a5a393');
 art+=stateGroup(s,'home-entry-1',R(66,211,276,182,wallDone?['url(#wall)','url(#siding)','url(#stone)'][wallStyle]:'#b7b9a6',2)+(!wallDone?P('M78 228l37 9-19 36-28-8m238 67l-29-18 8 50 40-5M142 378l21-29 19 27','none','stroke="#8c9688" stroke-width="8"'):wallStyle===0?P('M71 212v178m265-178v178M69 251h272','none','stroke="#a77f54" stroke-width="9"'):''));
 art+=R(63,379,281,17,'#9b987e',3)+P('M340 380l76-50v17l-76 49Z','#797c6e');
 art+=P('M48 219L199 109l151 105 82-56L276 55 124 162Z','url(#roof)')+P('M48 219L199 109l151 105-8 12-143-98L56 230Z','#294e57');
 for(let n=0;n<9;n++)art+=P(`M${70+n*16} ${203-n*10}l140 98`,'none','stroke="#7ea099" stroke-width="2" opacity=".3"');
 art+=P('M44 215l153-110 155 106 80-56-7-9-75 48L199 91 42 204Z','#f6f7e9')+P('M128 157L275 54l145 95-15 4-130-85-136 99Z','#f5f5e6');
 art+=P('M309 87V46l28 2v58Z','#ab9277')+R(307,40,33,10,'#e9ead8',3)+P('M319 32q-8-15 4-23m0 25q21-15 8-29','none','stroke="#ffffff" stroke-width="8" opacity=".6"');
 art+=P('M148 206l51-37 52 37Z','#dec29a')+C(199,194,11,'#699a9d','stroke="#fff0c9" stroke-width="4"');
 art+=windowArt(91,266,63,70)+`<g transform="matrix(.65 -.43 0 1 363 231)">${windowArt(0,0,48,63)}</g>`;
 art+=P('M164 393h100l10 15H154Z','#e7dec6')+P('M154 408h120v10H154Z','#b7ad94')+P('M149 419h130l10 14H138Z','#e9e0c9');
 art+=stateGroup(s,'home-entry-0',`<g transform="translate(171 249) scale(.86)">${doorArt(style('home-entry-0'),done['home-entry-0'])}</g>`);
 art+=stateGroup(s,'home-entry-2',`<g transform="translate(279 264) scale(.76)">${lampArt(style('home-entry-2'),done['home-entry-2'])}</g>`);
 art+=R(265,322,42,22,'#dfd4b2',3)+P('M270 329h32m-32 7h23','none','stroke="#95805b" stroke-width="2"');
 art+='</g>';
 // Porch props and the garden are on the same east side in every view.
 art+=`<g filter="url(#small-shadow)">${R(80,363,49,31,'#ae865a',5)}${R(76,359,57,9,'#d8bc85',3)}${P('M84 357q-6-32 10-28 0-20 15-19 14 5 7 24 20-2 10 23Z','#678e6a')}${C(101,336,6,'#e7c7b1')}${C(119,349,5,'#f2dfba')}</g>`;
 art+=P('M0 464q75-42 145-23l74-22 45 10-68 27-47 84H53Z','#c9d1b9')+P('M105 493l31-38 30 4-25 40Zm48-46 30-17 31 4-24 18Z','#f1ebd7');
 art+=`<g>${P('M351 403l93-44v35l-93 45Z','#a5bba0')}${P('M354 403v34m18-42v33m18-42v33m18-42v33m18-42v33','none','stroke="#fbedd0" stroke-width="7"')}${P('M350 414l97-46','none','stroke="#d9d9bb" stroke-width="5"')}</g>`;
 if(s.home.pending?.startsWith('home-entry'))art+=scaffold();
 if(!done['home-entry-0'])art+=P('M139 434l11-8 25 8-7 6Zm-22-5 4-9 10 6-1 8Z','#9e967c');
 art+=`<ellipse cx="299" cy="436" rx="29" ry="8" fill="#6c887c" opacity=".2"/><image href="./assets/triken-orange-80.png" x="264" y="370" width="70" height="70"/>`;
 art+=P('M12 482q25-20 45-7m340-22q30-12 57-3','none','stroke="#93b4a0" stroke-width="3"');
 return art;
}
function entry(s){
 const done=s.home.done,style=id=>s.home.styles[id]??0,wallDone=done['home-entry-1'],wallStyle=style('home-entry-1');
 let art=R(0,0,480,540,'#d0dcd3');
 art+=P('M0 0h480v101L406 148H74L0 101Z','#f9ebd2')+P('M0 101l74 47v205L0 470Z','#c7b293')+P('M406 148l74-47v369l-74-117Z','#e3ca9f');
 art+=stateGroup(s,'home-entry-1',R(74,148,332,211,wallDone?['url(#hall)','#dce4cd','url(#stone)'][wallStyle]:'#c2c0ab')+R(74,285,332,74,wallDone?['#b68a58','url(#siding)','#b4ad95'][wallStyle]:'#989f8b')+R(72,282,336,8,wallDone?'#f1dfb8':'#b1ad94')+P('M75 154v201m329-201v201','none','stroke="#b09269" stroke-width="7"'));
 art+=P('M74 359h332l74 111v70H0v-70Z','url(#floor)');
 for(let i=0;i<9;i++)art+=P(`M${76+i*41} 359L${-92+i*83} 540`,'none','stroke="#99764e" stroke-width="1.4" opacity=".5"');
 for(const y of [379,411,455,512])art+=P(`M0 ${y}h480`,'none','stroke="#9e7a50" stroke-width="1.2" opacity=".45"');
 art+=P('M0 101l74 47h332l74-47M74 148v-15h332v15','none','stroke="#9d7a50" stroke-width="9"')+P('M0 94l74 46h332l74-46','none','stroke="#e4c698" stroke-width="6"');
 // Same south door, seen from the opposite side. West window is on the right.
 art+=stateGroup(s,'home-entry-0',`<g transform="translate(191 201) scale(1.1)">${doorArt(style('home-entry-0'),done['home-entry-0'],true)}</g>`);
 art+=windowArt(326,200,50,65);
 art+=P('M330 266l-70 90 133 56-3-119Z','#fff1be','opacity=".18"');
 // East passage (kitchen) on screen left, west passage (living) on right.
 art+=`<g>${P('M0 198l47 27v132L0 418Z','#65766c')}${P('M0 206l37 22v127L0 403Z','#b9c4a5')}${P('M0 350l37-14v19L0 403Z','#9a805a')}${P('M42 224v133L0 419','none','stroke="#8b6f4f" stroke-width="9"')}</g>`;
 art+=`<g>${P('M480 198l-47 27v132l47 61Z','#65766c')}${P('M480 206l-37 22v127l37 48Z','#e1d5b2')}${P('M480 350l-37-14v19l37 48Z','#a38b60')}${P('M438 224v133l42 62','none','stroke="#8b6f4f" stroke-width="9"')}</g>`;
 art+=stateGroup(s,'home-entry-2',`<g transform="translate(133 205)">${lampArt(style('home-entry-2'),done['home-entry-2'])}</g>`);
 // Permanent entrance belongings; no new paid tasks or extra budget.
 art+=`<g filter="url(#small-shadow)">${P('M83 341l75 3 13 20-92-2Z','#cda46b')}${R(79,361,92,14,'#a77a47',3)}${P('M85 373v28m77-26v28','none','stroke="#785b3b" stroke-width="7"')}${R(90,330,22,12,'#f0e5c8',4)}${P('M118 348q-10-13 1-14l19 5 1 13Z','#9c7861')}${P('M142 351q-8-14 1-14l19 5-1 11Z','#577e77')}</g>`;
 art+=R(95,260,49,8,'#99754f',3)+P('M104 268v13m15-13v13m15-13v13','none','stroke="#9b8053" stroke-width="4"')+P('M103 280q-16 22-6 43l15 4 5-27-6-19Z','#d9b271')+P('M130 279l-8 17 6 18 14-3-2-20Z','#74998a');
 art+=P('M188 398q60-18 114 0l26 47q-86 28-164 0Z',done['home-entry-0']?'#638d80':'#8b9380','stroke="#e9d4a4" stroke-width="4"')+P('M192 407q51-12 105 0m-111 25q65 14 124 0','none','stroke="#c6d1ab" stroke-width="3"');
 art+=`<g filter="url(#small-shadow)">${P('M351 342h29l-4 31h-21Z','#bc9062')}${P('M364 343q-30-17-15-29 13-4 15 20-5-38 12-35 16 13-10 37 31-24 31-5-9 15-30 12Z','#719577')}</g>`;
 if(!wallDone)art+=P('M77 161l35 9-9 31-28-8m280 81l-19-22 26-23 18 16M303 309l29 10-7 26-30-16','none','stroke="#909c8b" stroke-width="6"');
 if(s.home.pending?.startsWith('home-entry'))art+=`<g transform="translate(8 -6)">${scaffold()}</g>`;
 art+=`<ellipse cx="354" cy="478" rx="32" ry="9" fill="#6b694e" opacity=".18"/><image href="./assets/triken-orange-80.png" x="317" y="405" width="77" height="77"/>`;
 art+=P('M0 520q237-45 480 0v20H0Z','#c8b08b','opacity=".3"');
 return art;
}
export function renderHouseScene(s,id){
 if(!['exterior','entry'].includes(id))return legacyRoomScene(s,id);
 const title=id==='exterior'?'雪に包まれたトリケンの家。南の玄関、東の庭とキッチン':'玄関の内側。正面が南の扉、右が西のリビング、左が東のキッチン';
 return `<svg class="illustrated-scene" viewBox="0 0 480 540" role="img" aria-label="${title}" data-scene-art="${id}" data-wall-design="${s.home.done['home-entry-1']?ENTRY_DESIGNS[1][s.home.styles['home-entry-1']??0].motif:'unrepaired'}">${defs}${id==='exterior'?exterior(s):entry(s)}</svg>`;
}
export const SCENE_LINKS={
 exterior:[{to:'entry',x:44,y:65,label:'玄関へ'},{to:'living',x:23,y:46,label:'リビング'},{to:'kitchen',x:79,y:39,label:'キッチン'},{to:'bedroom',x:46,y:21,label:'寝室'},{to:'garden',x:82,y:76,label:'庭へ'}],
 entry:[{to:'exterior',x:50,y:61,label:'外へ'},{to:'kitchen',x:12,y:53,label:'キッチンへ'},{to:'living',x:88,y:53,label:'リビングへ'},{to:'bedroom',x:50,y:94,label:'奥の寝室へ'}],
};
