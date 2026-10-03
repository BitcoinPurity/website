import { translator, localePath, type LocalizedProps } from "@/lib/i18n";
import Link from "next/link";
import { Container } from "@/components/Container";
import { ExternalLink } from "@/components/ExternalLink";
import { PageHeader } from "@/components/PageHeader";
import { PolicyToConsensus } from "@/components/diagrams/PolicyToConsensus";
import { protocol } from "@/content/protocol";

export default function WhyPurityPage({ locale = "en" }: LocalizedProps = {}) {
  const t = translator(locale);

  return (
    <>
      <PageHeader
        eyebrow={t("Why Purity")}
        title={<>{t("Bitcoin is money. Keep it that way.")}</>}
      >
        {t(
          "Bitcoin Purity exists to keep that definition in consensus, not only in policy. It is not a new asset with a new ticker. It claims the Bitcoin identity.",
        )}
      </PageHeader>
      <Container className="space-y-16 py-16 sm:py-20">
        <section>
          <h2 className="text-3xl text-ink">{t("What Bitcoin is")}</h2>
          <ul className="mt-6 max-w-2xl space-y-3 text-lg text-muted">
            <li>{t("A peer-to-peer electronic cash system.")}</li>
            <li>
              {t("A ledger of value transfer, secured by proof-of-work.")}
            </li>
            <li>
              {t("Software that anyone can run to verify their own money.")}
            </li>
          </ul>
        </section>
        <section>
          <h2 className="text-3xl text-ink">{t("What Bitcoin is not")}</h2>
          <ul className="mt-6 max-w-2xl space-y-3 text-lg text-muted">
            <li>{t("A general-purpose database or file host.")}</li>
            <li>
              {t("An application platform for complex on-chain programs.")}
            </li>
            <li>
              {t(
                "A chain whose rules exist to maximize arbitrary data embedding.",
              )}
            </li>
          </ul>
        </section>
        <section>
          <h2 className="text-3xl text-ink">
            {t("Policy can change. Consensus endures.")}
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "BIP110 / RDTS encodes a monetary stance in consensus. In Knots that deployment was temporary. Purity makes those rules permanent by hard fork, instead of a one-year temporary soft fork.",
            )}
          </p>
          <div className="mt-8 max-w-xl">
            <PolicyToConsensus locale={locale} />
          </div>
        </section>
        <section>
          <h2 className="text-3xl text-ink">
            {t("Not another coin. A path for Bitcoin.")}
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t("Same P2P magic (")}
            <span className="font-mono text-ink">{protocol.p2pMagic}</span>
            {t("), default port ")}
            {protocol.defaultPort}
            {t(
              ", addresses, transaction serialization, and sighash. Same default data directory (",
            )}
            <span className="font-mono text-ink">{protocol.dataDirectory}</span>
            {t(") and binary names. No transaction-level replay protection.")}
          </p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "The project waits for economic consensus to choose the Purity rules rather than engineering a clean split into “another coin.” That is intent, not a claim that the legacy history has already been abandoned.",
            )}
          </p>
        </section>
        <p className="text-muted">
          <ExternalLink
            locale={locale}
            href={protocol.docs.vision}
            className="text-gold"
          >
            {t("Vision document")}
          </ExternalLink>
          {" · "}
          <Link
            href={localePath("/how-it-works", locale)}
            className="text-gold"
          >
            {t("How it works")}
          </Link>
        </p>
      </Container>
    </>
  );
}
