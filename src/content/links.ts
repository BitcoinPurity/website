export const GITHUB = "https://github.com/saltduck/bitcoinpurity" as const;

export const repoFile = (path: string) => `${GITHUB}/blob/master/${path}`;

export const DOCS = {
  readme: repoFile("README.md"),
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
