import Link from "next/link";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { SafetyCallout } from "@/components/SafetyCallout";
import { ChainSplitDiagram } from "@/components/diagrams/ChainSplitDiagram";
import { protocol } from "@/content/protocol";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta(
  "For Users",
  "/users",
  "Bitcoin Purity keeps Bitcoin addresses, transaction format, and sighash. Compatibility is not the same as finality.",
);

export default function UsersPage() {
  return (
    <>
      <PageHeader eyebrow="For users" title="Your keys remain Bitcoin keys.">
        Address formats, transaction serialization, and sighash remain those of
        Bitcoin. Node binaries remain {protocol.binaries.join(", ")}. The default
        data directory remains {protocol.dataDirectory}.
      </PageHeader>
      <Container className="space-y-16 py-16 sm:py-20">
        <section>
          <h2 className="text-3xl text-ink">Continuity</h2>
          <ul className="mt-6 max-w-2xl space-y-3 text-lg text-muted">
            <li>Bitcoin addresses are unchanged.</li>
            <li>Transaction format is unchanged.</li>
            <li>Sighash remains compatible.</li>
            <li>No transaction-level replay protection is added.</li>
            <li>You do not receive a new token.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-3xl text-ink">Compatibility is not the same as finality.</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Because the formats remain compatible, a transaction may be valid on
            both Purity and a compatible legacy history. That is a design choice
            with trade-offs. Lack of replay protection is not risk-free.
          </p>
          <div className="mt-8">
            <ChainSplitDiagram />
          </div>
        </section>
        <SafetyCallout title="Treat settlement conservatively.">
          <p>
            Until hash rate and block production are stable and sufficient, do
            not treat unconfirmed or lightly confirmed payments from untrusted
            counterparties as final settlement.
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
    </>
  );
}
