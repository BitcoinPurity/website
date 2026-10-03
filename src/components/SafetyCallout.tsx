import { translator, type Locale } from "@/lib/i18n";
import type { ReactNode } from "react";
import { StatusBadge } from "./StatusBadge";

export function SafetyCallout({
  locale = "en",
  children,
  title = "Settlement safety during the transition",
}: {
  locale?: Locale;
  children: ReactNode;
  title?: string;
}) {
  const t = translator(locale);

  return (
    <aside
      className="border-l-2 border-gold bg-surface px-5 py-6 sm:px-8 sm:py-8"
      aria-labelledby="safety-callout-title"
    >
      <div className="mb-4">
        <StatusBadge locale={locale} kind="safety" />
      </div>
      <h2
        id="safety-callout-title"
        className="max-w-3xl text-2xl leading-tight text-ink sm:text-3xl"
      >
        {t(title)}
      </h2>
      <div className="mt-5 max-w-3xl space-y-4 text-[1.05rem] leading-relaxed text-muted">
        {children}
      </div>
    </aside>
  );
}
