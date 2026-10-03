import { translator, localePath, type LocalizedProps } from "@/lib/i18n";
import Link from "next/link";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ReorgDiagram } from "@/components/diagrams/ReorgDiagram";
import { protocol } from "@/content/protocol";

export default function SafetyPage({ locale = "en" }: LocalizedProps = {}) {
  const t = translator(locale);

  return (
    <>
      <PageHeader
        eyebrow={t("Safety")}
        title={t("During the transition, treat settlement conservatively.")}
      >
        {t(
          "Until Bitcoin Purity has stable and sufficient hash rate and block production, users should not treat unconfirmed or lightly confirmed payments from untrusted counterparties as final settlement.",
        )}
      </PageHeader>
      <Container className="space-y-16 py-16 sm:py-20">
        <section className="border-l-2 border-gold bg-surface px-5 py-8 sm:px-8">
          <StatusBadge locale={locale} kind="safety" />
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink">
            {t(
              "High-value transactions should use stricter confirmation requirements or be delayed until network conditions are sufficiently stable.",
            )}
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "Be alert to chain reorganizations, replay behavior, and double-spend risk during periods of low or volatile hash rate.",
            )}
          </p>
        </section>

        <section>
          <h2 className="text-3xl text-ink">
            {t("Before hash rate stabilizes")}
          </h2>
          <ul className="mt-6 max-w-2xl space-y-3 text-lg text-muted">
            <li>{t("Do not accept zero-confirmation payments as final.")}</li>
            <li>
              {t(
                "Be cautious with low-confirmation payments from parties you do not trust.",
              )}
            </li>
            <li>
              {t(
                "Require more confirmations for economically significant transactions.",
              )}
            </li>
            <li>
              {t(
                "Consider delaying high-value settlement during severe hash-rate instability.",
              )}
            </li>
            <li>{t("Monitor chain reorganizations and node warnings.")}</li>
            <li>
              {t(
                "Understand replay behavior before spending coins during coexistence of Purity and legacy histories.",
              )}
            </li>
            <li>
              {t(
                "Run your own Bitcoin Purity node when making important settlement decisions.",
              )}
            </li>
          </ul>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">
            {t(
              "There is no fixed confirmation count that guarantees safety. Security depends on available proof-of-work and economic conditions.",
            )}
          </p>
        </section>

        <section>
          <h2 className="text-3xl text-ink">
            {t("What majority hash power can — and cannot — do")}
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "A party controlling sufficient competing proof-of-work may attempt to reorganize recent blocks, reverse its own previously confirmed payments, double-spend its own inputs, and censor or delay transactions.",
            )}
          </p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink">
            {t(
              "Hash power alone does not provide the private keys required to spend arbitrary coins belonging to other users. Without the relevant private keys, majority hash power does not grant arbitrary authority to spend someone else’s UTXOs.",
            )}
          </p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "Bitcoin Purity currently uses operational defenses including 24-hour ASERT difficulty adjustment after activation, SHA256d remaining unchanged, and default parking of reorganizations deeper than",
            )}{" "}
            {protocol.parking.depth} {t("blocks for operator review.")}
          </p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "Those measures are intended to improve operation under changing hash-rate conditions. They are not guarantees against every possible attack. Prefer the phrase ",
            )}
            <em>{t("reorganization risk mitigation")}</em>{" "}
            {t("over any claim of 51% attack immunity.")}
          </p>
        </section>

        <section>
          <h2 className="text-3xl text-ink">{t("Deep-reorg parking")}</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t("Blocks requiring a reorganization deeper than ")}
            {protocol.parking.depth}{" "}
            {t(
              "blocks are parked rather than automatically reorganizing the active chain.",
            )}
          </p>
          <div className="mt-4">
            <StatusBadge locale={locale} kind="local-policy" />
          </div>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "Deep-reorg parking is local node policy, not a consensus guarantee. It does not make a majority-hash attack impossible.",
            )}
          </p>
          <div className="mt-8">
            <ReorgDiagram locale={locale} />
          </div>
        </section>

        <section>
          <h2 className="text-3xl text-ink">{t("Replay behavior")}</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "Bitcoin Purity adds no transaction-level replay protection. Compatible transactions can potentially propagate to and be accepted by nodes on both histories, subject to each node’s current policy, chain state, and validity rules. Each node has its own mempool.",
            )}
          </p>
          <p className="mt-5">
            <Link href={localePath("/users", locale)} className="text-gold">
              {t("For users →")}
            </Link>
          </p>
        </section>

        <section>
          <div className="mb-4">
            <StatusBadge locale={locale} kind="specified" />
          </div>
          <h2 className="text-3xl text-ink">
            {t("Double-spend freeze is not implemented")}
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "Automatic freeze of double-spend coinbases and inputs is specified as draft work. It is not implemented and is not an active protection.",
            )}
          </p>
        </section>
      </Container>
    </>
  );
}
