# Crypto Trivia Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork OpenKrillion into a daily crypto rare-answer trivia game with a swappable mine-shaft theme, running free on Vercel + Turso, with a 90-day answer bank kept in a private repo.

**Architecture:** Keep OpenKrillion's vanilla-JS client and server-owned game logic. Strip the openkrillion.com-only extras, then pull all theme-specific art/copy/sound behind one theme object (`sea` and `mine`). Swap Cloudflare D1/R2/Worker for a D1-shaped libSQL adapter, a single Vercel function and a local Node dev server. Puzzles come only from the database, seeded from a private bank repo. A daily Vercel cron re-tiers answers from real play.

**Tech Stack:** Node 24, ES modules, `@libsql/client` (Turso), Vercel functions + cron, `node:test`, Playwright (browser audits), `sharp` (build-time PNGs).

**Spec:** `docs/superpowers/specs/2026-10-21-crypto-trivia-design.md`

**Upstream reference:** https://github.com/VulcanEon/openkrillion.com-service (MIT). Line references below are to upstream `main`.

## Global Constraints

- Node.js 24+, vanilla ES modules, no front-end framework, no new runtime deps besides `@libsql/client`.
- Runs at $0: Vercel Hobby + Turso free tier. No paid services, no analytics.
- MIT license and OpenKrillion attribution are kept (LICENSE, README, `/about`). No other "Krillion" / "OpenKrillion" branding, URLs or IDs anywhere a player sees.
- The app never calls krillion.io.
- The public repo never contains real bank prompts or answers. Only the labeled sample bank (`src/sample-bank.mjs`).
- No accounts, wallets, tokens, on-chain anything, or monetization.
- `npm run dev` works on a fresh clone with no cloud account.
- Server owns timing and scoring. Answers stay hidden until the player's daily run is complete. The API never exposes a future day's prompts.
- Tier keys (internal, stored in DB and bank): `normie, midcurve, holder, degen, og, satoshi`. Scores: 10, 15, 30, 60, 85, 100. Max 700. 10 m per point.
- Daily reset at midnight America/New_York (upstream `etDate`/`resetAt`, unchanged).
- Prompts must not depend on live data (prices, rankings "today").

## Review Focus

1. **`$`-prefixed or lowercase tickers** (`$doge`, `eth`). They must be accepted directly as the canonical answer. An exact alias match must not trigger the "did you mean…?" confirmation; only fuzzy typos do. This changes upstream behavior on purpose → test in Task 6.
2. **Two answers in one prompt sharing an alias** (e.g. Terra and Terra Classic both "LUNA"). The bank validator must reject it rather than let the matcher pick one silently → test in Task 6.
3. **A run started before midnight and finished after.** It must keep scoring against its start date's puzzle, with tiers frozen for that date → test in Task 6.
4. **Day 91+ (bank exhausted).** Day 1 must rerun (keeping its re-tiered answers and prompt ids) instead of falling back to sample questions → test in Task 6.
5. **Cron endpoint hit without the secret, or twice.** It must return 404 without the secret and give the same result when run twice → test in Task 7.

---

## File Structure (end state)

```
api/index.mjs                 Vercel function: GET/POST/HEAD → handle()
vercel.json                   build, static output, rewrite, cron
scripts/dev.mjs               local server: static public/ + handle()
scripts/migrate.mjs           apply migrations to TURSO_DATABASE_URL
scripts/seed.mjs              load private bank dir → puzzles table
scripts/validate-bank.mjs     validate a bank dir (used by the bank repo)
scripts/rejections.mjs        top rejected guesses per prompt (find missing answers)
scripts/build.mjs             sprites, favicon, OG image (both themes)
scripts/pixel-art.mjs         sea sprites (upstream)
scripts/pixel-art-mine.mjs    mine sprites (new)
scripts/browser-audit.mjs     desktop flow audit (kept, updated)
scripts/mobile-flow-audit.mjs mobile flow audit (kept, updated)
src/server.mjs                handle(request, env) — was src/worker.mjs
src/db.mjs                    createDb(), migrate()
src/bank.mjs                  validateDay(), daysBetween()
src/puzzles.mjs               puzzleFor() incl. sample / bank / rerun
src/retier.mjs                retierPrompt(), runRetier()
src/sample-bank.mjs           small public crypto sample (replaces demo.mjs)
src/config.mjs                SITE (name, origin, theme, launchDate)
src/html.mjs                  page templates, theme-driven copy
public/rules.mjs              TIER_KEYS, TIER_SCORES, BANDS, matching, shareText
public/themes/index.mjs       THEMES = { sea, mine }
public/themes/sea.mjs         sea theme object
public/themes/seascape.mjs    sea scenery (moved from public/)
public/themes/mine.mjs        mine theme object
public/themes/minescape.mjs   mine scenery
public/scene.mjs              class Scene — was public/ocean.mjs
public/app.mjs, sound.mjs, presentation.mjs, style.css   (theme-driven)
tests/*.test.mjs
```

---

### Task 1: Fork and strip openkrillion.com extras

**Files:**
- Create the git repo in `~/Claude Projects/crypto-trivia/` (folder already holds `docs/superpowers/`).
- Delete: `src/content/guide.mjs`, `src/docs.mjs`, `docs/generated/`, `docs/acceptance.md`, `docs/fidelity-audit.md`, `docs/art-polish.md`, `progress.md`, `scripts/reference-seed.mjs`, `scripts/sync-public.mjs`, `scripts/audit.mjs`, `scripts/audio-audit.mjs`, `scripts/art-audit.mjs`, `public/assets/{chatgpt,claude,perplexity,gemini,grok}.svg`
- Modify: `src/worker.mjs`, `src/html.mjs`, `src/config.mjs`, `public/app.mjs`, `scripts/build.mjs`, `package.json`, `README.md`, `THIRD_PARTY_NOTICES.md`, `LICENSE`, `AGENTS.md`, `.github/workflows/check.yml`
- Test: `tests/game.test.mjs`

**Interfaces:**
- Produces: `SITE` in `src/config.mjs` = `{ name: 'Crypto Trivia', origin, repository, description, title, rounds: 7, previewSeconds: 3, answerSeconds: 25, maxScore: 700, metresPerPoint: 10, theme: 'sea', launchDate: '2026-12-01' }`. `name` and `launchDate` are placeholders, changed at deploy. `origin` comes from `env.SITE_URL` at request time where needed. Player cookie name: `ct_player`.

- [ ] **Step 1: Bring upstream into the folder.** `git init -b main`, `git remote add upstream https://github.com/VulcanEon/openkrillion.com-service.git`, `git fetch upstream`, `git reset upstream/main` then `git checkout -- .` (keeps the untracked `docs/superpowers/`). `npm ci && npm test`. Expected: upstream's 10 tests pass.

- [ ] **Step 2: Write failing tests** in `tests/game.test.mjs`:
  - `test('openkrillion-only routes are gone')`: for each of `/llms.txt`, `/llms-full.txt`, `/pricing.md`, `/models.md`, `/BingSiteAuth.xml`, `/media/assets/og.png` → status 404. `POST /api/admin/sync` → 404.
  - `test('home page has no analytics, AI links, guide or krillion branding')`: `homePage()` output does not match `/plausible|gtag|clarity|chatgpt|perplexity|grok|id="guide"|lang=zh/i`, and does not match `/krillion/i`. `infoPage('/about')` does contain `OpenKrillion` and the upstream repo URL (attribution).
  - Cookie test: `/api/start` sets `ct_player=`.

- [ ] **Step 3: Run** `npm test`. Expected: the new tests FAIL.

- [ ] **Step 4: Strip.** Remove from `src/worker.mjs`: `validateReference`, `syncPuzzle`, the `REFERENCE_SYNC` branch, `/api/admin/sync`, docs routes, `/BingSiteAuth.xml`, `/media/`, the www redirect, `scheduled`. Remove from `src/html.mjs`: guide panel, `agentFooter`, `zh`/`lang`, schema `alternateName`, analytics fields in `runtime-config`, and the noscript guide links. Remove `track`/`loadScript`/analytics from `public/app.mjs`. Remove AI icons, docs generation and the word-count/keyword check from `scripts/build.mjs`. Slim `SITE` to the shape above, and delete `publicConfig`. Rewrite `/about` and `/privacy` short: what the game is, built on OpenKrillion (MIT, link), not affiliated with Krillion, what the cookie stores. Change the HTML `<h1>` and title to use `SITE.name`. Leave game copy as-is (sea) for now. Remove the upstream tests for reference import, docs, AI links and SEO.

- [ ] **Step 5: Tidy the package and docs.** In `package.json`, set name `crypto-trivia`, drop scripts `check`, `test:audio`, `test:art` and the dep `simple-icons`. CI runs `npm ci`, `npm test`, `npm run build`. In `LICENSE`, keep the upstream notice and add a `Copyright (c) 2026 <owner>` line. README: one-paragraph intro, credit to OpenKrillion, "run locally" placeholder (finished in Task 5). Point `AGENTS.md` at this plan and spec.

- [ ] **Step 6: Run** `npm test && npm run build`. Expected: all PASS, and the build has no keyword-density error.

- [ ] **Step 7: Commit** `git add -A && git commit -m "chore: fork OpenKrillion and strip site-specific extras"`.

---

### Task 2: Tier keys and the theme layer (sea theme, no visual change)

**Files:**
- Create: `public/themes/index.mjs`, `public/themes/sea.mjs`. Move `public/seascape.mjs` → `public/themes/seascape.mjs`, and `public/ocean.mjs` → `public/scene.mjs`.
- Modify: `public/rules.mjs`, `public/app.mjs`, `public/presentation.mjs`, `public/sound.mjs`, `public/style.css`, `src/html.mjs`, `src/worker.mjs`, `src/demo.mjs`, `scripts/build.mjs`, `src/config.mjs`
- Test: `tests/theme.test.mjs`, `tests/game.test.mjs`

**Interfaces:**
- Produces in `public/rules.mjs`: `TIER_KEYS = ['normie','midcurve','holder','degen','og','satoshi']`, `TIER_SCORES = {normie:10, midcurve:15, holder:30, degen:60, og:85, satoshi:100}`. `BANDS` keeps upstream min/max and its `tier` uses the new keys (plankton→normie, schooler→holder, rare→degen, deepcut→og, krillion→satoshi), with names moved to the theme. `shareText(dayNumber, results, theme, site: { name, origin }) → string` formatted as `${site.name} #${day} ${theme.copy.shareIcon}\n${score}/700 · ${score*10}m\n${emoji row}\n${site.origin}`. `TIERS` is removed.
- Produces the theme object shape (`public/themes/sea.mjs` default export):
  ```js
  { id, tiers: { [tierKey]: { name, emoji, color, blurb, sprite } },
    bands: { normie|holder|degen|og|satoshi: { name, text } },
    copy: { /* every player-visible themed string, see Step 4 */ },
    sprites: { mascot, mascotGold, buddies: [{ id, name, sprite, streak }] },
    palette: { /* every hard-coded colour from scene.mjs, by role */ },
    particle: 'bubble' | 'rubble',
    Scenery: class { constructor(); draw(ctx, w, h, worldY) },
    sounds: { /* partial SOUND_CUES overrides */ } }
  ```
- Produces `THEMES = { sea }` (mine added in Task 3) in `public/themes/index.mjs`. Also `cuesFor(theme) → SOUND_CUES merged with theme.sounds` in `public/sound.mjs`, and `class Scene(canvas, mascotEl, theme)` in `public/scene.mjs` with the same methods as upstream `Ocean`.
- `SITE.theme` picks the theme. The server puts it in `runtime-config` and on `<body data-theme="…">`, and the client reads `THEMES[config.theme]`.

- [ ] **Step 1: Write failing tests** in `tests/theme.test.mjs`:
  - `test('every theme has the same complete shape')`: for every theme in `THEMES`, `Object.keys(t.tiers)` deep-equals `TIER_KEYS`. Each tier has non-empty `name, emoji, color, blurb, sprite`. `Object.keys(t.bands)` deep-equals `BANDS.map(b=>b.tier)`. `typeof t.Scenery === 'function'`. Key sets of `copy`, `palette`, `sprites` match `THEMES.sea`'s exactly (so a key added to one theme must be added to all).
  - `test('scores are theme-independent')`: `TIER_SCORES` equals the values above, and the sum of 7 × satoshi is 700.
  - `test('share text uses theme emoji and origin')`: for sea, 7 satoshi results → `shareText(3, results, THEMES.sea, {name:'X', origin:'https://x.test'})` starts with `'X #3 '`, ends with `'\nhttps://x.test'`, has `'700/700 · 7000m'`, and the emoji row equals `THEMES.sea.tiers.satoshi.emoji` repeated 7 times. A miss renders `⬛`.
  - `test('sound cues merge theme overrides')`: `cuesFor({sounds:{submit:[{from:1}]}}).submit[0].from === 1`, and the other cues equal `SOUND_CUES`.

- [ ] **Step 2: Run** `node --test tests/theme.test.mjs`. Expected: FAIL (modules missing).

- [ ] **Step 3: Rename tier keys** across `rules.mjs`, `demo.mjs`, `worker.mjs` (`TIERS[x].score` → `TIER_SCORES[x]`), `presentation.mjs` (`DROP_MS`, `iconFor`, `logDepth` keys), `app.mjs`, and the existing tests (`'krillion'` → `'satoshi'`). Make server error strings theme-neutral: "Game not found on this browser.", "Finish today's game before opening the answer sheet.", and so on.

- [ ] **Step 4: Extract the sea theme.** Move into `sea.mjs`, unchanged in value:
  - upstream `TIERS` name/emoji/color/blurb and `BANDS` name/text
  - every hard-coded colour in `ocean.mjs`, into `palette`
  - the sprite names in the `Ocean` constructor and `build.mjs`
  - the buddy list from `app.mjs`
  - every themed player-visible string in `app.mjs`/`html.mjs`, into `copy`: anything mentioning dive, ocean, surface, sink, descend, krill, blub, echo, trench, buddy, wardrobe, logbook, "rarer answers sink deeper". The server's reject message becomes `copy.reject` with `{answer}` placeholder.

  `html.mjs` and `app.mjs` read copy from the selected theme. `Scene` reads palette, particle and Scenery from the theme. `style.css`: move colour custom properties that are themed into a `body[data-theme="sea"]{…}` block.

- [ ] **Step 5: Run** `npm test && npm run build`. Expected: all PASS.

- [ ] **Step 6: Visual no-change check.** Run `npm run db:local && npm run dev` (still Wrangler until Task 5), then `node scripts/browser-audit.mjs http://localhost:3051 output/audit`. Expected: passes with no console errors, and screenshots look the same as before the refactor.

- [ ] **Step 7: Commit** `feat: theme layer and crypto tier keys (sea theme)`.

---

### Task 3: Mine theme, then the look checkpoint

**Files:**
- Create: `public/themes/mine.mjs`, `public/themes/minescape.mjs`, `scripts/pixel-art-mine.mjs`
- Modify: `public/themes/index.mjs`, `scripts/build.mjs`, `public/style.css`, `public/scene.mjs` (rubble particles, gold-vein satoshi effect), `src/config.mjs` (`theme: 'mine'`), `scripts/browser-audit.mjs`, `scripts/mobile-flow-audit.mjs`
- Test: `tests/theme.test.mjs` (now covers mine via `THEMES`), `tests/build.test.mjs`

**Interfaces:**
- Consumes the theme shape from Task 2.
- Produces `THEMES = { sea, mine }`, and `pixel-art-mine.mjs` exports `miner(variant?: 'gold'|'night'|…) → svg string`, `pebble()`, `pyrite()`, `copper()`, `diamond()`, `fossil()`, `goldcoin()` (64 px pixel SVGs, same approach as `pixel-art.mjs`).

Mine content (from spec; copy beyond this is the builder's call, in the same voice):

| key | name | emoji | sprite | blurb |
|---|---|---|---|---|
| normie | Normie | 🪨 | pebble | The answer everyone blurts out. |
| midcurve | Midcurve | 🤡 | pyrite | Thought it was galaxy-brained. So did everyone. |
| holder | Holder | ⛏️ | copper | Solid pick. |
| degen | Degen | 💎 | diamond | Uncommon. Diamond hands. |
| og | OG | 🦴 | fossil | Few remember. You do. |
| satoshi | Satoshi-tier | 🪙 | goldcoin | The designated gem. Bedrock gold. |

Bands use the upstream ranges, with the texts "Barely broke ground." · "Steady digging." · "Deep in the strata." · "Down where the fossils are." · "Struck bedrock gold.". Copy samples: hint `▼ rarer answers dig deeper ▼`, next button `DIG ▼`, mascot says `clink!`, reject `“{answer}”: not found on-chain. try again`, share icon `⛏️`. Scenery bands keep upstream depth ranges (40–470 m, 480–2620 m, 2950–7060 m): topsoil/dirt with roots → layered rock strata → deep cavern with crystals and gold veins. The intro scene shows the miner at a shaft headframe under a sky instead of the boat. `particle: 'rubble'` gives falling grit and sparks. Sounds: pickaxe clink on submit, rumble on sink, coin chime on satoshi.

- [ ] **Step 1: Write failing tests.** In `tests/build.test.mjs`, `test('every sprite a theme references exists after build')`: after `npm run build` (run once in a `before` hook via `execFileSync`), every `tiers[*].sprite`, `sprites.mascot`, `sprites.mascotGold` and `buddies[*].sprite` of every theme exists as `public/assets/<name>.svg`, and `public/assets/og.png` exists. `tests/theme.test.mjs` already iterates `THEMES`, so adding `mine` makes it exercise the shape.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL (no mine theme).
- [ ] **Step 3: Implement** the sprites, `minescape.mjs` (cached 384×688 canvas layers, same `draw` contract as `Seascape`), the `mine.mjs` theme, the `body[data-theme="mine"]` CSS palette, and rubble particles plus a gold-vein reveal in `Scene`. `build.mjs` builds both themes' sprites, plus favicon and OG image from the selected theme's mascot (OG shows the shaft, the miner and `SITE.name`).
- [ ] **Step 4: Results screen fits a screenshot.** In `scripts/mobile-flow-audit.mjs`, add an assertion that at 390×844 the results summary (title, score, depth, emoji row, site name) has a bounding box fully inside the viewport with no scrolling. Style it to pass.
- [ ] **Step 5: Run** `npm test && npm run build`, then both audits against `npm run dev`. Expected: all PASS, with no console errors.
- [ ] **Step 6: Commit** `feat: mine-shaft theme`.
- [ ] **Step 7: CHECKPOINT. Stop and show the owner.** Use the gstack `/browse` skill to screenshot at 390×844 and 1280×800: the home screen, a round mid-dig after a Degen answer, and the results screen. Send them to the owner. **Wait for their answer.** If they reject the look, set `SITE.theme = 'sea'`, commit `chore: use sea theme`, and continue. The mine code stays in the repo.

---

### Task 4: libSQL database adapter

**Files:**
- Create: `src/db.mjs`, `scripts/migrate.mjs`
- Modify: `package.json` (add `@libsql/client`, script `"db:migrate": "node scripts/migrate.mjs"`), `tests/game.test.mjs` (replace the hand-rolled `node:sqlite` fake with `createDb`)
- Test: `tests/db.test.mjs`

**Interfaces:**
- Produces in `src/db.mjs`:
  - `createDb({ url: string, authToken?: string }) → Db`
  - `Db.prepare(sql) → Stmt`; `Stmt.bind(...args) → Stmt`; `Stmt.first() → Promise<object|null>`; `Stmt.all() → Promise<{ results: object[] }>`; `Stmt.run() → Promise<{ success: true, meta: { changes: number } }>`
  - `Db.batch(stmts: Stmt[]) → Promise<unknown[]>` runs atomically, in order, in one write transaction (`client.batch(..., 'write')`).
  - `Db.close()`
  - `migrate(db, dir = 'migrations') → Promise<string[]>` applies `*.sql` files not yet recorded in `_migrations(name TEXT PRIMARY KEY, applied_at INTEGER)`, in filename order, and returns the names it applied.
  - Rows are plain objects keyed by column name, with integers as JS numbers.
- `scripts/migrate.mjs` reads `TURSO_DATABASE_URL` (default `file:.data/local.db`) and `TURSO_AUTH_TOKEN`.

- [ ] **Step 1: Write failing tests** in `tests/db.test.mjs` with `createDb({url:':memory:'})`:
  - `migrate` applies `['0001_initial.sql','0002_pause.sql']` the first time and `[]` the second time.
  - `prepare('INSERT INTO rate_limits(key,window,count) VALUES(?,?,1) ON CONFLICT(key,window) DO UPDATE SET count=count+1 RETURNING count').bind('k',1).first()` returns `{count:1}`, then `{count:2}`.
  - `batch` rollback: a batch of a valid insert plus an insert violating the `answers.score` CHECK rejects, and the valid row is absent afterwards.
  - `first()` on no rows returns `null`, and `all()` returns `{results:[]}`.
- [ ] **Step 2: Run** `node --test tests/db.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** `src/db.mjs` and `scripts/migrate.mjs`, then switch the `service()` helper in `tests/game.test.mjs` to `createDb({url:':memory:'})` + `migrate`.
- [ ] **Step 4: Run** `npm test`. Expected: all PASS, including the upstream gameplay tests on the new adapter.
- [ ] **Step 5: Commit** `feat: libSQL database adapter and migrations`.

---

### Task 5: Vercel function, local dev server, Cloudflare removal

**Files:**
- Rename: `src/worker.mjs` → `src/server.mjs`
- Create: `api/index.mjs`, `vercel.json`, `scripts/dev.mjs`, `.env.example`
- Delete: `wrangler.jsonc`, `.dev.vars.example`, and the `wrangler` dev dependency
- Modify: `package.json` (`"dev": "node scripts/dev.mjs"`), `.gitignore` (`.data/`, `.env*` except `.env.example`, `.vercel/`), `README.md` (run locally), `scripts/*audit.mjs` (default URL)
- Test: `tests/game.test.mjs`, `tests/dev.test.mjs`

**Interfaces:**
- Produces `handle(request: Request, env: { DB: Db, SITE_URL: string, LOCAL_DEVELOPMENT: 'true'|'false', CRON_SECRET?: string }) → Promise<Response>` from `src/server.mjs`, which replaces `worker.fetch`. Unknown non-API paths return 404 (static files are served before `handle` is reached).
- The client IP for rate-limiting is the first entry of `x-forwarded-for`, or `'local'`.
- `api/index.mjs`: builds `env` once at module scope from `process.env` (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SITE_URL`, `CRON_SECRET`, `LOCAL_DEVELOPMENT='false'`). Exports `GET`, `POST` and `HEAD` as `request => handle(request, env)`.
- `vercel.json`:
  ```json
  { "buildCommand": "npm run build", "outputDirectory": "public",
    "rewrites": [{ "source": "/(.*)", "destination": "/api/index" }],
    "crons": [{ "path": "/api/cron/retier", "schedule": "30 5 * * *" }] }
  ```
- `scripts/dev.mjs`: on `PORT` (default 3051), serves files from `public/` (with the content types for `.mjs .js .css .svg .png .woff2 .txt .json`), and otherwise converts to a `Request` and calls `handle`. On start it runs `migrate` on `file:.data/local.db` (or `TURSO_DATABASE_URL`). `LOCAL_DEVELOPMENT='true'`.

- [ ] **Step 1: Write failing tests.**
  - In `tests/game.test.mjs`, point `service()` at `handle` and add `test('rate limit keys use x-forwarded-for')`: 101 POSTs from `x-forwarded-for: 1.1.1.1` → the last one is 429, and a POST from `2.2.2.2` is still 200.
  - In `tests/dev.test.mjs`, spawn `node scripts/dev.mjs` with `PORT=3999` and a temp `TURSO_DATABASE_URL=file:<tmp>/t.db`, then check: `GET /` → 200 HTML containing `SITE.name`, `GET /app.mjs` → 200 `text/javascript`, `GET /api/today` → 200 JSON with 7 prompts, `GET /nope` → 404. Kill the process afterwards.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** everything above, remove Wrangler, and write the README "Run locally" section: `npm ci && npm run build && npm run dev`.
- [ ] **Step 4: Run** `npm test`, then `npm run dev` + `node scripts/browser-audit.mjs http://localhost:3051 output/audit` + the mobile audit. Expected: all PASS.
- [ ] **Step 5: Commit** `feat: run on Vercel functions with a local Node dev server`.

---

### Task 6: Puzzle bank, seeding, practice lock, no-leak guarantees

**Files:**
- Create: `src/bank.mjs`, `src/puzzles.mjs`, `src/sample-bank.mjs`, `scripts/seed.mjs`, `scripts/validate-bank.mjs`, `scripts/rejections.mjs`, `migrations/0003_rejections.sql`
- Delete: `src/demo.mjs`
- Modify: `src/server.mjs`, `.gitignore` (add `days/`, `bank/`, `*-bank/`), `README.md` (public code / private bank split, seeding), `package.json` (`"seed": "node scripts/seed.mjs"`, `"validate-bank": "node scripts/validate-bank.mjs"`)
- Test: `tests/bank.test.mjs`, `tests/game.test.mjs`

**Interfaces:**
- Bank day file (`days/0001.json` in the private repo):
  ```json
  { "day": 1, "prompts": [ { "id": "d001p1", "text": "Name a memecoin with a dog in it",
      "category": "memecoins",
      "answers": [ { "answer": "Dogecoin", "tier": "normie", "aliases": ["DOGE"] } ] } ] }
  ```
  Exactly 7 prompts per day. Prompt `id` is unique across the bank. Categories are `history, chains, defi, memecoins, collapses, people, ct-lore, nfts, exchanges, tech, satoshi, culture`.
- `src/bank.mjs`:
  - `validateDay(day) → day` throws an `Error` naming the prompt id if: there aren't exactly 7 prompts; there's an empty or duplicate id; there's empty text; a category isn't in the list; a tier isn't in `TIER_KEYS`; the number of `satoshi` answers ≠ 1; there are fewer than 8 answers; or two entries (answer or alias) in one prompt share a `normalize()` key.
  - `daysBetween(a: 'YYYY-MM-DD', b) → integer`.
- `src/sample-bank.mjs`: `SAMPLE = { source: 'Sample questions', prompts: [7 crypto prompts] }`. It must pass `validateDay`. Its prompts must not appear in the private bank.
- `scripts/seed.mjs <bankDir> [--force]`: validates every day, then upserts `puzzles(date = SITE.launchDate + (day-1), day_number = day, source = 'bank', content)`. Every answer gets `startTier = tier`. Rows with `date < etDate()` are skipped unless `--force`. Prints the count written and skipped.
- `scripts/validate-bank.mjs <bankDir>`: runs `validateDay` on each file, checks days are numbered 1..N with no gaps, and checks no prompt `text` repeats across the bank (compared with `normalize`). Exits non-zero with every error listed.
- `src/puzzles.mjs`: `puzzleFor(db, date) → Promise<puzzle>`, in this order:
  1. In-memory cache.
  2. An existing `puzzles` row for `date`.
  3. No `source='bank'` rows, or `date < SITE.launchDate` → `SAMPLE`, snapshot as `source='sample'`.
  4. Otherwise rerun: `index = daysBetween(launchDate, date) mod bankCount`, read the bank row at `ORDER BY date LIMIT 1 OFFSET index`, and snapshot it under `date` as `source='rerun'` with `dayNumber = daysBetween+1` and `rerunOf`. Use `INSERT OR IGNORE`, then re-select.

  The snapshot freezes that date's tiers.
- `matchAnswer` in `public/rules.mjs`: `correction` is `true` only for a fuzzy (edit-distance) match. An exact match on the canonical answer or any alias returns `correction: false`. Drop upstream's potato-specific `commonAliases`.
- Rejected guesses are logged so missing valid answers can be found. Add migration `migrations/0003_rejections.sql`: `rejections(date TEXT, prompt_id TEXT, raw TEXT, created_at INTEGER)` with an index on `(prompt_id)`. The server inserts a row whenever `/api/answer` returns `rejected`. `scripts/rejections.mjs [--since YYYY-MM-DD]` prints, per prompt id, the top 20 normalized rejected strings with counts, read from `TURSO_DATABASE_URL` (npm script `"rejections"`).
- Server changes:
  - `/api/health` drops the `storage` field.
  - `POST /api/start {practice:true}` → 403 `{error}` unless this player's daily run for today is `completed`.
  - `GET /api/review` → 403 unless the run is completed **and** the player's daily run for `run.date` is completed.
  - No endpoint accepts a date parameter.

- [ ] **Step 1: Write failing tests** in `tests/bank.test.mjs`:
  - `validateDay` accepts the sample. It rejects (with the prompt id in the message) each of these: 6 prompts, 0 satoshi, 2 satoshi, an unknown tier, 7 answers, and a duplicate alias (`Terra` with alias `LUNA` + `Terra Classic` with alias `luna`).
  - `test('$ and case in tickers match exactly')`: with Dogecoin aliased `DOGE`, each of `matchAnswer('$doge')`, `matchAnswer('DOGE')` and `matchAnswer('dogecoin')` returns `answer === 'Dogecoin'` with `correction === false`. `matchAnswer('Dogecoim')` returns Dogecoin with `correction === true`.
  - `test('rejected guesses are logged')`: in `tests/game.test.mjs`, answering `'zzzzzzzzzz'` returns `rejected: true` and adds one `rejections` row with today's date, the round's prompt id and the raw text.
  - Move the upstream correction test (`'mashed'` → `'Mashed potatoes'`) to a sample-bank fuzzy typo that expects `correction`.
  - The seed script against an in-memory DB with a temp 2-day bank and `launchDate` = today writes 2 rows. Re-running with today's row edited and no `--force` leaves today's row unchanged.
  - `validate-bank` exits non-zero on a repeated prompt text across two days.

  In `tests/game.test.mjs`:
  - `test('practice locked until daily done')`: practice start → 403. Finish the daily → practice start → 200, with `mode==='practice'`.
  - `test('no answers leak before completion')`: seed today + tomorrow. The `/api/today` body has no `answers` key at any depth, contains none of today's answer strings, and contains none of tomorrow's prompt texts. `/api/today?date=<tomorrow>` returns today's prompts. `/api/state` mid-run contains no answer strings beyond the player's own results.
  - `test('run started before midnight scores against its own date')`: mock `Date.now` to 23:59:50 ET on day D, start, then advance to 00:00:05 on D+1 and answer. The result is scored against day D's prompt.
  - `test('bank exhausted reruns day 1 with its re-tiered answers')`: 2-day bank. On launch+2, the prompt ids equal day 1's, the `dayNumber` is 3, and a tier edited in day 1's row is reflected. Requesting launch+2 again returns the snapshot, not a recomputation.
  - `test('fresh database serves the sample')`: with no bank rows, `/api/today` returns `SAMPLE` prompts with `sample: true`.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** the interfaces above. Write the 7 sample prompts (crypto, range of tones, at least 8 answers each, one gem).
- [ ] **Step 4: Run** `npm test`. Expected: all PASS.
- [ ] **Step 5: Commit** `feat: private puzzle bank seeding, practice lock and leak tests`.

---

### Task 7: Re-tiering from real play

**Files:**
- Create: `src/retier.mjs`
- Modify: `src/server.mjs` (route `GET /api/cron/retier`)
- Test: `tests/retier.test.mjs`

**Interfaces:**
- `RETIER = { minPlayers: 50, commonShare: 0.15, holderShare: 0.05, degenShare: 0.01 }`
- `retierPrompt(answers, counts: Record<canonicalAnswer, number>, respondents: number) → answers` (new array; never mutates). Rules, using `share = count / respondents` and `start = a.startTier ?? a.tier`:
  - `respondents < minPlayers` → unchanged
  - `tier === 'satoshi'` → unchanged
  - `count === 0` → unchanged
  - `share ≥ commonShare` → `midcurve` if `start ∈ {midcurve, degen, og}`, else `normie`
  - `share ≥ holderShare` → `holder`
  - `share ≥ degenShare` → `degen`
  - else → `og`
- `runRetier(db, today: 'YYYY-MM-DD') → Promise<{ prompts: number, updated: number }>`:
  1. For every `puzzles` row with `date < today` and a source in `('bank','rerun')`, map round → prompt id.
  2. Count `answers` from `mode='daily'` runs on that date. `respondents` = rows for that round (misses included). `counts` = the non-null canonical `answer` values.
  3. Sum the counts per prompt id across dates.
  4. Apply `retierPrompt` to each `source='bank'` row whose date < today, and `UPDATE` only rows whose content changed.

  It never touches rows dated today or later. The result is idempotent.
- `GET /api/cron/retier`: if `env.CRON_SECRET` is empty or `Authorization !== 'Bearer ' + env.CRON_SECRET` → 404 `Unknown endpoint.`. Otherwise it returns `runRetier(env.DB, etDate())` as JSON.

- [ ] **Step 1: Write failing tests** in `tests/retier.test.mjs`:
  - With 100 respondents: a `start: og` answer with 40 → `midcurve`; a `start: holder` answer with 40 → `normie`; 10 → `holder`; 3 → `degen`; 0.5 share (1 of 200 respondents) → `og`; satoshi with 90 → `satoshi`; 49 respondents → everything unchanged; count 0 → unchanged. The input array is not mutated.
  - `runRetier`: seed yesterday plus today. Insert 60 completed daily runs for yesterday where 50 gave answer X (`start: degen`) in round 0. Running it → yesterday's row shows X as `midcurve`, today's row is unchanged, and the result is `updated: 1`. A second run → `updated: 0`.
  - Route: no header → 404; wrong secret → 404; `CRON_SECRET` unset with any header → 404; correct header → 200 with `{prompts, updated}`.
- [ ] **Step 2: Run** `node --test tests/retier.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test`. Expected: all PASS.
- [ ] **Step 5: Commit** `feat: daily re-tiering from player answers`.

---

### Task 8: Write the 90-day private bank

**Files (private repo `~/Claude Projects/crypto-trivia-bank/`, its own `git init`; never inside the public repo):**
- Create: `catalog.json`, `days/0001.json` … `days/0090.json`, `README.md` (format + "validate with `npm run validate-bank -- ../crypto-trivia-bank/days` from the code repo")

**Interfaces:** Consumes the day-file format and `scripts/validate-bank.mjs` from Task 6.

Content rules:
- Range of tone from serious to unhinged within each day.
- Each day has 7 prompts from at least 5 different categories.
- No prompt that depends on live data. No "buy/shill" framing.
- Every answer must be factually correct as of 2026-10.
- Open prompts ("Name a Layer 1") list every reasonably known correct answer, at least 25. Closed sets list all members, at least 8 total.
- Tickers, common nicknames and frequent misspellings go in as aliases.
- Starting tiers: at least 1 `normie`, exactly 1 `satoshi` (correct, obscure, verifiable).

- [ ] **Step 1: Catalog.** Write `catalog.json`: 630 prompt texts, each with `day`, `id` (`dNNNpK`), `category`, and `kind` (`open`|`closed`). Run a duplicate/near-duplicate check (normalized text) and a per-day category check. Commit in the bank repo.
- [ ] **Step 2: Fill answers** in six parallel batches of 15 days (one subagent each, given the content rules, the catalog slice, and the day format). Each batch writes its `days/*.json`.
- [ ] **Step 3: Validate.** Run `npm run validate-bank -- ../crypto-trivia-bank/days` from the code repo. Expected: exit 0. Fix and re-run until clean.
- [ ] **Step 4: Accuracy review.** Run six fresh reviewer subagents, one per batch, each told to find wrong "correct" answers, missing obvious answers, mis-set gems and live-data prompts. Apply the fixes and re-validate.
- [ ] **Step 5: Leak check.** From the code repo, `git grep -n -i -F -f <(jq -r '.[].text' ../crypto-trivia-bank/catalog.json)` returns nothing. Expected: no matches.
- [ ] **Step 6: Commit** in the bank repo: `content: 90-day bank`.

---

### Task 9: Deploy (with the owner)

**Files:** Modify `README.md` (deploy runbook: what each step below does, so the owner can redo it), `src/config.mjs` (`launchDate`, `name`/`origin` if chosen).

Every step that creates something public or in the owner's accounts needs the owner's go-ahead first.

- [ ] **Step 1: Accounts.** The owner runs `npx vercel login` and `turso auth login` (or uses the dashboards). Confirm `gh auth status` works.
- [ ] **Step 2: Repos** (owner approves first). `gh repo fork VulcanEon/openkrillion.com-service --clone=false --fork-name <name>`, set it as `origin`, push `main`. `gh repo create <name>-bank --private`, then push the bank repo.
- [ ] **Step 3: Database.** `turso db create <name>`. Get the URL and a token. Run `TURSO_DATABASE_URL=… TURSO_AUTH_TOKEN=… npm run db:migrate`. Set `SITE.launchDate` to the chosen launch day and commit. Run `npm run seed -- ../crypto-trivia-bank/days` against Turso. Expected: 90 written.
- [ ] **Step 4: Vercel.** Run `npx vercel link`, then set env `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SITE_URL`, and `CRON_SECRET` (random 32 bytes hex) for Production. Then `npx vercel --prod`.
- [ ] **Step 5: Verify production.**
  - `GET /api/health` returns database ok.
  - Use `/browse` to play a full daily run on desktop and mobile widths with no console errors, and confirm practice is locked before the daily and open after.
  - Confirm `/api/today` contains no answers.
  - `curl -H "Authorization: Bearer $CRON_SECRET" <url>/api/cron/retier` returns 200.
  - Vercel dashboard → Cron Jobs lists `/api/cron/retier`.
- [ ] **Step 6: Commit** `docs: deploy runbook` and push.
