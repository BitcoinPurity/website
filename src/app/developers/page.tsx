import { Container } from "@/components/Container";
import { ExternalLink } from "@/components/ExternalLink";
import { PageHeader } from "@/components/PageHeader";
import { protocol } from "@/content/protocol";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta(
  "Developers",
  "/developers",
  "Source of truth for Bitcoin Purity is the repository: vision, consensus, roadmap, and build documentation.",
);

const links = [
  { href: protocol.github, label: "Repository" },
  { href: protocol.docs.vision, label: "Vision" },
  { href: protocol.docs.consensus, label: "Consensus changes" },
  { href: protocol.docs.roadmap, label: "Roadmap" },
  { href: protocol.docs.setup, label: "Setup / build docs" },
  { href: protocol.docs.contributing, label: "Contributing" },
  { href: protocol.docs.security, label: "Security policy" },
];

export default function DevelopersPage() {
  return (
    <>
      <PageHeader eyebrow="Developers" title="The repository is canonical.">
        Consensus-critical claims on this website are summaries. The repository
        consensus specification is authoritative.
      </PageHeader>
      <Container className="space-y-14 py-16 sm:py-20">
        <aside className="border-l-2 border-gold px-5 py-4 text-muted">
          Source of truth:{" "}
          <ExternalLink href={protocol.docs.consensus} className="text-gold">
            doc/purity-consensus.md
          </ExternalLink>
          . This node is a fork of Bitcoin Knots {protocol.knotsBase}. The
          official source release for mainnet is{" "}
          <span className="font-mono text-ink">{protocol.launch.releaseTag}</span>.
        </aside>

        <section>
          <h2 className="text-3xl text-ink">Documents</h2>
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {links.map((link) => (
              <li key={link.href}>
                <ExternalLink
                  href={link.href}
                  className="flex min-h-12 items-center justify-between gap-4 py-3 text-ink hover:text-gold"
                >
                  <span>{link.label}</span>
                  <span className="font-mono text-[11px] text-muted">↗</span>
                </ExternalLink>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-3xl text-ink">Deep-reorg parking RPCs</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Parking is local policy, not consensus. Operators review parked
            blocks with <span className="font-mono text-ink">parkblock</span> and{" "}
            <span className="font-mono text-ink">unparkblock</span>.{" "}
            <span className="font-mono text-ink">invalidateblock</span> and{" "}
            <span className="font-mono text-ink">reconsiderblock</span> remain
            available. Bitcoin Cash Avalanche, automatic unparking, and{" "}
            <span className="font-mono text-ink">-maxreorgdepth</span>{" "}
            auto-finalization are not ported.
          </p>
        </section>

        <section>
          <h2 className="text-3xl text-ink">Identity retained</h2>
          <ul className="mt-5 max-w-2xl space-y-2 font-mono text-sm text-muted">
            <li>P2P magic {protocol.p2pMagic}</li>
            <li>port {protocol.defaultPort}</li>
            <li>{protocol.binaries.join(" / ")}</li>
            <li>{protocol.dataDirectory}</li>
          </ul>
        </section>
      </Container>
    </>
  );
}
