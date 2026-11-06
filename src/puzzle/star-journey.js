/**
 * Count the stars the player has actually collected on this stage.
 * State is authoritative; neither proof hints nor the campaign save are read.
 */
export function starJourney(stage,state){
 if(!stage||!Array.isArray(stage.stars)||!state||!Array.isArray(state.stars))
  throw Error('Invalid star journey');
 const total=stage.stars.length,remaining=state.stars.length;
 if(total<1||remaining>total||!state.stars.every(c=>stage.stars.includes(c))||new Set(state.stars).size!==remaining)
  throw Error('Star journey state inconsistent with the stage');
 return {total,remaining,collected:total-remaining,complete:remaining===0};
}
