import fs from 'node:fs/promises';
import path from 'node:path';
import {createCatalog} from '../src/puzzle/catalog.js';
import {replay} from '../src/puzzle/engine.js';
import {solve} from '../src/puzzle/solver.js';
import {hash,exactFingerprint,symmetryFingerprint} from './puzzle-generation.js';
import {readEvidence} from './puzzle-evidence.js';
const dir=process.argv[2]??'reports/puzzle-scale';
const manifest=JSON.parse(await fs.readFile(path.join(dir,'manifest.json'),'utf8'));
const catalog=createCatalog(manifest,file=>fs.readFile(path.join(dir,file),'utf8'),{allowCandidates:true});
const ledger=await readEvidence(dir,'verification.jsonl');
const rows=ledger.trim().split('\n').map(JSON.parse);
const summary=JSON.parse(await fs.readFile(path.join(dir,'summary.json'),'utf8'));
if(hash(ledger)!==summary.metadata.ledgerSha256)throw Error('Verification ledger integrity failure');
if(rows.length!==manifest.count)throw Error('Incomplete verification ledger');
let replayed=0,impossible=0,unresolved=0;
for(let i=0;i<rows.length;i++) {
  const stage=await catalog.get(i+1),r=rows[i];
  if(stage.id!==r.id)throw Error('Mismatched certificate');
  if(exactFingerprint(stage)!==r.exactHash||symmetryFingerprint(stage)!==r.symmetryHash)throw Error('Stage fingerprint mismatch');
  if(r.status==='solved') {
    if(!replay(stage,r.actions).cleared||r.actions.length!==r.optimalTurns)throw Error(`Replay failed ${r.id}`);
    replayed++;
  }else if(r.status==='unsolvable') {
    if(solve(stage,{maxNodes:summary.metadata.maxNodes,maxMs:10000}).status!=='unsolvable')throw Error('Impossible result not reproducible');
    impossible++;
  }
  else if(r.status==='budget')unresolved++;
  else throw Error('Unknown verification status');
}
console.log(JSON.stringify({candidates:manifest.count,replayed,impossible,unresolved,productionApproved:0}));
try {
  const text=await readEvidence(dir,'curated-pool.json'),curation=JSON.parse(await fs.readFile(path.join(dir,'curation-summary.json'),'utf8'));
  if(hash(text)!==curation.poolSha256)throw Error('Curated pool integrity failure');
  const pool=JSON.parse(text);
  if(pool.length!==curation.accepted)throw Error('Curated pool count mismatch');
  for(const {stage,verification}of pool)if(!replay(stage,verification.actions).cleared)throw Error('Curated replay failure');
  console.log(JSON.stringify({independentCuratedReplays:pool.length,productionApproved:0}));
}catch(error){if(error.code!=='ENOENT')throw error;}
