import test from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from '../public/themes/index.mjs';
import { TIER_KEYS, TIER_SCORES, BANDS, shareText, xShareUrl } from '../public/rules.mjs';
import { SOUND_CUES, cuesFor } from '../public/sound.mjs';

const keys = o => Object.keys(o).sort();

test('every theme has the same complete shape', () => {
  const base = THEMES.sea;
  for (const [id, t] of Object.entries(THEMES)) {
    assert.equal(t.id, id);
    assert.deepEqual(Object.keys(t.tiers), TIER_KEYS, id);
    for (const k of TIER_KEYS) for (const f of ['name', 'emoji', 'color', 'blurb', 'sprite']) assert.ok(t.tiers[k][f], `${id}.${k}.${f}`);
    assert.deepEqual(Object.keys(t.bands), BANDS.map(b => b.tier), id);
    for (const b of Object.values(t.bands)) assert.ok(b.name && b.text);
    assert.equal(typeof t.Scenery, 'function');
    for (const part of ['copy', 'palette', 'sprites', 'paint']) assert.deepEqual(keys(t[part]), keys(base[part]), `${id}.${part}`);
    for (const [k, v] of Object.entries(t.copy)) assert.ok(typeof v === 'string' && v.length, `${id}.copy.${k}`);
    assert.ok(Array.isArray(t.landmarks));
    assert.equal(typeof t.layout?.intro, 'function', `${id}.layout.intro`);
  }
});

test('scores are theme-independent', () => {
  assert.deepEqual(TIER_SCORES, { normie: 10, midcurve: 15, holder: 30, degen: 60, og: 85, satoshi: 100 });
  assert.equal(7 * TIER_SCORES.satoshi, 700);
});

test('share text: title, score with depth and tier, emoji row, link', () => {
  const results = Array.from({ length: 7 }, (_, round) => ({ round, tier: 'satoshi', score: 100 }));
  const lines = shareText(3, results, THEMES.sea, { name: 'X', origin: 'https://x.test' }).split('\n');
  assert.equal(lines[0], 'X #3 ' + THEMES.sea.copy.shareIcon);
  assert.equal(lines[1], `700/700 · 7,000m · ${THEMES.sea.bands.satoshi.name}`);
  assert.equal(lines[2], THEMES.sea.tiers.satoshi.emoji.repeat(7));
  assert.equal(lines[3], 'https://x.test');
  const mixed = [{ tier: 'degen', score: 60 }, { tier: null, score: 0 }, { tier: 'normie', score: 10 }];
  const m = shareText(9, mixed, THEMES.mine, { name: 'Proof of Dig', origin: 'o' }).split('\n');
  assert.equal(m[1], `70/700 · 700m · ${THEMES.mine.bands.normie.name}`);
  assert.equal(m[2], THEMES.mine.tiers.degen.emoji + '⬛' + THEMES.mine.tiers.normie.emoji);
});

test('X share link opens the composer with the text prefilled', () => {
  const text = 'Proof of Dig #1 ⛏️\n485/700 · 4,850m · Degen\nhttps://proof-of-dig.vercel.app';
  const url = new URL(xShareUrl(text));
  assert.equal(url.origin + url.pathname, 'https://x.com/intent/post');
  assert.equal(url.searchParams.get('text'), text);
});

test('sound cues merge theme overrides', () => {
  const merged = cuesFor({ sounds: { submit: [{ from: 1 }] } });
  assert.equal(merged.submit[0].from, 1);
  for (const k of Object.keys(SOUND_CUES)) if (k !== 'submit') assert.deepEqual(merged[k], SOUND_CUES[k]);
});

test('?theme= previews another registered theme; unknown ids fall back to the configured one', async () => {
  const { homePage } = await import('../src/html.mjs');
  const { SITE } = await import('../src/config.mjs');
  assert.match(homePage({}, 'sea'), /data-theme="sea"/);
  assert.match(homePage({}, 'nope'), new RegExp(`data-theme="${SITE.theme}"`));
  assert.match(homePage({}), new RegExp(`data-theme="${SITE.theme}"`));
});
