// Usage: node scripts/seed.mjs <bank/days folder> [--force]
// Loads the private bank into TURSO_DATABASE_URL. Past days are skipped unless --force.
import { readBank } from './read-bank.mjs';
import { validateBank, seedBank } from '../src/bank.mjs';
import { createDb, migrate } from '../src/db.mjs';
import { SITE } from '../src/config.mjs';
import { etDate } from '../public/rules.mjs';
const dir = process.argv[2], force = process.argv.includes('--force');
if (!dir) { console.error('Usage: npm run seed -- <days folder> [--force]'); process.exit(2); }
const days = await readBank(dir), errors = validateBank(days);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
const db = createDb({ url: process.env.TURSO_DATABASE_URL || 'file:.data/local.db', authToken: process.env.TURSO_AUTH_TOKEN });
await migrate(db);
const launchDate = process.env.LAUNCH_DATE || SITE.launchDate;
const result = await seedBank(db, days, { launchDate, today: etDate(), force });
console.log(`Launch ${launchDate}: wrote ${result.written}, skipped ${result.skipped} past day(s).`);
db.close();
