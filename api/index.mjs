// Vercel function: every non-static path is rewritten here (see vercel.json).
import { handle } from '../src/server.mjs';
import { createDb } from '../src/db.mjs';

const env = {
  DB: createDb({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN }),
  SITE_URL: process.env.SITE_URL || '',
  CRON_SECRET: process.env.CRON_SECRET || '',
  LOCAL_DEVELOPMENT: 'false',
};
const run = request => handle(request, env);
export const GET = run, POST = run, HEAD = run;
