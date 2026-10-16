export const GITHUB = "https://github.com/saltduck/bitcoinpurity" as const;
export const PURITY_WALLET = "https://github.com/BitcoinPurity/PurityWallet" as const;

export const CONTACT = {
  email: "contact@bitcoinpurity.org",
  emailHref: "mailto:contact@bitcoinpurity.org",
  x: "@Bitcoin_Purity",
  xHref: "https://x.com/Bitcoin_Purity",
  telegram: "@bitcoinpurity",
  telegramHref: "https://t.me/bitcoinpurity",
  discord: "discord.gg/yjyz9JcZT",
  discordHref: "https://discord.gg/yjyz9JcZT",
  bbs: "bbs.bitcoinpurity.org",
  bbsHref: "https://bbs.bitcoinpurity.org/",
} as const;

export const SERVICES = {
  poolMonitor: "https://pool.bitcoinpurity.org",
  mempoolExplorer: "https://mempool.bitcoinpurity.org",
  bbs: "https://bbs.bitcoinpurity.org",
  electrum: {
    host: "electrum.bitcoinpurity.org",
    port: 50002,
    ssl: true,
    url: "ssl://electrum.bitcoinpurity.org:50002",
    bluewalletServer: "electrum.bitcoinpurity.org:50002:s",
  },
} as const;

/** Third-party mining pools listed on the For Miners page. */
export const PARTNER_POOLS = [
  {
    name: "Competitiously community pool",
    website: "https://competitiously.com",
    description:
      "The first community pool, offering SOLO and PPLNS mining.",
  },
  {
    name: "Mole solo pool",
    website: "https://btc1.molepool.com/",
    description: "Currently the largest pool.",
  },
  {
    name: "Crypto-Éire DATUM TIDES pool",
    website: "https://crypto-eire.com/#btc1",
    description: "The first DATUM TIDES pool.",
  },
] as const;

export const MINING_MANUALS = {
  en: "https://downloads.bitcoinpurity.org/docs/Bitcoin_Purity_Mining_Manual_v0.9.2_en.pdf",
  zhCN: "https://downloads.bitcoinpurity.org/docs/Bitcoin_Purity_Mining_Manual_v0.9.2_zh.pdf",
  zhTW: "https://downloads.bitcoinpurity.org/docs/Bitcoin_Purity_Mining_Manual_v0.9.2_zh-Hant.pdf",
} as const;

export const WHITEPAPER_PDF =
  "https://downloads.bitcoinpurity.org/whitepaper.pdf" as const;

export const repoFile = (path: string) => `${GITHUB}/blob/master/${path}`;

export const DOCS = {
  readme: repoFile("README.md"),
  versioning: repoFile("doc/VERSION.md"),
  vision: repoFile("doc/purity-vision.md"),
  consensus: repoFile("doc/purity-consensus.md"),
  roadmap: repoFile("doc/roadmap.md"),
  setup: repoFile("doc/README.md"),
  buildUnix: repoFile("doc/build-unix.md"),
  buildMac: repoFile("doc/build-osx.md"),
  buildWindowsMsvc: repoFile("doc/build-windows-msvc.md"),
  buildWindows: repoFile("doc/build-windows.md"),
  contributing: repoFile("CONTRIBUTING.md"),
  security: repoFile("SECURITY.md"),
  copying: repoFile("COPYING"),
  issues: `${GITHUB}/issues`,
} as const;
