import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {gzipSync} from 'node:zlib';
import {generateCandidate,hash,exactFingerprint,symmetryFingerprint,solutionSignature} from './puzzle-generation.js';
import {solve} from '../src/puzzle/solver.js';
import {replay,applyPuzzle} from '../src/puzzle/engine.js';
import {initialPuzzle} from '../src/puzzle/schema.js';
import {createCatalog} from '../src/puzzle/catalog.js';
import {newProgress,recordClear,buildTown,balance,saveProgress,loadProgress} from '../src/puzzle/progress.js';
import {readEvidence,writeEvidence} from './puzzle-evidence.js';

const args=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=')));
const counts=(args.counts??'50,500,10000').split(',').map(Number);
if(counts.some((v,i)=>!Number.isInteger(v)||v<1||(i&&v<=counts[i-1])))throw Error('Increasing counts required');
const maxNodes=Number(args.nodes??1500),maxMs=Number(args.ms??1000),seed=Number(args.seed??731031);
const output=args.output??'reports/puzzle-scale';
await fs.mkdir(path.join(output,'chunks'),{recursive:true});
const writeJSON=(file,data)=>fs.writeFile(path.join(output,file),JSON.stringify(data,null,2)+'\n');
const quantile=(values,q)=>{const a=[...values].sort((a,b)=>a-b);return a.length?a[Math.floor((a.length-1)*q)]:null;};
const distribution=values=>values.reduce((a,v)=>(a[v]=(a[v]??0)+1,a),{});
const time=()=>performance.now();
function richPattern(stage,actions) {
  let s=initialPuzzle(stage);const tokens=[];
  for(const a of actions) {
    const n=applyPuzzle(stage,s,a),from=a.prep.type==='warp'?a.prep.to:s.position,w=stage.board.width;
    tokens.push({...a,distance:Math.abs(from%w-n.position%w)+Math.abs(Math.floor(from/w)-Math.floor(n.position/w)),score:s.stars.length-n.stars.length});s=n;
  }
  return solutionSignature(tokens.map(a=>({...a,prep:{...a.prep,type:`${a.prep.type}:${a.distance}:${a.score}`}})));
}
function summarize(rows,stages,generationMs) {
  const cleared=rows.filter(r=>r.status==='solved'), patterns=distribution(cleared.map(r=>r.pattern));
  const rich=distribution(cleared.map(r=>r.richPattern));
  const top=Object.entries(patterns).sort((a,b)=>b[1]-a[1]).slice(0,10);
  return {count:rows.length,validatedPlacements:stages.length,invalidPlacements:0,exactDuplicates:rows.length-new Set(rows.map(r=>r.exactHash)).size,
    symmetryDuplicates:rows.length-new Set(rows.map(r=>r.symmetryHash)).size,status:distribution(rows.map(r=>r.status)),replayedCertificates:cleared.length,
    notVerifiedAsSolvable:rows.length-cleared.length,solvedRate:cleared.length/rows.length,generationMs,
    solverTotalMs:rows.reduce((n,r)=>n+r.ms,0),solverMs:{p50:quantile(rows.map(r=>r.ms),.5),p95:quantile(rows.map(r=>r.ms),.95),max:Math.max(...rows.map(r=>r.ms))},
    nodeCounts:{p50:quantile(rows.map(r=>r.expanded),.5),p95:quantile(rows.map(r=>r.expanded),.95)},
    optimalTurns:distribution(cleared.map(r=>r.optimalTurns)),shapes:distribution(stages.map(s=>s.provenance.shape)),profiles:distribution(stages.map(s=>s.provenance.profile)),
    byShape:Object.fromEntries([...new Set(stages.map(s=>s.provenance.shape))].map(shape=>[shape,distribution(rows.filter((r,i)=>stages[i].provenance.shape===shape).map(r=>r.status))])),
    byProfile:Object.fromEntries([...new Set(stages.map(s=>s.provenance.profile))].map(profile=>[profile,distribution(rows.filter((r,i)=>stages[i].provenance.profile===profile).map(r=>r.status))])),
    patterns:{orientationNormalized:Object.keys(patterns).length,withDistanceAndScoring:Object.keys(rich).length,top10:top,top10Share:top.reduce((n,r)=>n+r[1],0)/cleared.length,
      entropyBits:Object.values(patterns).reduce((n,c)=>n-(c/cleared.length)*Math.log2(c/cleared.length),0)},
    actions:distribution(cleared.flatMap(r=>r.actions.map(a=>a.prep.type))),
    oneTurnShare:cleared.filter(r=>r.optimalTurns===1).length/cleared.length};
}
const stages=[],rows=[],milestones=[];let generationMs=0;
const runStart=time();
for(const count of counts) {
  while(stages.length<count) {
    const index=stages.length,start=time(),stage=generateCandidate(index,{seed});
    const exactHash=exactFingerprint(stage),symmetryHash=symmetryFingerprint(stage);
    generationMs+=time()-start;stages.push(stage);
    const result=solve(stage,{maxNodes,maxMs});
    const row={id:stage.id,exactHash,symmetryHash,...result};
    if(result.status==='solved') {
      if(!replay(JSON.parse(JSON.stringify(stage)),JSON.parse(JSON.stringify(result.actions))).cleared)throw Error('Serialized replay failed');
      row.pattern=solutionSignature(result.actions);row.richPattern=richPattern(stage,result.actions);
    }
    rows.push(row);
    if(stages.length%250===0)process.stdout.write(`verified ${stages.length}/${counts.at(-1)}: ${distribution(rows.map(r=>r.status)).solved??0} solved\n`);
  }
  const summary=summarize(rows,stages,generationMs);milestones.push(summary);
  await writeJSON(`milestone-${count}.json`,summary);
  await writeEvidence(output,'verification.jsonl',rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
  process.stdout.write(JSON.stringify({milestone:count,status:summary.status,ms:summary.solverTotalMs,patterns:summary.patterns.orientationNormalized})+'\n');
}
const packagingStart=time(),chunks=[];
for(let first=0;first<stages.length;first+=100) {
  const batch=stages.slice(first,first+100),text=JSON.stringify(batch)+'\n',file=`chunks/batch-${String(first/100).padStart(3,'0')}.json`;
  await fs.writeFile(path.join(output,file),text);
  chunks.push({first:first+1,last:first+batch.length,count:batch.length,path:file,sha256:hash(text),bytes:Buffer.byteLength(text),gzipBytes:gzipSync(text).length});
}
const manifest={version:1,rulesVersion:'solo-v1',count:stages.length,productionApproved:0,chunks};
await writeJSON('manifest.json',manifest);
const manifestText=await fs.readFile(path.join(output,'manifest.json'),'utf8'),whole=JSON.stringify(stages);
const packaging={ms:time()-packagingStart,allRawBytes:Buffer.byteLength(whole),allGzipBytes:gzipSync(whole).length,manifestBytes:Buffer.byteLength(manifestText),chunkBytes:{p50:quantile(chunks.map(c=>c.bytes),.5),max:Math.max(...chunks.map(c=>c.bytes))},chunkGzipBytes:{p50:quantile(chunks.map(c=>c.gzipBytes),.5),max:Math.max(...chunks.map(c=>c.gzipBytes))}};
const timing={};
let started=time();JSON.parse(whole);timing.monolithicParseMs=time()-started;
let reads=0,readBytes=0;
const catalog=createCatalog(manifest,async file=>{reads++;const text=await fs.readFile(path.join(output,file),'utf8');readBytes+=Buffer.byteLength(text);return text;},{allowCandidates:true});
started=time();await catalog.get(1);timing.firstChunkMs=time()-started;
const randomAccess=[];
for(let i=0;i<1000;i++){started=time();await catalog.get(1+(Math.imul(i+3,7919)>>>0)%stages.length);randomAccess.push(time()-started);}
timing.random1000={p50:quantile(randomAccess,.5),p95:quantile(randomAccess,.95),totalMs:randomAccess.reduce((a,b)=>a+b,0),reads,readBytes,cacheChunks:catalog.cacheSize()};
started=time();let progress=newProgress();
// Synthetic 10k-completion fixture tests capacity only. It does NOT promote candidates.
for(const s of stages)progress.completed[s.id]={reward:1,bestTurns:5,revision:s.revision};
const memoryStorage={value:null,setItem(k,v){this.value=v;},getItem(){return this.value;}};
saveProgress(memoryStorage,progress);timing.fullSaveMs=time()-started;
started=time();progress=loadProgress(memoryStorage);timing.fullRestoreMs=time()-started;
const saveBytes=Buffer.byteLength(memoryStorage.value);
started=time();progress=recordClear(progress,{...stages[0],status:'approved'},3);saveProgress(memoryStorage,progress);timing.repeatClearAndSaveMs=time()-started;
const original=balance(progress);progress=buildTown(progress,'first-house',Math.min(3,stages.length));
if(balance(progress)!==original-Math.min(3,stages.length))throw Error('Progress accounting mismatch');
if(balance(recordClear(progress,{...stages[0],status:'approved'},3))!==balance(progress))throw Error('Duplicate reward');
const loading={environment:'Node filesystem + JSON + Web Crypto; not HTTP or iPhone',...timing,saveBytes};

const ablation=[];
for(const [item,actionType]of [['iceBlock','ice'],['powerGlove','glove'],['warpCrystal','warp']]) {
  const candidates=rows.map((r,i)=>({r,s:stages[i]})).filter(({r})=>r.status==='solved'&&r.actions.some(a=>a.prep.type===actionType)).slice(0,40);
  for(const {r,s}of candidates) {
    const without=solve({...s,inventory:{...s.inventory,[item]:0}},{maxNodes,maxMs});
    ablation.push({id:s.id,item,withTurns:r.optimalTurns,withoutStatus:without.status,withoutTurns:without.optimalTurns??null,ms:without.ms});
  }
}
await writeJSON('item-ablation.json',ablation);
const stress=[];
for(let i=0;i<28;i++) {
  const s=generateCandidate(i+100000,{seed,large:true}),r=solve(s,{maxNodes:10000,maxMs:2000});
  stress.push({stage:s,result:r});
}
await writeJSON('large-board-stress.json',stress);
const ledger=await readEvidence(output,'verification.jsonl');
const summary={metadata:{baseCommit:'040bb3fbeb95684c7d7c9edba45e8b8845a85a8d',seed,generator:'random-v1',rulesVersion:'solo-v1',maxNodes,maxMs,node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0].model,cpuCount:os.cpus().length,date:new Date().toISOString(),ledgerSha256:hash(ledger)},
  milestones,packaging,loading,ablation:distribution(ablation.map(a=>`${a.item}:${a.withoutStatus==='unsolvable'?'required-proven':a.withoutStatus==='budget'?'unknown':a.withoutTurns>a.withTurns?'reduces-turns':'same-optimum'}`)),
  stress:{count:stress.length,status:distribution(stress.map(s=>s.result.status)),totalMs:stress.reduce((n,s)=>n+s.result.ms,0)},
  totalWallMs:time()-runStart,maxRssKiB:process.resourceUsage().maxRSS,productionApproved:0};
await writeJSON('summary.json',summary);
process.stdout.write(JSON.stringify(summary,null,2)+'\n');
