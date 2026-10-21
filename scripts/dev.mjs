// Local server: static files from public/, everything else through handle(). No cloud account needed.
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handle } from '../src/server.mjs';
import { createDb, migrate } from '../src/db.mjs';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const port = Number(process.env.PORT || 3051);
const url = process.env.TURSO_DATABASE_URL || 'file:.data/local.db';
if (url === 'file:.data/local.db') await mkdir('.data', { recursive: true });
const DB = createDb({ url, authToken: process.env.TURSO_AUTH_TOKEN });
await migrate(DB);
const env = { DB, SITE_URL: `http://localhost:${port}`, LOCAL_DEVELOPMENT: 'true', CRON_SECRET: process.env.CRON_SECRET || '' };
const types = { '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json' };

async function staticFile(pathname) {
  const file = path.join(root, decodeURIComponent(pathname));
  if (!file.startsWith(root) || pathname === '/') return null;
  try { if ((await stat(file)).isFile()) return { body: await readFile(file), type: types[path.extname(file)] || 'application/octet-stream' }; } catch {}
  return null;
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const file = ['GET', 'HEAD'].includes(req.method) ? await staticFile(pathname) : null;
  if (file) { res.writeHead(200, { 'Content-Type': file.type }); return res.end(req.method === 'HEAD' ? undefined : file.body); }
  const chunks = []; for await (const c of req) chunks.push(c);
  const request = new Request(`http://localhost:${port}${req.url}`, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
  const response = await handle(request, env);
  const headers = {}; response.headers.forEach((v, k) => { headers[k] = v; });
  res.writeHead(response.status, headers); res.end(Buffer.from(await response.arrayBuffer()));
}).listen(port, () => console.log(`Crypto Trivia running at http://localhost:${port}`));
