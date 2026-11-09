// Draft artwork renderer only. House economy, identifiers and v2 save stay untouched.
import {TASKS} from './puzzle/house.js';
import {renderExteriorGrowth} from './house-expansion-art.js';
export const ART_VERSION='v7.1';
const base='./assets/house/v7/';
const bg=name=>`${base}backgrounds/${name}-fixed-v1.webp`;
const variants=['before','a','b','c'];
const names={
 'home-entry-0':[['ナチュラルウッド','オーク・真鍮・雪の紋章','arch'],['アイスブルー','青い板扉・結晶の窓','glass'],['クリスタル','結晶ガラス・透かし彫り','crystal']],
 'home-entry-1':[['ナチュラルウォール','漆喰・オークの筋交い','timber'],['アイスウッド','青い横板・雪の彫刻','clapboard'],['クリスタルストーン','丸い石積み・結晶の目地','masonry']],
 'home-entry-2':[['クラシックランタン','真鍮・琥珀色のガラス','lantern'],['ベルライト','銅の傘・丸い電球','bell'],['クリスタルランタン','結晶・真鍮の透かし枠','crystal']],
 'ice-crane':[['オークの床','幅広板・木栓'],['寄せ木の床','クルミ・白木の寄せ木'],['結晶モザイクの床','石灰岩・青いモザイク']],
 'home-living-1':[['森のお茶会','オーク・生成りの毛織り'],['湖畔のソファ','曲げ木・青緑のベルベット'],['星あかりのソファ','彫刻木・ラベンダーの布']],
 'home-living-2':[['アーチの本棚','オーク・陶器'],['階段形の本棚','白木・籐の引き出し'],['ガラス扉の書棚','クルミ・結晶の飾り']],
 'ice-workshop':[['木の調理台','木の天板・銅のシンク'],['タイルの調理台','青い陶板・白いシンク'],['石の調理台','石の天板・結晶の取っ手']],
 'home-kitchen-1':[['丸い食卓','オーク・挽物の椅子'],['だ円の食卓','白木・曲木の椅子'],['八角の食卓','クルミ・結晶の象嵌']],
 'home-kitchen-2':[['ほうろうのコンロ','生成りのほうろう・銅'],['薪のコンロ','青緑の鋳鉄・真鍮'],['結晶のコンロ','滑石・結晶の象嵌']],
 'home-bedroom-0':[['木のそりベッド','オーク・雪柄のキルト'],['白木のベッド','挽物・編み込みの寝具'],['星のベッド','結晶の頭板・パッチワーク']],
 'home-bedroom-1':[['木の実の壁紙','生成りリネン・金の枝'],['雪の板壁','青い木板・白い雪模様'],['星織りの壁紙','織物・小さな星の刺繍']],
 'home-bedroom-2':[['リネンの読書灯','真鍮・プリーツの笠'],['曲げ木の読書灯','白木・すりガラス'],['結晶の読書灯','結晶ランタン・クルミ']],
 'crystal-gate':[['砂岩の小道','丸い敷石・足元の灯り'],['スレートの小道','曲線の石・青い縁'],['結晶の小道','紫の敷石・透明な結晶']],
 'home-garden-1':[['木の花壇','オーク・冬のバラ'],['石の花壇','曲線の石・スノードロップ'],['結晶の花壇','透かし木枠・冬の白い花']],
 'home-garden-2':[['森のガーデン席','アーチの木・真鍮灯'],['曲げ木のガーデン席','編み座・銅のベル灯'],['結晶のガーデン席','象嵌の木・石のテーブル']],
};
export const layeredDesignOptions=t=>names[t.id].map(([name,material,motif],i)=>({name,material,motif:motif??`${t.id}-${i}`}));
export function assetPath(s,id){
 const task=TASKS.find(t=>t.id===id),state=s.home.done[id]?variants[1+(s.home.styles[id]??0)]:'before';
 if(id==='home-entry-0')return `./assets/house/exterior/door/prototypes/door_${({before:'before',a:'natural',b:'iceblue',c:'crystal'})[state]}_03.png`;
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
 let art=image(bg('house-shell'),[0,0,480,540]);
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
 const area=scene==='exterior'?'entry':scene,ts=TASKS.filter(t=>t.area===area),n=ts.filter(t=>s.home.done[t.id]).length;
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
 // Reversible atmosphere: the architecture stays identical while repairs brighten it.
 art+=`<rect data-art-layer="atmosphere" width="480" height="540" fill="#162b55" opacity="${(.24*(3-n)/3).toFixed(3)}" pointer-events="none"/>`;
 if(s.home.done[ts[2].id])art+='<ellipse data-art-layer="light" cx="275" cy="270" rx="190" ry="225" fill="url(#art-amber)" pointer-events="none"/>';
 art+=construction(s,scene);
 // House scenes show the restored architecture itself; the arcade player sprite
 // remains in puzzle gameplay but is not composited into illustrated rooms.
 const wall=s.home.done['home-entry-1']?layeredDesignOptions(TASKS[1])[s.home.styles['home-entry-1']??0].motif:'unrepaired';
 return `<svg class="illustrated-scene" viewBox="0 0 480 540" role="img" aria-label="トリケンの家・${scene}" data-scene-art="${scene}" data-art-version="${ART_VERSION}" data-wall-design="${wall}">${art}</svg>`;
}
