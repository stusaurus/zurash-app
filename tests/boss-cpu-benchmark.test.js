import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MATCHUP_LEVELS,pairedSchedule,runBossMatch,summarizeBossMatches} from '../src/boss-cpu-benchmark.js';

test('CPU audit uses symmetric paired seats, equal seeds, same board per comparison',()=>{
 const schedule=pairedSchedule({layouts:[0,1],samples:2,seed:1200});
 assert.equal(schedule.length,24);
 assert.deepEqual(MATCHUP_LEVELS,['practice','normal','challenge']);
 for(let i=0;i<schedule.length;i+=2){
  const a=schedule[i],b=schedule[i+1];
  assert.equal(a.layout,b.layout);
  assert.equal(a.sample,b.sample);
  assert.equal(a.seed,b.seed);
  assert.deepEqual(a.players,[...b.players].reverse());
 }
 assert.deepEqual(schedule,pairedSchedule({layouts:[0,1],samples:2,seed:1200}));
 assert.throws(()=>pairedSchedule({layouts:[10]}),/layouts/);
 assert.throws(()=>pairedSchedule({samples:0}),/samples/);
});

test('running a seeded CPU encounter produces legal reproducible transitions without inventing a winner',()=>{
 const input={layout:0,players:['practice','normal'],maxPlies:8,seed:261105};
 const a=runBossMatch(input),b=runBossMatch(input);
 const clean=m=>{const {elapsedMs,...result}=m;return result;};
 assert.deepEqual(clean(a),clean(b));
 assert.ok(['finished','no-legal-move','turn-cap'].includes(a.reason));
 assert.ok(a.plies<=8);
 assert.ok(a.plies>=0);
 assert.deepEqual(a.players,['practice','normal']);
 assert.equal(a.winnerLevel,a.winnerSeat===null?null:a.players[a.winnerSeat]);
 assert.equal(a.scores[0]+a.scores[1]+a.starsRemaining,5);
 if(a.reason!=='finished')assert.equal(a.winnerSeat,null);
 assert.throws(()=>runBossMatch({...input,players:['invalid','normal']}),/profiles/);
 assert.throws(()=>runBossMatch({...input,maxPlies:0}),/maxPlies/);
});

test('CPU audit summarises resolved and unresolved games without treating a turn-cap as a draw or victory',()=>{
 const data=[
  {players:['practice','normal'],reason:'finished',winnerSeat:0,winnerLevel:'practice',plies:21,elapsedMs:110},
  {players:['normal','practice'],reason:'finished',winnerSeat:0,winnerLevel:'normal',plies:17,elapsedMs:90},
  {players:['practice','challenge'],reason:'turn-cap',winnerSeat:null,winnerLevel:null,plies:30,elapsedMs:220},
  {players:['challenge','practice'],reason:'finished',winnerSeat:1,winnerLevel:'practice',plies:27,elapsedMs:200},
  {players:['normal','challenge'],reason:'no-legal-move',winnerSeat:null,winnerLevel:null,plies:20,elapsedMs:140},
  {players:['challenge','normal'],reason:'finished',winnerSeat:0,winnerLevel:'challenge',plies:19,elapsedMs:115}
 ];
 const summary=summarizeBossMatches(data);
 assert.equal(summary.sampleSize,6);
 assert.equal(summary.finished,4);
 assert.equal(summary.unresolved,2);
 assert.deepEqual(summary.unresolvedByReason,{turnCap:1,noLegalMove:1});
 assert.deepEqual(summary.winCounts,{practice:2,normal:1,challenge:1});
 assert.equal(summary.firstSeatWins,3);
 assert.equal(summary.secondSeatWins,1);
 assert.equal(summary.meanFinishedPlies,21);
 assert.equal(summary.matchups.length,3);
 assert.equal(summary.matchups[1].unresolved,1);
 assert.deepEqual(summary.matchups[0].wins,{practice:1,normal:1});
 assert.throws(()=>summarizeBossMatches([]),/No matches/);
});
