import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateDay, validateBank, seedBank, daysBetween } from '../src/bank.mjs';
import { SAMPLE } from '../src/sample-bank.mjs';
import { matchAnswer, etDate } from '../public/rules.mjs';
import { createDb, migrate } from '../src/db.mjs';
import { makeDay, addDays } from './helpers.mjs';

const mutate = fn => { const d = structuredClone(makeDay(1, 'v')); fn(d); return d; };

test('validateDay accepts the sample and good days', () => {
  assert.doesNotThrow(() => validateDay({ day: 1, prompts: SAMPLE.prompts }));
  assert.doesNotThrow(() => validateDay(makeDay(1, 'a')));
});

test('validateDay names the prompt for each kind of mistake', () => {
  assert.throws(() => validateDay(mutate(d => d.prompts.pop())), /7 prompts/);
  assert.throws(() => validateDay(mutate(d => { d.prompts[2].answers[0].tier = 'og'; })), /v1p2.*satoshi/);
  assert.throws(() => validateDay(mutate(d => { d.prompts[3].answers[1].tier = 'satoshi'; })), /v1p3.*satoshi/);
  assert.throws(() => validateDay(mutate(d => { d.prompts[4].answers[2].tier = 'plankton'; })), /v1p4.*tier/);
  assert.throws(() => validateDay(mutate(d => { d.prompts[5].answers.pop(); })), /v1p5.*8 answers/);
  assert.throws(() => validateDay(mutate(d => { d.prompts[6].category = 'weather'; })), /v1p6.*category/);
  assert.throws(() => validateDay(mutate(d => { d.prompts[1].id = d.prompts[0].id; })), /duplicate id/);
  assert.throws(() => validateDay(mutate(d => {
    d.prompts[0].answers[1] = { answer: 'Terra', tier: 'normie', aliases: ['LUNA'] };
    d.prompts[0].answers[2] = { answer: 'Terra Classic', tier: 'midcurve', aliases: ['luna'] };
  })), /v1p0.*luna/i);
});

test('$ and case in tickers match exactly', () => {
  const answers = [{ answer: 'Dogecoin', tier: 'normie', aliases: ['DOGE'] }, { answer: 'Shiba Inu', tier: 'normie', aliases: ['SHIB'] }];
  for (const input of ['$doge', 'DOGE', 'dogecoin', '$DOGE']) {
    const m = matchAnswer(input, answers); assert.equal(m.answer, 'Dogecoin', input); assert.equal(m.correction, false, input);
  }
  const typo = matchAnswer('Dogecoim', answers); assert.equal(typo.answer, 'Dogecoin'); assert.equal(typo.correction, true);
});

test('daysBetween counts calendar days', () => {
  assert.equal(daysBetween('2026-12-01', '2026-12-01'), 0);
  assert.equal(daysBetween('2026-12-01', '2027-03-01'), 90);
  assert.equal(daysBetween('2026-12-05', '2026-12-01'), -4);
});

test('seedBank stores bank days by number, records the launch date, sets startTier', async () => {
  const db = createDb({ url: ':memory:' }); await migrate(db);
  assert.deepEqual(await seedBank(db, [makeDay(1, 's'), makeDay(2, 's')], { launchDate: '2026-12-01' }), { written: 2 });
  const row = await db.prepare('SELECT * FROM bank WHERE day=2').first();
  const content = JSON.parse(row.content);
  assert.equal(content.prompts[0].id, 's2p0');
  assert.ok(content.prompts[0].answers.every(a => a.startTier === a.tier));
  assert.equal((await db.prepare("SELECT value FROM meta WHERE key='launch_date'").first()).value, '2026-12-01');
  db.close();
});

test('seeding after launch keeps every bank day and maps dates by day number', async () => {
  const { puzzleFor } = await import('../src/puzzles.mjs');
  const db = createDb({ url: ':memory:' }); await migrate(db);
  const today = etDate(), launch = addDays(today, -3);
  for (let i = 0; i < 3; i++) assert.equal((await puzzleFor(db, addDays(launch, i), launch)).sample, true);
  assert.deepEqual(await seedBank(db, [1, 2, 3, 4, 5].map(n => makeDay(n, 'late')), { launchDate: launch }), { written: 5 });
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM bank').first()).n, 5);
  assert.equal((await puzzleFor(db, today, launch)).prompts[0].id, 'late4p0');
  assert.equal((await puzzleFor(db, addDays(today, 1), launch)).prompts[0].id, 'late5p0');
  const rerun = await puzzleFor(db, addDays(today, 2), launch);
  assert.equal(rerun.prompts[0].id, 'late1p0'); assert.equal(rerun.dayNumber, 6);
  db.close();
});

test('a reseed never changes a date that was already served', async () => {
  const { puzzleFor } = await import('../src/puzzles.mjs');
  const db = createDb({ url: ':memory:' }); await migrate(db);
  const today = etDate();
  await seedBank(db, [makeDay(1, 'r')], { launchDate: today });
  const served = await puzzleFor(db, today, today);
  const edited = makeDay(1, 'r'); edited.prompts[0].text = 'edited later';
  await seedBank(db, [edited], { launchDate: today });
  const row = JSON.parse((await db.prepare('SELECT content FROM puzzles WHERE date=?').bind(today).first()).content);
  assert.equal(row.prompts[0].text, served.prompts[0].text);
  assert.equal(JSON.parse((await db.prepare('SELECT content FROM bank WHERE day=1').first()).content).prompts[0].text, 'edited later');
  db.close();
});

test('validateDay rejects the same canonical answer listed twice', () => {
  const d = makeDay(1, 'dup'); d.prompts[0].answers[2] = { ...d.prompts[0].answers[1], tier: 'og' };
  assert.throws(() => validateDay(d), /dup1p0.*twice/);
});

test('validateBank and the CLI reject gaps and repeated prompt text', () => {
  const dup = makeDay(2, 'b'); dup.prompts[3].text = 'B DAY 1 PROMPT 3!';
  const errors = validateBank([makeDay(1, 'b'), dup]);
  assert.ok(errors.some(e => /repeat/i.test(e)), errors.join('\n'));
  assert.ok(validateBank([makeDay(1, 'c'), makeDay(3, 'c')]).some(e => /gap|missing/i.test(e)));
  assert.deepEqual(validateBank([makeDay(1, 'd'), makeDay(2, 'd')]), []);
  const dir = mkdtempSync(path.join(tmpdir(), 'bank-'));
  writeFileSync(path.join(dir, '0001.json'), JSON.stringify(makeDay(1, 'b')));
  writeFileSync(path.join(dir, '0002.json'), JSON.stringify(dup));
  assert.notEqual(spawnSync('node', ['scripts/validate-bank.mjs', dir]).status, 0);
  const ok = mkdtempSync(path.join(tmpdir(), 'bank-'));
  writeFileSync(path.join(ok, '0001.json'), JSON.stringify(makeDay(1, 'e')));
  assert.equal(spawnSync('node', ['scripts/validate-bank.mjs', ok]).status, 0);
});
