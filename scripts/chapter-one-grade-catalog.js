// Build or verify the published 1–50 grade metadata from existing BFS certificates.
// This script does not change stage JSON, hashes, saved stars or progress.
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {readChapter} from './chapter-one-verify.js';
import {hash} from './puzzle-generation.js';
import {replay} from '../src/puzzle/engine.js';
import {validateChapterOneChallenges} from '../src/puzzle/chapter-one-challenges.js';

export function deriveChapterOneChallenges(stages,proofs){
 if(stages.length!==50||proofs.length!==50)throw Error('Expected 50 verified stages');
 return validateChapterOneChallenges({
  version:1,chapterId:'ice-town-01',rulesVersion:'solo-v1',count:50,
  stages:stages.map((stage,index)=>{
   const proof=proofs[index],minimumTurns=proof.optimalTurns;
   if(proof.id!==stage.id||proof.number!==index+1||stage.chapter.number!==index+1||
      proof.stageHash!==hash(JSON.stringify(stage))||
      !Number.isSafeInteger(minimumTurns)||minimumTurns<1||
      proof.actions.length!==minimumTurns||!replay(stage,proof.actions).cleared)
    throw Error('Invalid Chapter 1 shortest-turn source at '+(index+1));
   return {number:index+1,id:stage.id,revision:stage.revision,stageHash:proof.stageHash,
    challenge:{minimumTurns,aThrough:minimumTurns+Math.ceil(minimumTurns*.10),
     passThrough:minimumTurns+Math.ceil(minimumTurns*.25),
     verifiedBy:'complete-bfs-solo-v1'}};
  })
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const {stages,proofs}=await readChapter();
 const result=deriveChapterOneChallenges(stages,proofs.stages);
 const path='data/chapters/chapter-01/challenges-v1.json';
 if(process.argv.includes('--write'))await fs.writeFile(path,JSON.stringify(result,null,2)+'\n');
 else{
  const actual=validateChapterOneChallenges(JSON.parse(await fs.readFile(path,'utf8')));
  if(JSON.stringify(actual)!==JSON.stringify(result))throw Error('Chapter 1 challenge catalog differs from proof certificates; regenerate and review');
 }
 console.log('Certified Chapter 1 grading:',result.stages.length,'levels,',process.argv.includes('--write')?'catalog written':'source-aligned');
}
