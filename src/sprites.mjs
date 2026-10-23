// Pixel grids (64x64 colour arrays) for each sprite name, built from the same generators as the SVG assets.
import * as sea from '../scripts/pixel-art.mjs';
import * as mine from '../scripts/pixel-art-mine.mjs';
const makers = {
  miner: () => mine.miner(), 'miner-gold': () => mine.miner('gold'), 'miner-laser': () => mine.miner('laser'),
  pebble: mine.pebble, pyrite: mine.pyrite, copper: mine.copper, diamond: mine.diamond, fossil: mine.fossil, goldcoin: mine.goldcoin,
  canary: mine.canary, cart: mine.cart, mole: mine.mole,
  krill: () => sea.shrimp(), 'krill-gold': () => sea.shrimp('gold'), evil: () => sea.shrimp('evil'),
  schooler: () => sea.fish(), tooclever: () => sea.fish(true), rare: sea.squid, deepcut: sea.angler,
};
const cache = new Map();
export function spriteGrid(name) {
  if (!cache.has(name)) { const make = makers[name]; cache.set(name, make ? (make(), sea.lastPixels.p) : null); }
  return cache.get(name);
}
