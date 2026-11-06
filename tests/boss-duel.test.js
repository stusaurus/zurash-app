import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initial,apply,actions,successors,slideOptions} from '../src/engine.js';
import {choose,seeded} from '../src/ai.js';

test('chapter-two boss begins as an actual legal 7x7 two-player race to three stars',()=>{
 const start=initial(0,0);
 assert.equal(start.winner,null);
 assert.equal(start.turn,0);
 assert.deepEqual(start.scores,[0,0]);
 assert.ok(start.stars.length>=3);
 assert.equal(start.players.length,2);
 assert.equal(actions(start).length>0,true);
 const rand=seeded(261101);
 const a=choose(start,{level:'greedy',rng:rand});
 assert.ok(actions(start).some(m=>JSON.stringify(m)===JSON.stringify(a)));
 const next=apply(start,a);
 assert.equal(next.ply,1);
 assert.equal(next.turn,1);
 assert.deepEqual(start.scores,[0,0],'AI actions must never mutate the input state');
 assert.equal(start.ply,0);
 const bot=choose(next,{level:'greedy',rng:rand});
 assert.ok(actions(next).some(m=>JSON.stringify(m)===JSON.stringify(bot)));
 const after=apply(next,bot);
 assert.equal(after.ply,2);
 assert.equal(after.turn,0);
 assert.equal(after.winner,null);
 assert.equal(after.stars.length,5-after.scores[0]-after.scores[1]);
});

test('CPU encounter shares the true victory boundary and forbids moves after finish',()=>{
 // A valid, directly playable final turn: from A1, wall at E1 makes D1 reachable.
 const final={...initial(0,0),players:[0,6],walls:[4],stars:[3],scores:[2,0],target:3,turn:0,ply:8,winner:null};
 const winning={wall:null,dir:1};
 assert.ok(actions(final).some(a=>JSON.stringify(a)===JSON.stringify(winning)));
 assert.ok(slideOptions(final).some(a=>a.to===3));
 const cleared=apply(final,winning);
 assert.equal(cleared.winner,0);
 assert.deepEqual(cleared.scores,[3,0]);
 assert.deepEqual(cleared.stars,[]);
 assert.equal(cleared.ply,9);
 assert.deepEqual(actions(cleared),[]);
 assert.equal(choose(cleared,{level:'greedy',rng:seeded(42)}),null);
});
