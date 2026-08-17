import Link from "next/link";
import { Container } from "@/components/Container";
import { ExternalLink } from "@/components/ExternalLink";
import { PageHeader } from "@/components/PageHeader";
import { PolicyToConsensus } from "@/components/diagrams/PolicyToConsensus";
import { protocol } from "@/content/protocol";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta(
  "Why Purity",
  "/why-purity",
  "Bitcoin Purity exists to keep Bitcoin as money and a payment system in consensus, not only in policy.",
);

export default function WhyPurityPage() {
  return (
    <>
      <PageHeader eyebrow="Why Purity" title={<>Bitcoin is money. Keep it that way.</>}>
        Bitcoin Purity exists to keep that definition in consensus, not only in
        policy. It is not a new asset with a new ticker. It claims the Bitcoin
        identity.
      </PageHeader>
      <Container className="space-y-16 py-16 sm:py-20">
        <section>
          <h2 className="text-3xl text-ink">What Bitcoin is</h2>
          <ul className="mt-6 max-w-2xl space-y-3 text-lg text-muted">
            <li>A peer-to-peer electronic cash system.</li>
            <li>A ledger of value transfer, secured by proof-of-work.</li>
            <li>Software that anyone can run to verify their own money.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-3xl text-ink">What Bitcoin is not</h2>
          <ul className="mt-6 max-w-2xl space-y-3 text-lg text-muted">
            <li>A general-purpose database or file host.</li>
            <li>An application platform for complex on-chain programs.</li>
            <li>A chain whose rules exist to maximize arbitrary data embedding.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-3xl text-ink">Policy can change. Consensus endures.</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            BIP110 / RDTS encodes a monetary stance in consensus. In Knots that
            deployment was temporary. Purity makes those rules permanent by hard
            fork, instead of a one-year temporary soft fork.
          </p>
          <div className="mt-8 max-w-xl">
            <PolicyToConsensus />
          </div>
        </section>
        <section>
          <h2 className="text-3xl text-ink">Not another coin. A path for Bitcoin.</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Same P2P magic (<span className="font-mono text-ink">{protocol.p2pMagic}</span>
            ), default port {protocol.defaultPort}, addresses, transaction
            serialization, and sighash. Same default data directory (
            <span className="font-mono text-ink">{protocol.dataDirectory}</span>)
            and binary names. No transaction-level replay protection.
          </p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            The project waits for economic consensus to choose the Purity rules
            rather than engineering a clean split into “another coin.” That is
            intent, not a claim that the legacy history has already been
            abandoned.
          </p>
        </section>
        <p className="text-muted">
          <ExternalLink href={protocol.docs.vision} className="text-gold">
            Vision document
          </ExternalLink>
          {" · "}
          <Link href="/how-it-works" className="text-gold">
            How it works
          </Link>
        </p>
      </Container>
    </>
  );
}
