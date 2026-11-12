import {spawn,execFileSync} from 'node:child_process';import {chromium} from '@playwright/test';import fs from 'node:fs';import path from 'node:path';
const server=spawn('python3',['-m','http.server','4189','--bind','127.0.0.1'],{stdio:'ignore'});let b;
try{
 for(let i=0;i<60;i++){try{const r=await fetch('http://127.0.0.1:4189/adventure.html');if(r.ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 b=await chromium.launch();
 for(const width of [320,390]){const p=await b.newPage({viewport:{width,height:850}});
  for(const mode of ['legacy','surface']){
   if(mode==='legacy')await p.route('**/src/house-layered-art.js',r=>r.fulfill({body:execFileSync('git',['show','f0cb83a2448a10654e0cf1a30208a59872d6e0ce:src/house-layered-art.js']),contentType:'text/javascript'}));else await p.unroute('**/src/house-layered-art.js');
   await p.goto('http://127.0.0.1:4189/tests/fixtures/house-v7-review.html?scene=exterior&state=complete&style=0');await p.locator('body[data-ready=true]').waitFor();await p.locator('#art').screenshot({path:`reports/wall-surface-study/${mode}-${width}.jpg`,type:'jpeg',quality:90});
  }await p.close();
 }
}finally{await b?.close();server.kill();}
