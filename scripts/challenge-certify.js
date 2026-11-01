// Recalculate every displayed challenge minimum with the exact solo-v1 engine.
// Usage: node scripts/challenge-certify.js [JSON pack path] [--write]
// Without --write, this is a strict CI-friendly drift check; never accept guesses.
import fs from 'node:fs/promises';
import {validateStage} from '../src/puzzle/schema.js';
import {solve} from '../src/puzzle/solver.js';
import {validateChallenge} from '../src/puzzle/challenge-grade.js';

const file=process.argv.find((arg,i)=>i>1&&!arg.startsWith('--'))
  ?? 'data/chapters/chapter-01/long-candidates-v1.json';
const write=process.argv.includes('--write');
const bundle=JSON.parse(await fs.readFile(file,'utf8'));
if (!Array.isArray(bundle.stages) || !bundle.stages.length) throw Error('No challenge stages found');
const results=[];
for (const stage of bundle.stages){
 validateStage(stage);
 const result=solve(stage,{maxNodes:160000,maxMs:45000});
 if(result.status!=='solved')throw Error(stage.id+': minimum not proved ('+result.status+')');
 const minimumTurns=result.optimalTurns;
 const challenge={
  minimumTurns,
  aThrough:minimumTurns+Math.ceil(minimumTurns*.10),
  passThrough:minimumTurns+Math.ceil(minimumTurns*.25),
  verifiedBy:'complete-bfs-solo-v1'
 };
 if(write) stage.challenge=challenge;
 else {
  const actual=validateChallenge(stage);
  if(JSON.stringify(actual)!==JSON.stringify({
    minimumTurns:challenge.minimumTurns,
    aThrough:challenge.aThrough,
    passThrough:challenge.passThrough
  }))throw Error(stage.id+': published challenge thresholds differ from BFS proof');
 }
 results.push({id:stage.id,minimumTurns,passThrough:challenge.passThrough,expanded:result.expanded});
}
if(write)await fs.writeFile(file,JSON.stringify(bundle,null,2)+'\n','utf8');
for(const row of results)console.log(row.id+' | minimum '+row.minimumTurns+' | pass '+row.passThrough+' | searched '+row.expanded);
console.log('Verified '+results.length+' levels with complete BFS'+(write?' and wrote draft thresholds':' (read-only)')+'.');
