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

## Content rule

Do not invent activation status, releases, hashrate, exchange or wallet support, or tickers. If documentation in `saltduck/bitcoinpurity` changes, update `src/content/protocol.ts` first.
