// One reward per stable stage id, including after catalog revisions/replays.
// Prototype for local progress only; not an authoritative purchase ledger.
import {replay} from './engine.js';
export const SAVE_KEY='zurash-app:puzzle-progress:v1';
export const newProgress=()=>({version:1,completed:{},town:{}});
export function validateProgress(s) {
  if(!s||s.version!==1||!s.completed||typeof s.completed!=='object'||Array.isArray(s.completed)||!s.town||typeof s.town!=='object'||Array.isArray(s.town))throw Error('Invalid save');
  for(const [id,record] of Object.entries(s.completed))if(!/^pz-\d{6}$/.test(id)||!record||record.reward!==1||!Number.isInteger(record.bestTurns)||record.bestTurns<1||!Number.isInteger(record.revision)||record.revision<1)throw Error('Invalid completion');
  for(const [id,cost]of Object.entries(s.town))if(!/^[a-z0-9-]+$/.test(id)||!Number.isInteger(cost)||cost<1)throw Error('Invalid town spend');
  if(balance(s)<0)throw Error('Invalid star balance');
  return s;
}
export const balance=s=>Object.values(s.completed).reduce((n,r)=>n+r.reward,0)-Object.values(s.town).reduce((n,c)=>n+c,0);
export function recordClear(s,stage,turns,{allowCandidates=false}={}) {
  validateProgress(s);
  if((stage.status!=='approved'&&!(allowCandidates&&stage.status==='candidate'))||!Number.isInteger(turns)||turns<1)throw Error('Clear not eligible for rewards');
  const n=structuredClone(s),old=n.completed[stage.id];
  if(old&&stage.revision<old.revision)throw Error('Outdated stage revision');
  n.completed[stage.id]={reward:1,bestTurns:old?.revision===stage.revision?Math.min(old.bestTurns,turns):turns,revision:stage.revision};
  return validateProgress(n);
}
export function completePuzzle(s,stage,actions,options) {
  if(!replay(stage,actions).cleared)throw Error('Puzzle not cleared');
  return recordClear(s,stage,actions.length,options);
}
export function buildTown(s,projectId,cost) {
  validateProgress(s);
  if(!/^[a-z0-9-]+$/.test(projectId)||!Number.isInteger(cost)||cost<1)throw Error('Invalid project');
  if(Object.hasOwn(s.town,projectId))return structuredClone(s);
  if(balance(s)<cost)throw Error('Not enough stars');
  const n=structuredClone(s);n.town[projectId]=cost;return validateProgress(n);
}
export function saveProgress(storage,s,key=SAVE_KEY) {
  const text=JSON.stringify(validateProgress(s));
  storage.setItem(key,text);return text.length;
}
export function loadProgress(storage,key=SAVE_KEY) {
  const text=storage.getItem(key);
  return text===null?newProgress():validateProgress(JSON.parse(text));
}
