// Which puzzle a date gets. A date's first lookup freezes a snapshot in `puzzles`, so its
// prompts and tiers never change for anyone that day (reseeds and re-tiering only affect
// dates not yet served). Before launch or with no bank: the sample. After the last bank
// day: reruns from day 1.
import { SAMPLE } from './sample-bank.mjs';
import { daysBetween } from './bank.mjs';

const caches = new WeakMap(); // safe: snapshots are immutable once written

export async function puzzleFor(db, date, fallbackLaunch) {
  if (!caches.has(db)) caches.set(db, new Map());
  const cache = caches.get(db);
  if (cache.has(date)) return cache.get(date);
  const load = async () => { const row = await db.prepare('SELECT content FROM puzzles WHERE date=?').bind(date).first(); return row && JSON.parse(row.content); };
  let puzzle = await load();
  if (!puzzle) {
    const launch = (await db.prepare("SELECT value FROM meta WHERE key='launch_date'").first())?.value || fallbackLaunch;
    const offset = daysBetween(launch, date), count = (await db.prepare('SELECT COUNT(*) AS n FROM bank').first()).n;
    let fresh, source;
    if (!count || offset < 0) { fresh = { ...SAMPLE, dayNumber: Math.max(1, offset + 1), sample: true }; source = 'sample'; }
    else {
      const day = offset < count ? offset + 1 : (offset % count) + 1;
      const row = await db.prepare('SELECT content FROM bank WHERE day=?').bind(day).first();
      if (!row) throw new Error(`Bank day ${day} is missing; days must be numbered 1..${count}`);
      source = offset < count ? 'bank' : 'rerun';
      fresh = { ...JSON.parse(row.content), dayNumber: offset + 1, source, ...(source === 'rerun' ? { rerunOf: day } : {}) };
    }
    fresh.date = date;
    await db.prepare('INSERT OR IGNORE INTO puzzles(date,day_number,source,content) VALUES(?,?,?,?)').bind(date, fresh.dayNumber, source, JSON.stringify(fresh)).run();
    puzzle = await load();
  }
  cache.set(date, puzzle);
  return puzzle;
}
