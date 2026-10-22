import test from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from '../public/themes/index.mjs';
import { TIER_KEYS, TIER_SCORES, BANDS, shareText } from '../public/rules.mjs';
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

test('share text uses theme emoji and origin', () => {
  const results = Array.from({ length: 7 }, (_, round) => ({ round, tier: 'satoshi', score: 100 }));
  const text = shareText(3, results, THEMES.sea, { name: 'X', origin: 'https://x.test' });
  assert.ok(text.startsWith('X #3 '));
  assert.ok(text.endsWith('\nhttps://x.test'));
  assert.ok(text.includes('700/700 · 7000m'));
  assert.ok(text.includes('\n' + THEMES.sea.tiers.satoshi.emoji.repeat(7) + '\n'));
  const miss = shareText(1, [{ round: 0, tier: null, score: 0 }], THEMES.sea, { name: 'X', origin: 'o' });
  assert.ok(miss.includes('\n⬛\n'));
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
