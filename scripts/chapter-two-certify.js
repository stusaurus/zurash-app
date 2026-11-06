import fs from 'node:fs';import assert from 'node:assert/strict';
import {solve} from '../src/puzzle/solver.js';import {solveGate} from '../src/puzzle/gate-v2.js';
import {replayChapterTwo} from '../src/puzzle/chapter-two-progress.js';
import {verifyGateClosure} from '../src/puzzle/gate-closure-certification.js';
import {verifyItemRequirement} from '../src/puzzle/item-necessity.js';
import {verifyGateItemNecessity} from '../src/puzzle/gate-item-certification.js';
const pack=JSON.parse(fs.readFileSync('data/chapters/chapter-02/adventure-v1.json'));
const rows=[];
for(const stage of pack.stages){
 const gate=stage.rulesVersion==='solo-v2-gate',options={maxNodes:250000,maxMs:60000};
 const shortest=(gate?solveGate:solve)(stage,options);
 assert.equal(shortest.status,'solved',stage.id+' shortest unverified');assert.equal(shortest.optimalTurns,stage.challenge.minimumTurns);
 assert.equal(replayChapterTwo(stage,stage.proof).cleared,true);
 const items={};for(const item of stage.requiredItems??Object.keys(stage.inventory).filter(k=>stage.inventory[k])){
  items[item]=(gate?verifyGateItemNecessity:verifyItemRequirement)(stage,item,options);assert.equal(items[item].status,'required',stage.id+' '+item);
 }
 const closed=gate?solveGate(stage,{...options,locked:true}):null;if(gate&&stage.chapter.number!==58)assert.equal(closed.status,'unsolvable');
 const closure=stage.chapter.number===58?verifyGateClosure(stage,{mode:'forbid-reclosed-stop',...options}):null;if(closure)assert.equal(closure.status,'unsolvable');
 const opening=stage.chapter.number===60?verifyGateItemNecessity(stage,'powerGlove',{...options,goal:'open'}):null;if(opening)assert.equal(opening.status,'required');
 rows.push({number:stage.chapter.number,id:stage.id,title:stage.chapter.title,minimumTurns:shortest.optimalTurns,proof:stage.proof,board:stage.board,gate:stage.gate,items:stage.inventory,necessity:items,closed,closure,opening,expanded:shortest.expanded,adoption:stage.adoption,humanPlaytest:'pending',browserVerification:'see CI for exact commit',difficulty:shortest.optimalTurns<=8?'intro':shortest.optimalTurns<=14?'medium':'hard'});
 console.log(stage.chapter.number,shortest.optimalTurns+' turns',shortest.expanded+' states','all required checks passed');
}
fs.mkdirSync('reports/chapter-02',{recursive:true});fs.writeFileSync('reports/chapter-02/stage-register.json',JSON.stringify({version:1,release:pack.release,stages:rows},null,2)+'\n');
