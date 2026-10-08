import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { root, runtimeFiles } from './build.mjs';

const allowed = new Set(runtimeFiles);
const prefix = '/assets/games/abelian-sandpile/';
const types = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8' };
const port = Number(process.env.PORT || 4178);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
const server = createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname); }
  catch { response.writeHead(400).end('Invalid URL'); return; }
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405).end('Method not allowed'); return; }
  const stripped = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname.slice(1);
  const asset = stripped || 'index.html';
  if (!allowed.has(asset)) { response.writeHead(404).end('Not found'); return; }
  try {
    const body = readFileSync(join(root, asset));
    response.writeHead(200, { 'Content-Type': types[asset.split('.').pop()] || 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch { response.writeHead(500).end('Resource unavailable'); }
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Preview http://127.0.0.1:${port}/`);
  console.log(`Hall path http://127.0.0.1:${port}${prefix}`);
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
