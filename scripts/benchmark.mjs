import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
const require=createRequire(import.meta.url), C=require('../src/domain/sandpile.js');
for(const size of [33,65,129]) for(const name of ['center','critical']) {
  const state=C.preset(size,name),runner=new C.Relaxer(state),start=performance.now(); let batches=0,operations=0;
  while(!runner.done){operations+=runner.tick(10000).operations;batches++;}
  if(state.total+state.lost!==state.initialTotal+state.added)throw new Error('ledger mismatch');
  console.log(JSON.stringify({size,preset:name,milliseconds:Math.round(performance.now()-start),batches,operations,topplings:state.topplings,lost:state.lost,stable:state.stable}));
}
