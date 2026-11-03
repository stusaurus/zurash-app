import {test} from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import {reviewCards,REVIEW_STAGES,stage54ComparisonRows,stage59ComparisonRows,stage57ComparisonRows,stage70ComparisonRows,formatChapterTwoComparisonText} from '../src/puzzle/chapter-two-review-summary.js';
const stages=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/adventure-v1.json',import.meta.url))).stages;
test('four comparison stages are exactly 54, 57, 59, 70, keeping official stage names',()=>{
 assert.deepEqual(REVIEW_STAGES.map(x=>x.number),[54,57,59,70]);
 const rows=reviewCards(stages,{});
 assert.equal(rows.length,4);
 for(const r of rows){
  assert.ok(r.minimumTurns>=1);
  assert.ok(r.title.length>1);
  assert.equal(r.rating,'未評価');
  assert.equal(r.bestAdventure,null);
 }
 assert.equal(rows[1].contrast,67);
 assert.equal(rows[2].contrast,65);
 assert.equal(rows[3].contrast,null);
 assert.equal(rows[3].minimumTurns,18);
});
test('ratings and both verified completion ledgers are displayed separately without mutation',()=>{
 const s=stages.find(x=>x.chapter.number===57),review={enjoyment:'fun',difficulty:'hard',note:'三度開いた'};
 const ratings={[s.id]:review},normal={[s.id]:{bestTurns:19}},practice={[s.id]:{bestTurns:21}};
 const before=JSON.stringify({ratings,normal,practice});
 const rows=reviewCards(stages,ratings,{adventure:normal,practice});
 assert.equal(rows[1].rating,'面白かった');assert.equal(rows[1].difficulty,'難しい');
 assert.equal(rows[1].bestAdventure,19);assert.equal(rows[1].bestPractice,21);
 assert.equal(rows[1].note,'三度開いた');
 assert.equal(rows[0].hasReview,false);
 assert.equal(before,JSON.stringify({ratings,normal,practice}));
});
test('missing candidate data is a hard error, never silently invented',()=>{
 assert.throws(()=>reviewCards(stages.filter(x=>x.chapter.number!==59),{}),/Missing comparison stage 59/);
 assert.throws(()=>reviewCards(stages.filter(x=>x.chapter.number!==70),{}),/Missing comparison stage 70/);
});

const remixes=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/stage54-remix-candidates-v1.json',import.meta.url))).stages;
test('stage54 comparison keeps real original and two distinct candidate ids',()=>{
 const rows=stage54ComparisonRows(stages,remixes,{});
 assert.deepEqual(rows.map(x=>x.key),['original','a','b']);
 assert.deepEqual(rows.map(x=>x.minimumTurns),[19,16,17]);
 assert.deepEqual(rows.map(x=>x.wallActions),[0,4,7]);
 assert.ok(rows.every(x=>x.rating==='未評価'));
 assert.ok(rows.slice(1).every(x=>x.status==='研究用・未採用'));
});
test('stage54 three independent optional human feedbacks do not mutate data',()=>{
 const ids=[stages.find(s=>s.chapter.number===54).id,...remixes.map(s=>s.id)];
 const reviews=Object.fromEntries(ids.map((id,i)=>[id,{enjoyment:['fun','okay','poor'][i],difficulty:'hard',insight:['strong','some','none'][i],note:'感想'+i}]));
 const raw=JSON.stringify(reviews);
 const rows=stage54ComparisonRows(stages,remixes,reviews);
 assert.deepEqual(rows.map(x=>x.rating),['面白かった','ふつう','改善してほしい']);
 assert.deepEqual(rows.map(x=>x.insight),['発見があって気持ちよかった','少し発見があった','作業に感じた']);
 assert.deepEqual(rows.map(x=>x.note),['感想0','感想1','感想2']);
 assert.equal(JSON.stringify(reviews),raw);
 assert.throws(()=>stage54ComparisonRows(stages,remixes.slice(0,1),{}),/Three verified/);
});

const stage59Research=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/stage59-return-candidates-v1.json',import.meta.url))).stages;
test('stage59 comparison retains original plus two separate candidate data records',()=>{
 const rows=stage59ComparisonRows(stages,stage59Research,{});
 assert.deepEqual(rows.map(x=>x.minimumTurns),[20,18,19]);
 assert.deepEqual(rows.map(x=>x.key),['original','a','b']);
 assert.ok(rows.slice(1).every(x=>x.status==='研究用・未採用'));
 assert.ok(rows.every(x=>x.rating==='未評価'));
 assert.throws(()=>stage59ComparisonRows(stages,stage59Research.slice(0,1),{}),/Three verified/);
});

const stage57Variants=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/stage57-remix-candidates-v1.json',import.meta.url))).stages;
test('stage57 comparison retains the original and displays two faster, distinct alternatives',()=>{
 const rows=stage57ComparisonRows(stages,stage57Variants,{});
 assert.deepEqual(rows.map(r=>r.minimumTurns),[19,16,17]);
 assert.deepEqual(rows.map(r=>r.wallActions),[8,6,4]);
 assert.deepEqual(rows.map(r=>r.key),['original','a','b']);
 assert.ok(rows.slice(1).every(r=>r.status==='研究用・未採用'));
 assert.throws(()=>stage57ComparisonRows(stages,stage57Variants.slice(1),{}),/Three verified/);
});

const stage70Candidates=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/stage70-finale-candidates-v1.json',import.meta.url))).stages;
test('stage70 review retains original and both distinct finale candidates',()=>{
 const rows=stage70ComparisonRows(stages,stage70Candidates,{});
 assert.deepEqual(rows.map(x=>x.minimumTurns),[18,14,18]);
 assert.deepEqual(rows.map(x=>x.wallActions),[12,5,11]);
 assert.deepEqual(rows.map(x=>x.key),['original','a','b']);
 assert.ok(rows.slice(1).every(x=>x.status==='研究用・未採用'));
 assert.throws(()=>stage70ComparisonRows(stages,stage70Candidates.slice(1),{}),/Three verified/);
});

test('12-variant Japanese share text includes human reviews, missing variants and no auto-adoption',()=>{
 const groups=[
  ...stage54ComparisonRows(stages,remixes,{}).map(row=>({...row,stageNumber:54})),
  ...stage57ComparisonRows(stages,stage57Variants,{}).map(row=>({...row,stageNumber:57})),
  ...stage59ComparisonRows(stages,stage59Research,{}).map(row=>({...row,stageNumber:59})),
  ...stage70ComparisonRows(stages,stage70Candidates,{}).map(row=>({...row,stageNumber:70}))
 ];
 groups[1]={...groups[1],hasReview:true,rating:'面白かった',difficulty:'難しい',insight:'発見があって気持ちよかった',note:'中盤の壁移動に気づけた'};
 groups[11]={...groups[11],hasReview:true,rating:'ふつう',difficulty:'ちょうどいい',insight:'少し発見があった',note:''};
 const before=JSON.stringify(groups);
 const text=formatChapterTwoComparisonText(groups);
 assert.match(text,/評価済み 2\/12案/);
 assert.match(text,/【第54面】/);
 assert.match(text,/【第70面】/);
 assert.match(text,/中盤の壁移動に気づけた/);
 assert.match(text,/改良案B.*ふつう/);
 assert.match(text,/研究用・未採用/);
 assert.match(text,/現行70面：未評価/);
 assert.equal(JSON.stringify(groups),before);
 assert.throws(()=>formatChapterTwoComparisonText(groups.slice(1)),/12 verified/);
 assert.throws(()=>formatChapterTwoComparisonText([...groups.slice(0,11),{...groups[0],stageNumber:70}]),/out-of-order|Duplicated/);
});
