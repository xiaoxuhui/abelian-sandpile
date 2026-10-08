import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {Controller}=require('../src/controller.js'), C=require('../src/domain/sandpile.js');
const levels=require('../src/domain/levels.js'), P=require('../src/storage/persistence.js');
function harness(){
  const tasks=[];let time=0;
  const ctrl=new Controller(levels,{schedule:fn=>{tasks.push(fn);return tasks.length;},cancel:()=>{},clock:()=>time});
  return {ctrl,tasks,frame(at=time){time=at;const fn=tasks.shift();assert.ok(fn,'scheduled frame');fn();}};
}
test('U28 repeated input uses frozen cell/amount, interval and exact physics',()=>{
  const h=harness(),c=h.ctrl;c.startPour(32,32,4,500);h.frame(0);
  assert.equal(c.state.added,4);assert.equal(c.state.topplings,1);assert.equal(c.state.stable,true);
  c.selected={x:0,y:0};c.settings.amount=10;h.frame(499);assert.equal(c.state.added,4);
  h.frame(500);assert.equal(c.state.added,8);assert.equal(c.state.cells[32*65+31],2);
  h.frame(20000);assert.equal(c.state.added,12,'no catch-up burst');
  assert.equal(c.state.total+c.state.lost,c.state.initialTotal+c.state.added);assert.ok(c.pouring);
});
test('U29 manual queue finishes first and ongoing avalanche creates no repeated queue',()=>{
  const h=harness(),c=h.ctrl;c.drop(32,32,8);c.drop(0,0,1);c.startPour(1,1,1,100);
  h.frame(0);assert.equal(c.state.added,8);assert.equal(c.queue.length,1);
  h.frame(100);assert.equal(c.state.added,10);assert.equal(c.queue.length,0);assert.equal(c.state.cells[0],1);
  const slow=harness();slow.ctrl.experiment=C.preset(129,'center');
  let tick=0;slow.ctrl.clock=()=>tick+=9;slow.ctrl.startPour(0,0,1,100);
  slow.frame();assert.equal(slow.ctrl.state.added,0);assert.equal(slow.ctrl.queue.length,0);assert.ok(slow.ctrl.pouring);
});
test('U30 every cancellation invalidates old loop frames; pause preserves the current experiment',()=>{
  for(const end of [c=>c.pause(),c=>c.step(),c=>c.resetExperiment(33,'empty'),c=>c.mode('challenge'),c=>c.run(true)]){
    const h=harness(),c=h.ctrl;c.startPour(32,32,1,100);h.frame(0);const stale=h.tasks.shift();end(c);
    const before=c.snapshot();assert.equal(c.pouring,null);stale();assert.deepEqual(c.snapshot(),before);
  }
  const h=harness();h.ctrl.startPour(32,32,1,100);h.frame();h.ctrl.pause();assert.equal(h.ctrl.state.total,1);
});
test('U30 restart has one active generation and save-v1 never resumes automatic input',()=>{
  const h=harness(),c=h.ctrl;c.startPour(32,32,1,100);const old=h.tasks.shift();c.startPour(0,0,3,100);old();
  h.frame(0);assert.equal(c.state.added,3);assert.equal(c.state.cells[0],3);
  const bundle=P.decode(P.encode(c.snapshot(),levels),levels);assert.equal('pouring' in bundle,false);
  const fresh=harness();fresh.ctrl.restore(bundle);assert.equal(fresh.ctrl.running,false);assert.equal(fresh.ctrl.pouring,null);
  const stale=h.tasks.shift();c.restore(bundle);stale();assert.equal(c.running,false);assert.equal(c.state.added,3);
});
test('U31 invalid loop settings/mode reject without cancelling an existing valid loop',()=>{
  const h=harness(),c=h.ctrl;c.startPour(32,32,1,100);const before=c.snapshot(),config=c.pouring;
  for(const args of [[0,0,1,99],[0,0,1,5001],[0,0,1,100.5],[65,0,1,100],[0,0,1.5,100],[0,0,100001,100]]){
    assert.throws(()=>c.startPour(...args));assert.deepEqual(c.snapshot(),before);assert.equal(c.pouring,config);
  }
  c.mode('challenge');assert.throws(()=>c.startPour(1,1,1,100));assert.equal(c.running,false);
});
test('U31 cumulative limit stops automatically before a partial drop or numerical overflow',()=>{
  const h=harness(),c=h.ctrl;c.experiment=C.create(1,1,[999996]);C.stabilize(c.state);c.selected={x:0,y:0};
  let error;c.onError=e=>error=e;c.startPour(0,0,3,100);h.frame(0);assert.equal(c.state.added,3);
  const before=C.clone(c.state);h.frame(100);assert.deepEqual(c.state,before);assert.equal(c.pouring,null);assert.equal(c.running,false);assert.match(error.message,/累计/);
  assert.throws(()=>c.startPour(0,0,3,100));assert.deepEqual(c.state,before);
});
