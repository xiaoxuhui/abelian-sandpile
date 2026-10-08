import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url), C=require('../src/domain/sandpile.js'),H=require('../src/domain/challenge.js');
const levels=require('../src/domain/levels.js');
test('U14/U15/U17 legal move, busy/invalid rejection, final move wins',()=>{
  const s=H.create(levels[0]);const before=C.clone(s);
  assert.throws(()=>H.move(s,0,0));assert.deepEqual(s,before);
  H.move(s,1,1);assert.equal(s.moves,1);assert.equal(H.status(s),'busy');
  assert.throws(()=>H.move(s,1,1));assert.equal(s.moves,1);
  C.stabilize(s.state);assert.equal(H.status(s),'won');
});
test('U16/U18 exact target and exhausted budget, not merely equal total',()=>{
  const s=H.create(levels[4]); H.move(s,1,2); C.stabilize(s.state); H.move(s,2,1);C.stabilize(s.state);
  assert.equal(H.status(s),'failed'); assert.notDeepEqual(s.state.cells,s.level.board.target);
});
test('U19 undo before/during/after avalanche restores stable counters',()=>{
  const s=H.create(levels[1]),before=C.clone(s.state);assert.equal(H.undo(s),false);
  H.move(s,1,1);C.wave(s.state);assert.equal(H.undo(s),true);assert.deepEqual(s.state,before);assert.equal(s.moves,0);
  H.move(s,1,1);C.stabilize(s.state);assert.equal(H.status(s),'won');H.undo(s);assert.deepEqual(s.state,before);
});
test('challenge checkpoint rolls back in-flight move, restore validates replay',()=>{
  const s=H.create(levels[5]);H.move(s,1,2);
  const pending=H.checkpoint(s);assert.equal(pending.moves,0);assert.deepEqual(H.restore(levels[5],pending).state,levels[5]&&H.create(levels[5]).state);
  C.stabilize(s.state);const save=H.checkpoint(s);assert.deepEqual(H.restore(levels[5],save),s);
  const bad=C.clone(save);bad.state.added++;assert.throws(()=>H.restore(levels[5],bad));
});
test('U20 six levels prove minimum by increasing depth; zero-step and budget failure handled',()=>{
  for(const level of levels){const proof=H.solve(level);assert.equal(proof.minimum,level.maxMoves);assert.equal(H.solve(level,level.maxMoves-1).minimum,null);}
  const trivial=C.clone(levels[0]);trivial.board.target=trivial.board.initial.slice();assert.equal(H.solve(trivial).minimum,0);
  assert.throws(()=>H.solve(levels[4],2,1),/未证明/);
});
