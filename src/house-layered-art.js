import {HOUSE_DESIGNS} from './puzzle/house-designs.js';
// Draft artwork renderer only. House economy, identifiers and v2 save stay untouched.
import {TASKS} from './puzzle/house.js';
import {renderExteriorGrowth} from './house-expansion-art.js';
export const ART_VERSION='v7.1';
const base='./assets/house/v7/';
const bg=name=>`${base}backgrounds/${name}-fixed-v1.webp`;
const variants=['before',...Array.from({length:Math.max(...Object.values(HOUSE_DESIGNS).map(options=>options.length))},(_,i)=>String.fromCharCode(97+i))];

export const layeredDesignOptions=t=>HOUSE_DESIGNS[t.id].map(([name,material,motif],i)=>({id:`${t.id}-${i}`,name,material,motif:motif??`${t.id}-${i}`}));
export function assetPath(s,id){
 const task=TASKS.find(t=>t.id===id),state=s.home.done[id]?variants[1+(s.home.styles[id]??0)]:'before';
 if(id==='home-entry-0')return `./assets/house/exterior/door/prototypes/door_${(({before:'before',a:'natural',b:'iceblue',c:'crystal'})[state]??state)}_03.png`;
 if(id==='home-bedroom-1'&&state==='b')return bg('entry-wall-b');
 return `${base}${task.area==='entry'?'exterior':task.area}/${id}-${state}-v1.webp`;
}
// Viewport coordinates shared by artwork, close-ups and minimum 44px HTML hit areas.
export const ART_PLACEMENTS={
 exterior:[[163,259,113,153],[67,244,288,158],[272,269,46,62]],
 entry:[[160,115,150,208],[73,91,356,215],[111,156,48,65]],
 living:[[0,324,480,216],[48,337,295,197],[281,217,111,177]],
 kitchen:[[106,247,220,147],[92,350,280,187],[340,251,101,149]],
 bedroom:[[92,304,277,208],[109,80,326,225],[351,274,102,149]],
 garden:[[58,259,245,276],[281,264,176,118],[230,373,229,153]],
};
const image=(path,r,extra='')=>`<image href="${path}" x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" ${extra.includes('preserveAspectRatio')?'':'preserveAspectRatio="xMidYMid meet"'} ${extra}/>`;
const whole=path=>image(path,[0,0,480,540],'preserveAspectRatio="none"');
function group(s,id,art){return `<g data-object="${id}" data-state="${s.home.pending===id?'building':s.home.done[id]?'complete':'before'}" data-variant="${s.home.done[id]?variants[1+(s.home.styles[id]??0)]:'before'}" class="scene-object ${s.home.pending===id?'building-now':''}">${art}</g>`;}
function surface(s,id,rect,clip){const state=s.home.done[id]?variants[1+(s.home.styles[id]??0)]:'before',path=clip==='hall-wall'?bg(`entry-wall-${state}`):assetPath(s,id);return group(s,id,`<g clip-path="url(#${clip})">${image(path,rect,'preserveAspectRatio="none"')}</g>`);}
function item(s,t,scene){let extra='';if(t.id==='home-entry-0')extra=`data-door-design="${s.home.done[t.id]?layeredDesignOptions(t)[s.home.styles[t.id]??0].motif:'unrepaired'}" data-face="${scene==='entry'?'inside':'outside'}"`;if(t.id==='home-entry-2')extra=`data-light-design="${s.home.done[t.id]?layeredDesignOptions(t)[s.home.styles[t.id]??0].motif:'unrepaired'}"`;
 const r=ART_PLACEMENTS[scene][t.slot],a=image(assetPath(s,t.id),r,extra);
 // Door is the same saved design viewed from the reverse side.
 return group(s,t.id,scene==='entry'&&t.id==='home-entry-0'?`<g transform="translate(${2*r[0]+r[2]} 0) scale(-1 1)">${a}</g>`:a);
}
function building(s){
 let art=image(s.home.done['home-entry-1']?bg('house-shell'):`${base}backgrounds/house-shell-before-v2.webp`,[0,0,480,540]);
 art+=surface(s,'home-entry-1',[66,243,290,159],'front-wall');
 art+=`<g transform="matrix(.59 -.34 0 1 371 252)"><g clip-path="url(#east-wall)">${image(assetPath(s,'home-entry-1'),[0,0,135,152],'preserveAspectRatio="none"')}</g></g>`;
 return art+item(s,TASKS[0],'exterior')+item(s,TASKS[2],'exterior');
}
const defs=`<defs>
 <radialGradient id="art-amber"><stop stop-color="#ffc66c" stop-opacity=".45"/><stop offset="1" stop-color="#ffb957" stop-opacity="0"/></radialGradient>
 <clipPath id="front-wall"><path d="M72 249H348V395H72Z M75 268H170V378H75Z M162 259H275V410H162Z" fill-rule="evenodd" clip-rule="evenodd"/></clipPath>
 <clipPath id="east-wall"><path d="M0 0H135V152H0Z M31 20H110V113H31Z" fill-rule="evenodd" clip-rule="evenodd"/></clipPath>
 <clipPath id="hall-wall"><path d="M77 94h84v133H77Z M313 246h111v58H313Z M78 229h82v15H78Z"/></clipPath>
 <clipPath id="living-floor"><path d="M0 324L480 337V540H0Z"/></clipPath>
 <clipPath id="bed-wall"><path d="M110 82h61v215h-61Z M174 229h215v67H174Z M393 86h42v210h-42Z"/></clipPath>
 </defs>`;
function construction(s,scene){if(!s.home.pending)return '';const t=TASKS.find(t=>t.id===s.home.pending);if((scene==='exterior'?'entry':scene)!==t.area)return '';const r=ART_PLACEMENTS[scene][t.slot],x=r[0]+r[2]/2,y=Math.min(487,r[1]+r[3]*.8);return `<g class="construction-art" data-art-layer="construction" pointer-events="none" transform="translate(${x} ${y})"><ellipse rx="49" ry="17" fill="url(#art-amber)"/><path d="M-35 9v-53m70 53v-53M-40-25h80M-40 0h80" fill="none" stroke="#c79a59" stroke-width="6"/><path d="M-44-28h88M-44 3h88" stroke="#f1cb8a" stroke-width="5"/><path d="M0-58l4 11 11 4-11 4-4 11-4-11-11-4 11-4Z" fill="#fff3ac"/></g>`;}
export function renderLayeredScene(s,scene){
 const area=scene==='exterior'?'entry':scene,ts=TASKS.filter(t=>t.area===area);
 let art=defs;
 if(scene==='exterior')art+=whole(bg('forest'))+building(s)+renderExteriorGrowth(s);
 else if(scene==='entry')art+=whole(bg('entry-shell'))+surface(s,'home-entry-1',[73,91,356,215],'hall-wall')+item(s,ts[0],scene)+item(s,ts[2],scene);
 else if(scene==='garden')art+=whole(bg('garden-shell'))+`<g pointer-events="none" transform="translate(-32 -44) scale(.57)">${building(s)}${renderExteriorGrowth(s)}</g>`+ts.map(t=>item(s,t,scene)).join('');
 else{
  art+=whole(bg(`${scene}-shell`));
  if(scene==='living')art+=surface(s,ts[0].id,ART_PLACEMENTS.living[0],'living-floor')+item(s,ts[2],scene)+item(s,ts[1],scene);
  if(scene==='kitchen')art+=item(s,ts[0],scene)+item(s,ts[2],scene)+item(s,ts[1],scene);
  if(scene==='bedroom')art+=surface(s,ts[1].id,ART_PLACEMENTS.bedroom[1],'bed-wall')+item(s,ts[0],scene)+item(s,ts[2],scene);
 }
 // Only the lighting repair changes room-wide brightness; other jobs keep the atmosphere.
 art+=`<rect data-art-layer="atmosphere" width="480" height="540" fill="#162b55" opacity="${(s.home.done[ts[2].id]?0:.24).toFixed(3)}" pointer-events="none"/>`;
 if(s.home.done[ts[2].id])art+='<ellipse data-art-layer="light" cx="275" cy="270" rx="190" ry="225" fill="url(#art-amber)" pointer-events="none"/>';
 art+=construction(s,scene);
 // House scenes show the restored architecture itself; the arcade player sprite
 // remains in puzzle gameplay but is not composited into illustrated rooms.
 const wall=s.home.done['home-entry-1']?layeredDesignOptions(TASKS[1])[s.home.styles['home-entry-1']??0].motif:'unrepaired';
 return `<svg class="illustrated-scene" viewBox="0 0 480 540" role="img" aria-label="トリケンの家・${scene}" data-scene-art="${scene}" data-art-version="${ART_VERSION}" data-wall-design="${wall}">${art}</svg>`;
}
