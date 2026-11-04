import {test} from 'node:test';
import assert from 'node:assert/strict';
import {challengeReplayPath,shareableChallengeUrl} from '../src/puzzle/challenge-replay-link.js';

test('chapter two invitation always starts the recipient in independent practice at the exact stage',()=>{
 for(const n of [51,54,59,70]){
  const path=challengeReplayPath({page:'chapter-two.html',stageNumber:n,index:2,adventureMode:true});
  assert.equal(path,'./chapter-two.html?trial=1&practice=1&replay=1&stage='+n);
  assert.doesNotMatch(path,/save|proof|userId|token/);
 }
});

test('research candidates use their own real stage-indexed page and never become campaign stages',()=>{
 for(const [page,index] of [['stage54-remix-lab.html',2],['stage70-finale-lab.html',1],['fun-lab.html',4]]){
  const path=challengeReplayPath({page,index,stageNumber:70});
  assert.equal(path,'./'+page+'?stage='+index);
  assert.doesNotMatch(path,/practice=1|chapter-two.html/);
 }
});

test('only an HTTPS host serving the active game can produce a copyable absolute URL',()=>{
 const path=challengeReplayPath({page:'chapter-two.html',stageNumber:70,adventureMode:true});
 const live=shareableChallengeUrl('https://stusaurus.github.io/zurash-app/chapter-two.html?stage=51&trial=1',path);
 assert.equal(live,'https://stusaurus.github.io/zurash-app/chapter-two.html?trial=1&practice=1&replay=1&stage=70');
 assert.equal(shareableChallengeUrl('http://127.0.0.1:4173/chapter-two.html',path),null);
 assert.equal(shareableChallengeUrl('http://localhost:4173/chapter-two.html',path),null);
 assert.equal(shareableChallengeUrl('file:///tmp/chapter-two.html',path),null);
 assert.equal(shareableChallengeUrl('https://user:pass@example.com/chapter-two.html',path),null);
 assert.equal(shareableChallengeUrl('https://stusaurus.github.io/zurash-app/chapter-two.html','https://other.example/'),null);
});

test('bad page names, impossible stage numbers and injected query arguments fail closed',()=>{
 for(const input of [
  {page:'chapter-two.html',stageNumber:50,adventureMode:true},
  {page:'chapter-two.html',stageNumber:71,adventureMode:true},
  {page:'chapter-two.html',stageNumber:'70',adventureMode:true},
  {page:'unknown-lab.html',index:2},
  {page:'stage70-finale-lab.html',index:0},
  {page:'stage70-finale-lab.html',index:1.5}
 ])assert.throws(()=>challengeReplayPath(input));
 assert.equal(shareableChallengeUrl('https://stusaurus.github.io/zurash-app/chapter-two.html','./chapter-two.html?stage=51&saved=secret'),null);
});
