# bitcoinpurity.org

Official website for [Bitcoin Purity](https://github.com/saltduck/bitcoinpurity).

This is a static Next.js site. Protocol facts are taken from the node repository documentation, especially `README.md`, `doc/purity-vision.md`, `doc/purity-consensus.md`, and `doc/roadmap.md`.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The static output is written to `out/`.

## Deploy

This site is a static export. Cloudflare Workers serves `out/` as static assets.

Workers Builds settings:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |

`wrangler.jsonc` uses Worker name `bitcoinpurity`. The GitHub repo name (`website`) does not need to match.

Local deploy:

```bash
npm run build
npx wrangler deploy
```

## Content rule

Do not invent activation status, releases, hashrate, exchange or wallet support, or tickers. If documentation in `saltduck/bitcoinpurity` changes, update `src/content/protocol.ts` first.
