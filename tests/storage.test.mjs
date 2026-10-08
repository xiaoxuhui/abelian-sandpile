import { test } from 'node:test';import assert from 'node:assert/strict';import {createRequire}from'node:module';
const require=createRequire(import.meta.url),P=require('../src/storage/persistence.js'),C=require('../src/domain/sandpile.js'),
  {Controller}=require('../src/controller.js'),levels=require('../src/domain/levels.js');
const storage=()=>{const data=new Map();return{data,setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)??null,removeItem:k=>data.delete(k)};};
test('U21 full save roundtrip includes unstable experiment and queued input, restore paused',()=>{
  const ctrl=new Controller(levels);ctrl.drop(32,32,100);ctrl.drop(1,1,4);
  const st=storage();P.save(st,ctrl.snapshot(),levels);const bundle=P.load(st,levels);
  const other=new Controller(levels);other.restore(bundle);assert.equal(other.running,false);
  assert.deepEqual(other.snapshot(),bundle);assert.equal(bundle.experiment.queue.length,1);
});
test('U22 corrupt/future/cross-game/oversized/invalid ledger imports reject without mutating controller',()=>{
  const ctrl=new Controller(levels),before=ctrl.snapshot();
  for(const mutate of [x=>x.schemaVersion=2,x=>x.gameId='eml',x=>x.experiment.state.lost++,x=>x.settings.amount=0,
    x=>x.experiment.queue=[{x:-1,y:0,amount:1}],x=>x.progress={'intro-cross':{version:1,best:0}}]){
    const bad=C.clone(before);mutate(bad);assert.throws(()=>P.decode(JSON.stringify(bad),levels));assert.deepEqual(ctrl.snapshot(),before);
  }
  assert.throws(()=>P.decode('{',levels));assert.throws(()=>P.decode(' '.repeat(P.MAX_BYTES+1),levels));
});
test('U23 clear only owned keys preserves other games and unrelated data',()=>{
  const st=storage();for(const key of ['eml_workbench_v2','light-game/save','conway-life-game.custom-patterns.v1','turing-machine-simulator.project.v1','other'])st.setItem(key,'sentinel');
  P.save(st,new Controller(levels).snapshot(),levels);P.clear(st);
  assert.equal(st.data.size,5);for(const value of st.data.values())assert.equal(value,'sentinel');
});
test('U24 storage exceptions propagate without modifying memory',()=>{
  const ctrl=new Controller(levels),before=ctrl.snapshot();assert.throws(()=>P.save({setItem(){throw new Error('quota');}},before,levels),/quota/);
  assert.deepEqual(ctrl.snapshot(),before);
});
test('challenge checkpoint persists success; undo does not revoke historic best',()=>{
  const ctrl=new Controller(levels,{schedule:()=>0,cancel:()=>{}});ctrl.mode('challenge');ctrl.drop(1,1);C.stabilize(ctrl.state);ctrl.changed();
  assert.equal(ctrl.progress['intro-cross'].best,1);ctrl.undo();assert.equal(ctrl.progress['intro-cross'].best,1);
  assert.deepEqual(P.validate(ctrl.snapshot(),levels).progress,ctrl.progress);
});
