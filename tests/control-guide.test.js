import {test} from 'node:test';
import assert from 'node:assert/strict';
import {controlGuide} from '../src/puzzle/control-guide.js';
const opt=(prep,dir)=>({action:{prep,dir}});
test('shows only legal directions without reading a shortest solution',()=>{
 const options=[opt({type:'none'},1),opt({type:'none'},3),opt({type:'wall',from:12,to:13},0)];
 const before=JSON.stringify(options);
 const guide=controlGuide({mode:'none',selectedPrep:{type:'none'},options});
 assert.equal(guide.phase,'direction');
 assert.equal(guide.directions,'→ ←');
 assert.match(guide.instruction,/光る停止マス/);
 assert.doesNotMatch(JSON.stringify(guide),/最短|正解|proof|手順/);
 assert.equal(JSON.stringify(options),before);
 assert.ok(Object.isFrozen(guide));
});
test('wall and glove step through source, destination and then legal directions',()=>{
 const options=[opt({type:'wall',from:12,to:13},0),opt({type:'wall',from:12,to:14},2)];
 assert.equal(controlGuide({mode:'wall',options}).phase,'wall');
 assert.match(controlGuide({mode:'wall',selectedWall:12,options}).instruction,/移動先/);
 const prepared=controlGuide({mode:'wall',selectedWall:12,selectedPrep:{type:'wall',from:12,to:13},options});
 assert.equal(prepared.phase,'direction');
 assert.equal(prepared.directions,'↑');
 assert.equal(controlGuide({mode:'glove',options}).phase,'wall');
});
test('item placement and clearing show no stale arrows',()=>{
 const options=[opt({type:'ice',to:26},2),opt({type:'warp',to:9},1)];
 assert.equal(controlGuide({mode:'ice',options}).phase,'target');
 assert.equal(controlGuide({mode:'ice',options}).directions,'');
 assert.equal(controlGuide({mode:'ice',selectedPrep:{type:'ice',to:26},options}).directions,'↓');
 assert.equal(controlGuide({mode:'warp',options}).phase,'target');
 const complete=controlGuide({mode:'warp',options,cleared:true});
 assert.equal(complete.phase,'clear');
 assert.equal(complete.directions,'');
 assert.throws(()=>controlGuide({mode:'unknown',options}),/Invalid/);
});
