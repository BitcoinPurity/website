import { Container } from "@/components/Container";
import { ExternalLink } from "@/components/ExternalLink";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { protocol } from "@/content/protocol";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta(
  "Roadmap",
  "/roadmap",
  "Bitcoin Purity short-term work in this tree versus later research direction that is not scheduled and not implemented.",
);

export default function RoadmapPage() {
  return (
    <>
      <PageHeader eyebrow="Roadmap" title="Current tree, later research.">
        No dates. No progress percentages. If it is not in the short-term
        consensus document, it is not an active rule.
      </PageHeader>
      <Container className="space-y-16 py-16 sm:py-20">
        <p className="max-w-2xl border-l-2 border-gold pl-5 text-muted">
          Roadmap items are research/product direction, not active consensus
          rules. They require separate specification and implementation
          decisions.
        </p>

        <section>
          <div className="mb-4">
            <StatusBadge kind="active-in-tree" />
          </div>
          <h2 className="text-3xl text-ink">Current / short-term tree</h2>
          <ol className="mt-6 max-w-2xl list-decimal space-y-4 pl-5 text-lg text-muted">
            <li>Rebrand the node as Bitcoin Purity (documentation and CLIENT_NAME).</li>
            <li>Make BIP110/RDTS rules permanently active; remove the opt-out.</li>
            <li>
              Switch difficulty adjustment to 24-hour ASERT (
              {protocol.asert.algorithm}), anchor enforcement-chain block{" "}
              {protocol.asert.anchorHeight}. Keep SHA256d.
            </li>
            <li>
              Enable Bitcoin Cash Node-style deep-reorg parking (depth greater
              than {protocol.parking.depth}).
            </li>
            <li>
              Specify automatic double-spend freeze; do not implement it yet.{" "}
              <StatusBadge kind="specified" />
            </li>
          </ol>
          <p className="mt-6 text-muted">No replay protection.</p>
        </section>

        <section>
          <div className="mb-4">
            <StatusBadge kind="roadmap" />
          </div>
          <h2 className="text-3xl text-ink">Later / research direction</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            These items are product direction only. They have no activation
            height and must not be treated as incomplete bugs in the current
            node.
          </p>
          <ol className="mt-6 max-w-2xl list-decimal space-y-3 pl-5 text-lg text-muted">
            {protocol.laterRoadmap.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <p className="mt-6 max-w-2xl text-muted">
            Work on those requires a new consensus document and an explicit
            decision to implement.
          </p>
        </section>

        <p>
          <ExternalLink href={protocol.docs.roadmap} className="text-gold">
            doc/roadmap.md
          </ExternalLink>
        </p>
      </Container>
    </>
  );
}
