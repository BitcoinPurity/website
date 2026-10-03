import { translator, type LocalizedProps } from "@/lib/i18n";
export function BlockBoundaryDiagram({ locale = "en" }: LocalizedProps = {}) {
  const t = translator(locale);

  return (
    <figure className="py-2">
      <figcaption className="mb-5 font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
        {t("Consensus boundary — Reduced Data")}
      </figcaption>
      <div aria-hidden="true" className="font-mono text-[11px] sm:text-xs">
        <p className="tracking-[0.18em] text-gold">{t("BLOCK")}</p>
        <div className="mt-2 mb-5 h-px w-full bg-line-gold" />
        <p className="mb-3 tracking-[0.14em] text-muted">
          {t("VALUE TRANSFER")}
        </p>
        <div className="space-y-2">
          {["TX", "TX", "TX"].map((label, index) => (
            <div
              key={`${label}-${index}`}
              className="anim-enter flex items-center gap-3"
              style={{ animationDelay: `${index * 180}ms` }}
            >
              <span className="h-2 flex-1 bg-gold/80" />
              <span className="w-8 text-ink">{label}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 mb-3 tracking-[0.14em] text-muted">
          {t("ARBITRARY DATA")}
        </p>
        <div
          className="anim-reject flex items-center gap-3"
          style={{ animationDelay: "700ms" }}
        >
          <span className="h-px flex-1 bg-muted" />
          <span className="text-gold">×</span>
        </div>
        <p className="mt-6 tracking-[0.16em] text-gold">{t("CONSENSUS")}</p>
        <p className="mt-1 tracking-[0.16em] text-ink">{t("REDUCED DATA")}</p>
      </div>
      <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">
        {t(
          "Monetary transfers belong in the block. Excessive arbitrary-data payloads are rejected by the Reduced Data consensus boundary.",
        )}
      </p>
    </figure>
  );
}
