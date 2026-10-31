import fs from 'node:fs/promises';
import {generateCandidate,symmetryFingerprint,solutionSignature,hash} from './puzzle-generation.js';
import {solve} from '../src/puzzle/solver.js';
import {replay} from '../src/puzzle/engine.js';
import {readEvidence,writeEvidence} from './puzzle-evidence.js';
const dir='reports/puzzle-scale',seed=941101,target=500,maxAttempts=5000;
const baseline=(await readEvidence(dir,'verification.jsonl')).trim().split('\n').map(JSON.parse);
const seen=new Set(baseline.map(r=>r.symmetryHash)),patternCount=new Map(),accepted=[],ledger=[];
const reject={},bump=k=>reject[k]=(reject[k]??0)+1;
const start=performance.now();
for(let attempt=0;attempt<maxAttempts&&accepted.length<target;attempt++) {
  const stage=generateCandidate(attempt+20000,{seed}),fingerprint=symmetryFingerprint(stage);
  if(seen.has(fingerprint)){bump('symmetry-duplicate');continue;}
  const result=solve(stage,{maxNodes:1500,maxMs:1000}),row={id:stage.id,symmetryHash:fingerprint,status:result.status,ms:result.ms};ledger.push(row);
  if(result.status!=='solved'){bump(result.status);continue;}
  row.turns=result.optimalTurns;
  if(result.optimalTurns<3){bump('under-three-turns');continue;}
  const pattern=solutionSignature(result.actions);row.pattern=pattern;
  if((patternCount.get(pattern)??0)>=3){bump('pattern-cap');continue;}
  const hasItem=Object.values(stage.inventory).some(Boolean);
  let ablation=null;
  if(hasItem) {
    if(!result.actions.some(a=>['ice','glove','warp'].includes(a.prep.type))){bump('unused-item');continue;}
    const without=solve({...stage,inventory:{iceBlock:0,powerGlove:0,warpCrystal:0}},{maxNodes:1500,maxMs:1000});
    ablation={status:without.status,turns:without.optimalTurns??null};
    if(without.status==='budget'){bump('item-benefit-unresolved');continue;}
    if(without.status==='solved'&&without.optimalTurns===result.optimalTurns){bump('no-proven-item-benefit');continue;}
  }
  if(!replay(stage,result.actions).cleared)throw Error('Curation replay failed');
  row.accepted=true;accepted.push({stage,verification:result,pattern,itemAblation:ablation});seen.add(fingerprint);patternCount.set(pattern,(patternCount.get(pattern)??0)+1);
}
const pool=JSON.stringify(accepted)+'\n',dist=a=>a.reduce((d,k)=>(d[k]=(d[k]??0)+1,d),{});
const summary={seed,target,maxAttempts,attempts:ledger.length,accepted:accepted.length,acceptanceRate:accepted.length/ledger.length,rejections:reject,totalMs:performance.now()-start,
  patternCount:patternCount.size,maxPerPattern:Math.max(...patternCount.values()),optimalTurns:dist(accepted.map(r=>r.verification.optimalTurns)),
  profiles:dist(accepted.map(r=>r.stage.provenance.profile)),usedMechanics:dist(accepted.flatMap(r=>[...new Set(r.verification.actions.map(a=>a.prep.type))])),
  allReplayed:true,productionApproved:0,poolSha256:hash(pool),note:'Independent seed; minimum 3 optimal turns; at most 3 certificates per orientation-normalized action signature; item stages require proved shorter optimum or exhaustive impossibility without all items. Still not human-approved or a proof of experiential diversity.'};
await writeEvidence(dir,'curated-pool.json',pool);
await writeEvidence(dir,'curation-ledger.jsonl',ledger.map(r=>JSON.stringify(r)).join('\n')+'\n');
await fs.writeFile(`${dir}/curation-summary.json`,JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
