import Link from "next/link";
import { Container } from "@/components/Container";
import { ExternalLink } from "@/components/ExternalLink";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { protocol } from "@/content/protocol";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta(
  "How It Works",
  "/how-it-works",
  "Permanent Reduced Data consensus, SHA256d, ASERT, and Bitcoin transaction compatibility as specified in the Bitcoin Purity repository.",
);

const rows = [
  {
    name: "Non-empty non-OP_RETURN scriptPubKey",
    value: `≤ ${protocol.rdts.maxOutputScriptSize} bytes`,
    id: "MAX_OUTPUT_SCRIPT_SIZE",
  },
  {
    name: "OP_RETURN outputs",
    value: `≤ ${protocol.rdts.maxOpReturnSize} bytes`,
    id: "MAX_OUTPUT_DATA_SIZE",
  },
  {
    name: "Script elements",
    value: `≤ ${protocol.rdts.maxScriptElementSize} bytes`,
    id: "MAX_SCRIPT_ELEMENT_SIZE_REDUCED",
  },
  {
    name: "Taproot control blocks",
    value: `depth ≤ ${protocol.rdts.taprootControlMaxDepth}`,
    id: "TAPROOT_CONTROL_MAX_SIZE_REDUCED",
  },
  {
    name: "Taproot annex",
    value: protocol.rdts.taprootAnnex,
    id: "annex",
  },
  {
    name: "OP_IF / OP_NOTIF in Tapscript",
    value: protocol.rdts.tapscriptIfOpcodes,
    id: "tapscript-if",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        eyebrow="How it works"
        title="Permanent Reduced Data, still Bitcoin."
      >
        This page summarizes the short-term hard fork. Code must match{" "}
        <ExternalLink href={protocol.docs.consensus} className="text-gold">
          doc/purity-consensus.md
        </ExternalLink>
        . Later ideas belong on the roadmap and are not active rules.
      </PageHeader>
      <Container className="space-y-16 py-16 sm:py-20">
        <section>
          <h2 className="text-3xl text-ink">Activation</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Activation height <span className="font-mono text-ink">nPurityActivationHeight</span>{" "}
            is hardcoded on mainnet to{" "}
            <span className="font-mono text-ink">{protocol.launch.activationHeight}</span>.
            The first Purity consensus block is pinned to the hash{" "}
            <span className="break-all font-mono text-ink">{protocol.activationBlockHash}</span>.
            A different block at that height is invalid under consensus, even
            when checkpoints are disabled with{" "}
            <span className="font-mono text-ink">-checkpoints=0</span>.
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            Mainnet launched at{" "}
            <time dateTime={protocol.launch.isoUtc} className="font-mono text-ink">
              {protocol.launch.timeLabel} on {protocol.launch.dateLabel}
            </time>
            , at height{" "}
            <span className="font-mono text-ink">{protocol.launch.activationHeight}</span>
            . The enforcement-chain split is at {protocol.enforcementHeight}. If
            an upgraded node already has a conflicting block at the activation
            height, rebuild its block index with{" "}
            <span className="font-mono text-ink">-reindex</span>.
          </p>
        </section>

        <section>
          <h2 className="text-3xl text-ink">Fork baseline</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            The Knots/BIP110 <em>enforcement</em> chain that rejected
            non-signaling blocks at height {protocol.enforcementHeight} — not the
            Core majority chain at the same height. Historical Bitcoin / Knots
            validation is unchanged before the Purity activation height, so IBD
            still works.
          </p>
        </section>

        <section>
          <div className="mb-4">
            <StatusBadge kind="consensus" />
          </div>
          <h2 className="text-3xl text-ink">Permanent RDTS</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            BIP110 Reduced Data rules become always active at the Purity
            activation height and never expire. They cannot be turned off with
            consensus-rule opt-outs. After activation, version-bit 4 mandatory
            signaling is not required. The rules are consensus, not a miner poll.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            Script elements include the documented P2SH redeemScript-push
            exemption. Block size and weight limits remain those inherited from
            Bitcoin.
          </p>
          <div className="mt-8 divide-y divide-line border-y border-line">
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-baseline"
              >
                <p className="text-ink">{row.name}</p>
                <p className="font-mono text-sm text-gold">{row.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4">
            <StatusBadge kind="active-in-tree" />
          </div>
          <h2 className="text-3xl text-ink">Difficulty: {protocol.asert.algorithm}</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Port of Bitcoin Cash aserti3. Half-life{" "}
            {protocol.asert.halfLifeSeconds} seconds (24 hours). Ideal block time
            remains {protocol.asert.targetIntervalSeconds} seconds. Anchor is
            enforcement-chain block {protocol.asert.anchorHeight}. From the
            Purity activation height onward, GetNextWorkRequired uses ASERT.
            Blocks before that height still use Bitcoin’s 2016-block DAA.
          </p>
        </section>

        <section>
          <div className="mb-4">
            <StatusBadge kind="unchanged" />
          </div>
          <h2 className="text-3xl text-ink">Unchanged</h2>
          <ul className="mt-5 max-w-2xl space-y-2 text-lg text-muted">
            <li>SHA256d proof-of-work</li>
            <li>P2P magic {protocol.p2pMagic}, default port {protocol.defaultPort}</li>
            <li>Address formats, transaction serialization, sighash</li>
            <li>No transaction-level replay protection</li>
            <li>Block size / weight limits inherited from Bitcoin</li>
          </ul>
        </section>

        <p className="text-muted">
          <Link href="/developers" className="text-gold">
            Developers
          </Link>
          {" · "}
          <Link href="/safety" className="text-gold">
            Safety
          </Link>
        </p>
      </Container>
    </>
  );
}
