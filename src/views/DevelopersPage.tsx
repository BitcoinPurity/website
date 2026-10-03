import { translator, type LocalizedProps } from "@/lib/i18n";
import { Container } from "@/components/Container";
import { ExternalLink } from "@/components/ExternalLink";
import { PageHeader } from "@/components/PageHeader";
import { protocol } from "@/content/protocol";

export default function DevelopersPage({ locale = "en" }: LocalizedProps = {}) {
  const t = translator(locale);
  const links = [
    { href: protocol.github, label: t("Repository") },
    { href: protocol.docs.versioning, label: t("Versioning") },
    { href: protocol.docs.vision, label: t("Vision") },
    { href: protocol.docs.consensus, label: t("Consensus changes") },
    { href: protocol.docs.roadmap, label: t("Roadmap") },
    { href: protocol.docs.setup, label: t("Setup / build docs") },
    { href: protocol.docs.contributing, label: t("Contributing") },
    { href: protocol.docs.security, label: t("Security policy") },
  ];

  return (
    <>
      <PageHeader
        eyebrow={t("Developers")}
        title={t("The repository is canonical.")}
      >
        {t(
          "Consensus-critical claims on this website are summaries. The repository consensus specification is authoritative.",
        )}
      </PageHeader>
      <Container className="space-y-14 py-16 sm:py-20">
        <aside className="border-l-2 border-gold px-5 py-4 text-muted">
          {t("Source of truth:")}{" "}
          <ExternalLink
            locale={locale}
            href={protocol.docs.consensus}
            className="text-gold"
          >
            {"doc/purity-consensus.md"}
          </ExternalLink>
          {t(". This node is a fork of Bitcoin Knots ")}
          {protocol.knotsBase} {t("(Bitcoin Core consensus baseline ")}
          {protocol.coreConsensusBaseline}
          {t("). The official source release for mainnet is")}{" "}
          <span className="font-mono text-ink">
            {protocol.launch.releaseTag}
          </span>
          {protocol.version.isReleaseCandidate ? t(" (release candidate)") : ""}
          {t(". Versioning is defined in")}{" "}
          <ExternalLink
            locale={locale}
            href={protocol.docs.versioning}
            className="text-gold"
          >
            {"doc/VERSION.md"}
          </ExternalLink>
          {t(".")}
        </aside>

        <section>
          <h2 className="text-3xl text-ink">{t("Versioning")}</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t("Bitcoin Purity maintains an independent")}{" "}
            <span className="font-mono text-ink">MAJOR.MINOR.PATCH</span>{" "}
            {t("release series. Git tags use a leading")}{" "}
            <span className="font-mono text-ink">v</span> {t("(for example")}{" "}
            <span className="font-mono text-ink">
              {protocol.launch.releaseTag}
            </span>
            {t("). Release candidates append")}{" "}
            <span className="font-mono text-ink">rcN</span>{" "}
            {t("before the final release.")}
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            {t("The upstream Bitcoin Knots version (")}
            <span className="font-mono text-ink">{protocol.knotsBase}</span>
            {t(") and Bitcoin Core consensus baseline (")}
            <span className="font-mono text-ink">
              {protocol.coreConsensusBaseline}
            </span>
            {t(
              ") are recorded separately and do not determine the Bitcoin Purity release number. On the P2P network, nodes identify as",
            )}{" "}
            <span className="font-mono text-ink">
              {protocol.version.p2pUserAgent}
            </span>
            {t(".")}
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            {t("Older date-based tags such as")}{" "}
            <span className="font-mono text-ink">
              {protocol.version.legacyReleaseTag}
            </span>{" "}
            {t("are legacy identifiers.")}{" "}
            <span className="font-mono text-ink">
              {protocol.launch.releaseTag}
            </span>{" "}
            {t("supersedes them under the new convention.")}
          </p>
        </section>

        <section>
          <h2 className="text-3xl text-ink">{t("Documents")}</h2>
          {locale !== "en" ? (
            <p className="mt-4 text-muted">
              {t("Source documents remain in their original language.")}
            </p>
          ) : null}
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {links.map((link) => (
              <li key={link.href}>
                <ExternalLink
                  locale={locale}
                  href={link.href}
                  className="flex min-h-12 items-center justify-between gap-4 py-3 text-ink hover:text-gold"
                >
                  <span>{t(link.label)}</span>
                  <span className="font-mono text-[11px] text-muted">↗</span>
                </ExternalLink>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-3xl text-ink">{t("Deep-reorg parking RPCs")}</h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t(
              "Parking is local policy, not consensus. Operators review parked blocks with ",
            )}
            <span className="font-mono text-ink">parkblock</span> {t("and")}{" "}
            <span className="font-mono text-ink">unparkblock</span>
            {t(".")} <span className="font-mono text-ink">invalidateblock</span>{" "}
            {t("and")}{" "}
            <span className="font-mono text-ink">reconsiderblock</span>{" "}
            {t(
              "remain available. Bitcoin Cash Avalanche, automatic unparking, and",
            )}{" "}
            <span className="font-mono text-ink">-maxreorgdepth</span>{" "}
            {t("auto-finalization are not ported.")}
          </p>
        </section>

        <section>
          <h2 className="text-3xl text-ink">{t("Identity retained")}</h2>
          <ul className="mt-5 max-w-2xl space-y-2 font-mono text-sm text-muted">
            <li>
              {t("P2P magic ")}
              {protocol.p2pMagic}
            </li>
            <li>
              {t("port ")}
              {protocol.defaultPort}
            </li>
            <li>{protocol.binaries.join(" / ")}</li>
            <li>{protocol.dataDirectory}</li>
          </ul>
        </section>
      </Container>
    </>
  );
}
