import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newHome} from '../src/puzzle/house.js';
import {ART_PLACEMENTS,assetPath,renderLayeredScene} from '../src/house-layered-art.js';

const B='./assets/house/v7/living/ice-crane-b-v2.webp';
const C='./assets/house/v7/living/ice-crane-c-v2.webp';

test('aligned floor textures apply only to their matching completed B/C decorations',()=>{
 const s=newHome(),untouched=structuredClone(s);
 assert.deepEqual(ART_PLACEMENTS.living[0],[0,324,480,216]);
 assert.equal(assetPath(s,'ice-crane'),'./assets/house/v7/living/ice-crane-before-v1.webp');
 s.home.done['ice-crane']=true;
 const options=['ice-crane-a-v1.webp','ice-crane-b-v2.webp','ice-crane-c-v2.webp'];
 options.forEach((file,i)=>{
  s.home.styles['ice-crane']=i;
  assert.ok(assetPath(s,'ice-crane').endsWith(file));
  assert.match(renderLayeredScene(s,'living'),new RegExp(file.replaceAll('.','\\.')));
 });
 assert.equal(s.version,untouched.version);
 assert.deepEqual(s.progress,untouched.progress);
});

test('B and C assets are actual RIFF WebPs, not full-room images squashed into the floor slot',()=>{
 for(const [style,uri] of [[1,B],[2,C]]){
  const bytes=readFileSync(new URL('../'+uri.slice(2),import.meta.url));
  assert.ok(bytes.length>15000);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  const s=newHome();
  s.home.done['ice-crane']=true;s.home.styles['ice-crane']=style;
  const svg=renderLayeredScene(s,'living');
  assert.ok(svg.includes(uri));
  assert.match(svg,/clip-path="url\(#living-floor\)"/);
  assert.match(svg,/x="0" y="324" width="480" height="216"/);
 }
});
