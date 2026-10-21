import test from 'node:test';
import assert from 'node:assert/strict';
import { createDb, migrate } from '../src/db.mjs';

test('migrate applies each migration once', async () => {
  const db = createDb({ url: ':memory:' });
  assert.deepEqual(await migrate(db), ['0001_initial.sql', '0002_pause.sql', '0003_rejections.sql']);
  assert.deepEqual(await migrate(db), []);
  db.close();
});

test('RETURNING upserts come back as plain objects with numbers', async () => {
  const db = createDb({ url: ':memory:' }); await migrate(db);
  const sql = 'INSERT INTO rate_limits(key,window,count) VALUES(?,?,1) ON CONFLICT(key,window) DO UPDATE SET count=count+1 RETURNING count';
  assert.deepEqual(await db.prepare(sql).bind('k', 1).first(), { count: 1 });
  assert.deepEqual(await db.prepare(sql).bind('k', 1).first(), { count: 2 });
  db.close();
});

test('batch is atomic: a failing statement rolls back the whole batch', async () => {
  const db = createDb({ url: ':memory:' }); await migrate(db);
  await db.prepare('INSERT INTO runs(id,player,date,mode,created_at) VALUES(?,?,?,?,?)').bind('r1', 'p', '2026-10-21', 'daily', 1).run();
  const insert = (round, score) => db.prepare('INSERT INTO answers(run_id,round,score,created_at) VALUES(?,?,?,?)').bind('r1', round, score, 1);
  await assert.rejects(db.batch([insert(0, 10), insert(1, 7)]));
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM answers').first()).n, 0);
  const results = await db.batch([insert(0, 10), insert(1, 30)]);
  assert.equal(results.length, 2);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM answers').first()).n, 2);
  db.close();
});

test('empty results: first() is null, all() is an empty list, run() reports changes', async () => {
  const db = createDb({ url: ':memory:' }); await migrate(db);
  assert.equal(await db.prepare('SELECT * FROM runs WHERE id=?').bind('x').first(), null);
  assert.deepEqual(await db.prepare('SELECT * FROM runs').all(), { results: [] });
  assert.equal(await db.prepare('SELECT 1 AS ok').first().then(r => r.ok), 1);
  const r = await db.prepare('DELETE FROM runs').bind().run();
  assert.equal(r.success, true); assert.equal(r.meta.changes, 0);
  db.close();
});
