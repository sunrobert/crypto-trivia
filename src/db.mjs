// A small D1-shaped wrapper over libSQL (Turso), so the game's query code stays unchanged.
import { createClient } from '@libsql/client';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const plain = rs => rs.rows.map(row => Object.fromEntries(rs.columns.map(c => [c, typeof row[c] === 'bigint' ? Number(row[c]) : row[c]])));

class Stmt {
  constructor(client, sql, args = []) { this.client = client; this.sql = sql; this.args = args; }
  bind(...args) { return new Stmt(this.client, this.sql, args); }
  async first() { return plain(await this.client.execute({ sql: this.sql, args: this.args }))[0] ?? null; }
  async all() { return { results: plain(await this.client.execute({ sql: this.sql, args: this.args })) }; }
  async run() { const rs = await this.client.execute({ sql: this.sql, args: this.args }); return { success: true, meta: { changes: rs.rowsAffected } }; }
}

export function createDb({ url, authToken }) {
  const client = createClient({ url, authToken });
  return {
    prepare: sql => new Stmt(client, sql),
    // Runs in order inside one write transaction; any failure rolls back all of it.
    batch: async stmts => (await client.batch(stmts.map(s => ({ sql: s.sql, args: s.args })), 'write')).map(rs => ({ success: true, meta: { changes: rs.rowsAffected }, results: plain(rs) })),
    exec: sql => client.executeMultiple(sql),
    close: () => client.close(),
  };
}

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
