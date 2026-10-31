import {newProgress,validateProgress,balance,buildTown} from './progress.js';
export const HOME_KEY='zurash-app:home-preview:ice-town:v2';
export const OLD_KEY='zurash-app:chapter-preview:ice-town:v1';
export const AREAS=[['entry','玄関・外壁'],['living','リビング'],['kitchen','キッチン・ダイニング'],['bedroom','寝室'],['garden','庭']];
const labels=[['玄関の扉を直す','外壁を塗る','玄関灯をつける'],['床を張り替える','ソファを置く','本棚を整える'],['調理台を直す','食卓を置く','コンロを整える'],['ベッドを直す','壁紙を選ぶ','読書灯をつける'],['小道を直す','花壇を作る','ガーデン席を作る']];
const legacy={living:'ice-crane',kitchen:'ice-workshop',garden:'crystal-gate'};
export const TASKS=AREAS.flatMap(([area],i)=>labels[i].map((label,j)=>({id:j===0&&legacy[area]?legacy[area]:`home-${area}-${j}`,area,label,cost:[3,2,3][j],at:[1,4,8,10,14,18,20,24,28,30,34,38,40,45,50][i*3+j],slot:j,requires:j?[j===1&&(legacy[area])?legacy[area]:`home-${area}-${j-1}`]:[]})));
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
export const available=(s,t)=>clears(s)>=t.at&&t.requires.every(id=>s.home.done[id]);
export function beginRepair(s,id){validateHome(s);const t=TASKS.find(t=>t.id===id);if(!t)throw Error('Unknown repair');if(s.home.done[id])return structuredClone(s);if(s.home.pending)throw Error('Repair already in progress');if(!available(s,t))throw Error('Repair locked');const n=structuredClone(s);n.progress=buildTown(n.progress,t.id,t.cost);n.home.pending=id;return validateHome(n);}
export function finishRepair(s){validateHome(s);const n=structuredClone(s);if(n.home.pending){n.home.done[n.home.pending]=true;n.home.pending=null;}return validateHome(n);}
export function decorate(s,id,style){validateHome(s);if(!s.home.done[id]||!Number.isInteger(style)||style<0||style>2)throw Error('Decoration unavailable');const n=structuredClone(s);n.home.styles[id]=style;return validateHome(n);}
export const homeComplete=s=>clears(s)===50&&TASKS.every(t=>s.home.done[t.id]);
export function loadHome(storage){const text=storage.getItem(HOME_KEY);if(text!==null)return validateHome(JSON.parse(text));const old=storage.getItem(OLD_KEY);return newHome(old===null?newProgress():JSON.parse(old));}
export function saveHome(storage,s){storage.setItem(HOME_KEY,JSON.stringify(validateHome(s)));}
export const budget=TASKS.reduce((n,t)=>n+t.cost,0);
