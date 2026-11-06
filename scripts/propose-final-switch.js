// Compose a switch island with an existing ice/glove proposal, then certify from scratch.
import fs from 'node:fs';import {solveGate,validateGateStage} from '../src/puzzle/gate-v2.js';import {verifyGateItemNecessity} from '../src/puzzle/gate-item-certification.js';
const proposals=JSON.parse(fs.readFileSync(process.argv[2]));const out=[];
for(const base of proposals.filter(s=>[67].includes(s.chapter.number))){
 const width=base.board.width+4,map=c=>Math.floor(c/base.board.width)*width+c%base.board.width;
 const x=base.board.width+1;const island=[x,x+1,width+x,width+x+1,width+x+2,2*width+x+1,2*width+x+2];
 for(const origin of base.board.playableCells.filter(c=>![base.start,...base.walls,...base.stars,...base.iceSockets,base.gate.tile].includes(c))){
  const s=structuredClone(base);s.id='ch02-70-v1';s.chapter.number=70;
  s.board={width,height:base.board.height,playableCells:[...base.board.playableCells.map(map),...island]};s.start=map(base.start);s.walls=base.walls.map(map);s.stars=base.stars.map(map);s.iceSockets=[island[5]];s.inventory.iceBlock=1;
  s.portals=[[map(origin),island[0]]];s.gate={tile:map(base.gate.tile),switch:island[3],initialOpen:false};s.inventory.warpCrystal=2;
  try{validateGateStage(s);}catch{continue;}
  const budget={maxNodes:120000,maxMs:8000},r=solveGate(s,budget);if(r.status!=='solved'||r.optimalTurns<14||r.optimalTurns>26)continue;
  const necessity={};for(const key of Object.keys(s.inventory).filter(k=>s.inventory[k]))necessity[key]=verifyGateItemNecessity(s,key,budget);
  if(Object.values(necessity).some(x=>x.status!=='required'))continue;
  const closed=solveGate(s,{...budget,locked:true});if(closed.status!=='unsolvable')continue;
  s.proof=r.actions;s.certification={shortest:{...r,actions:undefined},necessity,closed};out.push(s);
  console.log('ISLAND',s.chapter.number,r.optimalTurns,'origin',origin,'inventory',JSON.stringify(s.inventory));
  break;
 }
}
fs.writeFileSync(process.argv[3],JSON.stringify(out,null,2)+'\n');
