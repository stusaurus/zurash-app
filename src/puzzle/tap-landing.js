/**
 * Destination-tap control. Duplicate directions with identical full resulting
 * states may use one cell. Different outcomes require explicit direction.
 * Does not inspect proofs, ranks or hints.
 */
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function tapLanding(options,selectedPrep,cell){
 if(!selectedPrep||!Number.isInteger(cell))return null;
 const matches=options.filter(o=>o?.action?.prep&&same(o.action.prep,selectedPrep)&&o.state.position===cell);
 if(!matches.length)return null;
 const state=JSON.stringify(matches[0].state);
 if(matches.some(o=>JSON.stringify(o.state)!==state))
  return Object.freeze({kind:'direction-required',directions:Object.freeze(matches.map(o=>o.action.dir))});
 return Object.freeze({kind:'move',action:matches[0].action});
}
export function ambiguousTapCells(options,selectedPrep){
 const ambiguous=new Set(),visited=new Set();
 if(!selectedPrep)return ambiguous;
 for(const option of options){
  if(!same(option.action.prep,selectedPrep))continue;
  const cell=option.state.position;
  if(visited.has(cell))continue;
  visited.add(cell);
  if(tapLanding(options,selectedPrep,cell)?.kind==='direction-required')ambiguous.add(cell);
 }
 return ambiguous;
}
