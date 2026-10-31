import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'@playwright/test');
const server=http.createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Puzzle module benchmark</title>');return;}
  const filename=path.resolve(root,'.'+pathname);
  if(!filename.startsWith(root)){res.writeHead(403);res.end();return;}
  try{
    const data=await fs.readFile(filename);
    res.setHeader('Content-Type',filename.endsWith('.js')?'text/javascript':filename.endsWith('.json')?'application/json':'text/plain');res.end(data);
  }catch{
    try{const compressed=await fs.readFile(filename+'.gz');res.setHeader('Content-Type','text/plain');res.setHeader('Content-Encoding','gzip');res.end(compressed);}
    catch{res.writeHead(404);res.end();}
  }
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const results=[];
try {
  for(const [name,type]of [['chromium',chromium],['webkit',webkit]]) {
    let browser;
    try {
      browser=await type.launch({headless:true});
      const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
      page.on('pageerror',e=>errors.push(String(e)));
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      const result=await page.evaluate(async()=>{
        const {createCatalog}=await import('/src/puzzle/catalog.js');
        const {replay}=await import('/src/puzzle/engine.js');
        const {newProgress,recordClear,buildTown,balance,saveProgress,loadProgress}=await import('/src/puzzle/progress.js');
        const now=()=>performance.now(),quantile=(a,q)=>[...a].sort((a,b)=>a-b)[Math.floor((a.length-1)*q)];
        let at=now();const manifest=await(await fetch('/reports/puzzle-scale/manifest.json')).json(),manifestMs=now()-at;
        let requests=0,bytes=0;
        const catalog=createCatalog(manifest,async file=>{requests++;const text=await(await fetch('/reports/puzzle-scale/'+file)).text();bytes+=new TextEncoder().encode(text).length;return text;},{allowCandidates:true});
        at=now();await catalog.get(1);const firstChunkMs=now()-at,access=[];
        for(let i=0;i<1000;i++){at=now();await catalog.get(1+(Math.imul(i+3,7919)>>>0)%manifest.count);access.push(now()-at);}
        const rows=(await(await fetch('/reports/puzzle-scale/verification.jsonl')).text()).trim().split('\n').map(JSON.parse);
        let replayed=0;at=now();
        for(let i=0;i<rows.length;i++)if(rows[i].status==='solved') {
          if(!replay(await catalog.get(i+1),rows[i].actions).cleared)throw Error('Browser replay failed');replayed++;
        }
        const replayMs=now()-at;
        const s=newProgress();for(let i=1;i<=10000;i++)s.completed[`pz-${String(i).padStart(6,'0')}`]={reward:1,bestTurns:5,revision:1};
        const saveTimes=[],restoreTimes=[],repeatTimes=[];let restored;
        for(let i=0;i<20;i++){
          at=now();saveProgress(localStorage,s);saveTimes.push(now()-at);
          at=now();restored=loadProgress(localStorage);restoreTimes.push(now()-at);
          at=now();restored=recordClear(restored,{id:'pz-000001',revision:2,status:'approved'},3);saveProgress(localStorage,restored);repeatTimes.push(now()-at);
        }
        if(balance(restored)!==10000||balance(buildTown(restored,'house',3))!==9997)throw Error('Browser progress accounting');
        const data=localStorage.getItem('zurash-app:puzzle-progress:v1');
        return {userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight],manifestMs,firstChunkMs,random1000:{p50:quantile(access,.5),p95:quantile(access,.95),totalMs:access.reduce((a,b)=>a+b,0)},requests,bytes,replayed,replayMs,
          syntheticCompletions:10000,saveBytes:new TextEncoder().encode(data).length,saveUtf16Bytes:data.length*2,saveMs:{p50:quantile(saveTimes,.5),p95:quantile(saveTimes,.95)},restoreMs:{p50:quantile(restoreTimes,.5),p95:quantile(restoreTimes,.95)},repeatClearAndSaveMs:{p50:quantile(repeatTimes,.5),p95:quantile(repeatTimes,.95)}};
      });
      results.push({name,status:'passed',errors,...result});
    }catch(error){results.push({name,status:'failed',error:String(error)});process.exitCode=1;}
    finally{if(browser)await browser.close();}
  }
}finally{await new Promise(resolve=>server.close(resolve));}
const output={environment:'Headless browsers on Linux; localhost HTTP; 390px viewport. Not real iPhone or mobile-network performance.',date:new Date().toISOString(),results};
await fs.writeFile(path.join(root,'reports/puzzle-scale/browser-performance.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));
