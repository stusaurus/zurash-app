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
const output={
 ...summary,
 setting:full?'full':'quick',
 maxPlies:preset.maxPlies,
 layouts:preset.layouts,
 samplesPerLayoutPerMatchupSide:preset.samples,
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
 '- CPU calculation elapsed total: '+summary.elapsedSeconds+' seconds (runner dependent)',
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
