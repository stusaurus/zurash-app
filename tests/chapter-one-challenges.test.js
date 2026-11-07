import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readChapter} from '../scripts/chapter-one-verify.js';
import {deriveChapterOneChallenges} from '../scripts/chapter-one-grade-catalog.js';
import {validateChapterOneChallenges,challengeForChapterOneStage,gradeChapterOneClear,gradeChapterOneBest,chapterOneRankSummary} from '../src/puzzle/chapter-one-challenges.js';

const catalog=JSON.parse(fs.readFileSync('data/chapters/chapter-01/challenges-v1.json','utf8'));

test('all 50 grade certificates match verified chapter-one puzzle sources',async()=>{
 const {stages,proofs}=await readChapter();
 assert.deepEqual(validateChapterOneChallenges(catalog),deriveChapterOneChallenges(stages,proofs.stages));
 assert.equal(catalog.stages.length,50);
 for(let index=0;index<50;index++){
  const stage=stages[index],result=gradeChapterOneClear(catalog,stage,proofs.stages[index].actions.length);
  assert.equal(result.rank,'S',`stage ${index+1}`);
  assert.equal(result.minimumTurns,proofs.stages[index].optimalTurns);
 }
});

test('same S/A/B thresholds as Chapter 2 and no invalid ranking for old save',async()=>{
 const {stages}=await readChapter();
 const hardStage=stages[17]; // Stage 18: minimum 6
 assert.equal(challengeForChapterOneStage(catalog,hardStage).minimumTurns,6);
 assert.deepEqual([6,7,8,9].map(turns=>gradeChapterOneClear(catalog,hardStage,turns).rank),
  ['S','A','B','unqualified']);
 const saved={reward:1,revision:hardStage.revision,bestTurns:7};
 const original=structuredClone(saved);
 assert.equal(gradeChapterOneBest(catalog,hardStage,saved).rank,'A');
 assert.deepEqual(saved,original);
 assert.equal(gradeChapterOneBest(catalog,hardStage,{...saved,bestTurns:1}),null);
 assert.equal(gradeChapterOneBest(catalog,hardStage,{...saved,revision:999}),null);
 assert.equal(gradeChapterOneBest(null,hardStage,saved),null);
 assert.throws(()=>gradeChapterOneClear(catalog,hardStage,5),/impossible turn/);
});

test('a mismatched stage ID or uncertified minimum never yields a grade',async()=>{
 const {stages}=await readChapter();
 const swapped={...stages[0],id:stages[1].id};
 assert.throws(()=>challengeForChapterOneStage(catalog,swapped),/does not match/);
 const tampered=structuredClone(catalog);
 tampered.stages[0].challenge.verifiedBy='guess';
 assert.throws(()=>validateChapterOneChallenges(tampered),/Invalid certified|Uncertified/);
 const duplicate=structuredClone(catalog);duplicate.stages[1].id=duplicate.stages[0].id;
 assert.throws(()=>validateChapterOneChallenges(duplicate),/Invalid Chapter 1 challenge record/);
});

test('home S-rank summary chooses the earliest non-S clear and preserves old records',async()=>{
 const {stages}=await readChapter();
 const save={
  [stages[0].id]:{reward:1,revision:1,bestTurns:3},
  [stages[1].id]:{reward:1,revision:1,bestTurns:3},
  [stages[2].id]:{reward:1,revision:1,bestTurns:1},
 };
 const original=structuredClone(save);
 assert.deepEqual(chapterOneRankSummary(catalog,{}),{
  cleared:0,s:0,a:0,b:0,other:0,total:50,nextChallenge:null,allS:false
 });
 assert.deepEqual(chapterOneRankSummary(catalog,save),{
  cleared:3,s:1,a:0,b:0,other:2,total:50,nextChallenge:1,allS:false
 });
 save[stages[0].id].bestTurns=1;
 assert.equal(chapterOneRankSummary(catalog,save).nextChallenge,3);
 assert.equal(chapterOneRankSummary(catalog,save).s,2);
 assert.deepEqual(original[stages[2].id],save[stages[2].id]);
 assert.equal(chapterOneRankSummary(null,save),null);
});
