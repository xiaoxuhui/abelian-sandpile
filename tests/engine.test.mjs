import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const C = require('../src/domain/sandpile.js');
const reference = require('./reference-engine.cjs');

test('U01 empty, U02 center three plus one, U03 bulk eight', () => {
  const s = C.create(3, 3); assert.equal(s.stable, true);
  C.drop(s, 1, 1, 3); C.drop(s, 1, 1, 1); C.stabilize(s);
  assert.deepEqual(s.cells, [0,1,0,1,0,1,0,1,0]);
  assert.equal(s.topplings, 1); assert.equal(s.lastAvalanche, 1);
  const eight = C.create(3, 3); C.drop(eight, 1, 1, 8); C.stabilize(eight);
  assert.equal(eight.topplings, 2); assert.equal(eight.cells[1], 2);
});
test('U04-U06 corner, edge and singleton use threshold four', () => {
  for (const [width,height,x,y,lost] of [[3,3,0,0,2],[3,3,1,0,1],[1,1,0,0,4]]) {
    const s=C.create(width,height); C.drop(s,x,y,4); C.stabilize(s);
    assert.equal(s.lost,lost); assert.equal(s.topplings,1); assert.ok(C.isStable(s));
    assert.equal(s.total+s.lost,s.initialTotal+s.added);
  }
});
test('U07/U10 synchronous wave leaves newly unstable neighbour until next wave', () => {
  const s=C.create(3,3,[0,3,0,0,3,0,0,0,0]); C.drop(s,1,1,1);
  C.wave(s); assert.equal(s.cells[1],4); assert.equal(s.topplings,1);
  C.wave(s); assert.equal(s.topplings,2); assert.equal(s.cells[4],1);
});
test('U08/U09/U11 seeded configurations agree with independent forward/reverse reference', () => {
  let seed=4123; const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
  for(let trial=0;trial<80;trial++) {
    const w=1+random()%5,h=1+random()%5,input=Array.from({length:w*h},()=>random()%12);
    const ref=reference(w,h,input),rev=reference(w,h,input,true);
    assert.deepEqual(ref,rev);
    const s=C.create(w,h,input); const runner=new C.Relaxer(s);
    while(!runner.done) { runner.tick(1+random()%7); assert.equal(s.total+s.lost,s.initialTotal+s.added); }
    assert.deepEqual(s.cells,ref.cells); assert.deepEqual(s.odometer,ref.odometer);
    assert.equal(s.lost,ref.lost); assert.equal(s.topplings,ref.topplings);
    const waves=C.create(w,h,input); while(!waves.stable) C.wave(waves);
    assert.deepEqual(waves.cells,ref.cells); assert.equal(waves.topplings,ref.topplings);
  }
});
test('U12 invalid inputs and cumulative budget reject atomically', () => {
  const s=C.create(3,3); const old=C.clone(s);
  for(const args of [[-1,0,1],[3,0,1],[0,0,-1],[0,0,1.5],[0,0,NaN],[0,0,100001]]) {
    assert.throws(()=>C.drop(s,...args)); assert.deepEqual(s,old);
  }
  assert.throws(()=>C.create(130,3)); assert.throws(()=>C.create(3,3,[1]));
  assert.throws(()=>C.create(1e9,1e9), /宽度/);
  const full=C.create(1,1,[1000000]); assert.throws(()=>C.drop(full,0,0,1));
});
test('validated snapshots check ledger, stability and per-cell toppling counters', () => {
  const s=C.create(3,3); C.drop(s,1,1,30); C.stabilize(s);
  assert.deepEqual(C.validateSnapshot(C.clone(s)),s);
  for(const mutate of [x=>x.lost++,x=>x.total++,x=>x.stable=false,x=>x.cells[0]=-1,x=>x.odometer[0]++]) {
    const copy=C.clone(s); mutate(copy); assert.throws(()=>C.validateSnapshot(copy));
  }
});
test('fast work respects operation budget, and deadline can stop before a mutation', () => {
  const s=C.create(3,3,Array(9).fill(4)); const r=new C.Relaxer(s);
  const before=C.clone(s); r.tick(9,()=>true); assert.deepEqual(s,before);
  const result=r.tick(1); assert.equal(result.operations,1); assert.equal(r.done,false);
  while(!r.done)r.tick(10); assert.ok(s.stable);
});
