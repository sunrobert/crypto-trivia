// Tier keys are stored in the database and the puzzle bank; display names live in themes.
export const TIER_KEYS = ['normie', 'midcurve', 'holder', 'degen', 'og', 'satoshi'];
export const TIER_SCORES = { normie: 10, midcurve: 15, holder: 30, degen: 60, og: 85, satoshi: 100 };
export const BANDS = [
  { min: 0, max: 150, tier: 'normie' },
  { min: 151, max: 250, tier: 'holder' },
  { min: 251, max: 350, tier: 'degen' },
  { min: 351, max: 449, tier: 'og' },
  { min: 450, max: 700, tier: 'satoshi' },
];
export const ROUND_MS = 25000;
export const PREVIEW_MS = 3000;
export const ROUNDS = 7;
export const bandFor = score => [...BANDS].reverse().find(b => score >= b.min) || BANDS[0];
export const normalize = value => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
export function etDate(now = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
}
export function resetAt(date) {
  const next = new Date(date + 'T12:00:00Z'); next.setUTCDate(next.getUTCDate() + 1);
  const day = next.toISOString().slice(0, 10);
  const probe = new Date(day + 'T04:00:00Z');
  return etDate(probe) === day ? probe.getTime() : Date.parse(day + 'T05:00:00Z');
}
export function distance(a, b, limit = Infinity) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (Math.min(...next) > limit) return limit + 1;
    row = next;
  }
  return row[b.length];
}
export function matchAnswer(input, answers) {
  const key = normalize(input);
  if (!key || key.length > 256) return null;
  const entries = answers.flatMap(a => [a.answer, ...(a.aliases || [])].map(word => ({ a, key: normalize(word) })));
  // An exact hit on the answer or any alias (tickers like "$DOGE") is accepted without a confirmation step.
  const exact = entries.find(e => e.key === key);
  if (exact) return { ...exact.a, correction: false };
  const allowance = key.length < 4 ? 0 : key.length < 8 ? 1 : 2;
  const candidates = entries.map(e => ({ ...e, d: distance(key, e.key, allowance) })).filter(e => e.d <= allowance).sort((a, b) => a.d - b.d);
  if (candidates.length && (!candidates[1] || candidates[0].d < candidates[1].d || candidates[0].a.answer === candidates[1].a.answer)) return { ...candidates[0].a, correction: true };
  return null;
}
export function shareText(day, results, theme, site) {
  const score = results.reduce((s, r) => s + r.score, 0);
  const depth = (score * 10).toLocaleString('en-US');
  const band = theme.bands[bandFor(score).tier].name;
  return `${site.name} #${day} ${theme.copy.shareIcon}\n${score}/700 · ${depth}m · ${band}\n${results.map(r => theme.tiers[r.tier]?.emoji || '⬛').join('')}\n${site.link}`;
}
// Compact, URL-safe summary of a finished game, e.g. "1-hhhdxhs" (day 1, seven tiers, x = miss, trailing p = practice).
const CODE = { normie: 'n', midcurve: 'm', holder: 'h', degen: 'd', og: 'o', satoshi: 's' };
const UNCODE = Object.fromEntries(Object.entries(CODE).map(([k, v]) => [v, k]));
export const shareCode = (day, results, practice) => `${day}-${results.map(r => CODE[r.tier] || 'x').join('')}${practice ? 'p' : ''}`;
export function parseShareCode(code) {
  const m = /^([1-9]\d{0,3})-([nmhdosx]{7})(p?)$/.exec(String(code));
  if (!m) return null;
  const tiers = [...m[2]].map(c => UNCODE[c] || null);
  return { day: Number(m[1]), tiers, practice: m[3] === 'p', score: tiers.reduce((s, t) => s + (t ? TIER_SCORES[t] : 0), 0) };
}
// Opens X's composer with the result prefilled; the link in the text brings the preview card.
export const xShareUrl = text => 'https://x.com/intent/post?text=' + encodeURIComponent(text);
