import test from 'node:test';
import assert from 'node:assert/strict';
import {cpuEncounterForClear,returnFromCpuEncounter} from '../src/puzzle/cpu-encounter.js';

test('optional rival encounter appears only at earned chapter-two milestones',()=>{
 for(const stage of [0,51,54,55,59,61,65,69,71,999,NaN,'60',null]){
  assert.equal(cpuEncounterForClear(stage),null);
 }
 const sixty=cpuEncounterForClear(60);
 assert.equal(sixty.level,'practice');
 assert.equal(sixty.href,'./duel-boss.html?cpu=practice&from=60');
 assert.match(sixty.label,/勝たなくても先へ進める/);
 const seventy=cpuEncounterForClear(70);
 assert.equal(seventy.level,'normal');
 assert.equal(seventy.href,'./duel-boss.html?cpu=normal&from=70');
 assert.ok(Object.isFrozen(seventy));
});

test('practice and tap state are preserved without granting any rewards',()=>{
 const event=cpuEncounterForClear(60,{practice:true,tapFirst:true});
 assert.equal(event.href,'./duel-boss.html?cpu=practice&from=60&practice=1&tap=1');
 const back=returnFromCpuEncounter(new URL(event.href,'https://local.test/').searchParams);
 assert.deepEqual(back,{
  stage:60,practice:true,tapFirst:true,
  href:'./chapter-two.html?trial=1&practice=1&stage=61&tap=1',
  label:'第61面へ進む'
 });
 const finalFree=returnFromCpuEncounter('?cpu=normal&from=70&practice=1&tap=1');
 assert.equal(finalFree.href,'./chapter-two.html?trial=1&practice=1&stage=70&tap=1');
 const finalAdventure=returnFromCpuEncounter('?from=70&tap=1');
 assert.equal(finalAdventure.href,'./adventure.html?view=expedition');
 assert.equal(returnFromCpuEncounter('?from=60').href,'./chapter-two.html?trial=1&stage=61');
});

test('unknown and hostile return parameters can never become a redirect',()=>{
 for(const search of ['', '?from=0','?from=61','?from=70x','?from=0070',
  '?from=https://evil.example','?from=%2F%2Fevil.example','?from=70%26practice%3D1']){
  assert.equal(returnFromCpuEncounter(search),null);
 }
 const safe=returnFromCpuEncounter('?from=60&practice=javascript%3Aalert(1)&tap=%2F%2Fevil.example');
 assert.equal(safe.href,'./chapter-two.html?trial=1&stage=61');
 assert.equal(safe.practice,false);
 assert.equal(safe.tapFirst,false);
});
