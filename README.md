# Crypto Trivia (working name)

A daily rare-answer crypto trivia game for crypto Twitter. Seven prompts, 25 seconds each. Obvious answers barely score; obscure correct answers dig deep.

Built on [OpenKrillion](https://github.com/VulcanEon/openkrillion.com-service) (MIT). Not affiliated with Krillion or OpenKrillion. Just for fun: no tokens, no wallets, not financial advice.

## Run locally

Node.js 24+. No cloud account needed.

```sh
npm ci
npm run build
npm run dev
```

Open http://localhost:3051. The local database is `.data/local.db` (ignored by git). Add `?theme=sea` to preview the fallback sea theme.

Checks: `npm test`, plus `node scripts/browser-audit.mjs <url>` and `node scripts/mobile-flow-audit.mjs <url>`. The audits play the built-in sample questions, so point them at a dev server with an empty database, e.g. `PORT=3052 TURSO_DATABASE_URL=file:/tmp/audit.db npm run dev`.

## Questions: public code, private bank

The real daily questions live in a separate **private** repo so nobody can read tomorrow's answers on GitHub. This repo only ships a small labeled sample (`src/sample-bank.mjs`) so the game runs on a fresh clone.

- Bank format: one file per day, `days/0001.json` … each with 7 prompts (`id`, `text`, `category`, `answers[]` of `{answer, tier, aliases}`; exactly one `satoshi` gem per prompt).
- Check a bank: `npm run validate-bank -- ../crypto-trivia-bank/days`
- Load it into the database: `npm run seed -- ../crypto-trivia-bank/days` (uses `TURSO_DATABASE_URL`; day 1 = `LAUNCH_DATE` or `SITE.launchDate`, stored in the database so the server agrees). Each date freezes its puzzle the first time it's served, so reseeding never changes a day already in play.
- After the last day, the bank reruns from day 1 with its re-ranked answers.
- See what players typed that was rejected: `npm run rejections`.

## License

MIT. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
