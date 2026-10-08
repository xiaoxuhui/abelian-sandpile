import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './build.mjs';
const require=createRequire(import.meta.url), C=require('../src/domain/sandpile.js'), H=require('../src/domain/challenge.js');
const reference=require('../tests/reference-engine.cjs');
const levels=JSON.parse(readFileSync(join(root,'data/challenges/levels.json'),'utf8'));
assert.equal(levels.length,10); assert.equal(new Set(levels.map(x=>x.id)).size,10);
for(const level of levels){
  H.validateLevel(level); const s=C.create(level.board.width,level.board.height,level.board.initial);
  for(const p of level.referenceMoves){
    assert.ok(H.allowed(level,p.x,p.y)); C.drop(s,p.x,p.y,1);
    const ref=reference(s.width,s.height,s.cells); C.stabilize(s); assert.deepEqual(s.cells,ref.cells);
  }
  assert.deepEqual(s.cells,level.board.target);
  const proof=H.solve(level); assert.equal(proof.minimum,level.maxMoves);
  console.log(`${level.id}: minimum=${proof.minimum}; visited=${proof.nodes}; reference and independent engine agree`);
}
console.log('10 levels verified; 0 failures');
