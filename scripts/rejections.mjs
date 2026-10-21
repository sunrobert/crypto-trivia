// Usage: node scripts/rejections.mjs [--since YYYY-MM-DD]
// Top rejected guesses per prompt, to find correct answers missing from the bank.
import { createDb } from '../src/db.mjs';
import { normalize } from '../public/rules.mjs';
const i = process.argv.indexOf('--since'), since = i > 0 ? process.argv[i + 1] : '0000-00-00';
const db = createDb({ url: process.env.TURSO_DATABASE_URL || 'file:.data/local.db', authToken: process.env.TURSO_AUTH_TOKEN });
const rows = (await db.prepare('SELECT prompt_id, raw FROM rejections WHERE date >= ?').bind(since).all()).results;
const byPrompt = new Map();
for (const r of rows) { const m = byPrompt.get(r.prompt_id) || new Map(), k = normalize(r.raw); const e = m.get(k) || { raw: r.raw, n: 0 }; e.n++; m.set(k, e); byPrompt.set(r.prompt_id, m); }
for (const [id, m] of [...byPrompt].sort()) {
  console.log(`\n${id}`);
  for (const e of [...m.values()].sort((a, b) => b.n - a.n).slice(0, 20)) console.log(`  ${String(e.n).padStart(4)}  ${e.raw}`);
}
if (!rows.length) console.log('No rejected guesses yet.');
db.close();
