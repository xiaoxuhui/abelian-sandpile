import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './build.mjs';
const require = createRequire(import.meta.url), C = require('../src/domain/sandpile.js');
const items = [
  ['intro-cross','一粒沙的十字','中心已有 3 粒。再加一粒，会发生什么？',3,[[1,1,3]],[[1,1]],[[1,1]]],
  ['chain','连锁反应','中心崩塌会让上方的 3 粒也达到阈值。',3,[[1,1,3],[1,0,3]],[[1,1]],[[1,1]]],
  ['corner','角落的沙','角格仍需 4 粒才崩塌，其中两粒会流出棋盘。',3,[[0,0,3]],[[0,0]],[[0,0]]],
  ['edge','边缘传播','在边缘触发崩塌，观察一粒流失和三个内邻格。',3,[[1,0,3]],[[1,0]],[[1,0]]],
  ['choose','选择落点','只有正确的落点组合才能得到十字；比较完整目标。',3,[[1,1,2]],[[1,1],[1,2],[2,1]],[[1,1],[1,1]]],
  ['combine','双源组合','两个沙源各有 3 粒。用两次投沙拼出对称图案。',5,[[1,2,3],[3,2,3],[2,2,1]],[[1,2],[3,2],[2,2]],[[1,2],[3,2]]],
];
const levels = items.map(([id,title,description,size,points,allowed,moves]) => {
  const initial=Array(size*size).fill(0); for(const [x,y,n] of points)initial[y*size+x]=n;
  const state=C.create(size,size,initial); for(const [x,y]of moves){C.drop(state,x,y,1);C.stabilize(state);}
  return { id, version:1, status:'verified', rules:C.RULES, title, description,
    board:{width:size,height:size,initial,target:state.cells}, allowedDropCells:allowed.map(([x,y])=>({x,y})),
    grainPerMove:1, maxMoves:moves.length, referenceMoves:moves.map(([x,y])=>({x,y})) };
});
writeFileSync(join(root,'data/challenges/levels.json'),JSON.stringify(levels,null,2)+'\n');
console.log('Generated six tutorial candidates; run verify-levels before accepting proof.');
