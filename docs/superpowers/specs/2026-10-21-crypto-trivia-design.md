# Crypto Trivia (working name) — Design

Date: 2026-10-21
Status: ready for approval

## Intent

A daily "rare-answer" trivia game for crypto Twitter, built by forking
[OpenKrillion](https://github.com/VulcanEon/openkrillion.com-service) (MIT) and
re-theming it for crypto. It is a free, just-for-fun side project. The point is
a quick daily ritual whose result screenshot people want to post on CT.

How the game plays (inherited from OpenKrillion): seven prompts a day,
25 seconds each, type one answer per prompt. Correct answers are ranked by how
rarely players give them. Common answers score little, and obscure-but-correct
answers score a lot. Your total score sets how deep you get.

## Goals

- A daily crypto set (same seven prompts for everyone, resets at midnight
  New York time, as OpenKrillion does now) that CT people find fun and post.
- Prompt mix ranges across the space, some serious and some unhinged: history,
  chains and protocols, memecoins, collapses and rugs, CT lore and accounts,
  Satoshi, etc. Example prompts: "Name a coin that went to zero", "Name a
  Layer 1 blockchain", "Name a crypto exchange that collapsed", "Name a
  memecoin with a dog in it".
- A share card and share text that look good as a CT post.
- Costs $0 to run (Vercel Hobby plus a free database tier). A domain is
  optional and later.

## Non-goals

- Accounts, logins, wallets, wallet-connect, tokens, NFTs, or anything on-chain.
- Monetization, paid plans, ads.
- Multiplayer or live leaderboards beyond what OpenKrillion already does
  (comparing against the day's other completed runs).
- AI generating prompts at runtime.
- The extras built for openkrillion.com specifically: the 1,500-word SEO guide,
  AI-provider "ask about this" links, `/llms.txt`-style docs, the Chinese
  prompts, GA4/Clarity/Plausible/Bing/GSC setup, and the reference-sync
  pipeline to krillion.io. Remove these, don't port them.

## Anti-goals (failure even if it works)

- Looks like an obvious Krillion clone with a coin pasted on.
- Rejects correct answers players obviously know are right. CT will dunk on
  this. Answer lists must be generous, and aliases/tickers must work.
- Reads as financial content, shilling, or endorsing any coin. The tone is
  trivia and lore, not "buy this".
- Ongoing cost or upkeep that makes a fun project a chore.

## Decisions

### Made by the owner
- **Audience:** crypto Twitter, playing for fun.
- **Prompt tone:** a range, from serious to unhinged.
- **Fork OpenKrillion** rather than build from scratch.
- **Host on Vercel.**
- **Free project.** Keep running costs at zero.
- **Code public, answer bank private.**
- **Theme fallback:** try a crypto theme. If it looks bad, revert to the
  original OpenKrillion sea theme. So the art must be swappable (see below).

### Made by Claude (owner said "whichever you think is best" or didn't object)
- **Content source:** a hand-written bank of about 90 days of prompts, kept in
  a private repo (see Content). Each prompt has a list of accepted answers, each answer with
  aliases (tickers, nicknames, common misspellings) and a starting tier.
- **Rankings adapt after launch:** starting tiers are Claude's estimates. Once
  enough players have answered a prompt, tiers are recomputed from how often
  each answer was actually given (see Re-tiering).
- **Theme: a mine shaft.** A miner digs down instead of a diver sinking.
  Common answers barely scratch the surface; rare ones dig deep toward a gold
  vein / bedrock. This maps directly onto OpenKrillion's camera-descent
  mechanic, so gameplay code shouldn't need to change.
- **Database: Turso (libSQL, SQLite-compatible, free tier, available in the
  Vercel Marketplace).** Chosen because OpenKrillion's schema and queries are
  written for Cloudflare D1, which is SQLite, so they port with minimal change.
  (Neon/Postgres was mentioned in chat as an option; Turso is the simpler port.)
- **Drop R2.** The puzzle bank lives in the repo, and static assets are served
  by Vercel. Nothing needs object storage.
- **Keep:** server-owned timing and scoring, the cookie-based player identity
  (no login), daily + practice modes, pause, answer correction/rejection,
  results, answer review, sharing, settings, the browser logbook, and the
  synthesized audio (retuned toward pickaxe/mining sounds).

## Constraints

- Node 24+, existing vanilla-JS code style (no framework added).
- Vercel Hobby plan limits: serverless functions, no long-running processes.
  Use Vercel Cron (free tier allows daily jobs) for any daily task.
- MIT license and attribution to OpenKrillion must be kept. Remove all
  openkrillion.com and krillion.io branding, URLs, analytics IDs, and copy.
- Keep the game independent of krillion.io. No calls to it.

## How it changes from OpenKrillion

### 1. Hosting port (Cloudflare Worker → Vercel)
- `src/worker.mjs` handles routing with web-standard Request/Response. Wrap it
  as a Vercel function (catch-all route) and serve `public/` as Vercel static
  files.
- Replace `env.DB` (D1) with a small adapter over `@libsql/client` that keeps
  the `prepare().bind().first()/all()/run()` and `batch()` shapes, so query
  code changes as little as possible.
- Migrations (`migrations/*.sql`) run against Turso with a small npm script.
- Local dev runs against a local SQLite file via libSQL, with no cloud account
  needed, same as OpenKrillion's promise today.
- Remove Wrangler config and the R2 `/media/` route.

### 2. Content
- **The code repo is public; the answer bank is not (owner's call).** Anyone
  reading GitHub must not be able to see upcoming prompts or answers.
  - The real bank lives in a separate **private** repo (Claude's call:
    `crypto-trivia-bank`, checked out next to the code at
    `~/Claude Projects/crypto-trivia-bank/`). It holds the dated day files.
  - A seed script in the public repo (`npm run seed -- <path-to-bank>`)
    loads the bank into the production database's existing `puzzles` table.
    The app reads puzzles only from the database at runtime, so the deployed
    build never contains the bank.
  - The public repo keeps a small, clearly labeled sample bank (like
    OpenKrillion's `src/demo.mjs`, crypto-themed) so `npm run dev` works for
    anyone with no access to the private repo.
  - `.gitignore` blocks a copied-in bank folder by accident, and the README
    explains the split.
  - The API must never send future days' prompts, and must keep answers
    hidden until the player's daily run is complete (OpenKrillion already does
    the second; keep it and add a test for both).
- Replace `src/demo.mjs` and the reference-sync path with this dated bank, e.g.
  one JSON file per day (`days/NNN.json`), where day N maps to a calendar date
  from a fixed launch date. When the bank runs out, loop or show a
  "new season soon" state (builder's call; see open items).
- Each prompt: text, category tag, answer list. Each answer: canonical name,
  aliases, tier. Exactly one answer per prompt is the designated "gem" (the
  top tier, OpenKrillion's "One in a Krillion" equivalent).
- Answer lists should be broad. For open categories ("Name a Layer 1") that
  means dozens of answers, not six. Matching keeps OpenKrillion's normalize +
  edit-distance rules. Tickers ("ETH", "$DOGE") are aliases. The `$` prefix is
  stripped.
- Log rejected answers (already stored as `raw_answer` with score 0) so missing
  valid answers can be found and added.
- Avoid prompts that need live data ("Name a coin in the top 10 today") since
  the answers would go stale.

### 3. Re-tiering from real play
- A daily cron (or computed lazily on first request after a day ends) looks at
  completed daily runs for past days. For any prompt with at least ~50 answers,
  it reassigns tiers by share of players who gave that answer, using fixed
  share cut-offs. Common answers drop to the lowest tier and rare correct
  answers rise.
- The designated gem stays fixed. Answers no one gave keep their starting tier.
- Re-tiering matters mainly for reruns and for the "too clever" tier (an
  obscure answer that lots of people think of). Today's scoring uses the
  tiers as they were at the start of the day, so scores don't shift mid-day.
- **Midcurve rule (Claude's call):** share of players alone can't tell
  "obvious" from "seemed clever but everyone thought of it", so the starting
  tier is the second input. An answer that started at Degen or higher but
  turned out common becomes Midcurve (15). An answer that started low and is
  common stays Normie (10).

### 4. Theme and art (swappable)
- OpenKrillion's art lives mostly in `public/ocean.mjs`, `public/seascape.mjs`,
  `scripts/pixel-art.mjs`, `public/assets/*.svg`, and CSS colors. Gather
  theme-specific pieces (scenery layers, sprites, tier names/emoji/colors,
  copy strings, sounds) behind one theme module, so switching between
  `mine` and `sea` is a single config change.
- Mine theme: surface/dirt → rock strata → deep cave → gold/bedrock as depth
  bands, a pixel miner sprite with pickaxe, falling rubble and sparkle effects
  instead of bubbles, gold-vein reveal for the top tier.
- Tier renames, crypto-flavored (Claude's draft, easy to change):
  Normie (10) · Midcurve (15, the "too clever" tier) · Holder (30) ·
  Degen (60) · OG (85) · Satoshi-tier (100, the gem).
  Depth shown in meters below the surface. Score bands renamed to match.
- **Checkpoint:** build the mine look first and show the owner screenshots of
  the home screen, a mid-dig round, and the results/share card before porting
  anything else visual. If they don't like it, keep the sea theme and move on.

### 5. Branding and share
- Name and domain are TBD. Use a single `SITE` config value (already
  `src/config.mjs`) so renaming later is one edit.
- Share text keeps the emoji-row format with crypto tier emoji and the site URL.
- Replace the OG image with a mine-themed one.
- **"Share card" means (Claude's call):** a results screen designed to be
  screenshotted, plus the copy-text share and one fixed mine-themed OG image.
  No per-result generated images in v1. A "save as image" button can come
  later if people want it.

### 6. Practice mode (Claude's call)
- Practice is locked until that day's daily is finished, then replays today's
  prompts, as OpenKrillion does now. This stops players from reading the
  answers in practice and then acing the daily, and it needs no extra content.
  The answer sheet also opens only after the daily is done.

### 7. Deploying
- Claude builds and verifies everything locally. For the live deploy, the
  owner logs in to Vercel and Turso on their machine (CLI or dashboard), and
  Claude does the rest from there: create the DB, set env vars, deploy, and
  check the cron. If that isn't possible, the fallback is a short
  step-by-step deploy runbook in the README.

## What's left to the builder
- Exact file layout for the content bank and the Vercel function entry.
- Re-tiering share cut-offs and the minimum-answers threshold.
- What happens after day 90 (loop from day 1 vs. a "season over" screen).
  Default to looping.
- Sound retuning details.
- Which OpenKrillion audit scripts to keep. Keep `npm test` and the browser
  flow audit, and drop the reference-sync, SEO, and art-fidelity checks that
  only made sense for openkrillion.com.
- Writing the 90 days of content. Each answer list should be checked for
  accuracy (no wrong "correct" answers). Spread categories so the same
  category doesn't repeat on consecutive days.

## Done looks like
- `npm run dev` runs locally with no cloud account. A full seven-round daily
  run and a practice run work on desktop and mobile.
- Deployed to a Vercel URL on the free plan with Turso connected, a working
  daily reset, and the cron running.
- 90 days of crypto prompts in the private bank repo, seeded into production.
  The public repo contains no real prompts or answers.
- Mine theme (or sea fallback, if the owner rejects it) with a good-looking
  share card.
