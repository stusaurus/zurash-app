// Independent CPU rival: run costly search off the game-rendering thread.
// The worker has no storage, DOM, reward or chapter-progress access.
import {cpuAction,cpuRng,resolveCpuLevel} from './boss-cpu-settings.js';

let level='normal',rng=cpuRng(level);
self.addEventListener('message',event=>{
 const data=event.data??{};
 if(data.type==='init'){
  level=resolveCpuLevel(data.level);
  rng=cpuRng(level);
  return;
 }
 if(data.type!=='choose'||!Number.isSafeInteger(data.token))return;
 try{
  const action=cpuAction(data.state,level,rng,{scorelessPlies:data.scorelessPlies});
  self.postMessage({type:'result',token:data.token,action});
 }catch(error){
  self.postMessage({type:'error',token:data.token,message:'CPU calculation failed'});
 }
});
