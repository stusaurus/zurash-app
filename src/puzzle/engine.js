import { step, slide } from '../engine.js';
import { initialPuzzle } from './schema.js';

export const solved = state => state.stars.length === 0;
export const stateKey = s => JSON.stringify([s.position,[...s.walls].sort((a,b)=>a-b),s.stars,[...s.ice].sort((a,b)=>a-b),s.inventory.iceBlock,s.inventory.powerGlove,s.inventory.warpCrystal]);
function boardState(stage,s) {
  return {...stage.board,walls:[...stage.fixed,...s.walls,...s.ice],players:[s.position,-1]};
}
function preparations(stage,s) {
  const result=[{type:'none'}], b=boardState(stage,s);
  const empty=c=>c!==null&&!b.walls.includes(c)&&c!==s.position&&!s.stars.includes(c)&&!stage.portals.flat().includes(c);
  for (const from of s.walls) for(let dir=0;dir<4;dir++) {
    const to=step(from,dir,b);
    if(empty(to)) {
      result.push({type:'wall',from,to});
      const far=step(to,dir,b);
      if(s.inventory.powerGlove && empty(far)) result.push({type:'glove',from,to:far});
    }
  }
  if(s.inventory.iceBlock) for(const to of stage.iceSockets) if(empty(to)) result.push({type:'ice',to});
  if(s.inventory.warpCrystal) for(const pair of stage.portals) {
    if(pair.includes(s.position)) {
      const to=pair.find(c=>c!==s.position);
      if(!b.walls.includes(to)) result.push({type:'warp',to});
    }
  }
  return result;
}
function prepare(s,prep) {
  const n={...s,inventory:{...s.inventory}};
  if(prep.type==='wall'||prep.type==='glove') n.walls=s.walls.map(c=>c===prep.from?prep.to:c);
  if(prep.type==='glove') n.inventory.powerGlove--;
  if(prep.type==='ice') {n.ice=[...s.ice,prep.to];n.inventory.iceBlock--;}
  if(prep.type==='warp') {n.position=prep.to;n.inventory.warpCrystal--;}
  return n;
}
function finish(stage,s,dir) {
  const board=boardState(stage,s), to=slide(board,0,dir);
  if(to===s.position) return null;
  board.players[0]=to;
  // Retain the self-mobility requirement; the solo game has no opponent.
  if(![0,1,2,3].some(d=>slide(board,0,d)!==to)) return null;
  return {...s,position:to,stars:s.stars.filter(c=>c!==to),ply:s.ply+1};
}
export function successors(stage,s) {
  if(solved(s)) return [];
  const out=[];
  for(const prep of preparations(stage,s)) {
    const ready=prepare(s,prep);
    for(let dir=0;dir<4;dir++) {
      const n=finish(stage,ready,dir);
      if(n) out.push({action:{prep,dir},state:n});
    }
  }
  return out;
}
// Replay uses the checked public boundary, never a stored predicted state.
export function applyPuzzle(stage,s,action) {
  if(solved(s)) throw Error('Puzzle already cleared');
  if(!action || !Number.isInteger(action.dir)||action.dir<0||action.dir>3) throw Error('Invalid direction');
  const prep=preparations(stage,s).find(p=>action.prep&&Object.keys(p).length===Object.keys(action.prep).length&&Object.keys(p).every(k=>p[k]===action.prep[k]));
  if(!prep) throw Error('Invalid preparation');
  const n=finish(stage,prepare(s,prep),action.dir);
  if(!n) throw Error('Invalid slide');
  return structuredClone(n);
}
export function replay(stage,actions) {
  let state=initialPuzzle(stage);
  for(const action of actions) state=applyPuzzle(stage,state,action);
  return {state,cleared:solved(state)};
}
