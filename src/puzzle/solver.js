import {initialPuzzle} from './schema.js';
import {successors,solved,stateKey,replay} from './engine.js';

// Complete BFS within a hard resource budget. Exhaustion alone proves impossible.
// No heuristic pruning, symmetry pruning or random action shortlist.
export function solve(stage,{maxNodes=2000,maxMs=1000}={}) {
  if(!Number.isInteger(maxNodes)||maxNodes<1||!Number.isFinite(maxMs)||maxMs<=0) throw Error('Invalid solver budget');
  const started=performance.now(), root=initialPuzzle(stage);
  const nodes=[{state:root,parent:-1,action:null,depth:0}], seen=new Set([stateKey(root)]);
  let expanded=0,generated=0;
  const result=(status,extra={})=>({status,expanded,generated,discovered:nodes.length,ms:performance.now()-started,...extra});
  for(let cursor=0;cursor<nodes.length;cursor++) {
    if(performance.now()-started>=maxMs) return result('budget',{reason:'time'});
    const node=nodes[cursor]; expanded++;
    for(const next of successors(stage,node.state)) {
      generated++;
      const key=stateKey(next.state);
      if(seen.has(key)) continue;
      if(solved(next.state)) {
        const actions=[next.action];
        for(let at=cursor;nodes[at].parent!==-1;at=nodes[at].parent) actions.push(nodes[at].action);
        actions.reverse();
        if(!replay(stage,actions).cleared) throw Error('Certificate replay failed');
        return result('solved',{optimalTurns:node.depth+1,actions});
      }
      if(nodes.length>=maxNodes) return result('budget',{reason:'nodes'});
      seen.add(key);nodes.push({state:next.state,parent:cursor,action:next.action,depth:node.depth+1});
    }
  }
  return result('unsolvable');
}
