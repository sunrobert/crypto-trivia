// Usage: node scripts/seed.mjs <bank/days folder>
// Loads the private bank into TURSO_DATABASE_URL and records the launch date (day 1).
// Dates already served keep their snapshot, so reseeding is always safe.
import { readBank } from './read-bank.mjs';
import { validateBank, seedBank } from '../src/bank.mjs';
import { mkdir } from 'node:fs/promises';
import { createDb, migrate } from '../src/db.mjs';
import { SITE } from '../src/config.mjs';
const dir = process.argv[2];
if (!dir) { console.error('Usage: npm run seed -- <days folder>'); process.exit(2); }
const days = await readBank(dir), errors = validateBank(days);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
const url = process.env.TURSO_DATABASE_URL || 'file:.data/local.db';
if (url === 'file:.data/local.db') await mkdir('.data', { recursive: true });
const db = createDb({ url, authToken: process.env.TURSO_AUTH_TOKEN });
await migrate(db);
const launchDate = process.env.LAUNCH_DATE || SITE.launchDate;
const result = await seedBank(db, days, { launchDate });
console.log(`Launch ${launchDate}: wrote ${result.written} bank day(s).`);
db.close();
