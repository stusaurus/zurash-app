import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {createCatalog} from '../src/puzzle/catalog.js';
import {validateCampaign,validateChapterStage,enterChapterStage,clearChapterStage,unlockedItems} from '../src/puzzle/campaign.js';
import {newProgress,balance} from '../src/puzzle/progress.js';
import {solve} from '../src/puzzle/solver.js';
import {replay} from '../src/puzzle/engine.js';
import {hash,symmetryFingerprint,solutionSignature} from './puzzle-generation.js';
export async function readChapter() {
  const root='data/chapters/chapter-01/';
  const campaign=JSON.parse(await fs.readFile('data/campaign.json','utf8')),
    chapter=JSON.parse(await fs.readFile(root+'chapter.json','utf8')),
    manifest=JSON.parse(await fs.readFile(root+'manifest.json','utf8')),
    proofs=JSON.parse(await fs.readFile('reports/chapter-01/solutions.json','utf8'));
  const catalog=createCatalog(manifest,p=>fs.readFile(root+p,'utf8'),{allowCandidates:true});
  const stages=await Promise.all(Array.from({length:chapter.count},(_,i)=>catalog.get(i+1)));
  return {campaign,chapter,manifest,proofs,stages};
}
export async function verifyChapter() {
  const {campaign,chapter,manifest,proofs,stages}=await readChapter();validateCampaign(campaign);
  assert.equal(stages.length,50);assert.equal(manifest.count,50);assert.equal(proofs.stages.length,50);
  assert.deepEqual(campaign.unlocks.map(e=>[e.stageNumber,e.item]),[[10,'iceBlock'],[20,'powerGlove'],[30,'warpCrystal']]);
  const started=performance.now(),records=[],fingerprints=new Set(),patterns=new Map();let progress=newProgress();
  for(let i=0;i<stages.length;i++) {
    const stage=validateChapterStage(campaign,chapter,stages[i]),proof=proofs.stages[i];
    assert.equal(stage.id,proof.id);assert.equal(proof.number,i+1);assert.equal(stage.chapter.number,i+1);
    assert.equal(hash(JSON.stringify(stage)),proof.stageHash);
    const fingerprint=symmetryFingerprint(stage);assert.equal(fingerprint,proof.symmetryHash);assert.ok(!fingerprints.has(fingerprint));fingerprints.add(fingerprint);
    assert.ok(replay(stage,proof.actions).cleared);
    const result=solve(stage,{maxNodes:30000,maxMs:3000});assert.equal(result.status,'solved');assert.equal(result.optimalTurns,proof.optimalTurns);
    const pattern=solutionSignature(result.actions);patterns.set(pattern,(patterns.get(pattern)??0)+1);
    const types=[...new Set(result.actions.map(a=>a.prep.type).filter(t=>['ice','glove','warp'].includes(t)))];
    const equipped=Object.values(stage.inventory).some(Boolean);
    let without=null;
    if(equipped) {
      without=solve({...stage,inventory:{iceBlock:0,powerGlove:0,warpCrystal:0}},{maxNodes:30000,maxMs:3000});
      assert.notEqual(without.status,'budget');assert.ok(without.status==='unsolvable'||without.optimalTurns>result.optimalTurns);
      assert.equal(without.status,proof.withoutItems.status);assert.equal(without.optimalTurns??null,proof.withoutItems.optimalTurns);
    }
    if(i<9){assert.deepEqual(stage.inventory,{iceBlock:0,powerGlove:0,warpCrystal:0});assert.equal(stage.iceSockets.length,0);assert.equal(stage.portals.length,0);assert.equal(stage.fixed.length,0);}
    if(i>=39)assert.ok(types.length>=2);
    if(i===49)assert.equal(types.length,3);
    const entered=enterChapterStage(campaign,chapter,stage,progress,{preview:true});
    assert.deepEqual(entered.events.map(e=>e.stageNumber),[10,20,30].includes(i+1)?[i+1]:[]);
    assert.deepEqual(enterChapterStage(campaign,chapter,stage,entered.progress,{preview:true}).events,[]);
    progress=clearChapterStage(campaign,chapter,stage,entered.progress,proof.actions,{preview:true}).progress;
    assert.equal(balance(clearChapterStage(campaign,chapter,stage,progress,proof.actions,{preview:true}).progress),balance(progress));
    records.push({number:i+1,id:stage.id,title:stage.chapter.title,shape:stage.provenance?.shape??'square',width:stage.board.width,height:stage.board.height,stars:stage.stars.length,walls:stage.walls.length,inventory:stage.inventory,optimalTurns:result.optimalTurns,itemTypes:types,withoutItems:without?{status:without.status,optimalTurns:without.optimalTurns??null}:null,solverMs:result.ms});
  }
  assert.equal(Object.keys(progress.completed).length,50);assert.equal(balance(progress),41);assert.equal(Object.keys(progress.town).length,3);assert.equal(unlockedItems(campaign,progress).length,3);
  assert.ok(Math.max(...patterns.values())<=2);
  return {version:1,chapterId:chapter.id,total:50,solved:50,replayed:50,unresolved:0,unsolvable:0,symmetryDuplicates:0,normalizedPatterns:patterns.size,maxPerPattern:Math.max(...patterns.values()),mixedItemStages40To50:11,finalStageUsesAllThree:true,earnedStars:50,townStarsSpent:9,finalStarBalance:41,unlockEvents:[10,20,30],status:'draft',humanPlaytest:false,verificationMs:performance.now()-started,records};
}
if(import.meta.url===pathToFileURL(process.argv[1]).href) {
  const report=await verifyChapter();await fs.writeFile('reports/chapter-01/verification.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({...report,records:undefined},null,2));
}
