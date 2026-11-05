// CPU practice encounter has its own settings; it cannot write puzzle progress.
// Presets map only to AI policies that already exist in the main two-player engine.
import {actions} from './engine.js';
import {choose,seeded} from './ai.js';

export const CPU_PRESETS=Object.freeze({
 practice:Object.freeze({label:'れんしゅう',policy:'random',seed:261101}),
 normal:Object.freeze({label:'ふつう',policy:'greedy',seed:261102}),
 challenge:Object.freeze({label:'じっくり考える',policy:'search',seed:261103})
});
export function resolveCpuLevel(value){
 return typeof value==='string'&&Object.hasOwn(CPU_PRESETS,value)?value:'normal';
}
export function cpuRng(level){
 return seeded(CPU_PRESETS[resolveCpuLevel(level)].seed);
}
export function cpuAction(state,level,rng){
 const preset=CPU_PRESETS[resolveCpuLevel(level)];
 const available=actions(state);
 if(!available.length)return null;
 const move=choose(state,{level:preset.policy,rng});
 if(!available.some(a=>JSON.stringify(a)===JSON.stringify(move)))throw Error('CPU returned an illegal action');
 return move;
}
