import { translator, type LocalizedProps } from "@/lib/i18n";
import { Container } from "@/components/Container";
import { ExternalLink } from "@/components/ExternalLink";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { protocol } from "@/content/protocol";

export default function RoadmapPage({ locale = "en" }: LocalizedProps = {}) {
  const t = translator(locale);

  return (
    <>
      <PageHeader
        eyebrow={t("Roadmap")}
        title={t("Current tree, later research.")}
      >
        {t(
          "No dates. No progress percentages. If it is not in the short-term consensus document, it is not an active rule.",
        )}
      </PageHeader>
      <Container className="space-y-16 py-16 sm:py-20">
        <p className="max-w-2xl border-l-2 border-gold pl-5 text-muted">
          {t(
            "Roadmap items are research/product direction, not active consensus rules. They require separate specification and implementation decisions.",
          )}
        </p>

        <section>
          <div className="mb-4">
            <StatusBadge locale={locale} kind="active-in-tree" />
          </div>
          <h2 className="text-3xl text-ink">
            {t("Current / short-term tree")}
          </h2>
          <ol className="mt-6 max-w-2xl list-decimal space-y-4 pl-5 text-lg text-muted">
            <li>
              {t(
                "Rebrand the node as Bitcoin Purity (documentation and CLIENT_NAME).",
              )}
            </li>
            <li>
              {t(
                "Make BIP110/RDTS rules permanently active; remove the opt-out.",
              )}
            </li>
            <li>
              {t("Switch difficulty adjustment to 24-hour ASERT (")}
              {protocol.asert.algorithm}
              {t("), anchor enforcement-chain block")}{" "}
              {protocol.asert.anchorHeight}
              {t(". Keep SHA256d.")}
            </li>
            <li>
              {t(
                "Enable Bitcoin Cash Node-style deep-reorg parking (depth greater than ",
              )}
              {protocol.parking.depth}
              {t(").")}
            </li>
            <li>
              {t(
                "Specify automatic double-spend freeze; do not implement it yet.",
              )}{" "}
              <StatusBadge locale={locale} kind="specified" />
            </li>
          </ol>
          <p className="mt-6 text-muted">{t("No replay protection.")}</p>
        </section>

        <section>
          <div className="mb-4">
            <StatusBadge locale={locale} kind="roadmap" />
          </div>
          <h2 className="text-3xl text-ink">
            {t("Later / research direction")}
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "These items are product direction only. They have no activation height and must not be treated as incomplete bugs in the current node.",
            )}
          </p>
          <ol className="mt-6 max-w-2xl list-decimal space-y-3 pl-5 text-lg text-muted">
            {protocol.laterRoadmap.map((item) => (
              <li key={item}>{t(item)}</li>
            ))}
          </ol>
          <p className="mt-6 max-w-2xl text-muted">
            {t(
              "Work on those requires a new consensus document and an explicit decision to implement.",
            )}
          </p>
        </section>

        <p>
          <ExternalLink
            locale={locale}
            href={protocol.docs.roadmap}
            className="text-gold"
          >
            {"doc/roadmap.md"}
          </ExternalLink>
        </p>
      </Container>
    </>
  );
}
