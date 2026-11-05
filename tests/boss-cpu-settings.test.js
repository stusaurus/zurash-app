import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initial,actions,apply} from '../src/engine.js';
import {CPU_PRESETS,resolveCpuLevel,cpuAction,cpuRng} from '../src/boss-cpu-settings.js';

test('CPU difficulty modes are explicit and invalid links fall back safely',()=>{
 assert.deepEqual(Object.keys(CPU_PRESETS),['practice','normal','challenge']);
 assert.equal(resolveCpuLevel('practice'),'practice');
 assert.equal(resolveCpuLevel('challenge'),'challenge');
 for(const invalid of [undefined,null,'','STRONG','../../bad','random']){
  assert.equal(resolveCpuLevel(invalid),'normal');
 }
 for(const preset of Object.values(CPU_PRESETS)){
  assert.ok(preset.label);
  assert.ok(['guided','greedy','search'].includes(preset.policy));
  assert.ok(Object.isFrozen(preset));
 }
});

test('the three difficulty policies make reproducible legal CPU turns without changing player state',()=>{
 const start=initial(0,0);
 const opening=actions(start).find(a=>a.wall===null);
 assert.ok(opening,'starting position should allow no-wall opening');
 const cpuState=apply(start,opening);
 assert.equal(cpuState.turn,1);
 const unchanged=JSON.stringify(cpuState);
 for(const level of ['practice','normal']){
  const first=cpuAction(cpuState,level,cpuRng(level));
  const second=cpuAction(cpuState,level,cpuRng(level));
  assert.ok(actions(cpuState).some(a=>JSON.stringify(a)===JSON.stringify(first)));
  assert.deepEqual(first,second,'same game and difficulty must replay deterministically');
  assert.equal(apply(cpuState,first).turn,0);
 }
 // Check the deeper policy at a one-turn winning situation so CI does not
 // make long artificial matches just to verify the legal engine boundary.
 const final={...initial(0,0),players:[6,0],walls:[4],stars:[3],scores:[0,2],target:3,turn:1,ply:8,winner:null};
 const guided=cpuAction(final,'practice',cpuRng('practice'));
 assert.ok(actions(final).some(a=>JSON.stringify(a)===JSON.stringify(guided)));
 assert.equal(apply(final,guided).winner,1,'beginner CPU takes a legal immediate win');
 const best=cpuAction(final,'challenge',cpuRng('challenge'));
 assert.ok(actions(final).some(a=>JSON.stringify(a)===JSON.stringify(best)));
 assert.equal(apply(final,best).winner,1);
 assert.equal(JSON.stringify(cpuState),unchanged,'CPU must not mutate game state');
 assert.equal(cpuAction(apply(final,best),'challenge',cpuRng('challenge')),null);
});
