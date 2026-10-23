import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { shareCode, parseShareCode, shareText } from '../public/rules.mjs';
import { THEMES } from '../public/themes/index.mjs';
import { encodePNG } from '../src/png.mjs';
import { renderCard } from '../src/card.mjs';
import { handle } from '../src/server.mjs';
import { createDb, migrate } from '../src/db.mjs';

const res = tiers => tiers.map(t => ({ tier: t, score: { normie: 10, midcurve: 15, holder: 30, degen: 60, og: 85, satoshi: 100 }[t] || 0 }));

test('share codes round-trip day, tiers and practice; junk is rejected', () => {
  const r = res(['holder', 'holder', 'holder', 'degen', null, 'holder', 'satoshi']);
  assert.equal(shareCode(1, r, false), '1-hhhdxhs');
  assert.equal(shareCode(12, r, true), '12-hhhdxhsp');
  assert.deepEqual(parseShareCode('1-hhhdxhs'), { day: 1, tiers: ['holder', 'holder', 'holder', 'degen', null, 'holder', 'satoshi'], practice: false, score: 280 });
  assert.equal(parseShareCode('12-hhhdxhsp').practice, true);
  for (const bad of ['', '0-nnnnnnn', '1-nnnnnn', '1-nnnnnnnn', '1-nnnnnnq', 'x-nnnnnnn', '99999-nnnnnnn', '1-NNNNNNN', '1-nnnnnnn/..']) assert.equal(parseShareCode(bad), null, bad);
});

test('share text ends with the personal share link', () => {
  const lines = shareText(1, res(['degen', null, 'normie']), THEMES.mine, { name: 'Proof of Dig', link: 'https://p.test/s/1-dxn' }).split('\n');
  assert.equal(lines.at(-1), 'https://p.test/s/1-dxn');
});

test('PNG encoder writes real pixels', async () => {
  const w = 3, h = 2, px = Buffer.alloc(w * h * 4);
  px.set([255, 0, 0, 255], 0); px.set([0, 0, 255, 255], (1 * w + 2) * 4);
  const { data, info } = await sharp(encodePNG(w, h, px)).raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 3); assert.equal(info.height, 2);
  assert.deepEqual([...data.subarray(0, 3)], [255, 0, 0]);
  assert.deepEqual([...data.subarray((1 * w + 2) * info.channels, (1 * w + 2) * info.channels + 3)], [0, 0, 255]);
});

test('result card is a 1200x675 PNG, varied, deterministic, and differs per result', async () => {
  const a = renderCard({ theme: THEMES.mine, siteName: 'Proof of Dig', code: parseShareCode('1-hhhdxhs'), host: 'proof-of-dig.vercel.app' });
  const meta = await sharp(a).metadata(); assert.equal(meta.width, 1200); assert.equal(meta.height, 675);
  const stats = await sharp(a).stats(); assert.ok(stats.channels[0].stdev > 25, 'not a flat image');
  assert.ok(a.length < 400_000, `small enough for X (${a.length} bytes)`);
  assert.ok(a.equals(renderCard({ theme: THEMES.mine, siteName: 'Proof of Dig', code: parseShareCode('1-hhhdxhs'), host: 'proof-of-dig.vercel.app' })));
  const b = renderCard({ theme: THEMES.mine, siteName: 'Proof of Dig', code: parseShareCode('1-sssssss'), host: 'proof-of-dig.vercel.app' });
  assert.ok(!a.equals(b));
  assert.ok((await sharp(renderCard({ theme: THEMES.sea, siteName: 'Proof of Dig', code: parseShareCode('3-nmhdosx'), host: 'x' })).metadata()).width === 1200);
});

async function env() { const DB = createDb({ url: ':memory:' }); await migrate(DB); return { DB, LOCAL_DEVELOPMENT: 'true', SITE_URL: 'https://proof-of-dig.vercel.app' }; }

test('GET /og/<code>.png serves the card with long caching; bad codes 404', async () => {
  const e = await env();
  const r = await handle(new Request('https://proof-of-dig.vercel.app/og/1-hhhdxhs.png'), e);
  assert.equal(r.status, 200); assert.equal(r.headers.get('Content-Type'), 'image/png');
  assert.match(r.headers.get('Cache-Control'), /immutable/);
  assert.equal((await sharp(Buffer.from(await r.arrayBuffer())).metadata()).height, 675);
  assert.equal((await handle(new Request('https://proof-of-dig.vercel.app/og/1-zzzzzzz.png'), e)).status, 404);
  e.DB.close();
});

test('GET /s/<code> is the game page with this result as the X/OG preview', async () => {
  const e = await env();
  const html = await (await handle(new Request('https://proof-of-dig.vercel.app/s/1-hhhdxhs'), e)).text();
  assert.ok(html.includes('id="game"'), 'still the playable page');
  assert.match(html, /<meta property="og:image" content="https:\/\/proof-of-dig\.vercel\.app\/og\/1-hhhdxhs\.png">/);
  assert.match(html, /<meta name="twitter:image" content="https:\/\/proof-of-dig\.vercel\.app\/og\/1-hhhdxhs\.png">/);
  assert.match(html, /<meta property="og:title" content="[^"]*280\/700[^"]*">/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  const bad = await handle(new Request('https://proof-of-dig.vercel.app/s/nope'), e);
  assert.equal(bad.status, 302); assert.equal(new URL(bad.headers.get('Location'), 'https://x').pathname, '/');
  e.DB.close();
});
