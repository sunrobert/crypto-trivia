// Usage: node scripts/validate-bank.mjs <bank/days folder>
import { readBank } from './read-bank.mjs';
import { validateBank } from '../src/bank.mjs';
const dir = process.argv[2];
if (!dir) { console.error('Usage: npm run validate-bank -- <days folder>'); process.exit(2); }
const days = await readBank(dir);
const errors = days.length ? validateBank(days) : ['no NNNN.json day files found'];
if (errors.length) { console.error(errors.join('\n')); console.error(`\n${errors.length} problem(s).`); process.exit(1); }
console.log(`OK: ${days.length} days, ${days.length * 7} prompts.`);
