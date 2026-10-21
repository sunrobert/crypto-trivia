import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { THEMES } from '../public/themes/index.mjs';

before(() => { execFileSync('node', ['scripts/build.mjs'], { stdio: 'ignore' }); });

test('every sprite a theme references exists after build', () => {
  assert.ok(THEMES.mine, 'mine theme registered');
  for (const [id, t] of Object.entries(THEMES)) {
    const names = [...Object.values(t.tiers).map(x => x.sprite), t.sprites.mascot, t.sprites.mascotGold, ...t.sprites.buddies.map(b => b.sprite), ...t.sprites.scene];
    for (const name of names) assert.ok(existsSync(`public/assets/${name}.svg`), `${id}: ${name}.svg`);
  }
  assert.ok(existsSync('public/assets/og.png'));
});
