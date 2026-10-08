import{test}from'node:test';import assert from'node:assert/strict';import{createRequire}from'node:module';
const require=createRequire(import.meta.url),{Controller}=require('../src/controller.js'),levels=require('../src/domain/levels.js');
function harness(){const tasks=[];let clock=0;const ctrl=new Controller(levels,{schedule:fn=>{tasks.push(fn);return tasks.length;},cancel:()=>{},clock:()=>clock++});return{ctrl,tasks};}
test('U13 old frame cannot overwrite reset or mode after cancellation',()=>{
  const {ctrl,tasks}=harness();ctrl.drop(32,32,1000);ctrl.run(true);const stale=tasks.shift();ctrl.resetExperiment(33,'empty');stale();
  assert.equal(ctrl.state.width,33);assert.equal(ctrl.state.total,0);assert.equal(ctrl.running,false);
});
test('pause then synchronous step does one wave, resumed budget work reaches stability',()=>{
  const{ctrl,tasks}=harness();ctrl.drop(32,32,8);ctrl.step();assert.equal(ctrl.state.topplings,1);assert.equal(ctrl.state.cells[32*65+32],4);
  ctrl.run(true);for(let i=0;tasks.length&&i<1000;i++)tasks.shift()();assert.equal(ctrl.state.stable,true);assert.equal(ctrl.state.topplings,2);
});
test('queue admission reserves total budget; queued actions apply in order and restore paused',()=>{
  const{ctrl,tasks}=harness();ctrl.drop(32,32,4);ctrl.drop(0,0,4);ctrl.drop(1,1,3);assert.equal(ctrl.queue.length,2);
  ctrl.run(true);for(let i=0;tasks.length&&i<1000;i++)tasks.shift()();assert.equal(ctrl.queue.length,0);assert.equal(ctrl.state.added,11);assert.equal(ctrl.state.lost,2);
});
test('busy challenge invalid move does not cancel running work or consume budget',()=>{
  const{ctrl}=harness();ctrl.mode('challenge');ctrl.drop(1,1);assert.throws(()=>ctrl.drop(1,1));assert.equal(ctrl.session.moves,1);assert.equal(ctrl.running,true);
});
