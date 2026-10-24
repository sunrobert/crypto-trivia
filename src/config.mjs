// Public product facts. `name` and `launchDate` are placeholders until deploy.
export const SITE = {
  name: 'Proof of Dig',
  origin: 'http://localhost:3051',
  repository: 'https://github.com/sunrobert/proof-of-dig',
  description: 'Proof of Dig is a daily crypto trivia game for crypto Twitter. Seven prompts, 25 seconds each. Obvious answers barely score; rare correct answers dig deep.',
  title: 'Proof of Dig — daily crypto trivia where rare answers dig deeper',
  rounds: 7, previewSeconds: 3, answerSeconds: 25, maxScore: 700, metresPerPoint: 10,
  theme: 'mine',
  launchDate: '2026-10-22',
  // Optional tip jar. Leave empty to hide it; TIP_EVM / TIP_SOL env vars override these.
  tips: { evm: '0xC79aaC126A9E448f5AB3e616Aa18d579AC2139a8', sol: 'D5mpghj266kUNKmxmGz8rTBFTsC82nLnSARnLy3hip2Z' },
};

// Tip addresses that are safe to show: well-formed only, so a typo never shows a broken address.
export function tipAddresses(env = {}) {
  const evm = String(env.TIP_EVM || SITE.tips.evm || '').trim(), sol = String(env.TIP_SOL || SITE.tips.sol || '').trim();
  const out = [];
  if (/^0x[0-9a-fA-F]{40}$/.test(evm) || /^[a-z0-9-]+\.eth$/i.test(evm)) out.push({ chain: 'EVM', label: 'ETH · Base · any EVM chain', address: evm });
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(sol) || /^[a-z0-9-]+\.sol$/i.test(sol)) out.push({ chain: 'SOL', label: 'Solana', address: sol });
  return out;
}
