// Original 64px pixel sprites for the mine theme, drawn with the same Pixels helper as the sea sprites.
import { Pixels, mix, rgb, hash } from './pixel-art.mjs';

// Rock with a dark rim and speckles.
function rock(p, cx, cy, rx, ry, light, dark, rim) {
  p.oval(cx, cy + 1, rx + 1, ry + 1, rim);
  p.oval(cx, cy, rx, ry, light, dark);
  for (let i = 0; i < 18; i++) { const x = cx - rx + 2 + hash(i, 3) * (rx * 2 - 4), y = cy - ry + 2 + hash(i, 9) * (ry * 2 - 4); if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < .7) p.put(x, y, rgb(mix(light, dark, .8))); }
}
function cube(p, x, y, s, [top, left, right]) {
  p.poly([[x, y], [x + s, y - s / 2], [x + 2 * s, y], [x + s, y + s / 2]], top);
  p.poly([[x, y], [x + s, y + s / 2], [x + s, y + s * 1.5], [x, y + s]], left);
  p.poly([[x + s, y + s / 2], [x + 2 * s, y], [x + 2 * s, y + s], [x + s, y + s * 1.5]], right);
}

export function pebble() { const p = new Pixels(); rock(p, 32, 38, 17, 12, [176, 172, 168], [86, 82, 90], '#3a3540'); p.line([[22, 34], [27, 32]], '#d8d4cf'); return p.svg(); }

export function pyrite() {
  const p = new Pixels(), c = ['#fff09a', '#d9a520', '#8c6410'];
  cube(p, 12, 30, 10, c); cube(p, 30, 26, 11, c); cube(p, 22, 38, 9, c);
  for (const [x, y] of [[20, 27], [41, 22], [31, 36]]) { p.put(x, y, '#ffffff'); p.put(x + 1, y, '#ffffff'); }
  return p.svg();
}

export function copper() {
  const p = new Pixels(); rock(p, 32, 37, 18, 13, [120, 104, 96], [52, 44, 48], '#241d22');
  p.line([[18, 40], [25, 35], [31, 38], [38, 31], [46, 34]], '#e07a2e', 2); p.line([[22, 44], [30, 43], [36, 46]], '#f29b52');
  for (const [x, y] of [[27, 30], [41, 41], [20, 36]]) p.rect(x, y, 3, 2, '#3fbf9a');
  return p.svg();
}

export function diamond() {
  const p = new Pixels();
  p.poly([[14, 26], [22, 16], [42, 16], [50, 26], [32, 52]], '#0b5e7a');
  p.poly([[16, 26], [23, 18], [41, 18], [48, 26]], '#9ff4ff');
  p.poly([[16, 27], [48, 27], [32, 49]], '#3ccff0');
  p.poly([[23, 18], [28, 26], [32, 18]], '#e6fdff'); p.poly([[32, 27], [40, 27], [32, 49]], '#1b9cc4');
  p.line([[16, 26], [48, 26]], '#0b5e7a');
  for (const [x, y] of [[52, 12], [10, 40]]) { p.rect(x, y - 2, 1, 5, '#ffffff'); p.rect(x - 2, y, 5, 1, '#ffffff'); }
  return p.svg();
}

export function fossil() {
  const p = new Pixels(); rock(p, 32, 36, 20, 16, [204, 186, 150], [122, 100, 74], '#4d3b2a');
  const pts = []; for (let i = 0; i <= 90; i++) { const a = i * .19, r = 2 + i * .14; pts.push([32 + Math.cos(a) * r, 36 + Math.sin(a) * r * .85]); }
  p.line(pts, '#5a4430', 1);
  for (let i = 10; i < 90; i += 9) { const [x, y] = pts[i]; p.line([[x, y], [32 + (x - 32) * 1.25, 36 + (y - 36) * 1.25]], '#7a5f43'); }
  return p.svg();
}

export function goldcoin() {
  const p = new Pixels();
  p.oval(32, 33, 20, 20, '#8a5a06'); p.oval(32, 32, 19, 19, [255, 236, 120], [214, 140, 12]); p.oval(32, 32, 14, 14, [248, 205, 70], [226, 160, 20]);
  const ink = '#7a4a00';
  p.rect(27, 22, 3, 21, ink); p.rect(27, 22, 9, 3, ink); p.rect(27, 31, 10, 2, ink); p.rect(27, 40, 10, 3, ink);
  p.rect(35, 24, 3, 7, ink); p.rect(36, 33, 3, 7, ink); p.rect(29, 19, 2, 3, ink); p.rect(33, 19, 2, 3, ink); p.rect(29, 43, 2, 3, ink); p.rect(33, 43, 2, 3, ink);
  p.line([[19, 24], [24, 19]], '#fff6c8', 2);
  return p.svg();
}

export function miner(variant = 'default') {
  const p = new Pixels(), gold = variant === 'gold', laser = variant === 'laser';
  const hat = gold ? [255, 230, 110] : [255, 204, 40], hatLo = gold ? [200, 130, 10] : [204, 132, 0];
  const suit = gold ? '#e2a91c' : '#2f6fd1', suitLo = gold ? '#a86f08' : '#1d4a96', skin = gold ? '#ffd877' : '#f2b48a';
  // pickaxe behind the body
  p.line([[44, 16], [22, 54]], '#7a4a22', 3);
  p.curve([34, 14], [40, 9], [50, 10], [56, 18], gold ? '#fff2b0' : '#b8c2cc', 3);
  // body and overalls
  p.rect(20, 38, 22, 16, suitLo); p.rect(21, 38, 20, 15, suit); p.rect(24, 36, 3, 6, suitLo); p.rect(35, 36, 3, 6, suitLo);
  p.rect(18, 40, 4, 10, skin); p.rect(40, 40, 4, 10, skin); p.rect(22, 54, 7, 4, '#3b2a1e'); p.rect(33, 54, 7, 4, '#3b2a1e');
  // head, beard, helmet, lamp
  p.oval(31, 29, 9, 8, skin); p.poly([[23, 31], [39, 31], [37, 38], [31, 40], [25, 38]], gold ? '#c98a0c' : '#6b3f22');
  if (laser) { p.line([[27, 28], [2, 22]], '#ff2a3a', 1); p.line([[34, 28], [2, 30]], '#ff2a3a', 1); }
  p.oval(31, 19, 11, 7, hat, hatLo); p.rect(19, 23, 25, 3, rgb(hatLo)); p.rect(28, 14, 6, 5, '#fff7cf'); p.rect(29, 15, 4, 3, '#ffffff');
  p.rect(27, 27, 2, 2, laser ? '#ff2a3a' : '#1a1220'); p.rect(34, 27, 2, 2, laser ? '#ff2a3a' : '#1a1220');
  return p.svg();
}

export function canary() {
  const p = new Pixels();
  p.poly([[14, 40], [6, 44], [10, 36]], '#d99a00');
  p.oval(28, 38, 15, 11, [255, 226, 70], [226, 160, 0]); p.oval(41, 26, 9, 8, [255, 234, 90], [232, 172, 10]);
  p.poly([[49, 26], [57, 28], [49, 30]], '#ff8a1c'); p.rect(43, 24, 2, 2, '#1a1220'); p.put(43, 24, '#ffffff');
  p.curve([20, 34], [26, 30], [34, 32], [36, 40], '#d99a00', 2); p.line([[26, 48], [25, 54]], '#c46a10'); p.line([[32, 48], [33, 54]], '#c46a10');
  return p.svg();
}

export function cart() {
  const p = new Pixels();
  for (const [x, y] of [[20, 26], [27, 22], [34, 25], [40, 23], [30, 28]]) p.oval(x, y, 5, 4, [255, 222, 90], [196, 124, 6]);
  p.poly([[8, 28], [56, 28], [50, 48], [14, 48]], '#4a3a30'); p.poly([[10, 30], [54, 30], [49, 46], [15, 46]], '#7b6450');
  p.rect(12, 36, 40, 2, '#3a2c24'); for (const x of [16, 46]) { p.oval(x + 2, 51, 6, 6, '#1d1a20'); p.oval(x + 2, 51, 3, 3, '#7c8794'); }
  p.rect(2, 56, 60, 2, '#5c5560');
  return p.svg();
}

export function mole() {
  const p = new Pixels();
  p.oval(30, 38, 18, 14, [96, 82, 92], [44, 36, 46]); p.oval(46, 36, 6, 5, [255, 160, 180], [214, 92, 128]);
  for (const x of [16, 22, 28]) p.line([[x, 50], [x - 2, 55]], '#f0d8c8', 2);
  p.rect(39, 31, 2, 2, '#0d0a10'); p.oval(32, 25, 9, 5, [255, 204, 40], [204, 132, 0]); p.rect(30, 21, 4, 3, '#fff7cf');
  return p.svg();
}
