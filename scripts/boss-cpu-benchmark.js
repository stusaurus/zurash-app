// STEP39: reproducible, side-swapped CPU encounters on symmetric boards.
// node scripts/boss-cpu-benchmark.js --quick  (small CI sample)
// node scripts/boss-cpu-benchmark.js --full   (larger opt-in study)
import fs from 'node:fs';
import {pairedSchedule,runBossMatch,summarizeBossMatches} from '../src/boss-cpu-benchmark.js';

const full=process.argv.includes('--full');
const preset=full?
 {layouts:[0,1,2],samples:2,maxPlies:80}:
 {layouts:[0],samples:1,maxPlies:32};
const schedule=pairedSchedule(preset);
const matches=schedule.map((match,i)=>{
 const row=runBossMatch({...match,maxPlies:preset.maxPlies});
 console.log((i+1)+'/'+schedule.length+' '+row.players.join(' vs ')+' | layout '+row.layout+' | '+row.reason+' | '+row.plies+' plies | win '+(row.winnerLevel??'-'));
 return row;
});
const summary=summarizeBossMatches(matches);
// An equal-strength counterfactual separates CPU stall prevention from
// pairwise difficulty. Both sides use the same profile and fixed seeds.
const sameProfileSeeds=(full?[0,1,2]:[0]).flatMap(layout=>
 Array.from({length:full?4:1},(_,sample)=>({layout,seed:261105+layout*101+sample*7919}))
);
const selfPlayStudy=['practice','normal','challenge'].map(level=>{
 const guarded=sameProfileSeeds.map(row=>runBossMatch({...row,players:[level,level],maxPlies:80}));
 const legacy=level==='challenge'?sameProfileSeeds.map(row=>runBossMatch({...row,players:[level,level],maxPlies:80,antiStall:false})):null;
 const summarise=games=>({
  games:games.length,finished:games.filter(g=>g.reason==='finished').length,
  unresolved:games.filter(g=>g.reason!=='finished').length,
  firstSeatWins:games.filter(g=>g.winnerSeat===0).length,
  secondSeatWins:games.filter(g=>g.winnerSeat===1).length,
  meanPlies:Math.round(games.reduce((s,g)=>s+g.plies,0)/games.length*100)/100,
  totalGuardedTurns:games.reduce((s,g)=>s+g.guardedTurns,0),
  exactRepeatedStates:games.reduce((s,g)=>s+g.repeatedStates,0)
 });
 return {level,guarded:summarise(guarded),legacy:legacy?summarise(legacy):null};
});
const output={
 ...summary,
 setting:full?'full':'quick',
 maxPlies:preset.maxPlies,
 layouts:preset.layouts,
 samplesPerLayoutPerMatchupSide:preset.samples,
 selfPlayStudy,
 caution:'Unresolved matches are not wins, draws or decisive evidence of equal skill. Small samples must not justify a difficulty claim.',
 matches
};
const rows=summary.matchups.map(m=>[
 m.profiles.join(' vs '),String(m.total),String(m.finished),String(m.unresolved),
 String(m.wins[m.profiles[0]]),String(m.wins[m.profiles[1]]),
 m.meanFinishedPlies??'—'
].join(' | '));
const markdown=[
 '# Zurash! CPU level audit / '+(full?'full':'quick')+' sample',
 '',
 'Samples use identical symmetric layouts, fixed seeds, and both seat orders. This does not validate human difficulty.',
 '',
 '| Matchup | Games | Finished | Unresolved | Left wins | Right wins | Mean finished plies |',
 '| :-- | --: | --: | --: | --: | --: | --: |',
 ...rows.map(row=>'| '+row+' |'),
 '',
 '- Games: '+summary.sampleSize+', finished: '+summary.finished+', unresolved: '+summary.unresolved,
 '- Unresolved reason: turn-cap '+summary.unresolvedByReason.turnCap+', no legal move '+summary.unresolvedByReason.noLegalMove,
 '- First seat wins: '+summary.firstSeatWins+', second seat wins: '+summary.secondSeatWins,
 '- Mean finished plies: '+(summary.meanFinishedPlies??'N/A'),
 '- Guarded CPU turns: '+summary.guardedTurns+', exact repeated states: '+summary.repeatedStates,
 '- Mean longest score drought: '+summary.meanLongestScoreless+' plies',
 '',
 '### Equal-strength self-play (80-ply audit cap; not a game rule)',
 '',
 '| CPU | Games | Finished after guard | Unresolved after guard | Legacy unresolved | Avg plies after guard |',
 '| :-- | --: | --: | --: | --: | --: |',
 ...selfPlayStudy.map(row=>'| '+row.level+' | '+row.guarded.games+' | '+row.guarded.finished+' | '+row.guarded.unresolved+' | '+(row.legacy?.unresolved??'not compared')+' | '+row.guarded.meanPlies+' |'),
 '',
 '- CPU calculation elapsed total: '+summary.elapsedSeconds+' seconds for mixed matchups (runner dependent)',
 '',
 '**Interpretation guard:** No winner is assigned to a cap or stalemate. Full multi-seed runs and real human play are needed before claiming three verified skill tiers.',
 ''
].join('\n');
fs.mkdirSync('reports',{recursive:true});
const file='reports/boss-cpu-step39-'+(full?'full':'quick');
fs.writeFileSync(file+'.json',JSON.stringify(output,null,2)+'\n');
fs.writeFileSync(file+'.md',markdown);
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,markdown+'\n');
console.log(markdown);
