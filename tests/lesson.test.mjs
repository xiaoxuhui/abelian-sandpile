import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url),C=require('../src/domain/sandpile.js'),L=require('../src/domain/lesson.js');
const reference=require('./reference-engine.cjs'),levels=require('../src/domain/levels.js'),P=require('../src/storage/persistence.js');
test('U32 wave trace shows initial input, source/recipient/frontier and does not mutate game',()=>{
 const before=C.create(3,3,[0,3,0,0,3,0,0,0,0]),old=C.clone(before),t=L.trace(before,1,1);
 assert.deepEqual(before,old);assert.equal(t.frames.length,3);assert.equal(t.frames[0].state.cells[4],4);
 assert.deepEqual(t.frames[1].sources,[4]);assert.deepEqual(t.frames[1].receivers,[1,3,5,7]);assert.deepEqual(t.frames[1].newlyUnstable,[1]);
 assert.equal(t.frames[1].topplings,1);assert.equal(t.frames[2].lost,1);assert.equal(t.topplings,2);assert.equal(t.lost,1);
});
test('U33 exact trace accounting matches independent engine on every allowed tutorial action',()=>{
 for(const level of levels)for(const p of level.allowedDropCells){const before=C.create(level.board.width,level.board.height,level.board.initial),t=L.trace(before,p.x,p.y);
   const dropped=C.clone(before);C.drop(dropped,p.x,p.y,1);const ref=reference(before.width,before.height,dropped.cells),end=t.frames.at(-1).state;
   assert.deepEqual(end.cells,ref.cells);assert.deepEqual(end.odometer,ref.odometer);assert.equal(t.topplings,ref.topplings);assert.equal(t.lost,ref.lost);
   for(const f of t.frames)assert.equal(f.state.total+f.state.lost,f.state.initialTotal+f.state.added);
 }
 for(const level of levels){let before=C.create(level.board.width,level.board.height,level.board.initial);
   for(const p of level.referenceMoves){const old=C.clone(before),t=L.trace(before,p.x,p.y),dropped=C.clone(before);C.drop(dropped,p.x,p.y,1);
     const ref=reference(before.width,before.height,dropped.cells),end=t.frames.at(-1).state;
     assert.deepEqual(before,old);assert.deepEqual(end.cells,ref.cells);assert.equal(t.topplings,ref.topplings);assert.equal(t.lost,ref.lost);
     assert.deepEqual(end.odometer.map((v,i)=>v-before.odometer[i]),ref.odometer);before=end;
   }
   assert.deepEqual(before.cells,level.board.target);
 }
 const quiet=L.trace(C.create(3,3),1,1);assert.equal(quiet.frames.length,1);assert.equal(quiet.topplings,0);
 const corner=L.trace(C.create(3,3,[3,0,0,0,0,0,0,0,0]),0,0);assert.equal(corner.lost,2);
 const before=C.create(3,3,[0,3,0,0,3,0,0,0,0]),old=C.clone(before);assert.throws(()=>L.trace(before,1,1,1,1),/波次/);assert.deepEqual(before,old);
 assert.throws(()=>L.trace(before,3,0));const busy=C.create(1,1,[4]);assert.throws(()=>L.trace(busy,0,0),/稳定/);
});
test('U34 prediction is computed from actual basic topplings, not number of animation waves',()=>{
 assert.equal(L.category(0),'quiet');assert.equal(L.category(1),'single');assert.equal(L.category(2),'cascade');assert.equal(L.category(30),'cascade');assert.throws(()=>L.category(-1));
});
test('U34 old six level identities and saved physics/history remain compatible',()=>{
 const old=JSON.parse(readFileSync(new URL('./fixtures/v0.1.1-levels.json',import.meta.url),'utf8'));
 for(let i=0;i<6;i++){const {teaching,...physics}=levels[i];assert.deepEqual(physics,old[i]);}
 const saved=JSON.parse(readFileSync(new URL('./fixtures/v0.1.1-save.json',import.meta.url),'utf8'));assert.deepEqual(P.validate(saved,levels),saved);
});
test('U35 advanced lessons have choices and proven nontrivial budgets',()=>{
 assert.equal(levels.length,10);assert.deepEqual(levels.slice(6).map(l=>l.maxMoves),[4,5,5,6]);
 for(const l of levels){assert.equal(l.teaching.hints.length,3);assert.ok(l.teaching.concept.length);}
 for(const l of levels.slice(6)){assert.equal(l.teaching.tier,'advanced');assert.ok(l.allowedDropCells.length>=4);}
});
