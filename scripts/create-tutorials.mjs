import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './build.mjs';
const require = createRequire(import.meta.url), C = require('../src/domain/sandpile.js');
const H = require('../src/domain/challenge.js'), reference = require('../tests/reference-engine.cjs');
const items = [
  ['intro-cross','一粒沙的十字','中心已有 3 粒。再加一粒，会发生什么？',3,[[1,1,3]],[[1,1]],[[1,1]]],
  ['chain','连锁反应','中心崩塌会让上方的 3 粒也达到阈值。',3,[[1,1,3],[1,0,3]],[[1,1]],[[1,1]]],
  ['corner','角落的沙','角格仍需 4 粒才崩塌，其中两粒会流出棋盘。',3,[[0,0,3]],[[0,0]],[[0,0]]],
  ['edge','边缘传播','在边缘触发崩塌，观察一粒流失和三个内邻格。',3,[[1,0,3]],[[1,0]],[[1,0]]],
  ['choose','选择落点','只有正确的落点组合才能得到十字；比较完整目标。',3,[[1,1,2]],[[1,1],[1,2],[2,1]],[[1,1],[1,1]]],
  ['combine','双源组合','两个沙源各有 3 粒。用两次投沙拼出对称图案。',5,[[1,2,3],[3,2,3],[2,2,1]],[[1,2],[3,2],[2,2]],[[1,2],[3,2]]],
  ['bridge','桥上的临界点','四次投入、四个候选落点。看起来最满的中心，未必需要直接投沙。',5,[[1,2,2],[2,2,3],[3,2,2],[2,1,3],[2,3,3]],[[1,2],[3,2],[2,2],[2,0]],[[1,2],[1,2],[3,2],[3,2]]],
  ['crossroad','十字路口','五次投入分配给五个位置。目标的某些粒数来自连锁，而非直接投放。',5,[[1,2,3],[3,2,3],[2,1,2],[2,3,2],[2,2,2]],[[1,2],[3,2],[2,1],[2,3],[0,0]],[[1,2],[3,2],[2,1],[2,1],[2,3]]],
  ['shore','海岸的代价','五次投入复现目标，还要留意海岸流失的一粒。别把总量当作图案。',5,[[0,2,2],[1,2,3],[2,2,3],[3,2,2],[2,1,3],[2,3,3]],[[0,2],[1,2],[3,2],[2,2]],[[0,2],[0,2],[3,2],[3,2],[2,2]]],
  ['critical-ring','临界环的回响','七乘七棋盘，六次投入、五个落点。局部一粒能走过多轮连锁。',7,[[2,2,3],[3,2,3],[4,2,3],[2,3,2],[3,3,2],[4,3,2],[2,4,3],[3,4,3],[4,4,3],[1,3,3],[5,3,3],[3,1,3],[3,5,3]],[[2,3],[4,3],[3,3],[0,0],[6,6]],[[2,3],[2,3],[2,3],[4,3],[4,3],[4,3]]],
];
const concepts=['阈值与四向分配','新触发留到下一波','角落有两个耗散方向','边缘仍用阈值四','总量不能代替逐格比较','投沙次数的分配','间接激活中心','分配与传播叠加','边界耗散的账本','多波反馈与阿贝尔性质'];
const strategies=['中心再加一粒即可达到四。','先看中心，再看中心上方原有三粒。','角落两条方向在棋盘外。','上边中格的上方是耗散汇。','不要把沙投向右侧或下侧的诱饵格。','两个左右沙源会把沙送向同一个中心。','左右原有两粒，要各补到四；中心可以被邻居激活。','比较四个方向缺口，左/右各一次；上方需要两次，下方一次。','海岸与右侧先各补两次，再利用中心的那一次。','集中在左右两个接点；角落是诱饵。同样投入的不同顺序终态相同，波次过程可以不同。'];
const levels = items.map(([id,title,description,size,points,allowed,moves]) => {
  const initial=Array(size*size).fill(0); for(const [x,y,n] of points)initial[y*size+x]=n;
  const state=C.create(size,size,initial); for(const [x,y]of moves){C.drop(state,x,y,1);const expected=reference(size,size,state.cells);C.stabilize(state);assert.deepEqual(state.cells,expected.cells);}
  const level = { id, version:1, status:'draft', rules:C.RULES, title, description,
    board:{width:size,height:size,initial,target:state.cells}, allowedDropCells:allowed.map(([x,y])=>({x,y})),
    grainPerMove:1, maxMoves:moves.length, referenceMoves:moves.map(([x,y])=>({x,y})) };
  assert.equal(H.solve(level).minimum,level.maxMoves);
  const i=items.findIndex(x=>x[0]===id),counts=new Map();for(const [x,y]of moves){const k=`(${x},${y})`;counts.set(k,(counts.get(k)||0)+1);}
  level.teaching={tier:i<6?'intro':'advanced',concept:concepts[i],hints:[`先比较初态与目标，注意“${concepts[i]}”。每步只加一粒，未稳定时不能继续。`,strategies[i],`落点分配：${[...counts].map(([p,n])=>`${p} 投 ${n} 次`).join('；')}。操作顺序不作为额外限制。`]};
  H.validateLevel(level);
  level.status='verified'; return level;
});
writeFileSync(join(root,'data/challenges/levels.json'),JSON.stringify(levels,null,2)+'\n');
console.log('Generated ten lessons after independent-engine and minimum-depth proof.');
