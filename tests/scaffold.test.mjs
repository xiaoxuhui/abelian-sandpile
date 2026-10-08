import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { build, root, runtimeFiles, sha256 } from '../scripts/build.mjs';

const read = (path) => readFileSync(join(root, path), 'utf8');
const pkg = JSON.parse(read('package.json'));
const contract = JSON.parse(read('game-hub.integration.json'));
const example = JSON.parse(read('data/challenges/example.json'));

test('S01 candidate static contract lists all shipped web resources', () => {
  assert.equal(contract.id, pkg.name);
  assert.equal(contract.version, pkg.version);
  assert.equal(read('src/project-config.js').match(/version:\s*"([^"]+)"/)[1], pkg.version);
  assert.equal(read('index.html').match(/<b data-version>([^<]+)<\/b>/)[1], pkg.version);
  assert.ok(read('CHANGELOG.md').includes(`## ${pkg.version} —`));
  assert.equal(contract.entryPage, 'index.html');
  assert.equal(contract.buildKind, 'static');
  assert.deepEqual([...contract.files, contract.licenseFile], runtimeFiles);
  assert.equal(contract.status, 'candidate-host-extension-required');
  assert.equal(contract.repository, pkg.repository.url);
  assert.match(contract.repository, /^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+\.git$/);
  assert.equal(contract.hostCompatibility, null);
});

test('S02 page resource references resolve in a nested game directory', () => {
  const references = [...read('index.html').matchAll(/\b(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1]).filter((reference) => !reference.startsWith('data:'));
  const resources = references.filter((reference) => !reference.startsWith('#'));
  assert.equal(resources.length, contract.files.length - 1);
  for (const reference of resources) {
    const url = new URL(reference, 'https://appassets.androidplatform.net/assets/games/abelian-sandpile/index.html');
    assert.equal(url.origin, 'https://appassets.androidplatform.net');
    assert.ok(url.pathname.startsWith('/assets/games/abelian-sandpile/'));
    assert.ok(contract.files.includes(reference));
    assert.ok(read(reference).length > 0);
  }
});

test('S03 runtime has no external dependencies or broad storage clear', () => {
  for (const path of contract.files) {
    const source = read(path);
    assert.doesNotMatch(source, /https?:\/\/|@import|\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b/);
    assert.doesNotMatch(source, /\b(?:localStorage|sessionStorage)\s*\.\s*clear\s*\(/);
  }
  assert.equal(Object.keys(pkg.dependencies || {}).length, 0);
  assert.equal(Object.keys(pkg.devDependencies || {}).length, 0);
});

test('S04 reserved storage keys are unique and game-scoped', () => {
  assert.equal(new Set(contract.storageKeys).size, contract.storageKeys.length);
  for (const key of contract.storageKeys) assert.ok(key.startsWith(pkg.name + '.'));
  assert.equal(contract.nativeBridge, null);
});

test('S05 challenge example is a stable format draft, not a verified level', () => {
  assert.equal(example.gameId, pkg.name);
  assert.equal(example.status, 'draft');
  assert.equal(example.proofStatus, 'unverified');
  assert.equal(example.rules, 'square4-open-v1');
  const { width, height, initial, target } = example.board;
  assert.ok(Number.isSafeInteger(width) && width > 0);
  assert.ok(Number.isSafeInteger(height) && height > 0);
  for (const cells of [initial, target]) {
    assert.equal(cells.length, width * height);
    assert.ok(cells.every((value) => Number.isSafeInteger(value) && value >= 0 && value < 4));
  }
  for (const { x, y } of example.allowedDropCells) {
    assert.ok(Number.isInteger(x) && x >= 0 && x < width);
    assert.ok(Number.isInteger(y) && y >= 0 && y < height);
  }
  assert.equal(example.grainPerMove, 1);
  assert.ok(Number.isSafeInteger(example.maxMoves) && example.maxMoves > 0);
});

test('S06 build emits exact bytes and auditable resource hashes', () => {
  withTemporaryBuild((output) => {
    const manifest = build(output);
    assert.equal(manifest.stage, 'playable');
    assert.equal(manifest.version, pkg.version);
    assert.deepEqual(manifest.files.map((file) => file.path), runtimeFiles);
    for (const file of manifest.files) {
      const source = readFileSync(join(root, file.path));
      const built = readFileSync(join(output, file.path));
      assert.deepEqual(built, source);
      assert.equal(file.bytes, built.length);
      assert.equal(file.sha256, sha256(built));
    }
    assert.deepEqual(JSON.parse(readFileSync(join(output, 'asset-manifest.json'))), manifest);
  });
});

test('S07 two builds are byte-for-byte reproducible and exclude development files', () => {
  withTemporaryBuild((directory) => {
    const first = join(directory, 'first');
    const second = join(directory, 'second');
    build(first);
    build(second);
    for (const file of [...runtimeFiles, 'asset-manifest.json']) {
      assert.deepEqual(readFileSync(join(first, file)), readFileSync(join(second, file)));
    }
    assert.deepEqual(readdirSync(first).sort(), ['LICENSE', 'asset-manifest.json', 'index.html', 'src']);
    assert.deepEqual(readdirSync(join(first, 'src')).sort(), ['app.js', 'controller.js', 'domain', 'project-config.js', 'renderer.js', 'storage', 'styles.css', 'teaching.js']);
  });
});

function withTemporaryBuild(action) {
  const base = resolve(tmpdir());
  const directory = mkdtempSync(join(base, 'abelian-scaffold-'));
  try { action(directory); }
  finally {
    const child = relative(base, resolve(directory));
    assert.ok(child && child !== '..' && !child.startsWith('..' + sep) && !isAbsolute(child));
    assert.ok(child.startsWith('abelian-scaffold-'));
    rmSync(directory, { recursive: true, force: true });
  }
}
