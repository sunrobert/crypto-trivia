// Vercel function: every non-static path is rewritten here (see vercel.json).
// Uses the HTTP-only libSQL client so no native module has to be bundled.
import { createClient } from '@libsql/client/web';
import { handle } from '../src/server.mjs';
import { wrapClient } from '../src/db-core.mjs';

const url = process.env.TURSO_DATABASE_URL;
const env = url && {
  DB: wrapClient(createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })),
  SITE_URL: process.env.SITE_URL || '',
  LAUNCH_DATE: process.env.LAUNCH_DATE || '',
  CRON_SECRET: process.env.CRON_SECRET || '',
  LOCAL_DEVELOPMENT: 'false',
};
const run = request => env ? handle(request, env)
  : Response.json({ error: 'Server misconfigured: set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN) in Vercel.' }, { status: 500 });
export const GET = run, POST = run, HEAD = run;
