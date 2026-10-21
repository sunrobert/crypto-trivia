// Re-rank answers from real play. Runs nightly; only touches bank rows for days already over,
// so a day's scoring never shifts while people are playing it.
export const RETIER = { minPlayers: 50, commonShare: 0.15, holderShare: 0.05, degenShare: 0.01 };
const CLEVER = ['midcurve', 'degen', 'og'];

export function retierPrompt(answers, counts, respondents) {
  if (respondents < RETIER.minPlayers) return answers;
  return answers.map(a => {
    const count = counts[a.answer] || 0;
    if (a.tier === 'satoshi' || !count) return a;
    const share = count / respondents, start = a.startTier ?? a.tier;
    const tier = share >= RETIER.commonShare ? (CLEVER.includes(start) ? 'midcurve' : 'normie')
      : share >= RETIER.holderShare ? 'holder' : share >= RETIER.degenShare ? 'degen' : 'og';
    return tier === a.tier ? a : { ...a, tier };
  });
}

export async function runRetier(db, today) {
  const rows = (await db.prepare("SELECT date, source, content FROM puzzles WHERE date < ? AND source IN ('bank','rerun')").bind(today).all()).results.map(r => ({ ...r, puzzle: JSON.parse(r.content) }));
  const counts = new Map(), respondents = new Map();
  for (const { date, puzzle } of rows) {
    const played = (await db.prepare("SELECT a.round, a.answer FROM answers a JOIN runs r ON r.id = a.run_id WHERE r.date = ? AND r.mode = 'daily'").bind(date).all()).results;
    for (const { round, answer } of played) {
      const id = puzzle.prompts[round]?.id; if (!id) continue;
      respondents.set(id, (respondents.get(id) || 0) + 1);
      if (answer) { const c = counts.get(id) || {}; c[answer] = (c[answer] || 0) + 1; counts.set(id, c); }
    }
  }
  let prompts = 0, updated = 0;
  for (const { date, source, puzzle, content } of rows) {
    if (source !== 'bank') continue;
    const next = { ...puzzle, prompts: puzzle.prompts.map(p => { prompts++; return { ...p, answers: retierPrompt(p.answers, counts.get(p.id) || {}, respondents.get(p.id) || 0) }; }) };
    const json = JSON.stringify(next);
    if (json !== content) { await db.prepare('UPDATE puzzles SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE date = ?').bind(json, date).run(); updated++; }
  }
  return { prompts, updated };
}
