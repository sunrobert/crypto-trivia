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

// Counts daily answers per prompt id across every served date before `today`, then
// re-ranks the bank. Served snapshots stay as they were, so past answer sheets match scores.
export async function runRetier(db, today) {
  const served = (await db.prepare("SELECT date, content FROM puzzles WHERE date < ? AND source IN ('bank','rerun')").bind(today).all()).results;
  const counts = new Map(), respondents = new Map();
  for (const { date, content } of served) {
    const puzzle = JSON.parse(content);
    const played = (await db.prepare("SELECT a.round, a.answer FROM answers a JOIN runs r ON r.id = a.run_id WHERE r.date = ? AND r.mode = 'daily'").bind(date).all()).results;
    for (const { round, answer } of played) {
      const id = puzzle.prompts[round]?.id; if (!id) continue;
      respondents.set(id, (respondents.get(id) || 0) + 1);
      if (answer) { const c = counts.get(id) || {}; c[answer] = (c[answer] || 0) + 1; counts.set(id, c); }
    }
  }
  let prompts = 0, updated = 0;
  for (const { day, content } of (await db.prepare('SELECT day, content FROM bank ORDER BY day').all()).results) {
    const bankDay = JSON.parse(content);
    const next = { ...bankDay, prompts: bankDay.prompts.map(p => { prompts++; return { ...p, answers: retierPrompt(p.answers, counts.get(p.id) || {}, respondents.get(p.id) || 0) }; }) };
    const json = JSON.stringify(next);
    if (json !== content) { await db.prepare('UPDATE bank SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE day = ?').bind(json, day).run(); updated++; }
  }
  return { prompts, updated };
}
