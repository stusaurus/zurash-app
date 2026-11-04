import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {formatClearShare} from '../src/puzzle/clear-share.js';

const chapter2=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/adventure-v1.json',import.meta.url),'utf8')).stages;
const candidates=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/stage70-finale-candidates-v1.json',import.meta.url),'utf8')).stages;
const practice=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-01/fun-candidates-v1.json',import.meta.url),'utf8')).stages;

test('certified rank and real turn count are used, never an arbitrary claim',()=>{
 const stage=chapter2[0];
 const original=JSON.stringify(stage);
 for(const [turns,label] of [[8,'Sランク'],[9,'Aランク'],[10,'Bランク'],[11,'合格手数は未達']]){
  const copy=formatClearShare({stage,turns,mode:'adventure'});
  assert.match(copy,/ズラッシュ！/);
  assert.ok(copy.includes('第2章・第51面'));
  assert.ok(copy.includes(stage.chapter.title));
  assert.ok(copy.includes(turns+'手'));
  assert.ok(copy.includes(label));
  assert.ok(copy.endsWith('#ズラッシュ'));
  assert.ok(!copy.includes('prep'));
  assert.ok(!copy.includes('warpCrystal'));
  assert.ok(!copy.includes('hint'));
 }
 assert.equal(JSON.stringify(stage),original);
});
test('comparison subjects are explicitly non-final and cannot pose as a chapter release',()=>{
 const stage=candidates[0];
 const copy=formatClearShare({stage,turns:stage.challenge.minimumTurns,mode:'candidate'});
 assert.match(copy,/研究候補（正式採用前）/);
 assert.match(copy,/第70面/);
 assert.match(copy,/14手でSランク/);
 assert.doesNotMatch(copy,/次のステージ|結晶獲得|正式採用済み|https?:\/\//);
});
test('free practice cannot claim earned chapter-two rewards',()=>{
 const stage=chapter2[0];
 const copy=formatClearShare({stage,turns:8,mode:'practice'});
 assert.match(copy,/自由試遊/);
 assert.doesNotMatch(copy,/結晶獲得|ステージ解放|正式攻略/);
});
test('ungraded early puzzles can share a clear without fake S ranks',()=>{
 const stage=practice[0];
 const copy=formatClearShare({stage,turns:1});
 assert.match(copy,/研究パズル/);
 assert.match(copy,/1手でクリア！/);
 assert.doesNotMatch(copy,/Sランク|最短/);
});
test('invalid turn counts and impossible certified claims are rejected',()=>{
 for(const request of [
  {stage:chapter2[0],turns:0,mode:'adventure'},
  {stage:chapter2[0],turns:7,mode:'adventure'},
  {stage:chapter2[0],turns:8.5,mode:'adventure'},
  {stage:chapter2[0],turns:8,mode:'official-published'},
  {stage:null,turns:8},
  {stage:{chapter:{title:'?',number:'70'}},turns:8}
 ])assert.throws(()=>formatClearShare(request));
});
