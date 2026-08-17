import Link from "next/link";
import { Container } from "@/components/Container";
import { ExternalLink } from "@/components/ExternalLink";
import { FAQAccordion } from "@/components/FAQAccordion";
import { Logo } from "@/components/Logo";
import { SafetyCallout } from "@/components/SafetyCallout";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import { SpecificationRow } from "@/components/SpecificationRow";
import { StatusBadge } from "@/components/StatusBadge";
import { BlockBoundaryDiagram } from "@/components/diagrams/BlockBoundaryDiagram";
import { ChainSplitDiagram } from "@/components/diagrams/ChainSplitDiagram";
import { PolicyToConsensus } from "@/components/diagrams/PolicyToConsensus";
import { ReorgDiagram } from "@/components/diagrams/ReorgDiagram";
import { homeFaqIds } from "@/content/faq";
import { protocol } from "@/content/protocol";

function CtaLink({
  href,
  children,
  primary = false,
  external = false,
}: {
  href: string;
  children: string;
  primary?: boolean;
  external?: boolean;
}) {
  const className = primary
    ? "inline-flex min-h-12 items-center bg-gold px-5 text-sm font-medium text-bg hover:bg-[#e0b122]"
    : "inline-flex min-h-12 items-center border border-line px-5 text-sm text-ink hover:border-gold";

  if (external) {
    return (
      <ExternalLink href={href} className={className}>
        {children}
      </ExternalLink>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function HomePage() {
  return (
    <>
      <section className="facet-field relative overflow-hidden">
        <Container wide className="py-16 lg:py-24">
          <Logo size={120} className="mb-8" />
          <p className="font-mono text-[12px] tracking-[0.28em] text-gold uppercase">
            Bitcoin Purity
          </p>
          <h1 className="mt-5 max-w-3xl text-[2.7rem] leading-[0.98] text-ink sm:text-6xl md:text-7xl">
            Bitcoin is money.
            <br />
            Keep it that way.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted">
            Bitcoin Purity is a Bitcoin full node built to preserve Bitcoin as
            peer-to-peer electronic cash — not a general-purpose data-storage
            or application platform.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <CtaLink href="/run" primary>
              Run Bitcoin Purity
            </CtaLink>
            <CtaLink href="/why-purity">Read the Vision</CtaLink>
          </div>
          <p className="mt-5">
            <ExternalLink
              href={protocol.github}
              className="text-sm text-muted hover:text-ink"
            >
              View Source on GitHub
            </ExternalLink>
          </p>
          <div className="mt-16 max-w-xl">
            <BlockBoundaryDiagram />
          </div>
        </Container>
      </section>

      <div className="border-y border-line">
        <Container wide className="overflow-x-auto py-4">
          <p className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase whitespace-nowrap">
            SHA256d · Bitcoin addresses · Bitcoin transactions · Permanent Reduced Data rules
          </p>
        </Container>
      </div>

      <section className="py-20 sm:py-28">
        <Container>
          <SectionEyebrow>Purpose</SectionEyebrow>
          <h2 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            What is Bitcoin for?
          </h2>
          <div className="mt-12 grid gap-12 md:grid-cols-2">
            <div>
              <h3 className="font-mono text-sm tracking-[0.2em] text-gold">MONEY</h3>
              <ul className="mt-5 space-y-3 text-lg text-ink">
                <li>Peer-to-peer electronic cash</li>
                <li>Value transfer</li>
                <li>Proof-of-work security</li>
                <li>Self-verification</li>
                <li>Scarce block space</li>
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-sm tracking-[0.2em] text-muted">
                NOT A GENERAL-PURPOSE DATABASE
              </h3>
              <ul className="mt-5 space-y-3 text-lg text-muted">
                <li>Arbitrary file storage</li>
                <li>A general application layer</li>
                <li>Consensus optimized around data embedding</li>
                <li>Unbounded expansion of base-layer purpose</li>
              </ul>
            </div>
          </div>
          <p className="mt-16 max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            Block space is for money.
          </p>
        </Container>
      </section>

      <div className="rule" />

      <section className="py-20 sm:py-28">
        <Container>
          <SectionEyebrow>Why the hard fork exists</SectionEyebrow>
          <h2 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            Policy can change.
            <br />
            Consensus endures.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Relay and mempool policy are configurable. Consensus is what fully
            validating nodes actually enforce. Bitcoin Purity exists because
            Bitcoin’s monetary purpose should not depend only on mempool policy.
            BIP110 / RDTS Reduced Data rules are made permanent through the
            Purity hard fork.
          </p>
          <div className="mt-10 max-w-xl">
            <PolicyToConsensus />
          </div>
          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted">
            The short-term consensus document in the repository is the source of
            truth.{" "}
            <ExternalLink href={protocol.docs.consensus} className="text-gold">
              Read purity-consensus.md
            </ExternalLink>
          </p>
        </Container>
      </section>

      <section className="border-y border-line py-20 sm:py-28">
        <Container>
          <SectionEyebrow>Continuity</SectionEyebrow>
          <h2 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            Preserve Bitcoin&apos;s economic continuity.
          </h2>
          <div className="mt-14 grid gap-12 md:grid-cols-3">
            <div>
              <h3 className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">Miners</h3>
              <p className="mt-3 text-2xl text-ink">Keep SHA256d.</p>
              <p className="mt-4 text-[1.02rem] leading-relaxed text-muted">
                Bitcoin Purity keeps Bitcoin’s SHA256d proof-of-work rather than
                switching to an incompatible mining algorithm. The design avoids
                unnecessarily invalidating existing SHA256 mining investment as
                part of the fork. It does not promise mining profitability, and
                it does not imply every miner is guaranteed protection from
                economic loss.
              </p>
            </div>
            <div>
              <h3 className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">Users</h3>
              <p className="mt-3 text-2xl text-ink">Keep Bitcoin transactions.</p>
              <p className="mt-4 text-[1.02rem] leading-relaxed text-muted">
                Bitcoin address formats remain unchanged. Transaction
                serialization remains unchanged. Sighash remains compatible.
                Bitcoin Purity deliberately introduces no transaction-level
                replay protection. Users do not receive a new token.
              </p>
            </div>
            <div>
              <h3 className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">Network</h3>
              <p className="mt-3 text-2xl text-ink">Keep the path open.</p>
              <p className="mt-4 text-[1.02rem] leading-relaxed text-muted">
                Bitcoin Purity maintains transaction compatibility rather than
                forcing every user through a one-time token-claim or
                asset-conversion event. The intended long-term outcome is
                economic migration toward the Purity rules rather than the
                creation of a permanently separate “new coin.”
              </p>
            </div>
          </div>
          <blockquote className="mt-16 max-w-3xl border-l-2 border-gold pl-6 text-2xl leading-snug text-ink sm:text-3xl">
            Don&apos;t destroy the capital that secures Bitcoin in order to save
            Bitcoin.
          </blockquote>
          <p className="mt-4 font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
            Project philosophy — not an empirical guarantee
          </p>
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container>
          <SectionEyebrow>Proof-of-work</SectionEyebrow>
          <h2 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            Keep hashing Bitcoin.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            SHA256d is unchanged. Hash-rate defense in this tree is operational:
            difficulty that tracks available work, and parking of deep reorgs —
            not an algorithm change. Mining involves substantial technical and
            economic risk.
          </p>
          <div className="mt-8">
            <StatusBadge kind="unchanged" />
          </div>
          <p className="mt-8">
            <Link href="/miners" className="text-gold">
              For miners →
            </Link>
          </p>
        </Container>
      </section>

      <section className="border-y border-line py-20 sm:py-28">
        <Container>
          <SectionEyebrow>Replay compatibility</SectionEyebrow>
          <h2 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            No forced migration day.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Bitcoin Purity intentionally adds no transaction-level replay
            protection. Because addresses, transaction formats, and sighash
            remain compatible, a transaction may be valid on both Purity and a
            compatible legacy history.
          </p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Compatible transactions can potentially propagate to and be accepted
            by nodes on both histories, subject to each node’s current policy,
            chain state, and validity rules. Nodes maintain their own mempools.
          </p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink">
            The protocol does not require users to convert Bitcoin into a newly
            created asset simply to remain compatible with Purity.
          </p>
          <div className="mt-10">
            <ChainSplitDiagram />
          </div>
          <p className="mt-8">
            <Link href="/safety" className="text-gold">
              Read the Safety Guide →
            </Link>
          </p>
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container>
          <SafetyCallout>
            <p>
              Bitcoin Purity intentionally preserves Bitcoin transaction
              compatibility and does not add transaction-level replay protection.
            </p>
            <p>
              During periods of low or unstable Purity hash rate, reorganizations
              and double-spend attempts may present greater settlement risk.
            </p>
            <p className="text-ink">
              Do not treat zero-confirmation or lightly confirmed payments from
              untrusted counterparties as final while network conditions are
              unstable.
            </p>
            <p>
              For economically significant transactions, use more conservative
              confirmation requirements or delay settlement until hash rate and
              block production are sufficiently stable.
            </p>
            <p>
              Understand replay behavior before spending during coexistence of
              Purity and legacy histories.
            </p>
            <p>
              <Link href="/safety" className="text-gold">
                Read the Safety Guide →
              </Link>
            </p>
          </SafetyCallout>
        </Container>
      </section>

      <section className="border-y border-line py-20 sm:py-28">
        <Container>
          <SectionEyebrow>Difficulty</SectionEyebrow>
          <h2 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            Difficulty follows available hash rate.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            After Purity activation, difficulty uses{" "}
            <span className="font-mono text-ink">{protocol.asert.algorithm}</span>{" "}
            with a 24-hour half-life and a {protocol.asert.targetIntervalSeconds}
            -second target interval. SHA256d proof-of-work is unchanged. The
            algorithm is intended to adapt more responsively when available hash
            rate differs substantially from the pre-fork network. It does not
            promise perfectly regular block times.
          </p>
          <dl className="mt-10 grid gap-6 font-mono text-sm sm:grid-cols-3">
            <div>
              <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">Algorithm</dt>
              <dd className="mt-2 text-ink">{protocol.asert.algorithm}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">Half-life</dt>
              <dd className="mt-2 text-ink">{protocol.asert.halfLifeSeconds} seconds</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.14em] text-muted uppercase">Anchor height</dt>
              <dd className="mt-2 text-ink">{protocol.asert.anchorHeight}</dd>
            </div>
          </dl>
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container>
          <SectionEyebrow>Reorganization risk mitigation</SectionEyebrow>
          <h2 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            Deep reorgs wait for an operator.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            If connecting a block would rewind the active chain by more than{" "}
            {protocol.parking.depth} blocks, that block is parked rather than
            automatically reorganizing the active chain. This is local node
            policy, not a consensus guarantee. It is not 51% attack immunity.
          </p>
          <div className="mt-6">
            <StatusBadge kind="local-policy" />
          </div>
          <div className="mt-10">
            <ReorgDiagram />
          </div>
        </Container>
      </section>

      <section className="border-y border-line py-20 sm:py-28">
        <Container>
          <SectionEyebrow>This tree</SectionEyebrow>
          <h2 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            Protocol specification
          </h2>
          <p className="mt-6 max-w-2xl text-muted">
            Summaries only.{" "}
            <ExternalLink href={protocol.docs.consensus} className="text-gold">
              The repository consensus specification is authoritative.
            </ExternalLink>
          </p>
          <div className="mt-10">
            <SpecificationRow index="01" title="Permanent RDTS" status="consensus">
              BIP110 / Reduced Data rules become permanently active under the
              Purity hard-fork rules at the operator-set activation height, and
              they do not expire.
            </SpecificationRow>
            <SpecificationRow index="02" title="SHA256d" status="unchanged">
              Proof-of-work remains SHA256d.
            </SpecificationRow>
            <SpecificationRow index="03" title="ASERT / 24H" status="active-in-tree">
              Difficulty uses {protocol.asert.algorithm} after Purity activation.
            </SpecificationRow>
            <SpecificationRow index="04" title="Deep-reorg parking" status="local-policy">
              Reorganizations deeper than {protocol.parking.depth} blocks are
              parked for operator review by default. Local policy — not consensus.
            </SpecificationRow>
            <SpecificationRow index="05" title="Bitcoin transaction compatibility" status="unchanged">
              Address formats, transaction serialization, and sighash remain
              Bitcoin-compatible.
            </SpecificationRow>
            <SpecificationRow index="06" title="No transaction-level replay protection" status="safety">
              This is intentional.{" "}
              <Link href="/safety" className="text-gold">
                Read the Safety explanation.
              </Link>
            </SpecificationRow>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container>
          <SectionEyebrow>Direction</SectionEyebrow>
          <h2 className="max-w-3xl text-4xl leading-tight text-ink sm:text-5xl">
            Current tree, later research.
          </h2>
          <div className="mt-12 grid gap-12 md:grid-cols-2">
            <div>
              <div className="mb-4">
                <StatusBadge kind="active-in-tree" />
              </div>
              <h3 className="text-2xl text-ink">Short-term</h3>
              <ul className="mt-4 space-y-2 text-muted">
                <li>Permanent BIP110 / RDTS</li>
                <li>24-hour ASERT, SHA256d unchanged</li>
                <li>Deep-reorg parking</li>
                <li>Double-spend freeze specified, not implemented</li>
              </ul>
            </div>
            <div>
              <div className="mb-4">
                <StatusBadge kind="roadmap" />
              </div>
              <h3 className="text-2xl text-ink">Later / research</h3>
              <ul className="mt-4 space-y-2 text-muted">
                {protocol.laterRoadmap.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-10 max-w-2xl text-sm leading-relaxed text-muted">
            Roadmap items are research/product direction, not active consensus
            rules. They require separate specification and implementation
            decisions.
          </p>
          <p className="mt-6">
            <Link href="/roadmap" className="text-gold">
              Full roadmap →
            </Link>
          </p>
        </Container>
      </section>

      <section className="border-y border-line py-20 sm:py-28">
        <Container>
          <SectionEyebrow>Questions</SectionEyebrow>
          <h2 className="text-4xl text-ink sm:text-5xl">FAQ</h2>
          <div className="mt-10">
            <FAQAccordion ids={homeFaqIds} />
          </div>
          <p className="mt-8">
            <Link href="/faq" className="text-gold">
              All questions →
            </Link>
          </p>
        </Container>
      </section>

      <section className="py-28 sm:py-36">
        <Container>
          <h2 className="max-w-3xl text-5xl leading-tight text-ink sm:text-6xl">
            Bitcoin is enough.
          </h2>
          <p className="mt-6 max-w-xl text-lg text-muted">
            Money does not need to become everything.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <CtaLink href="/run" primary>
              Run Bitcoin Purity
            </CtaLink>
            <CtaLink href={protocol.github} external>
              View Source on GitHub
            </CtaLink>
          </div>
          <p className="mt-20 font-mono text-sm leading-7 tracking-[0.2em] text-muted">
            PEER-TO-PEER
            <br />
            ELECTRONIC
            <br />
            CASH
          </p>
        </Container>
      </section>
    </>
  );
}
