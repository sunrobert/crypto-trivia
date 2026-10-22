// Mine-shaft theme: a miner digs down; rare answers hit deeper strata and gold.
// Paint hooks run with `this` bound to the Scene.
import { Minescape } from './minescape.mjs';

const mix = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function seed(n) { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return v - Math.floor(v); }
const stops = [[0, [74, 50, 34]], [150, [58, 40, 30]], [350, [44, 32, 30]], [800, [34, 30, 38]], [1400, [26, 24, 34]], [2600, [20, 16, 30]], [5200, [10, 8, 16]]];
function colorAt(depth) { let i = stops.findIndex(([d]) => d > depth); if (i < 0) return stops.at(-1)[1]; if (!i) return stops[0][1]; const [a, c] = stops[i - 1], [b, k] = stops[i]; return c.map((n, j) => Math.round(mix(n, k[j], (depth - a) / (b - a)))); }

function headframe(x, y, s) {
  const c = this.ctx; c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(s, s);
  c.fillStyle = '#2a1a12';
  for (const [a, b, w, h] of [[-14, -40, 3, 40], [11, -40, 3, 40], [-14, -42, 28, 3], [-10, -28, 20, 2], [-12, -14, 24, 2], [-20, -2, 40, 2]]) c.fillRect(a, b, w, h);
  c.fillStyle = '#6b4630'; c.beginPath(); c.arc(0, -46, 7, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#2a1a12'; c.beginPath(); c.arc(0, -46, 3, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#8a8a8a'; c.lineWidth = .8; c.beginPath(); c.moveTo(0, -39); c.lineTo(0, 0); c.stroke();
  c.restore();
}
function lantern(x, y, flicker) {
  const c = this.ctx, g = c.createRadialGradient(x, y, 2, x, y, 46); g.addColorStop(0, `rgba(255,190,90,${.35 + flicker * .1})`); g.addColorStop(1, 'rgba(255,190,90,0)');
  c.fillStyle = g; c.fillRect(x - 46, y - 46, 92, 92); c.fillStyle = '#ffcf6b'; c.fillRect(x - 3, y - 4, 6, 8); c.fillStyle = '#2a1a12'; c.fillRect(x - 4, y - 6, 8, 2);
}

function backdrop({ w, h, t, l, sea, worldY }) {
  const c = this.ctx;
  if (sea > 0) {
    const sky = c.createLinearGradient(0, sea - 620, 0, sea); sky.addColorStop(0, '#1e1538'); sky.addColorStop(.55, '#5b2a5e'); sky.addColorStop(1, '#f08a4b');
    c.fillStyle = sky; c.fillRect(0, 0, w, sea + 8);
    for (let i = 0; i < 40; i++) { const x = seed(i + 5) * w, y = sea - 620 + seed(i + 50) * 380; if (y < sea - 40) { c.fillStyle = `rgba(255,240,220,${.3 + .3 * Math.sin(t * 2 + i)})`; c.fillRect(x, y, 2, 2); } }
    // Setting sun: stepped pixel disc with a warm halo, sliced by the horizon.
    const r = l.mobile ? 24 : 56, cx = w * .78, cy = sea - r * .55, px = l.mobile ? 4 : 8;
    const halo = c.createRadialGradient(cx, cy, r * .6, cx, cy, r * 2.6); halo.addColorStop(0, 'rgba(255,190,100,.35)'); halo.addColorStop(1, 'rgba(255,190,100,0)'); c.fillStyle = halo; c.fillRect(cx - r * 3, cy - r * 3, r * 6, r * 6);
    for (let y = -r; y < r; y += px) { const half = Math.floor(Math.sqrt(Math.max(0, r * r - (y + px / 2) ** 2)) / px) * px; c.fillStyle = y < -r * .35 ? '#ffe9a0' : y < r * .2 ? '#ffcf6b' : '#ffae5c'; c.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2, px); }
    c.fillStyle = 'rgba(91,42,94,.55)'; for (let k = 0; k < 3; k++) c.fillRect(cx - r, cy + r * (.1 + k * .22), r * 2, Math.max(2, px / 2));
    c.fillStyle = '#2a1830'; c.beginPath(); c.moveTo(0, sea);
    for (let x = 0; x <= w + 16; x += 16) c.lineTo(x, sea - 30 - Math.sin(x * .006) * 22 - Math.sin(x * .021) * 8); c.lineTo(w, sea); c.fill();
    headframe.call(this, w * .25, sea, Math.min(3.2, w / 300));
  }
  for (let y = Math.max(0, Math.floor(sea) - 3); y < h; y += 6) { const d = Math.max(0, this.cameraDepth + (y - l.height / 2) / 2), color = colorAt(d); c.fillStyle = `rgb(${color.join(',')})`; c.fillRect(0, y, w, 7); }
  if (sea > -10 && sea < h + 10) { c.fillStyle = '#3f7a3a'; c.fillRect(0, sea, w, 6); c.fillStyle = '#2c5a2a'; for (let x = 0; x < w; x += 8) c.fillRect(x, sea - 2 - (seed(x) * 4 | 0), 2, 4); }
  this.scenery.draw(c, w, h, worldY);
  for (let i = 0; i < (this.lowPower ? 50 : 160); i++) { const x = seed(i + 91) * w, yy = ((seed(i + 331) * h - t * (2 + seed(i) * 5) + this.cameraDepth * .35) % h + h) % h; if (yy < sea) continue; c.fillStyle = `rgba(214,190,160,${.06 + seed(i + 2) * .2})`; c.fillRect(x, yy, seed(i + 20) > .8 ? 2 : 1, seed(i + 20) > .8 ? 2 : 1); }
  for (let d = 150; d < 7000; d += 300) { const yy = worldY(d); if (yy < sea + 30 || yy < -60 || yy > h + 60) continue; const left = (d / 300 | 0) % 2 === 0; lantern.call(this, left ? l.left + l.width * .14 : w - l.rail - l.width * .14 - 30, yy, Math.sin(t * 7 + d)); }
  if (this.cameraDepth > 3200) {
    const floorY = worldY(7000); c.fillStyle = '#120d18'; c.beginPath(); c.moveTo(0, floorY);
    for (let x = 0; x <= w + 20; x += 12) c.lineTo(x, floorY + Math.sin(x * .014) * 24 + Math.sin(x * .045) * 7); c.lineTo(w, h); c.lineTo(0, h); c.fill();
    c.fillStyle = '#ffd84a'; for (let i = 0; i < 30; i++) c.fillRect(seed(i + 700) * w, floorY + 20 + seed(i + 800) * 80, 4, 2);
  }
}

function rubble(x, y, landed) {
  const c = this.ctx, t = this.time;
  for (let i = 0; i < (landed ? 20 : 16); i++) { const yy = y - 90 + ((seed(i + 62) * 180 + t * (landed ? 30 : 60)) % 180), xx = x + Math.sin(i * 3) * 34 + (seed(i) - .5) * 20; c.fillStyle = i % 4 ? '#8a7a6a' : '#5a4c44'; c.fillRect(xx, yy, 3, 3); }
}
function effect(l) {
  const c = this.ctx, t = this.time, p = this.fx.progress, x = l.center, landed = this.phase === 'landed', y = l.height / 2 - 60, tier = this.fx.tier,
    scatter = landed ? clamp((performance.now() - (this.goldLandAt || performance.now()) - 1000) / 1500, 0, 1) : 0;
  if (tier === 'og') { const g = c.createRadialGradient(x, y, 66, x, y, 330); g.addColorStop(0, '#05030a00'); g.addColorStop(.55, '#05030ab8'); g.addColorStop(1, '#05030af5'); c.fillStyle = g; c.fillRect(0, 0, this.w, this.h); }
  if (tier === 'degen') for (let i = 0; i < 14; i++) { const a = i * .45 + t * 1.6, r = 40 + seed(i) * 70, xx = x + Math.cos(a) * r, yy = y + Math.sin(a) * r * .6, s = 2 + (i % 3); c.fillStyle = i % 2 ? '#9ff4ff' : '#ffffff'; c.fillRect(xx - s, yy, s * 2 + 1, 1); c.fillRect(xx, yy - s, 1, s * 2 + 1); }
  if (tier === 'midcurve' && this.sprites.pyrite?.complete) for (let i = 0; i < 9; i++) { const dir = i % 2 ? 1 : -1, pr = clamp(p * 2 - i * .08, 0, 1), xx = mix(dir > 0 ? -70 : this.w + 70, dir > 0 ? this.w + 70 : -70, pr), yy = l.height * .42 + (seed(i + 8) - .5) * 240; c.save(); c.translate(xx, yy); c.rotate(t * 3 * dir + i); c.drawImage(this.sprites.pyrite, -22, -22, 44, 44); c.restore(); }
  if (!landed) { const glow = c.createRadialGradient(x, y - 32, 6, x, y - 32, 80); glow.addColorStop(0, '#ffb34724'); glow.addColorStop(1, '#ffb34700'); c.fillStyle = glow; c.fillRect(x - 80, y - 112, 160, 160); }
  if (tier === 'holder' && this.sprites.copper?.complete) for (const [dx, dy] of [[-64, -26], [-88, 10], [64, -18], [88, 18], [-40, 34], [44, 38]]) { c.save(); c.translate(x + dx, y + dy + Math.sin(t * 4 + dx) * 5); c.drawImage(this.sprites.copper, -15, -15, 30, 30); c.restore(); }
  if (tier === 'satoshi') {
    // Treasure-found sunburst: soft rotating rays and glow behind the text, sparkles, orbiting coins.
    const fade = Math.max(0, 1 - scatter), R = Math.min(this.w, 520) * .55;
    c.save(); c.translate(x, y); c.rotate(t * .15); c.globalAlpha = .55 * fade;
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; c.fillStyle = i % 2 ? '#ffd84a14' : '#ffd84a26'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, a, a + Math.PI / 14); c.closePath(); c.fill(); }
    c.restore();
    const glow = c.createRadialGradient(x, y, 8, x, y, R * .7); glow.addColorStop(0, `rgba(255,216,74,${.35 * fade})`); glow.addColorStop(1, 'rgba(255,216,74,0)');
    c.fillStyle = glow; c.fillRect(x - R, y - R, R * 2, R * 2);
    for (let i = 0; i < 10; i++) { const a = i * 2.39 + t * .4, r = R * (.35 + seed(i + 40) * .5), sx = x + Math.cos(a) * r, sy = y + Math.sin(a) * r * .7, s = 2 + Math.round(2 * (.5 + .5 * Math.sin(t * 5 + i))); c.globalAlpha = fade * .9; c.fillStyle = '#fff6c8'; c.fillRect(sx - s, sy, s * 2 + 1, 1); c.fillRect(sx, sy - s, 1, s * 2 + 1); }
    c.globalAlpha = 1;
    const coin = this.sprites.goldcoin;
    if (coin?.complete) for (let i = 0; i < 12; i++) { const a = t * .9 * (i % 2 ? 1 : -1) + i * 2.4, r = (60 + seed(i) * 50) * (landed ? .8 : 1) * (1 + scatter * 6), size = 16 + seed(i + 3) * 10; c.save(); c.globalAlpha = Math.max(0, .95 - scatter * 1.15); c.drawImage(coin, Math.round(x + Math.cos(a) * r * 1.3 - size / 2), Math.round(y + Math.sin(a) * r * .55 - size / 2), size, size); c.restore(); }
  }
  rubble.call(this, x, y, landed);
}
function foreground({ w, h, t, sea }) {
  const c = this.ctx;
  for (let i = 0; i < (this.lowPower ? 4 : 14); i++) { const x = seed(i + 741) * w + Math.sin(t * .4 + i) * 6, yy = ((t * 22 + seed(i + 94) * h) % h); if (yy > sea) { c.fillStyle = `rgba(190,170,150,${.25 + .2 * seed(i)})`; c.fillRect(x, yy, 2, 2); } }
}
function typeParticle(x, y) { return { x: x + (Math.random() - .5) * 8, y: y + Math.random() * 6, vx: (Math.random() - .5) * 60, vy: -60 - Math.random() * 40, life: 1, color: Math.random() > .5 ? '#ffb347' : '#ffe08a' }; }
function particle(p) { this.ctx.fillStyle = p.color; this.ctx.fillRect(p.x, p.y, 3, 3); }

export default {
  id: 'mine',
  tiers: {
    normie: { name: 'Normie', emoji: '🪨', color: '#a8a4a0', blurb: 'The answer everyone blurts out.', sprite: 'pebble' },
    midcurve: { name: 'Midcurve', emoji: '🤡', color: '#ff9f43', blurb: 'Thought it was galaxy-brained. So did everyone.', sprite: 'pyrite' },
    holder: { name: 'Holder', emoji: '⛏️', color: '#e0874f', blurb: 'Solid pick.', sprite: 'copper' },
    degen: { name: 'Degen', emoji: '💎', color: '#5ce1ff', blurb: 'Uncommon. Diamond hands.', sprite: 'diamond' },
    og: { name: 'OG', emoji: '🦴', color: '#c46bff', blurb: 'Few remember. You do.', sprite: 'fossil' },
    satoshi: { name: 'Satoshi-tier', emoji: '🪙', color: '#ffd84a', blurb: 'The designated gem. Bedrock gold.', sprite: 'goldcoin' },
  },
  bands: {
    normie: { name: 'Normie', text: 'Barely broke ground.' },
    holder: { name: 'Holder', text: 'Steady digging.' },
    degen: { name: 'Degen', text: 'Deep in the strata.' },
    og: { name: 'OG', text: 'Down where the fossils are.' },
    satoshi: { name: 'Satoshi-tier', text: 'Struck bedrock gold.' },
  },
  copy: {
    tagline: 'THE DAILY DIG',
    subline: '7 prompts · 25 seconds each · rarer answers dig deeper',
    canvasLabel: 'Animated pixel mine shaft, depth increases downward',
    startLabel: 'SURFACE',
    mascotLabel: 'Poke your mining buddy',
    mascotSay: 'clink!',
    hint: '▼ rarer answers dig deeper ▼',
    howToRare: 'rare answers score big. obvious ones barely scratch the dirt.',
    howToDepth: 'every point digs you 10 metres. 700 is bedrock.',
    howToDaily: 'one daily dig. practice whenever you like.',
    startButton: '▼ START DIGGING ▼',
    runNoun: 'Dig',
    submitButton: 'DIG',
    previewCountdown: 'digging in · the clock starts in',
    nextButton: 'DIG ▼',
    finishButton: 'CLIMB OUT ▲',
    sinkVerb: 'dig',
    missQuip: 'not on-chain. not in the ground.',
    menuRule: 'DIG IN',
    menuDaily: '↓ Daily dig',
    menuPractice: '∞ Practice dig',
    logbookButton: 'My digs →',
    buddyTitle: 'Mining buddy',
    logbookEyebrow: 'YOUR MINER’S LOGBOOK',
    logbookNote: 'Daily digs extend streaks. Practice digs don’t.',
    logbookEmpty: 'Your next dig starts your logbook.',
    logbookCount: 'Daily digs',
    distributionLoading: 'Surveying the shaft…',
    chartRule: 'DIG LOG · DEEPER = RARER',
    bandsRule: 'THE STRATA',
    keepGoing: 'KEEP DIGGING ∞',
    reviewRule: 'THE HAUL · TAP A ROUND FOR EVERY ANSWER',
    practiceNote: 'Practice dig · your daily score stays unchanged.',
    needMore: 'YOUR SCORE · MORE DAILY DIGS NEEDED FOR COMPARISON',
    playersNoun: 'MINERS',
    rateLabel: 'how was that dig? 1 = ngmi · 5 = wagmi',
    nextReset: 'next dig in',
    reject: '“{answer}”: not found on-chain. try again',
    shareIcon: '⛏️',
  },
  sprites: {
    mascot: 'miner',
    mascotGold: 'miner-gold',
    buddies: [
      { id: 'miner', name: 'The Miner', sprite: 'miner', streak: 0, poke: 'roll' },
      { id: 'canary', name: 'Canary', sprite: 'canary', streak: 5, poke: 'dart' },
      { id: 'cart', name: 'Mine Cart', sprite: 'cart', streak: 14, poke: 'jet' },
      { id: 'mole', name: 'Mole', sprite: 'mole', streak: 30, poke: 'chomp' },
      { id: 'laser', name: 'Laser-Eyes Miner', sprite: 'miner-laser', streak: 45, poke: 'roll' },
    ],
    scene: ['goldcoin', 'pyrite', 'copper'],
  },
  palette: { ink: '#0b0910', ruler: '#b8a99a', marker: '#ff8a3d', gold: '#ffd84a', burst: '#ffb347' },
  landmarks: [[60, 'topsoil · normies dig here', 'L'], [200, 'Jan 3, 2009 · the genesis block', 'R'], [332, '10,000 BTC for two pizzas (2010)', 'R'], [385, 'Mt. Gox collapses (2014)', 'L'], [535, 'Ethereum mainnet launches (2015)', 'R'], [660, 'The DAO hack (2016)', 'L'], [800, 'ICO mania (2017)', 'R'], [1040, 'CRYPTO WINTER', 'L'], [1240, 'DeFi summer (2020)', 'R'], [1550, 'NFT mania (2021)', 'L'], [1850, 'Terra/LUNA collapses (May 2022)', 'R'], [2150, 'the Merge: Ethereum goes proof-of-stake (2022)', 'L'], [2500, 'FTX collapses (Nov 2022)', 'R'], [3000, 'THE DEGEN ZONE', 'L'], [3800, 'spot bitcoin ETFs approved (Jan 2024)', 'R'], [4400, 'a halving every 210,000 blocks', 'L'], [4900, 'lost keys rest down here', 'R'], [5500, 'Satoshi’s coins: still unmoved', 'L'], [6000, 'THE OG ZONE', 'R'], [6500, '21 million. no more.', 'L'], [7000, 'bedrock — a perfect dig ends here', 'R']],
  // The miner stands on the surface beside the headframe, clear of the intro buttons.
  layout: { intro: (l, w, sea) => ({ x: w * .25 + Math.max(58, w * .07), y: sea - 30 }) },
  Scenery: Minescape,
  paint: { backdrop, effect, foreground, typeParticle, particle },
  sounds: {
    submit: [{ from: 2400, to: 1800, duration: .08, volume: .12, type: 'square', lowpass: 5000 }, { noise: true, duration: .06, lowpass: 8000, highpass: 2000, volume: .08 }],
    sink: [{ noise: true, duration: 1.4, lowpass: 320, sweep: 120, volume: .2 }, { from: 70, to: 40, duration: 1.3, volume: .18 }],
    satoshi: [{ from: 60, to: 40, duration: 1, volume: .3 }, ...[1568, 2093, 2637, 3136].map((from, i) => ({ from, duration: .5, volume: .12, type: 'triangle', lowpass: 6000, delay: i * .1 }))],
    poke: [{ from: 2600, to: 2000, duration: .06, volume: .12, type: 'square', lowpass: 6000 }, { from: 1300, duration: .12, volume: .06, type: 'triangle', delay: .05 }],
  },
};
