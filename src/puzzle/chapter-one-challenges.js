import {evaluateChallenge,validateChallenge} from './challenge-grade.js';

// Stage hashes are pinned by the build/test certificate, not computed in the browser.
// A bad, absent or outdated record must never invent a minimum or alter game rewards.
export function validateChapterOneChallenges(bundle) {
 if(bundle?.version!==1||bundle.chapterId!=='ice-town-01'||bundle.rulesVersion!=='solo-v1'||bundle.count!==50||!Array.isArray(bundle.stages)||bundle.stages.length!==50)
  throw Error('Invalid Chapter 1 challenge catalog');
 const ids=new Set();
 for(const [index,record] of bundle.stages.entries()) {
  if(record?.number!==index+1||!/^pz-\d{6}$/.test(record.id)||ids.has(record.id)||
     !Number.isInteger(record.revision)||record.revision<1||
     !/^[a-f0-9]{64}$/.test(record.stageHash))
   throw Error('Invalid Chapter 1 challenge record '+(index+1));
  const grade=validateChallenge({challenge:record.challenge});
  if(record.challenge.verifiedBy!=='complete-bfs-solo-v1'||!grade)
   throw Error('Uncertified Chapter 1 challenge '+(index+1));
  ids.add(record.id);
 }
 return bundle;
}

export function challengeForChapterOneStage(bundle,stage) {
 if(!bundle)return null;
 const number=stage?.chapter?.number;
 const record=bundle.stages?.[number-1];
 if(!record||record.number!==number||record.id!==stage.id||record.revision!==stage.revision)
  throw Error('Chapter 1 challenge record does not match stage');
 return record.challenge;
}

export function gradeChapterOneClear(bundle,stage,turns) {
 const challenge=challengeForChapterOneStage(bundle,stage);
 return challenge?evaluateChallenge({challenge},turns):null;
}

// Historic saves can predate certified minima. Never rewrite or reject them
// merely because their old bestTurns entry is lower than today's certificate.
export function gradeChapterOneBest(bundle,stage,completion) {
 const challenge=challengeForChapterOneStage(bundle,stage);
 if(!challenge||!completion||completion.revision!==stage.revision||
    !Number.isInteger(completion.bestTurns)||completion.bestTurns<challenge.minimumTurns)
  return null;
 return evaluateChallenge({challenge},completion.bestTurns);
}

export const chapterOneRankLabel=grade=>!grade?'':grade.rank==='unqualified'?'クリア':grade.rank;

/**
 * Aggregate only recorded clears; never change save data or award more stars.
 * Historic records with no valid grade remain replayable rather than becoming S.
 */
export function chapterOneRankSummary(bundle,completed={}) {
 if(!bundle)return null;
 let cleared=0,s=0,a=0,b=0,other=0;
 let nextChallenge=null;
 for(const record of bundle.stages){
  const completion=completed[record.id];
  if(!completion)continue;
  cleared++;
  const stage={id:record.id,revision:record.revision,chapter:{number:record.number}};
  const grade=gradeChapterOneBest(bundle,stage,completion);
  if(grade?.rank==='S'){s++;continue;}
  if(grade?.rank==='A')a++;
  else if(grade?.rank==='B')b++;
  else other++;
  if(nextChallenge===null)nextChallenge=record.number;
 }
 return {cleared,s,a,b,other,total:bundle.count,nextChallenge,allS:s===bundle.count};
}
