import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { SITE } from '../src/config.mjs';

const port = 3999, base = `http://localhost:${port}`;
let server;
before(async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ct-dev-'));
  server = spawn('node', ['scripts/dev.mjs'], { env: { ...process.env, PORT: String(port), TURSO_DATABASE_URL: 'file:' + path.join(dir, 't.db') }, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { try { await fetch(base + '/api/health'); return; } catch { await new Promise(r => setTimeout(r, 100)); } }
  throw new Error('dev server did not start');
});
after(() => server?.kill());

test('dev server serves the page, static files, the API and 404s', async () => {
  const home = await fetch(base + '/');
  assert.equal(home.status, 200); assert.ok((await home.text()).includes(SITE.name));
  const js = await fetch(base + '/app.mjs');
  assert.equal(js.status, 200); assert.match(js.headers.get('content-type'), /text\/javascript/);
  const today = await fetch(base + '/api/today');
  assert.equal(today.status, 200); assert.equal((await today.json()).prompts.length, 7);
  assert.equal((await fetch(base + '/nope')).status, 404);
});
