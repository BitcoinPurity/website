"use client";

import { usePathname } from "next/navigation";
import {
  localeNames,
  localePath,
  locales,
  translator,
  type Locale,
} from "@/lib/i18n";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  return (
    <select
      aria-label={translator(locale)("Language")}
      value={locale}
      onChange={(event) => {
        window.location.assign(
          localePath(
            `${pathname}${window.location.search}${window.location.hash}`,
            event.target.value as Locale,
          ),
        );
      }}
      className="min-h-11 max-w-28 border border-line bg-bg px-2 text-[13px] text-ink"
    >
      {locales.map((value) => (
        <option key={value} value={value} lang={value}>
          {localeNames[value]}
        </option>
      ))}
    </select>
  );
}
