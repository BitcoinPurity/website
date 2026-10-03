import { translator, type Locale } from "@/lib/i18n";
export function CodeBlock({
  locale = "en",
  code,
  label,
}: {
  locale?: Locale;
  code: string;
  label: string;
}) {
  const t = translator(locale);

  return (
    <div className="border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
        <p className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
          {label}
        </p>
        <button
          type="button"
          data-copy={code}
          className="min-h-9 px-2 font-mono text-[11px] tracking-[0.12em] text-gold uppercase"
          aria-label={t("Copy {0}", label)}
        >
          {t("Copy")}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[13px] leading-relaxed text-ink">
        <code>{code}</code>
      </pre>
    </div>
  );
}
