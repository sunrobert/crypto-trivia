// Server-drawn 1200x675 result card: the picture X shows when someone posts their share link.
// Pure JS rasteriser (no canvas, no fonts) so it runs anywhere and always looks the same.
import { encodePNG } from './png.mjs';
import { glyph, ADVANCE } from './font5x7.mjs';
import { spriteGrid } from './sprites.mjs';
import { bandFor } from '../public/rules.mjs';

const W = 1200, H = 675, HORIZON = 430;
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const lerp = (a, b, t) => a + (b - a) * t;

class Raster {
  constructor() { this.px = new Uint8Array(W * H * 4); }
  blend(x, y, [r, g, b], a = 1) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4, p = this.px;
    p[i] = Math.round(lerp(p[i], r, a)); p[i + 1] = Math.round(lerp(p[i + 1], g, a)); p[i + 2] = Math.round(lerp(p[i + 2], b, a)); p[i + 3] = 255;
  }
  rect(x, y, w, h, color, a = 1) {
    for (let yy = Math.max(0, Math.round(y)); yy < Math.min(H, Math.round(y + h)); yy++)
      for (let xx = Math.max(0, Math.round(x)); xx < Math.min(W, Math.round(x + w)); xx++) this.blend(xx, yy, color, a);
  }
  frame(x, y, w, h, t, color) { this.rect(x, y, w, t, color); this.rect(x, y + h - t, w, t, color); this.rect(x, y, t, h, color); this.rect(x + w - t, y, t, h, color); }
  gradient(y0, y1, stops) {
    const cols = stops.map(hex);
    for (let y = y0; y < y1; y++) {
      const f = (y - y0) / Math.max(1, y1 - y0 - 1) * (cols.length - 1), i = Math.min(cols.length - 2, Math.floor(f)), t = f - i;
      const c = cols[i].map((v, k) => lerp(v, cols[i + 1][k], t));
      this.rect(0, y, W, 1, c);
    }
  }
  textWidth(text, s) { return [...text].length * ADVANCE * s - s; }
  text(text, x, y, s, color) { this.#glyphs(text, x, y, s, color, 1); }
  #glyphs(text, x, y, s, color, a) { let cx = x; for (const ch of text) { glyph(ch).forEach((row, gy) => row.forEach((on, gx) => { if (on) this.rect(cx + gx * s, y + gy * s, s, s, color, a); })); cx += ADVANCE * s; } }
  shadowText(text, x, y, s, color, shadowColor, d, alpha = 1) { this.#glyphs(text, x + d, y + d, s, shadowColor, alpha); this.#glyphs(text, x, y, s, color, 1); }
  sprite(grid, x, y, size) {
    for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) {
      const c = grid[Math.floor(dy * 64 / size)][Math.floor(dx * 64 / size)];
      if (c) this.blend(x + dx, y + dy, hexCache(c));
    }
  }
}
const cache = new Map();
const hexCache = c => { let v = cache.get(c); if (!v) cache.set(c, v = hex(c)); return v; };

export function renderCard({ theme, siteName, code, host }) {
  const pal = theme.palette, R = new Raster();
  const cream = hex('#f3e9dc'), white = [255, 255, 255], black = [0, 0, 0];

  // Sky, stars, hills, ground, flecks, grass: the same scene as the in-game share image.
  R.gradient(0, HORIZON, pal.cardSky);
  for (let i = 0; i < 70; i++) R.rect((i * 397) % W, (i * 131) % 300, 3, 3, [255, 240, 220], .15 + (i % 5) * .08);
  R.gradient(HORIZON, H, pal.cardGround);
  const hills = hex(pal.cardHills);
  for (let x = 0; x < W; x++) { const top = Math.round(392 - Math.sin(x * .006) * 26 - Math.sin(x * .021) * 9); R.rect(x, top, 1, HORIZON - top, hills); }
  const gold = hex(pal.gold);
  for (let i = 0; i < 160; i++) R.rect((i * 173) % W, 440 + (i * 89) % (H - 450), 6, 6, i % 9 ? black : gold, i % 9 ? .18 : .4);
  R.rect(0, HORIZON - 2, W, 6, hex(pal.cardGrass));

  // Title and day line.
  const title = siteName.toUpperCase();
  R.shadowText(title, 60, 40, 9, gold, hex(pal.burst), 5);
  R.text(`${code.practice ? 'PRACTICE · ' : ''}#${code.day} · DAILY CRYPTO TRIVIA`, 64, 122, 4, cream);

  // Big score in the band's colour, then depth and band name.
  const band = bandFor(code.score), tierColor = hex(theme.tiers[band.tier]?.color || pal.gold), score = String(code.score);
  R.shadowText(score, 60, 178, 22, tierColor, black, 9, .4);
  const sw = R.textWidth(score, 22);
  R.text('/700', 60 + sw + 22, 178 + 154 - 56, 8, cream);
  R.shadowText(`${theme.copy.sinkVerb === 'dig' ? 'DUG' : 'SANK'} ${(code.score * 10).toLocaleString('en-US')}M · ${theme.bands[band.tier].name.toUpperCase()}`, 64, 356, 5, white, black, 3, .45);

  // Mascot (gold if any answer hit the top tier).
  const mascot = spriteGrid(code.tiers.includes('satoshi') ? theme.sprites.mascotGold : theme.sprites.mascot);
  if (mascot) R.sprite(mascot, 872, 104, 256);

  // One tile per round.
  const size = 128, gap = 20, x0 = Math.round((W - (7 * size + 6 * gap)) / 2), y0 = 456, miss = hex('#4a4450');
  code.tiers.forEach((tier, i) => {
    const x = x0 + i * (size + gap);
    R.rect(x - 6, y0 - 6, size + 12, size + 12, black, .38);
    if (!tier) { R.text('-', x + (size - 5 * 10) / 2, y0 + (size - 7 * 10) / 2, 10, miss); return; }
    const color = hex(theme.tiers[tier].color);
    R.frame(x - 6, y0 - 6, size + 12, size + 12, 3, color);
    const grid = spriteGrid(theme.tiers[tier].sprite);
    if (grid) R.sprite(grid, x, y0, size);
    else for (let y = 0; y < size; y++) for (let xx = 0; xx < size; xx++) { const d = Math.hypot(xx - size / 2, y - size / 2); if (d < size * .28) R.blend(x + xx, y0 + y, color, d < size * .2 ? 1 : .55); }
  });

  // Footer call to action.
  const footer = `CAN YOU ${theme.copy.sinkVerb} DEEPER?  ${host}`.toUpperCase();
  R.text(footer, Math.round((W - R.textWidth(footer, 4)) / 2), 618, 4, cream);
  return encodePNG(W, H, Buffer.from(R.px.buffer));
}
