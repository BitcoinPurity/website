export const GITHUB = "https://github.com/saltduck/bitcoinpurity" as const;

export const CONTACT = {
  email: "contact@bitcoinpurity.org",
  emailHref: "mailto:contact@bitcoinpurity.org",
  x: "@Bitcoin_Purity",
  xHref: "https://x.com/Bitcoin_Purity",
} as const;

export const SERVICES = {
  poolMonitor: "https://pool.bitcoinpurity.org",
  mempoolExplorer: "https://mempool.bitcoinpurity.org",
  electrum: {
    host: "electrum.bitcoinpurity.org",
    port: 50002,
    ssl: true,
    url: "ssl://electrum.bitcoinpurity.org:50002",
  },
} as const;

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
