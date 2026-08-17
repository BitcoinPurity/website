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
  provisionalActivationHeight: 961636,
  activationOption: "purityactivationheight",
  activationFile: "purity_activation_height",
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
