// CPU practice encounter has its own settings; it cannot write puzzle progress.
// Presets map only to AI policies that already exist in the main two-player engine.
import {actions,successors} from './engine.js';
import {choose,seeded,evaluate} from './ai.js';

export const CPU_PRESETS=Object.freeze({
 practice:Object.freeze({label:'れんしゅう',policy:'guided',seed:261101}),
 normal:Object.freeze({label:'ふつう',policy:'greedy',seed:261102}),
 challenge:Object.freeze({label:'じっくり考える',policy:'search',seed:261103})
});
export function resolveCpuLevel(value){
 return typeof value==='string'&&Object.hasOwn(CPU_PRESETS,value)?value:'normal';
}
export function cpuRng(level){
 return seeded(CPU_PRESETS[resolveCpuLevel(level)].seed);
}
/**
 * A beginner CPU should make imperfect but purposeful moves instead of
 * aimlessly looping between squares. No state edits or custom game rules:
 * rank LEGAL successors by the same evaluation used by normal CPU, then
 * pick stochastically from the top twelve; immediate wins are never missed.
 */
function guidedPracticeMove(state,rng){
 const options=successors(state);
 if(!options.length)return null;
 const wins=options.filter(o=>o.n.winner===state.turn);
 if(wins.length)return wins[Math.floor(rng()*wins.length)].a;
 const ranked=options.map(o=>({a:o.a,score:evaluate(o.n,state.turn)}));
 ranked.sort((a,b)=>b.score-a.score);
 const top=ranked.slice(0,Math.min(12,ranked.length));
 const index=Math.min(top.length-1,Math.floor(Math.pow(rng(),2.2)*top.length));
 return top[index].a;
}
export function cpuAction(state,level,rng){
 const preset=CPU_PRESETS[resolveCpuLevel(level)];
 const available=actions(state);
 if(!available.length)return null;
 const move=preset.policy==='guided'?guidedPracticeMove(state,rng):choose(state,{level:preset.policy,rng});
 if(!available.some(a=>JSON.stringify(a)===JSON.stringify(move)))throw Error('CPU returned an illegal action');
 return move;
}
