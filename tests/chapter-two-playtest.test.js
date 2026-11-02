import {test} from 'node:test';import assert from 'node:assert/strict';
import {CHAPTER_TWO_REVIEW_KEY,loadChapterTwoReviews,recordChapterTwoReview,exportChapterTwoReviews} from '../src/puzzle/chapter-two-playtest.js';
const stage={id:'gate-cycle-57-v1',chapter:{number:57,title:'三度ひらく氷扉'}};
test('playtest review is separate from game, chapter one and practice progress',()=>{
 const values=new Map([['zurash-app:chapter-two-preview:v1','campaign-save'],['zurash-app:home-preview:ice-town:v2','house-save']]);
 const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const saved=recordChapterTwoReview(storage,stage,{enjoyment:'fun',difficulty:'hard',note:'ゲートの3切替でひらめいた'},{now:'2026-11-02T01:00:00.000Z'});
 assert.equal(saved.title,stage.chapter.title);
 assert.equal(values.get('zurash-app:chapter-two-preview:v1'),'campaign-save');
 assert.equal(values.get('zurash-app:home-preview:ice-town:v2'),'house-save');
 assert.equal(loadChapterTwoReviews(storage).reviews[stage.id].enjoyment,'fun');
 const exported=JSON.parse(exportChapterTwoReviews(storage));
 assert.equal(exported.kind,'chapter-two-human-playtest');
 assert.equal(exported.reviews[stage.id].difficulty,'hard');
});
test('unknown versions and malformed reviews are never silently overwritten',()=>{
 for(const raw of ['{',JSON.stringify({version:4,reviews:{}}),JSON.stringify({version:1,reviews:{'invalid-1':{enjoyment:'bad',difficulty:null,note:'',title:'x',savedAt:'2026-11-02T01:00:00.000Z'}}})]){
  const storage={getItem:()=>raw,setItem:()=>{throw Error('Should not write')}};
  assert.throws(()=>loadChapterTwoReviews(storage));
  assert.throws(()=>recordChapterTwoReview(storage,stage,{enjoyment:'fun'}));
 }
});
test('invalid input and text longer than 300 characters are rejected',()=>{
 const storage={getItem:()=>null,setItem:()=>{}};
 assert.throws(()=>recordChapterTwoReview(storage,stage,{enjoyment:'invalid'}));
 assert.throws(()=>recordChapterTwoReview(storage,stage,{enjoyment:'fun',difficulty:'bad'}));
 assert.throws(()=>recordChapterTwoReview(storage,stage,{enjoyment:'fun',note:'x'.repeat(301)}));
});

test('legacy records without insight load, new insight saves under same key',()=>{
 const old={version:1,reviews:{'gate-cycle-57-v1':{title:'old',number:57,enjoyment:'fun',difficulty:'hard',note:'old',savedAt:'2026-11-02T01:00:00.000Z'}}};
 const map=new Map([[CHAPTER_TWO_REVIEW_KEY,JSON.stringify(old)],['zurash-app:chapter-two-preview:v1','campaign']]);
 const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 assert.equal(loadChapterTwoReviews(storage).reviews[stage.id].insight,undefined);
 recordChapterTwoReview(storage,stage,{enjoyment:'okay',difficulty:'balanced',insight:'strong',note:'発見'},{now:'2026-11-02T01:03:00.000Z'});
 assert.equal(loadChapterTwoReviews(storage).reviews[stage.id].insight,'strong');
 assert.equal(map.get('zurash-app:chapter-two-preview:v1'),'campaign');
 assert.equal(JSON.parse(exportChapterTwoReviews(storage)).reviews[stage.id].insight,'strong');
 assert.throws(()=>recordChapterTwoReview(storage,stage,{enjoyment:'fun',insight:'invalid'}),/Invalid/);
});
