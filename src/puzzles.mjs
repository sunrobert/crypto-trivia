// Which puzzle a date gets: an existing row, the sample (no bank / before launch),
// or a rerun of the bank once it runs out. Each date is snapshotted on first use so its
// prompts and tiers stay frozen for the whole day.
import { SAMPLE } from './sample-bank.mjs';
import { daysBetween } from './bank.mjs';

const caches = new WeakMap();
const snapshot = (db, date, puzzle, source) =>
  db.prepare('INSERT OR IGNORE INTO puzzles(date,day_number,source,content) VALUES(?,?,?,?)').bind(date, puzzle.dayNumber, source, JSON.stringify(puzzle)).run();

export async function puzzleFor(db, date, launchDate) {
  if (!caches.has(db)) caches.set(db, new Map());
  const cache = caches.get(db);
  if (cache.has(date)) return cache.get(date);
  const load = async () => { const row = await db.prepare('SELECT content FROM puzzles WHERE date=?').bind(date).first(); return row && JSON.parse(row.content); };
  let puzzle = await load();
  if (!puzzle) {
    const offset = daysBetween(launchDate, date);
    const bankCount = (await db.prepare("SELECT COUNT(*) AS n FROM puzzles WHERE source='bank'").first()).n;
    if (!bankCount || offset < 0) {
      await snapshot(db, date, { ...SAMPLE, date, dayNumber: Math.max(1, offset + 1), sample: true }, 'sample');
    } else {
      const original = JSON.parse((await db.prepare("SELECT content FROM puzzles WHERE source='bank' ORDER BY date LIMIT 1 OFFSET ?").bind(offset % bankCount).first()).content);
      await snapshot(db, date, { ...original, date, dayNumber: offset + 1, source: 'rerun', rerunOf: original.date }, 'rerun');
    }
    puzzle = await load();
  }
  cache.set(date, puzzle);
  return puzzle;
}
