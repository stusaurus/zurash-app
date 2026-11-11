import test from 'node:test';
import assert from 'node:assert/strict';
import {newHome,TASKS} from '../src/puzzle/house.js';
import {renderLayeredScene,assetPath} from '../src/house-layered-art.js';

test('repaired and unrepaired exterior wall use clipped material without duplicated asset frames',()=>{
 const fresh=newHome();
 const original=structuredClone(fresh);
 for(const style of [null,0,1,2]){
  const save=structuredClone(fresh);
  if(style!==null){
   for(const task of TASKS.slice(0,3))save.home.done[task.id]=true;
   save.home.styles['home-entry-1']=style;
  }
  const svg=renderLayeredScene(save,'exterior');
  assert.match(svg,/data-wall-texture-crop="front"/);
  assert.match(svg,/data-wall-texture-crop="east"/);
  assert.match(svg,/clip-path="url\(#front-wall\)"/);
  assert.match(svg,/clip-path="url\(#east-wall\)"/);
  const wall=assetPath(save,'home-entry-1');
  assert.equal(svg.split('href="'+wall+'"').length-1,2);
  assert.match(svg,/x="38" y="211" width="346" height="236" preserveAspectRatio="xMidYMid slice"/);
  assert.match(svg,/x="-25" y="-28" width="185" height="208" preserveAspectRatio="xMidYMid slice"/);
  assert.equal((svg.match(/data-object="home-entry-1"/g)||[]).length,1);
  assert.equal((svg.match(/data-object="home-entry-0"/g)||[]).length,1);
  assert.equal((svg.match(/data-object="home-entry-2"/g)||[]).length,1);
 }
 assert.deepEqual(fresh,original);
});
