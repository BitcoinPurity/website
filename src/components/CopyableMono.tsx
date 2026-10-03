import { translator, type Locale } from "@/lib/i18n";
import { type ReactNode } from "react";

export function CopyableMono({
  locale = "en",
  value,
  invert = false,
  className = "",
  children,
}: {
  locale?: Locale;
  value: string;
  invert?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const t = translator(locale);

  const buttonClass = invert
    ? "min-h-9 shrink-0 px-2 font-mono text-[11px] tracking-[0.12em] uppercase text-bg/80 hover:text-bg"
    : "min-h-9 shrink-0 px-2 font-mono text-[11px] tracking-[0.12em] uppercase text-gold";

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 ${className}`.trim()}
    >
      <span className="min-w-0 break-all font-mono text-[13px] leading-relaxed">
        {children ?? <code>{value}</code>}
      </span>
      <button
        type="button"
        data-copy={value}
        className={buttonClass}
        aria-label={t("Copy {0}", value)}
      >
        {t("Copy")}
      </button>
    </span>
  );
}
