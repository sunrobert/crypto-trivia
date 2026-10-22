import test from 'node:test';
import assert from 'node:assert/strict';
import { retierPrompt, runRetier, RETIER } from '../src/retier.mjs';
import { createDb, migrate } from '../src/db.mjs';
import { seedBank } from '../src/bank.mjs';
import { handle } from '../src/server.mjs';
import { etDate } from '../public/rules.mjs';
import { makeDay, addDays } from './helpers.mjs';

const ans = (answer, tier, startTier = tier) => ({ answer, tier, startTier });

test('retierPrompt applies share cut-offs, the Midcurve rule and guards', () => {
  const answers = [ans('A', 'og'), ans('B', 'holder'), ans('C', 'normie'), ans('D', 'normie'), ans('E', 'normie'), ans('G', 'satoshi'), ans('Z', 'degen')];
  const frozen = structuredClone(answers);
  const out = retierPrompt(answers, { A: 40, B: 40, C: 10, D: 3, G: 90 }, 100);
  const tier = n => out.find(a => a.answer === n).tier;
  assert.equal(tier('A'), 'midcurve');   // started clever, turned out common
  assert.equal(tier('B'), 'normie');     // started plain, common
  assert.equal(tier('C'), 'holder');
  assert.equal(tier('D'), 'degen');
  assert.equal(tier('G'), 'satoshi');    // the gem never moves
  assert.equal(tier('Z'), 'degen');      // nobody gave it: unchanged
  assert.equal(retierPrompt([ans('E', 'normie')], { E: 1 }, 200)[0].tier, 'og');
  assert.deepEqual(retierPrompt(answers, { A: 40 }, RETIER.minPlayers - 1), answers);
  assert.deepEqual(answers, frozen);     // input not mutated
});

async function setup() {
  const db = createDb({ url: ':memory:' }); await migrate(db);
  const today = etDate(), yesterday = addDays(today, -1);
  await seedBank(db, [makeDay(1, 'r'), makeDay(2, 'r')], { launchDate: yesterday });
  const { puzzleFor } = await import('../src/puzzles.mjs');
  await puzzleFor(db, yesterday, yesterday); await puzzleFor(db, today, yesterday);
  for (let i = 0; i < 60; i++) {
    const id = `run-${i}`;
    await db.prepare("INSERT INTO runs(id,player,date,mode,next_round,completed,created_at) VALUES(?,?,?,'daily',7,1,1)").bind(id, `p${i}`, yesterday).run();
    const answer = i < 50 ? 'r1p0x5' : null;
    await db.prepare('INSERT INTO answers(run_id,round,answer,tier,score,created_at) VALUES(?,?,?,?,?,1)').bind(id, 0, answer, answer ? 'degen' : null, answer ? 60 : 0).run();
  }
  return { db, today, yesterday };
}

test('runRetier updates the bank from past daily answers, leaves served snapshots alone, is idempotent', async () => {
  const { db, today, yesterday } = await setup();
  const snapshot = (await db.prepare('SELECT content FROM puzzles WHERE date=?').bind(yesterday).first()).content;
  assert.deepEqual(await runRetier(db, today), { prompts: 14, updated: 1 });
  const bank = JSON.parse((await db.prepare('SELECT content FROM bank WHERE day=1').first()).content);
  assert.equal(bank.prompts[0].answers.find(a => a.answer === 'r1p0x5').tier, 'midcurve');
  assert.equal((await db.prepare('SELECT content FROM puzzles WHERE date=?').bind(yesterday).first()).content, snapshot);
  assert.deepEqual(await runRetier(db, today), { prompts: 14, updated: 0 });
  db.close();
});

test("today's answers are not counted until the day is over", async () => {
  const { db, today } = await setup();
  await db.prepare('DELETE FROM answers').run(); await db.prepare('DELETE FROM runs').run();
  for (let i = 0; i < 60; i++) {
    await db.prepare("INSERT INTO runs(id,player,date,mode,next_round,completed,created_at) VALUES(?,?,?,'daily',7,1,1)").bind('t' + i, 'q' + i, today).run();
    await db.prepare('INSERT INTO answers(run_id,round,answer,tier,score,created_at) VALUES(?,0,?,?,30,1)').bind('t' + i, 'r2p0x3', 'holder').run();
  }
  assert.deepEqual(await runRetier(db, today), { prompts: 14, updated: 0 });
  db.close();
});

test('cron route needs the secret', async () => {
  const { db } = await setup();
  const env = { DB: db, LOCAL_DEVELOPMENT: 'false', CRON_SECRET: 's3cret' };
  const get = (h, e = env) => handle(new Request('http://x/api/cron/retier', { headers: h }), e);
  assert.equal((await get({})).status, 404);
  assert.equal((await get({ Authorization: 'Bearer nope' })).status, 404);
  assert.equal((await get({ Authorization: 'Bearer ' }, { ...env, CRON_SECRET: '' })).status, 404);
  const ok = await get({ Authorization: 'Bearer s3cret' });
  assert.equal(ok.status, 200); assert.deepEqual(Object.keys(await ok.json()).sort(), ['prompts', 'updated']);
  db.close();
});
