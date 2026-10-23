// Shared result rendering; tier names, colours and sprites come from the active theme.
let theme=null;
export const useTheme = value => { theme = value; };
export const DROP_MS = { normie: 3400, midcurve: 3000, holder: 3000, degen: 3400, og: 4300, satoshi: 4600, miss: 900 };
export const easeInOut = t => t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
export const easeOut = t => 1 - (1 - t) ** 3;
export const iconFor = tier => theme?.tiers[tier]?.sprite;
export const tierImage = (tier, cls = '') => tier ? `<img class="${cls}" src="/assets/${iconFor(tier)}.svg" alt="" width="24" height="24">` : '<span class="miss-icon">⬛</span>';
const logDepth={normie:8,midcurve:18,holder:36,degen:60,og:82,satoshi:97};
export function diveChart(results, escape) {
  return `<div class="dive-chart" role="img" aria-label="Seven answer scores, zero at the surface and 100 at the deepest point">${[0,25,50,75,100].map(n=>`<div class="chart-grid" style="top:${n}%"><span>${n===0?'0m':'−'+n}</span></div>`).join('')}<div class="dive-columns">${results.map((r,i)=>`<div class="dive-column" title="Round ${i+1}: ${escape(r.answer||'miss')}, ${r.score} points" style="--drop:${logDepth[r.tier]??3}%;--delay:${i*90}ms;--dot-color:${theme?.tiers[r.tier]?.color||'#43556b'}"><div class="dive-stem"></div><div class="dive-dot">${tierImage(r.tier)}</div><span>${i+1}</span></div>`).join('')}</div></div>`;
}
// Smoothed density derives solely from this site's own completed daily games.
export function distributionChart(dist, score, population) {
  const pal=theme?.palette||{burst:'${pal.burst}',marker:'${pal.marker}',ruler:'${pal.ruler}'};
  const bins = dist?.length ? dist : Array(71).fill(0), width = 560, top = 18, baseline = 140;
  const smoothed = bins.map((_, i) => bins.reduce((s, n, j) => s + n * Math.exp(-.5 * ((i-j)/2.2) ** 2), 0));
  const max = Math.max(1, ...smoothed), points = smoothed.map((n,i)=>[i*width/(bins.length-1),baseline-n/max*(baseline-top)]);
  const path = points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' '), x=score/700*width;
  const index=Math.min(points.length-1,Math.max(0,Math.round(score/700*(points.length-1)))), y=points[index][1];
  return `<svg viewBox="0 0 560 174" role="img" aria-label="${population?`Score distribution from ${population} daily players`:'Your score on a zero to 700 axis; population comparison is not available'}"><path d="${path} L560,140 L0,140 Z" fill="${pal.burst}25"/><path d="${path}" fill="none" stroke="${pal.burst}" stroke-width="2.4"/><path d="M0 140H560" stroke="${pal.ruler}55"/>${Array.from({length:8},(_,i)=>`<path d="M${i*80} 140v6" stroke="${pal.ruler}55"/><text x="${i*80}" y="161" text-anchor="middle" fill="${pal.ruler}" font-size="12">${i*100}</text>`).join('')}<path d="M${x} 140V${y}" stroke="${pal.marker}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="4" fill="${pal.marker}"/><text x="${Math.max(12,Math.min(548,x))}" y="173" text-anchor="middle" fill="${pal.marker}" font-size="12" letter-spacing="2">YOU</text></svg>`;
}

// 1200x675 share image (X's preferred 16:9) drawn on a canvas from the day's results.
const loadImage = src => new Promise(resolve => { const i = new Image(); i.onload = () => resolve(i); i.onerror = () => resolve(null); i.src = src; });
export async function shareCard({ siteName, dayNumber, score, results, band, host, practice, mascot }) {
  const W = 1200, H = 675, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  try { await document.fonts.load('64px VT323'); } catch { /* falls back to monospace */ }
  const pal = theme.palette, font = px => `${px}px VT323, ui-monospace, monospace`;
  const sky = g.createLinearGradient(0, 0, 0, 430); pal.cardSky.forEach((col, i, a) => sky.addColorStop(i / (a.length - 1), col));
  g.fillStyle = sky; g.fillRect(0, 0, W, 430);
  for (let i = 0; i < 70; i++) { const x = (i * 397) % W, y = (i * 131) % 300; g.fillStyle = `rgba(255,240,220,${.15 + (i % 5) * .08})`; g.fillRect(x, y, 3, 3); }
  g.fillStyle = pal.cardHills; g.beginPath(); g.moveTo(0, 430); for (let x = 0; x <= W + 20; x += 20) g.lineTo(x, 392 - Math.sin(x * .006) * 26 - Math.sin(x * .021) * 9); g.lineTo(W, 430); g.fill();
  const ground = g.createLinearGradient(0, 430, 0, H); pal.cardGround.forEach((col, i, a) => ground.addColorStop(i / (a.length - 1), col));
  g.fillStyle = ground; g.fillRect(0, 430, W, H - 430);
  for (let i = 0; i < 160; i++) { g.fillStyle = i % 9 ? 'rgba(0,0,0,.18)' : pal.gold + '66'; g.fillRect((i * 173) % W, 440 + (i * 89) % (H - 450), 6, 6); }
  g.fillStyle = pal.cardGrass; g.fillRect(0, 428, W, 6);
  // Title and day.
  g.textBaseline = 'alphabetic'; g.font = font(78);
  g.fillStyle = pal.burst; g.fillText(siteName.toUpperCase(), 63, 103); g.fillStyle = pal.gold; g.fillText(siteName.toUpperCase(), 60, 100);
  g.font = font(34); g.fillStyle = '#f3e9dc'; g.fillText(`${practice ? 'PRACTICE · ' : ''}#${dayNumber} · DAILY CRYPTO TRIVIA`, 64, 146);
  // Score.
  const tierColor = theme.tiers[band.tier]?.color || pal.gold;
  g.font = font(230); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillText(String(score), 70, 352); g.fillStyle = tierColor; g.fillText(String(score), 62, 344);
  const sw = g.measureText(String(score)).width;
  g.font = font(64); g.fillStyle = '#f3e9dc'; g.fillText('/700', 80 + sw, 344);
  g.font = font(40); g.fillStyle = '#ffffff'; g.fillText(`DUG ${(score * 10).toLocaleString('en-US')}M · ${band.name.toUpperCase()}`, 66, 400);
  // Mascot.
  const m = await loadImage(`/assets/${mascot}.svg`); if (m) g.drawImage(m, 850, 110, 280, 280);
  // Tier icons for the 7 rounds.
  const size = 104, gap = 34, total = 7 * size + 6 * gap, x0 = (W - total) / 2, y0 = 462;
  const icons = await Promise.all(results.map(r => r.tier ? loadImage(`/assets/${theme.tiers[r.tier].sprite}.svg`) : null));
  for (let i = 0; i < 7; i++) {
    const x = x0 + i * (size + gap), r = results[i];
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x - 6, y0 - 6, size + 12, size + 12);
    if (r?.tier && icons[i]) { g.strokeStyle = theme.tiers[r.tier].color; g.lineWidth = 3; g.strokeRect(x - 6, y0 - 6, size + 12, size + 12); g.drawImage(icons[i], x, y0, size, size); }
    else { g.fillStyle = '#4a4450'; g.font = font(70); g.textAlign = 'center'; g.fillText('—', x + size / 2, y0 + 76); g.textAlign = 'left'; }
  }
  g.font = font(36); g.fillStyle = '#f3e9dc'; g.textAlign = 'center'; g.fillText(`can you dig deeper?  ${host}`, W / 2, 640); g.textAlign = 'left';
  return c;
}
