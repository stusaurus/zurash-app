// Objective description of a proven winning route; never infer enjoyment from move counts.
// Usage: node scripts/chapter-two-pattern-audit.js
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {initialGate,applyGate} from '../src/puzzle/gate-v2.js';
import {initialPuzzle} from '../src/puzzle/schema.js';
import {applyPuzzle,solved} from '../src/puzzle/engine.js';

export function auditChapterTwoProof(stage){
 if(!stage?.proof?.length||!Number.isInteger(stage.chapter?.number))throw Error('Uncertified stage');
 const isGate=stage.rulesVersion==='solo-v2-gate';
 let state=isGate?initialGate(stage):initialPuzzle(stage);
 const stops=[state.position],types={wall:0,glove:0,ice:0,warp:0,none:0};
 let consecutivePlain=0,longestPlain=0,scoreless=0,longestScoreless=0,toggles=0;
 const switchTurns=[],starTurns=[],warpTurns=[],gloveTurns=[],iceTurns=[];
 for(const [i,action] of stage.proof.entries()){
  const type=action.prep.type;
  if(!Object.hasOwn(types,type))throw Error('Unsupported preparation '+type);
  const old=state;
  state=isGate?applyGate(stage,state,action):applyPuzzle(stage,state,action);
  if(old.stars.length<state.stars.length)throw Error('Stars increased');
  const turn=i+1;
  const stars=old.stars.length-state.stars.length;
  if(stars)starTurns.push(turn);
  scoreless=stars?0:scoreless+1;
  longestScoreless=Math.max(longestScoreless,scoreless);
  consecutivePlain=type==='none'?consecutivePlain+1:0;
  longestPlain=Math.max(longestPlain,consecutivePlain);
  if(type==='warp')warpTurns.push(turn);
  if(type==='glove')gloveTurns.push(turn);
  if(type==='ice')iceTurns.push(turn);
  if(isGate&&old.gateOpen!==state.gateOpen){toggles++;switchTurns.push(turn);}
  types[type]++;
  stops.push(state.position);
 }
 if(!solved(state))throw Error('Proof did not clear stage '+stage.id);
 if(stage.proof.length!==stage.challenge.minimumTurns)throw Error('Proof is not minimum in '+stage.id);
 const seen=new Set(stops);
 return {
  number:stage.chapter.number,id:stage.id,title:stage.chapter.title,
  minimumTurns:stage.proof.length,stars:stage.stars.length,
  movableWallPreparations:types.wall+types.glove,
  regularWallMoves:types.wall,gloveMoves:types.glove,
  iceUses:types.ice,warpUses:types.warp,
  longestUnmodifiedSlideStreak:longestPlain,
  longestStreakWithoutStar:longestScoreless,
  uniqueStoppingCells:seen.size,
  revisitedStops:stops.length-seen.size,
  gateToggles:toggles,switchTurns,starTurns,warpTurns,gloveTurns,iceTurns
 };
}
export function auditChapterTwoCollection(stages){
 const rows=stages.map(auditChapterTwoProof);
 if(rows.length!==20||rows[0].number!==51||rows.at(-1).number!==70||
  !rows.every((row,i)=>row.number===i+51))throw Error('Chapter two must contain stages 51-70');
 return rows;
}
const scriptPath=process.argv[1];
if(scriptPath&&fileURLToPath(import.meta.url)===scriptPath){
 const src=new URL('../data/chapters/chapter-02/adventure-v1.json',import.meta.url);
 const rows=auditChapterTwoCollection(JSON.parse(fs.readFileSync(src,'utf8')).stages);
 for(const a of rows){
  console.log('STAGE '+a.number+' | '+a.minimumTurns+' turns | '+a.movableWallPreparations+
   ' wall/glove | longest plain '+a.longestUnmodifiedSlideStreak+
   ' | gate toggles '+a.gateToggles+' | warp turns '+a.warpTurns.join(','));
 }
 console.log('Human review priority: 54 (no wall movement), 57 (3 gate toggles), 59 (last-turn warp)');
}
