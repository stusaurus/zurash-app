// Chapter two owns a separate ledger: chapter-one rewards and home state are never rewritten.
import {initialGate,replayGate} from './gate-v2.js';
import {initialPuzzle} from './schema.js';
import {replay,solved} from './engine.js';
export const CHAPTER_TWO_KEY='zurash-app:chapter-two-preview:v1';
export const practiceSaveKey=CHAPTER_TWO_KEY+':practice';
export const newChapterTwo=()=>({version:1,completed:{},active:null});
export const replayChapterTwo=(stage,actions)=>stage.rulesVersion==='solo-v2-gate'?replayGate(stage,actions):replay(stage,actions);
export const initialChapterTwo=stage=>stage.rulesVersion==='solo-v2-gate'?initialGate(stage):initialPuzzle(stage);
export function canEnterTwo(entries,save,index,{practice=false}={}){
 return Number.isInteger(index)&&index>=0&&index<entries.length&&(practice||entries.slice(0,index).every(s=>save.completed[s.id]?.revision===s.revision));
}
export function validateChapterTwo(save,entries,options={}){
 if(save?.version!==1||!save.completed||typeof save.completed!=='object'||Array.isArray(save.completed))throw Error('Unsupported chapter-two save');
 for(const [id,r]of Object.entries(save.completed)){
  const stage=entries.find(s=>s.id===id);
  if(!stage||r?.revision!==stage.revision||!Number.isInteger(r.bestTurns)||r.bestTurns<stage.challenge.minimumTurns||!Array.isArray(r.proof)||r.proof.length!==r.bestTurns||!replayChapterTwo(stage,r.proof).cleared)throw Error('Invalid chapter-two completion');
 }
 if(save.active!==null){
  const a=save.active,stage=entries.find(s=>s.id===a?.id);
  if(!stage||a.revision!==stage.revision||!Array.isArray(a.actions)||a.actions.length>1000||!canEnterTwo(entries,save,entries.indexOf(stage),options))throw Error('Invalid chapter-two resume');
  replayChapterTwo(stage,a.actions);
 }
 return save;
}
export function checkpointTwo(save,entries,stage,actions,options={}){
 const index=entries.findIndex(s=>s.id===stage.id);
 if(!canEnterTwo(entries,save,index,options))throw Error('Stage locked');
 const result=replayChapterTwo(stage,actions),next=structuredClone(save);
 next.active={id:stage.id,revision:stage.revision,actions:structuredClone(actions)};
 if(solved(result.state)){
  const old=next.completed[stage.id];
  if(!old||actions.length<old.bestTurns)next.completed[stage.id]={revision:stage.revision,bestTurns:actions.length,proof:structuredClone(actions)};
 }
 return next;
}
export function loadChapterTwo(storage,entries,options={}){
 const raw=storage.getItem(options.practice?practiceSaveKey:CHAPTER_TWO_KEY);
 return raw===null?newChapterTwo():validateChapterTwo(JSON.parse(raw),entries,options);
}
export function writeChapterTwo(storage,save,options={}){storage.setItem(options.practice?practiceSaveKey:CHAPTER_TWO_KEY,JSON.stringify(save));}

// Preserve an invalid/unknown-version record BEFORE explicitly resetting chapter two.
// A write failure must leave the original key untouched. Never touch chapter one.
export function recoverInvalidChapterTwo(storage,entries,options={}){
 const key=options.practice?practiceSaveKey:CHAPTER_TWO_KEY,raw=storage.getItem(key);
 if(raw===null)throw Error('No chapter-two save to recover');
 try{loadChapterTwo(storage,entries,options);}catch(_){
  const root=key+':invalid-backup';
  let suffix=1;
  while(storage.getItem(root+':'+suffix)!==null){
   suffix++;
   if(suffix>10000)throw Error('Too many chapter-two backups');
  }
  const backupKey=root+':'+suffix;
  storage.setItem(backupKey,raw);
  const fresh=newChapterTwo();
  storage.setItem(key,JSON.stringify(fresh));
  return {save:fresh,backupKey};
 }
 throw Error('Chapter-two save is valid; recovery is unnecessary');
}
