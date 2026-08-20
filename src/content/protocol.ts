import { DOCS, GITHUB } from "./links";

/** Source of truth: saltduck/bitcoinpurity docs. Do not invent values here. */
export const protocol = {
  name: "Bitcoin Purity",
  knotsBase: "v29.4.knots20260508",
  license: "MIT",
  binaries: ["bitcoind", "bitcoin-qt", "bitcoin-cli"] as const,
  dataDirectory: "~/.bitcoin",
  p2pMagic: "f9beb4d9",
  defaultPort: 8333,
  pow: "SHA256d",
  blockIntervalSeconds: 600,
  enforcementHeight: 961632,
  provisionalActivationHeight: 961637,
  activationOption: "purityactivationheight",
  activationFile: "purity_activation_height",
  launch: {
    isoUtc: "2026-08-19T10:00:00Z",
    dateLabel: "19 August 2026",
    timeLabel: "10:00 UTC",
    activationHeight: 961637,
    mainnetLive: true,
    trialSoloPool: "stratum+tcp://pool.bitcoinpurity.org:3333",
    trialSoloPoolLowHash: "stratum+tcp://pool.bitcoinpurity.org:4444",
    releaseTag: "v29.4.purity20260819",
  },
  rdts: {
    maxOutputScriptSize: 34,
    maxOpReturnSize: 83,
    maxScriptElementSize: 256,
    taprootControlMaxDepth: 7,
    taprootAnnex: "invalid",
    tapscriptIfOpcodes: "forbidden",
  },
  asert: {
    algorithm: "aserti3-1d",
    halfLifeSeconds: 86400,
    targetIntervalSeconds: 600,
    anchorHeight: 961632,
  },
  parking: {
    depth: 6,
    defaultEnabled: true,
    classification: "local-policy",
  },
  doubleSpendFreeze: {
    status: "specified-not-implemented" as const,
  },
  laterRoadmap: [
    "SEAL-2 block header",
    "Removal of Taproot, and possibly Segwit",
    "Post-quantum signatures and 32 MB block size",
  ] as const,
  docs: DOCS,
  github: GITHUB,
} as const;

export type Protocol = typeof protocol;

export const activationConf =
  `${protocol.activationOption}=${protocol.launch.activationHeight}` as const;

export const activationCli = `-${activationConf}` as const;

export const releaseTagUrl = `${protocol.github}/tree/${protocol.launch.releaseTag}` as const;

export const mainnetLaunchedAt =
  `${protocol.launch.timeLabel} on ${protocol.launch.dateLabel}` as const;
