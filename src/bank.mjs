// Puzzle bank format, validation and seeding. The bank itself lives in a private repo.
import { TIER_KEYS, normalize } from '../public/rules.mjs';
import { SAMPLE } from './sample-bank.mjs';

export const CATEGORIES = ['history', 'chains', 'defi', 'memecoins', 'collapses', 'people', 'ct-lore', 'nfts', 'exchanges', 'tech', 'satoshi', 'culture'];

export const daysBetween = (a, b) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000);

export function validateDay(day) {
  const where = `day ${day?.day ?? '?'}`;
  if (!Array.isArray(day?.prompts) || day.prompts.length !== 7) throw new Error(`${where}: needs exactly 7 prompts`);
  const ids = new Set();
  for (const p of day.prompts) {
    const at = `${where} ${p.id || '(no id)'}`;
    if (!p.id || typeof p.id !== 'string') throw new Error(`${at}: missing id`);
    if (ids.has(p.id)) throw new Error(`${at}: duplicate id`);
    ids.add(p.id);
    if (!p.text || typeof p.text !== 'string' || !p.text.trim()) throw new Error(`${at}: empty text`);
    if (!CATEGORIES.includes(p.category)) throw new Error(`${at}: unknown category "${p.category}"`);
    if (!Array.isArray(p.answers) || p.answers.length < 8) throw new Error(`${at}: needs at least 8 answers`);
    const keys = new Map(), names = new Set();
    for (const a of p.answers) {
      if (names.has(a.answer)) throw new Error(`${at}: "${a.answer}" is listed twice`);
      names.add(a.answer);
      if (!TIER_KEYS.includes(a.tier)) throw new Error(`${at}: unknown tier "${a.tier}" on "${a.answer}"`);
      for (const word of [a.answer, ...(a.aliases || [])]) {
        const key = normalize(word);
        if (!key) throw new Error(`${at}: empty answer or alias on "${a.answer}"`);
        if (keys.has(key) && keys.get(key) !== a.answer) throw new Error(`${at}: "${word}" matches both "${keys.get(key)}" and "${a.answer}" (${key})`);
        keys.set(key, a.answer);
      }
    }
    const gems = p.answers.filter(a => a.tier === 'satoshi').length;
    if (gems !== 1) throw new Error(`${at}: needs exactly 1 satoshi answer, has ${gems}`);
  }
  return day;
}

// Checks every day plus cross-day rules. Returns a list of error strings (empty when valid).
export function validateBank(days) {
  const errors = [], seenText = new Map(), seenId = new Map();
  const sorted = [...days].sort((a, b) => a.day - b.day);
  sorted.forEach((d, i) => { if (d.day !== i + 1) errors.push(`day numbering: expected day ${i + 1}, found ${d.day} (gap or missing day)`); });
  for (const d of sorted) {
    try { validateDay(d); } catch (e) { errors.push(e.message); continue; }
    for (const p of d.prompts) {
      const key = normalize(p.text);
      if (seenText.has(key)) errors.push(`day ${d.day} ${p.id}: prompt text repeats ${seenText.get(key)}`); else seenText.set(key, `day ${d.day} ${p.id}`);
      if (seenId.has(p.id)) errors.push(`day ${d.day} ${p.id}: id repeats ${seenId.get(p.id)}`); else seenId.set(p.id, d.day);
    }
  }
  return errors;
}

// Writes bank days by day number and records the launch date. Dates that were already
// served keep their frozen snapshot in `puzzles`, so a reseed never changes a puzzle mid-day.
export async function seedBank(db, days, { launchDate }) {
  for (const d of days) {
    validateDay(d);
    const content = { dayNumber: d.day, source: 'bank', prompts: d.prompts.map(p => ({ ...p, answers: p.answers.map(a => ({ ...a, startTier: a.startTier || a.tier })) })) };
    await db.prepare('INSERT INTO bank(day,content) VALUES(?,?) ON CONFLICT(day) DO UPDATE SET content=excluded.content, updated_at=CURRENT_TIMESTAMP').bind(d.day, JSON.stringify(content)).run();
  }
  await db.prepare("INSERT INTO meta(key,value) VALUES('launch_date',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(launchDate).run();
  // Every answer and alias across the whole bank (plus the sample), for the server's typo guard.
  const known = new Set(SAMPLE.prompts.flatMap(p => p.answers.flatMap(a => [a.answer, ...(a.aliases || [])])).map(normalize));
  for (const { content } of (await db.prepare('SELECT content FROM bank').all()).results)
    for (const p of JSON.parse(content).prompts) for (const a of p.answers) for (const w of [a.answer, ...(a.aliases || [])]) known.add(normalize(w));
  known.delete('');
  await db.prepare("INSERT INTO meta(key,value) VALUES('known_names',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify([...known])).run();
  return { written: days.length };
}
