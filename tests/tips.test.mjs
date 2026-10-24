import test from 'node:test';
import assert from 'node:assert/strict';
import { tipAddresses, SITE } from '../src/config.mjs';
import { homePage, infoPage } from '../src/html.mjs';

const EVM = '0x' + 'ab'.repeat(20), SOL = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';

test('tip jar is hidden until an address is configured', () => {
  const saved = SITE.tips; SITE.tips = { evm: '', sol: '' };
  try {
  assert.deepEqual(tipAddresses({}), []);
  const html = homePage({});
  assert.ok(!html.includes('tip-dialog'));
  assert.ok(!html.includes('data-action="tip"'));
  assert.match(html, /"tips":false/);
  } finally { SITE.tips = saved; }
});

test('the configured addresses are well-formed, so the live tip jar shows both', () => {
  assert.deepEqual(tipAddresses({}).map(t => t.chain), ['EVM', 'SOL']);
});

test('only well-formed addresses are shown', () => {
  assert.deepEqual(tipAddresses({ TIP_EVM: '0x123', TIP_SOL: 'not an address!' }), []);
  assert.equal(tipAddresses({ TIP_EVM: 'digger.eth' })[0].address, 'digger.eth');
  assert.deepEqual(tipAddresses({ TIP_EVM: EVM, TIP_SOL: SOL }).map(t => t.chain), ['EVM', 'SOL']);
});

test('configured addresses appear in the tip dialog, menu and About page', () => {
  const env = { TIP_EVM: EVM, TIP_SOL: SOL }, html = homePage(env);
  assert.ok(html.includes('id="tip-dialog"'));
  assert.ok(html.includes('data-action="tip"'));
  assert.ok(html.includes(`data-copy="${EVM}"`) && html.includes(`data-copy="${SOL}"`));
  assert.match(html, /"tips":true/);
  assert.ok(infoPage('/about', env).includes(SOL));
});
