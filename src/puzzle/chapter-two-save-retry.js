// Retry an in-memory chapter-two checkpoint without reloading. A retry is
// allowed only after a write failure, from the exact previously observed
// persistent value. Do not merge with or silently replace another tab's save.
import {CHAPTER_TWO_KEY,practiceSaveKey,validateChapterTwo} from './chapter-two-progress.js';

export function retryChapterTwoSave(storage,entries,save,expectedRaw,options={}){
 if(expectedRaw!==null&&typeof expectedRaw!=='string')throw Error('Invalid previous save snapshot');
 const key=options.practice?practiceSaveKey:CHAPTER_TWO_KEY;
 // All saved stages and the active trace must still replay under the real
 // game engine. Validate before touching the browser's persistent record.
 validateChapterTwo(save,entries,options);
 if(storage.getItem(key)!==expectedRaw){
  const error=new Error('Chapter-two save changed after the last successful write');
  error.code='SAVE_CHANGED';
  throw error;
 }
 const raw=JSON.stringify(save);
 storage.setItem(key,raw);
 return {raw,save:structuredClone(save)};
}
