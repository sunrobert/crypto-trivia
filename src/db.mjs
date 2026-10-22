// Node-side database access (dev server, scripts, tests): libSQL client plus migrations.
import { createClient } from '@libsql/client';
import { wrapClient } from './db-core.mjs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const createDb = ({ url, authToken }) => wrapClient(createClient({ url, authToken }));

export async function migrate(db, dir = fileURLToPath(new URL('../migrations/', import.meta.url))) {
  await db.exec('CREATE TABLE IF NOT EXISTS _migrations(name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)');
  const done = new Set((await db.prepare('SELECT name FROM _migrations').all()).results.map(r => r.name));
  const applied = [];
  for (const name of (await readdir(dir)).filter(f => f.endsWith('.sql')).sort()) {
    if (done.has(name)) continue;
    await db.exec(await readFile(path.join(dir, name), 'utf8'));
    await db.prepare('INSERT INTO _migrations(name,applied_at) VALUES(?,?)').bind(name, Date.now()).run();
    applied.push(name);
  }
  return applied;
}
