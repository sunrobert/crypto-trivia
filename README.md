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

Checks: `npm test`, plus `node scripts/browser-audit.mjs` and `node scripts/mobile-flow-audit.mjs` against a running dev server.

## License

MIT. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
