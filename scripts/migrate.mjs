// Apply pending migrations to TURSO_DATABASE_URL (default: the local dev file).
import { mkdir } from 'node:fs/promises';
import { createDb, migrate } from '../src/db.mjs';
const url = process.env.TURSO_DATABASE_URL || 'file:.data/local.db';
if (url.startsWith('file:')) await mkdir('.data', { recursive: true });
const db = createDb({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const applied = await migrate(db);
console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Database is up to date.');
db.close();
