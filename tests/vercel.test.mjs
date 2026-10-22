import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const probe = `const m = await import('./api/index.mjs'); const r = await m.GET(new Request('https://x.test/api/health')); console.log(r.status, JSON.stringify(await r.json()));`;

test('Vercel entry explains a missing database URL instead of crashing', () => {
  const env = { ...process.env }; delete env.TURSO_DATABASE_URL;
  const out = spawnSync('node', ['--input-type=module', '-e', probe], { env, encoding: 'utf8' });
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /^500 /); assert.match(out.stdout, /TURSO_DATABASE_URL/);
});

test('Vercel entry uses the HTTP-only libSQL client (no native module)', () => {
  assert.match(readFileSync('api/index.mjs', 'utf8'), /@libsql\/client\/web/);
});

test('vercel.json pins "no framework" so Vercel never runs the browser script as the server', () => {
  const cfg = JSON.parse(readFileSync('vercel.json', 'utf8'));
  assert.ok('framework' in cfg && cfg.framework === null, 'framework must be explicitly null');
  assert.equal(cfg.outputDirectory, 'public');
  assert.deepEqual(cfg.rewrites, [{ source: '/(.*)', destination: '/api/index' }]);
});
