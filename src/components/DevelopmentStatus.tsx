import { translator, launchDate, type Locale } from "@/lib/i18n";
import { ExternalLink } from "@/components/ExternalLink";
import { binaryReleaseUrl, protocol } from "@/content/protocol";

export function DevelopmentStatus({
  locale = "en",
  className = "",
}: {
  locale?: Locale;
  className?: string;
}) {
  const t = translator(locale);

  return (
    <aside
      className={`border-l-2 border-gold bg-surface px-5 py-4 ${className}`.trim()}
      aria-label={t("Mainnet status")}
    >
      <p className="font-mono text-[11px] tracking-[0.14em] text-gold uppercase">
        {t("Mainnet live")}
      </p>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
        {t("Mainnet launched at ")}
        {launchDate(locale, protocol.launch.isoUtc)}
        {t(". Official release")}{" "}
        <ExternalLink
          locale={locale}
          href={binaryReleaseUrl}
          className="font-mono text-gold"
        >
          {protocol.launch.releaseTag}
        </ExternalLink>
        {protocol.version.isReleaseCandidate ? t(" (release candidate)") : ""}{" "}
        {t(
          "includes binaries; you can also clone that tag and build it yourself. Versioning follows the independent",
        )}{" "}
        <span className="font-mono text-ink">MAJOR.MINOR.PATCH</span>{" "}
        {t("convention described in")}{" "}
        <ExternalLink
          locale={locale}
          href={protocol.docs.versioning}
          className="text-gold"
        >
          {"doc/VERSION.md"}
        </ExternalLink>
        {t(".")}
      </p>
    </aside>
  );
}
