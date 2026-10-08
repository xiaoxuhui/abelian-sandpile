import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { root } from './build.mjs';

const required = ['README.md', 'LICENSE', 'CONTRIBUTING.md', 'SECURITY.md', 'THIRD_PARTY_NOTICES.md', 'CHANGELOG.md',
  'doc/需求与测试用例.md', 'doc/设计文档.md', 'doc/实施计划.md', 'doc/玩法调研.md', 'doc/游戏大厅接入规范.md'];
for (const file of required) assert.ok(readFileSync(join(root, file), 'utf8').trim(), `Empty required file: ${file}`);
const plan = readFileSync(join(root, 'doc/实施计划.md'), 'utf8');
assert.match(plan, /\*\*Status\*\*: (PENDING|COMPLETE|VERIFIED)/);
assert.match(plan, /\*\*Approved\*\*:/);
assert.match(plan, /\*\*Type\*\*: feature/);
assert.match(readFileSync(join(root, 'LICENSE'), 'utf8'), /^MIT License\n/);

function codeFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((item) => {
    const path = join(directory, item.name);
    if (item.isDirectory()) return codeFiles(path);
    return /\.(?:js|mjs)$/.test(item.name) ? [path] : [];
  });
}
const files = ['src', 'scripts', 'tests'].flatMap((directory) => codeFiles(join(root, directory)));
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  assert.equal(result.status, 0, `${file}: ${result.stderr}`);
}
console.log(`Checked ${files.length} JavaScript files and ${required.length} required documents; plan schema valid`);
