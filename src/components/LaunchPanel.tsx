import { translator, launchDate, type Locale } from "@/lib/i18n";
import { CopyableMono } from "@/components/CopyableMono";
import { ExternalLink } from "@/components/ExternalLink";
import { binaryReleaseUrl, protocol, releaseTagUrl } from "@/content/protocol";

export function LaunchPanel({
  locale = "en",
  className = "",
  showTrialSoloPool = true,
}: {
  locale?: Locale;
  className?: string;
  showTrialSoloPool?: boolean;
}) {
  const t = translator(locale);

  const { launch, version } = protocol;

  return (
    <aside
      className={`border border-gold bg-gold-dim ${className}`.trim()}
      aria-label={t("Mainnet status")}
    >
      <div className="border-b border-line-gold px-5 py-4 sm:px-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-gold uppercase">
          {t("Mainnet live")}
        </p>
        <p className="mt-2 text-lg leading-snug text-ink sm:text-xl">
          {t("Bitcoin Purity mainnet launched at ")}
          {launchDate(locale, protocol.launch.isoUtc)}
          {t(".")}
        </p>
      </div>
      <dl>
        <div className="border-b border-line-gold px-5 py-5 sm:px-6">
          <dt className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
            {t("Latest release")}
          </dt>
          <dd className="mt-3">
            <div className="flex flex-wrap items-end gap-3">
              <p className="font-sans text-2xl font-bold leading-none tracking-tight text-ink sm:text-3xl">
                {launch.releaseTag}
              </p>
              <span className="rounded border border-gold px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-gold uppercase">
                {version.isReleaseCandidate
                  ? t("Release candidate")
                  : t("Stable release")}
              </span>
              <CopyableMono locale={locale} value={launch.releaseTag}>
                <span className="sr-only">{launch.releaseTag}</span>
              </CopyableMono>
            </div>
          </dd>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {t("Bitcoin Purity now uses its own")}{" "}
            <span className="font-mono text-ink">MAJOR.MINOR.PATCH</span>{" "}
            {t("version series (for example")}{" "}
            <span className="font-mono text-ink">{"v1.0.0"}</span>
            {t(
              "). This is independent of the upstream Bitcoin Knots version. Current build:",
            )}{" "}
            <span className="font-mono text-ink">{version.release}</span>
            {t(", based on Bitcoin Knots")}{" "}
            <span className="font-mono text-ink">{protocol.knotsBase}</span>{" "}
            {t("(Bitcoin Core consensus baseline")}{" "}
            <span className="font-mono text-ink">
              {protocol.coreConsensusBaseline}
            </span>
            {t(").")}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {t("Official release for mainnet. Download binaries from")}{" "}
            <ExternalLink
              locale={locale}
              href={binaryReleaseUrl}
              className="font-mono text-gold"
            >
              {launch.releaseTag}
            </ExternalLink>
            {t(", or clone")}{" "}
            <ExternalLink
              locale={locale}
              href={releaseTagUrl}
              className="font-mono text-gold"
            >
              {launch.releaseTag}
            </ExternalLink>{" "}
            {t("and build it yourself. See")}{" "}
            <ExternalLink
              locale={locale}
              href={protocol.docs.versioning}
              className="text-gold"
            >
              {"doc/VERSION.md"}
            </ExternalLink>{" "}
            {t("for the full versioning convention.")}
          </p>
        </div>
        <div className="border-b border-line-gold px-5 py-5 sm:px-6">
          <dt className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
            {t("Activation block")}
          </dt>
          <dd className="mt-3">
            <p className="font-mono text-sm text-muted">{t("Height")}</p>
            <p className="mt-1 font-sans text-4xl font-bold leading-none tracking-tight text-ink sm:text-5xl">
              {launch.activationHeight}
            </p>
            <div className="mt-4">
              <CopyableMono
                locale={locale}
                value={protocol.activationBlockHash}
              />
            </div>
          </dd>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {t("Mainnet activation is hardcoded at height")}{" "}
            <span className="font-sans font-bold text-ink">
              {launch.activationHeight}
            </span>
            {t(
              ". The block hash above is consensus-pinned; a different block at this height is invalid. If an existing block index contains a conflicting block after upgrading, restart with",
            )}{" "}
            <span className="font-mono text-ink">-reindex</span>
            {t(".")}
          </p>
        </div>
        {showTrialSoloPool ? (
          <div id="trial-solo-pool" className="scroll-mt-28 px-5 py-5 sm:px-6">
            <dt className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
              {t("Trial solo pool")}
            </dt>
            <dd className="mt-3 space-y-5 text-ink">
              <div>
                <p className="text-sm text-muted">
                  {t("For high hash rate miners · port ")}
                  {launch.trialSoloPool.port}
                </p>
                <div className="mt-2">
                  <CopyableMono
                    locale={locale}
                    value={launch.trialSoloPool.url}
                  />
                </div>
                <p className="mt-2 font-mono text-[12px] leading-relaxed text-muted">
                  {`mindiff=${launch.trialSoloPool.mindiff} · startdiff=${launch.trialSoloPool.startdiff} · maxdiff=${launch.trialSoloPool.maxdiff}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">
                  {t("For low hash rate miners · port")}{" "}
                  {launch.trialSoloPoolLowHash.port}
                </p>
                <div className="mt-2">
                  <CopyableMono
                    locale={locale}
                    value={launch.trialSoloPoolLowHash.url}
                  />
                </div>
                <p className="mt-2 font-mono text-[12px] leading-relaxed text-muted">
                  {`mindiff=${launch.trialSoloPoolLowHash.mindiff} · startdiff=${launch.trialSoloPoolLowHash.startdiff} · maxdiff=${launch.trialSoloPoolLowHash.maxdiff}`}
                </p>
              </div>
            </dd>
          </div>
        ) : null}
      </dl>
    </aside>
  );
}
