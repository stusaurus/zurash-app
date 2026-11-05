// Reproducible, paired CPU-vs-CPU audit for the independent Chapter Two rival.
// No DOM, localStorage, stage proofs, game-rule edits, or progress writes.
import {performance} from 'node:perf_hooks';
import {initial,apply,key} from './engine.js';
import {seeded} from './ai.js';
import {CPU_PRESETS,cpuAction,CHALLENGE_SCORELESS_THRESHOLD} from './boss-cpu-settings.js';

export const MATCHUP_LEVELS=Object.freeze(['practice','normal','challenge']);
function assertPositiveInteger(value,label,allowZero=false){
 if(!Number.isSafeInteger(value)||value<(allowZero?0:1))throw Error('Invalid '+label);
}
export function pairedSchedule({layouts=[0,1],samples=1,seed=261105}={}){
 assertPositiveInteger(samples,'samples');
 assertPositiveInteger(seed,'seed',true);
 if(!Array.isArray(layouts)||!layouts.length||layouts.some(x=>!Number.isInteger(x)||x<0||x>2))
  throw Error('layouts must be a nonempty subset of symmetric built-in maps 0-2');
 const matches=[];
 for(const layout of layouts)for(let sample=0;sample<samples;sample++)
  for(let i=0;i<MATCHUP_LEVELS.length;i++)for(let j=i+1;j<MATCHUP_LEVELS.length;j++){
   const levels=[MATCHUP_LEVELS[i],MATCHUP_LEVELS[j]];
   const matchSeed=seed+layout*101+sample*7919+i*257+j*17;
   matches.push({layout,sample,seed:matchSeed,players:levels});
   matches.push({layout,sample,seed:matchSeed,players:[levels[1],levels[0]]});
  }
 return matches;
}
export function runBossMatch({layout=0,players,maxPlies=48,seed=261105,antiStall=true}){
 if(!Array.isArray(players)||players.length!==2||players.some(x=>!Object.hasOwn(CPU_PRESETS,x)))
  throw Error('Exactly two known CPU profiles are required');
 assertPositiveInteger(maxPlies,'maxPlies');
 assertPositiveInteger(seed,'seed',true);
 if(typeof antiStall!=='boolean')throw Error('Invalid antiStall');
 let state=initial(layout,0);
 const rng=players.map((level)=>seeded(CPU_PRESETS[level].seed+seed));
 const visited=new Map([[key(state),1]]);
 const start=performance.now();
 let reason=null,lastScorePly=0,longestScoreless=0,guardedTurns=0,repeatedStates=0;
 while(state.winner===null&&state.ply<maxPlies){
  const noScore=state.ply-lastScorePly;
  if(antiStall&&players[state.turn]==='challenge'&&noScore>=CHALLENGE_SCORELESS_THRESHOLD)guardedTurns++;
  const move=cpuAction(state,players[state.turn],rng[state.turn],{scorelessPlies:antiStall?noScore:0});
  if(move===null){reason='no-legal-move';break;}
  const next=apply(state,move);
  if(next.ply!==state.ply+1)throw Error('CPU game did not advance exactly one turn');
  const scored=next.scores[0]+next.scores[1]>state.scores[0]+state.scores[1];
  if(scored)lastScorePly=next.ply;
  longestScoreless=Math.max(longestScoreless,next.ply-lastScorePly);
  const nextKey=key(next);
  if(visited.has(nextKey))repeatedStates++;
  visited.set(nextKey,(visited.get(nextKey)??0)+1);
  state=next;
 }
 if(state.winner!==null)reason='finished';
 else if(reason===null)reason='turn-cap';
 const elapsedMs=Math.round(performance.now()-start);
 return {
  layout,players:[...players],seed,maxPlies,antiStall,reason,
  guardedTurns,repeatedStates,longestScoreless,
  winnerSeat:state.winner,
  winnerLevel:state.winner===null?null:players[state.winner],
  plies:state.ply,scores:[...state.scores],starsRemaining:state.stars.length,
  elapsedMs
 };
}
function round(x){return Math.round(x*100)/100;}
export function summarizeBossMatches(matches){
 if(!Array.isArray(matches)||!matches.length)throw Error('No matches to summarize');
 const resolved=matches.filter(m=>m.reason==='finished');
 const nonresolved=matches.filter(m=>m.reason!=='finished');
 const winCounts=Object.fromEntries(MATCHUP_LEVELS.map(l=>[l,0]));
 for(const m of resolved)winCounts[m.winnerLevel]++;
 const keys=[['practice','normal'],['practice','challenge'],['normal','challenge']];
 const matchups=keys.map(([a,b])=>{
  const subset=matches.filter(m=>m.players.includes(a)&&m.players.includes(b));
  const games=subset.filter(m=>m.reason==='finished');
  return {
   profiles:[a,b],total:subset.length,finished:games.length,
   unresolved:subset.length-games.length,
   wins:{[a]:games.filter(m=>m.winnerLevel===a).length,[b]:games.filter(m=>m.winnerLevel===b).length},
   firstSeatWins:games.filter(m=>m.winnerSeat===0).length,
   secondSeatWins:games.filter(m=>m.winnerSeat===1).length,
   meanFinishedPlies:games.length?round(games.reduce((s,m)=>s+m.plies,0)/games.length):null
  };
 });
 return {
  format:'zurash-boss-cpu-benchmark-v1',
  sampleSize:matches.length,
  finished:resolved.length,
  unresolved:nonresolved.length,
  unresolvedByReason:{
   turnCap:nonresolved.filter(m=>m.reason==='turn-cap').length,
   noLegalMove:nonresolved.filter(m=>m.reason==='no-legal-move').length
  },
  winCounts,
  firstSeatWins:resolved.filter(m=>m.winnerSeat===0).length,
  secondSeatWins:resolved.filter(m=>m.winnerSeat===1).length,
  meanFinishedPlies:resolved.length?round(resolved.reduce((s,m)=>s+m.plies,0)/resolved.length):null,
  elapsedSeconds:round(matches.reduce((s,m)=>s+m.elapsedMs,0)/1000),
  guardedTurns:matches.reduce((s,m)=>s+(m.guardedTurns??0),0),
  repeatedStates:matches.reduce((s,m)=>s+(m.repeatedStates??0),0),
  meanLongestScoreless:round(matches.reduce((s,m)=>s+(m.longestScoreless??0),0)/matches.length),
  matchups
 };
}
