import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const runtimeFiles = Object.freeze([
  'index.html', 'src/styles.css', 'src/project-config.js', 'src/domain/sandpile.js', 'src/domain/challenge.js',
  'src/domain/levels.js', 'src/storage/persistence.js', 'src/controller.js', 'src/renderer.js', 'src/app.js', 'LICENSE',
]);
export const sha256 = (value) => createHash('sha256').update(value).digest('hex');

export function build(output = join(root, 'dist')) {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const files = runtimeFiles.map((path) => {
    const content = readFileSync(join(root, path));
    const target = join(output, path);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(join(root, path), target);
    return { path, bytes: content.length, sha256: sha256(content) };
  });
  const manifest = { schemaVersion: 1, gameId: pkg.name, version: pkg.version, stage: 'playable', entryPage: 'index.html', files };
  writeFileSync(join(output, 'asset-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = build();
  console.log(`Built ${result.files.length} files in dist; ${result.gameId} ${result.version} (playable)`);
}
