// Builds a valid bank day whose answers are unique per prefix, e.g. makeDay(1,'a') → gem 'a1p0gem'.
const CATS = ['history', 'chains', 'defi', 'memecoins', 'collapses', 'people', 'nfts'];
export function makeDay(day, prefix) {
  return { day, prompts: Array.from({ length: 7 }, (_, k) => ({
    id: `${prefix}${day}p${k}`, text: `${prefix} day ${day} prompt ${k}`, category: CATS[k],
    answers: [
      { answer: `${prefix}${day}p${k}gem`, tier: 'satoshi' },
      ...['normie', 'normie', 'midcurve', 'holder', 'holder', 'degen', 'og'].map((tier, i) => ({ answer: `${prefix}${day}p${k}x${i}`, tier })),
    ],
  })) };
}
export const addDays = (date, n) => { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
