import {newProgress,validateProgress,balance,buildTown} from './progress.js';
export const HOME_KEY='zurash-app:home-preview:ice-town:v2';
export const OLD_KEY='zurash-app:chapter-preview:ice-town:v1';
export const AREAS=[['entry','玄関・外壁'],['living','リビング'],['kitchen','キッチン・ダイニング'],['bedroom','寝室'],['garden','庭']];
// Five short story arcs. Display text is derived from existing saves, not persisted.
export const HOUSE_CHAPTERS=[
 {id:'entry',name:'外まわり',goal:'家の外を直して、玄関を開ける',intro:'まずは外から。扉・壁・玄関灯を直すと中に入れるよ。',finish:'家の外がきれいになった！ さあ、玄関から中へ入ろう。'},
 {id:'living',name:'リビング',goal:'みんなが集まれる場所を作る',intro:'床が傷んでいて、ゆっくりくつろげないみたい。',finish:'くつろげるリビングの完成！ お話するのが楽しみだね。'},
 {id:'kitchen',name:'キッチン',goal:'あたたかいごはんを作れるようにする',intro:'古い台所を直して、おいしいごはんを作ろう。',finish:'ごはんの準備ができた！ みんなで食卓を囲もう。'},
 {id:'bedroom',name:'寝室',goal:'ぐっすり休める部屋にする',intro:'夜も安心して眠れる寝室にしよう。',finish:'やさしい灯りの寝室が完成！ おやすみなさい。'},
 {id:'garden',name:'庭',goal:'外でも楽しく過ごせる場所にする',intro:'外の小道を直して、庭にも笑顔を広げよう。',finish:'庭まできれいになった！ トリケンの家、完成だね！'},
];
export function houseChapterProgress(s){
 return HOUSE_CHAPTERS.map(chapter=>{
  const tasks=TASKS.filter(task=>task.area===chapter.id);
  const doneCount=tasks.filter(task=>s.home.done[task.id]).length;
  return {...chapter,doneCount,total:tasks.length,complete:doneCount===tasks.length};
 });
}
const labels=[['玄関の扉を直す','外壁を塗る','玄関灯をつける'],['床を張り替える','ソファを置く','本棚を整える'],['調理台を直す','食卓を置く','コンロを整える'],['ベッドを直す','壁紙を選ぶ','読書灯をつける'],['小道を直す','花壇を作る','ガーデン席を作る']];
const legacy={living:'ice-crane',kitchen:'ice-workshop',garden:'crystal-gate'};
export const TASKS=AREAS.flatMap(([area],i)=>labels[i].map((label,j)=>({id:j===0&&legacy[area]?legacy[area]:`home-${area}-${j}`,area,label,cost:[3,2,3][j],at:[1,4,8,10,14,18,20,24,28,30,34,38,40,45,50][i*3+j],slot:j,requires:j?[j===1&&(legacy[area])?legacy[area]:`home-${area}-${j-1}`]:[]})));
// Home areas grow with the puzzle campaign and finished rooms.
// Derived only from v2 saves: no migration, no extra purchase or lost legacy room.
export const HOUSE_EXPANSIONS=[
 {area:'entry',stage:0},
 {area:'living',stage:10},
 {area:'kitchen',stage:20},
 {area:'bedroom',stage:30},
 {area:'garden',stage:40},
];
export function accessibleHouseAreas(s){
 const earned=clears(s);
 const preservedIndex=HOUSE_EXPANSIONS.reduce((max,expansion,i)=>{
  const hasHistoricWork=TASKS.some(task=>task.area===expansion.area&&
   (s.home.done[task.id]||s.home.pending===task.id));
  return hasHistoricWork?Math.max(max,i):max;
 },0);
 const unlocked=['exterior'];
 for(const [i,expansion] of HOUSE_EXPANSIONS.entries()){
  const previous=HOUSE_EXPANSIONS[i-1]?.area;
  // Entry becomes explorable only after all three outside repairs, not at start.
  const finishedPrevious=previous
   ?TASKS.filter(t=>t.area===previous).every(t=>s.home.done[t.id])
   :TASKS.filter(t=>t.area==='entry').every(t=>s.home.done[t.id]);
  if(i<=preservedIndex||(finishedPrevious&&earned>=expansion.stage)){
   unlocked.push(expansion.area);
  }else break;
 }
 return unlocked;
}
export function nextHouseExpansion(s){
 const visible=accessibleHouseAreas(s);
 const next=HOUSE_EXPANSIONS.find(exp=>!visible.includes(exp.area));
 if(!next)return null;
 const index=HOUSE_EXPANSIONS.indexOf(next),previous=HOUSE_EXPANSIONS[index-1]?.area;
 const previousDone=previous?TASKS.filter(t=>t.area===previous).every(t=>s.home.done[t.id]):true;
 return {area:next.area,stage:next.stage,previousDone,missingStages:Math.max(0,next.stage-clears(s))};
}
export function newHome(progress=newProgress()){validateProgress(progress);return {version:2,progress:structuredClone(progress),home:{done:Object.fromEntries(TASKS.filter(t=>Object.hasOwn(progress.town,t.id)).map(t=>[t.id,true])),styles:{},reached:Math.max(1,Math.min(50,Object.keys(progress.completed).length),...Object.keys(progress.town).map(id=>({"ice-workshop":10,"ice-crane":20,"crystal-gate":30}[id]??0))),pending:null,completionSeen:false},legacy:{town:structuredClone(progress.town)}};}
export function validateHome(s){
 if(s?.version!==2||!s.home||!s.legacy)throw Error('Invalid home save');validateProgress(s.progress);
 if(!Number.isInteger(s.home.reached)||s.home.reached<1||s.home.reached>50||!s.home.done||!s.home.styles||typeof s.home.completionSeen!=='boolean')throw Error('Invalid home state');
 for(const [id,value]of Object.entries(s.home.done))if(value!==true||!TASKS.some(t=>t.id===id)||!Object.hasOwn(s.progress.town,id))throw Error('Invalid repair ledger');
 for(const [id,value]of Object.entries(s.home.styles))if(!TASKS.some(t=>t.id===id)||!Number.isInteger(value)||value<0||value>2)throw Error('Invalid decoration');
 if(s.home.pending&&!TASKS.some(t=>t.id===s.home.pending&&Object.hasOwn(s.progress.town,t.id)&&!s.home.done[t.id]))throw Error('Invalid pending repair');
 return s;
}
export const clears=s=>Object.keys(s.progress.completed).filter(id=>/^pz-1000(0[1-9]|[1-4][0-9]|50)$/.test(id)).length;
// The story follows a fixed sequence of 15 repairs (three per room).
// Existing saved repairs remain credited even if they were completed out of order.
export const available=(s,t)=>{
 const index=TASKS.findIndex(task=>task.id===t.id);
 return index>=0&&clears(s)>=t.at&&
   TASKS.slice(0,index).every(previous=>s.home.done[previous.id])&&
   t.requires.every(id=>s.home.done[id]);
};
export function nextRepairMission(s) {
 const doneCount=TASKS.filter(t=>s.home.done[t.id]).length;
 // Legacy saves may contain an in-progress repair from an old free-form route.
 // Finish the actual pending item before resuming the first incomplete mission.
 const pendingTask=TASKS.find(t=>t.id===s.home.pending&&!s.home.done[t.id]);
 const task=pendingTask??TASKS.find(t=>!s.home.done[t.id])??null;
 if(!task)return {task:null,doneCount,total:TASKS.length,state:'complete',missingStages:0,missingStars:0};
 const missingStages=Math.max(0,task.at-clears(s)),missingStars=Math.max(0,task.cost-balance(s.progress));
 const state=s.home.pending?'building':missingStages?'stages':missingStars?'stars':
   available(s,task)?'ready':'previous';
 return {task,doneCount,total:TASKS.length,state,missingStages,missingStars};
}
export function beginRepair(s,id){validateHome(s);const t=TASKS.find(t=>t.id===id);if(!t)throw Error('Unknown repair');if(s.home.done[id])return structuredClone(s);if(s.home.pending)throw Error('Repair already in progress');if(!available(s,t))throw Error('Repair locked');const n=structuredClone(s);n.progress=buildTown(n.progress,t.id,t.cost);n.home.pending=id;return validateHome(n);}
export function finishRepair(s){validateHome(s);const n=structuredClone(s);if(n.home.pending){n.home.done[n.home.pending]=true;n.home.pending=null;}return validateHome(n);}
export function decorate(s,id,style){validateHome(s);if(!s.home.done[id]||!Number.isInteger(style)||style<0||style>2)throw Error('Decoration unavailable');const n=structuredClone(s);n.home.styles[id]=style;return validateHome(n);}
export const homeComplete=s=>clears(s)===50&&TASKS.every(t=>s.home.done[t.id]);
export function loadHome(storage){const text=storage.getItem(HOME_KEY);if(text!==null)return validateHome(JSON.parse(text));const old=storage.getItem(OLD_KEY);return newHome(old===null?newProgress():JSON.parse(old));}
export function saveHome(storage,s){storage.setItem(HOME_KEY,JSON.stringify(validateHome(s)));}
export const budget=TASKS.reduce((n,t)=>n+t.cost,0);
