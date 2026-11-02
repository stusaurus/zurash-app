import fs from 'node:fs';
import {solveGate,initialGate,applyGate} from '../src/puzzle/gate-v2.js';
import {verifyGateItemNecessity} from '../src/puzzle/gate-item-certification.js';
import {verifyGateClosure} from '../src/puzzle/gate-closure-certification.js';
const proposals=JSON.parse(fs.readFileSync(process.argv[2]));const out=[];
for(const stage of proposals){
 const budget={maxNodes:150000,maxMs:30000};
 const shortest=solveGate(stage,budget);if(shortest.status!=='solved')continue;
 const closed=solveGate(stage,{...budget,locked:true});
 const required={};for(const item of Object.keys(stage.inventory).filter(k=>stage.inventory[k]))required[item]=verifyGateItemNecessity(stage,item,budget);
 const twoGloves=stage.inventory.powerGlove===2?solveGate({...stage,inventory:{...stage.inventory,powerGlove:1}},budget):null;
 const opening=Object.fromEntries(Object.keys(required).map(item=>[item,verifyGateItemNecessity(stage,item,{...budget,goal:'open'})]));
 const closure=verifyGateClosure(stage,{...budget,mode:'latch-open'});
 const types=shortest.actions.map(a=>a.prep.type);let state=initialGate(stage),toggles=[],pickups=[];
 shortest.actions.forEach((a,i)=>{const old=state;state=applyGate(stage,state,a);if(old.gateOpen!==state.gateOpen)toggles.push(i+1);if(old.stars.length>state.stars.length)pickups.push(i+1);});
 const valid=closed.status==='unsolvable'&&Object.values(required).every(r=>r.status==='required');
 console.log(JSON.stringify({number:stage.chapter.number,trial:stage.proposalTrial,minimum:shortest.optimalTurns,valid,toggles,pickups,types,opening:Object.fromEntries(Object.entries(opening).map(([k,r])=>[k,r.status])),closure:closure.status}));
 if(valid){stage.proof=shortest.actions;stage.certification={shortest:{...shortest,actions:undefined},closed,required,twoGloves,opening,closure,toggles,pickups};out.push(stage);}
}
fs.writeFileSync(process.argv[3],JSON.stringify(out,null,2)+'\n');
