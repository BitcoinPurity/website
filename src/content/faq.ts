import { mainnetLaunchedAt, protocol } from "./protocol";

export const faqItems = [
  {
    id: "versioning",
    question: "How are Bitcoin Purity versions numbered?",
    answer:
      `Bitcoin Purity now uses its own independent MAJOR.MINOR.PATCH release series. The current mainnet release is ${protocol.launch.releaseTag}${protocol.version.isReleaseCandidate ? " (release candidate)" : ""}. Git tags use a leading v (for example v1.0.0, v1.0.0rc1). This is separate from the upstream Bitcoin Knots version (${protocol.knotsBase}) and the Bitcoin Core consensus baseline (${protocol.coreConsensusBaseline}). On the P2P network, nodes identify as ${protocol.version.p2pUserAgent}. Older date-based tags such as ${protocol.version.legacyReleaseTag} are legacy identifiers. See doc/VERSION.md in the repository for the full convention.`,
  },
  {
    id: "mainnet",
    question: "Is Bitcoin Purity live on mainnet?",
    answer:
      `Yes. Mainnet launched at ${mainnetLaunchedAt}, at block height ${protocol.launch.activationHeight}. Mainnet activation is hardcoded, and the activation block is consensus-pinned to ${protocol.activationBlockHash}. The official release is ${protocol.launch.releaseTag} (source and binaries). If an existing block index contains a conflicting block at the activation height after upgrading, rebuild it with -reindex. Trial solo pool endpoints are ${protocol.launch.trialSoloPool.url} and ${protocol.launch.trialSoloPoolLowHash.url} (port 4444 for low-hash-rate miners).`,
  },
  {
    id: "new-coin",
    question: "Is Bitcoin Purity a new cryptocurrency?",
    answer:
      "No. Bitcoin Purity does not position itself as a newly issued asset and does not introduce a ticker. It is a Bitcoin full node that claims continuity with Bitcoin: the same addresses, transaction serialization, sighash, P2P magic, default port, binary names, and default data directory. The project is a path for Bitcoin, not another coin.",
  },
  {
    id: "hard-fork",
    question: "Why is a hard fork necessary?",
    answer:
      "Relay and mempool policy can be changed by node operators and software defaults. Consensus is what every fully validating node actually enforces. Bitcoin Purity exists because the project believes Bitcoin’s monetary purpose should not depend only on configurable policy. BIP110 / RDTS Reduced Data rules are made permanent through the Purity hard fork. The short-term consensus document in the repository is the source of truth for those rules.",
  },
  {
    id: "sha256d",
    question: "Why keep SHA256d?",
    answer:
      "Proof-of-work remains SHA256d. The design avoids unnecessarily invalidating existing SHA256 mining investment as part of the fork. That is a continuity choice about the capital that secures Bitcoin — not a promise of mining profitability, and not a guarantee that every miner is protected from economic loss.",
  },
  {
    id: "replay",
    question: "Is there replay protection?",
    answer:
      "No transaction-level replay protection is intentionally added. Because addresses, transaction formats, and sighash remain compatible, a transaction may be valid on both Purity and a compatible legacy history. Compatible transactions can potentially propagate to and be accepted by nodes on both histories, subject to each node’s current policy, chain state, and validity rules. Read the Safety guide before spending during coexistence.",
  },
  {
    id: "mempool",
    question: "Do the two chains share a mempool?",
    answer:
      "Not as a single shared pool. Purity and Core nodes do not share a mempool directly — each node still keeps its own. Purity transactions are fully compatible with Core, so anyone can relay transactions that satisfy both consensus rules from one mempool to the other. That forwarding path produces the practical effect of a shared mempool.",
  },
  {
    id: "migrate-later",
    question: "Can I move from the legacy history later?",
    answer:
      "The design intentionally avoids a mandatory one-time asset conversion. Transaction compatibility is meant to leave a path open rather than force every user through a claim event. Actual transaction safety still depends on current chain state, replay behavior, and network conditions. That is not a promise of effortless migration under every possible future state.",
  },
  {
    id: "low-hash",
    question: "What happens if Purity initially has low hash rate?",
    answer:
      `After activation, difficulty uses ${protocol.asert.algorithm} with a 24-hour half-life, intended to adapt more responsively when available hash rate differs substantially from the pre-fork network. That does not promise regular block times. Until hash rate and block production are stable and sufficient, treat settlement conservatively: do not treat unconfirmed or lightly confirmed payments from untrusted counterparties as final.`,
  },
  {
    id: "steal",
    question: "Can a majority-hash attacker steal my coins?",
    answer:
      "Not arbitrarily. Without your private keys, hash power alone cannot authorize spending your UTXOs. Sufficient competing hash power can still reorganize recent blocks, censor or delay transactions, and reverse an attacker’s own earlier payments in order to double-spend them. Those are serious risks. They are not the same as spending other people’s coins.",
  },
  {
    id: "parking-51",
    question: "Does six-block parking make Purity immune to 51% attacks?",
    answer:
      "No. Deep-reorg parking is local node policy requiring operator review. It is reorganization risk mitigation, not a consensus guarantee, and not 51% attack immunity. It does not make a majority-hash attack impossible.",
  },
  {
    id: "ds-freeze",
    question: "Is double-spend freezing implemented?",
    answer:
      "No. Automatic freeze of double-spend coinbases and inputs is specified as draft work in the repository and is not implemented. Do not treat it as an active protection.",
  },
  {
    id: "long-term",
    question: "What is the long-term goal?",
    answer:
      "Preserve Bitcoin’s monetary character — peer-to-peer electronic cash, not a general-purpose data platform — and allow economic consensus to choose the Purity rules without deliberately introducing a new asset identity. The intent is that economic activity migrates toward those rules rather than that a permanently separate “new coin” is engineered.",
  },
] as const;

export const homeFaqIds = [
  "versioning",
  "mainnet",
  "new-coin",
  "hard-fork",
  "replay",
  "steal",
  "ds-freeze",
] as const;
