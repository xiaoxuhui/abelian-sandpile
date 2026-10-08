import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './build.mjs';
const json=JSON.parse(readFileSync(join(root,'data/challenges/levels.json'),'utf8'));
const output=`(function(root){\n  'use strict';\n  const levels = ${JSON.stringify(json,null,2)};\n  if(typeof module === 'object' && module.exports) module.exports = levels;\n  else root.SandpileLevels = levels;\n})(globalThis);\n`;
const target=join(root,'src/domain/levels.js');
if(process.argv.includes('--check')) { if(readFileSync(target,'utf8')!==output)throw new Error('关卡源与网页数据不同步'); }
else writeFileSync(target,output);
console.log('Six tutorial data records synchronized');
