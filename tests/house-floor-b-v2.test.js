import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {newHome} from '../src/puzzle/house.js';
import {ART_PLACEMENTS,assetPath,renderLayeredScene} from '../src/house-layered-art.js';

const B='./assets/house/v7/living/ice-crane-b-v2.webp';

test('aligned herringbone floor applies only to the completed B decoration',()=>{
 const s=newHome(),untouched=structuredClone(s);
 assert.deepEqual(ART_PLACEMENTS.living[0],[0,324,480,216]);
 assert.equal(assetPath(s,'ice-crane'),'./assets/house/v7/living/ice-crane-before-v1.webp');
 s.home.done['ice-crane']=true;
 const options=['ice-crane-a-v1.webp','ice-crane-b-v2.webp','ice-crane-c-v1.webp'];
 options.forEach((file,i)=>{
  s.home.styles['ice-crane']=i;
  assert.ok(assetPath(s,'ice-crane').endsWith(file));
  assert.match(renderLayeredScene(s,'living'),new RegExp(file.replaceAll('.','\\.')));
 });
 assert.equal(s.version,untouched.version);
 assert.deepEqual(s.progress,untouched.progress);
});

test('B asset is an actual RIFF WebP, not the full-room source squeezed into the floor slot',()=>{
 const b=readFileSync(new URL('../assets/house/v7/living/ice-crane-b-v2.webp',import.meta.url));
 assert.ok(b.length>15000);
 assert.equal(b.toString('ascii',0,4),'RIFF');
 assert.equal(b.toString('ascii',8,12),'WEBP');
 const s=newHome();
 s.home.done['ice-crane']=true;s.home.styles['ice-crane']=1;
 const svg=renderLayeredScene(s,'living');
 assert.ok(svg.includes(B));
 assert.match(svg,/clip-path="url\(#living-floor\)"/);
 assert.match(svg,/x="0" y="324" width="480" height="216"/);
});
