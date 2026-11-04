import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {invitationGuide} from '../src/puzzle/invitation-guide.js';

const stages=JSON.parse(fs.readFileSync(new URL('../data/chapters/chapter-02/adventure-v1.json',import.meta.url),'utf8')).stages;

test('all 20 official chapter-two stages get the same short and valid invitation',()=>{
 for(const stage of stages){
  const before=JSON.stringify(stage);
  const guide=invitationGuide(stage);
  assert.match(guide.headline,/挑戦状/);
  assert.match(guide.stageLabel,new RegExp('STAGE '+stage.chapter.number+' '));
  assert.ok(guide.stageLabel.includes(stage.chapter.title));
  assert.equal(guide.steps.length,3);
  assert.ok(guide.steps.join(' ').includes('滑る'));
  assert.match(guide.privacy,/自由試遊/);
  assert.match(guide.privacy,/変わりません/);
  assert.doesNotMatch(JSON.stringify(guide),/proof|hint|最短|必勝|clear record/);
  assert.equal(JSON.stringify(stage),before);
 }
});

test('the guide cannot be made for unknown or fabricated stages',()=>{
 for(const stage of [undefined,null,{chapter:{number:50,title:'1章'}},{chapter:{number:71,title:'次の章'}},{chapter:{number:51,title:'  '}},{chapter:{number:'51',title:'なぞ'}}])
  assert.throws(()=>invitationGuide(stage),/Invalid invitation stage/);
});

test('guide text is frozen and cannot accidentally edit the data used for the next render',()=>{
 const result=invitationGuide(stages[19]);
 assert.ok(Object.isFrozen(result));
 assert.ok(Object.isFrozen(result.steps));
 assert.equal(result.steps.length,3);
});
