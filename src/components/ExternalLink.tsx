import { translator, type Locale } from "@/lib/i18n";
import type { ReactNode } from "react";

type Props = {
  locale?: Locale;
  href: string;
  children: ReactNode;
  className?: string;
};

export function ExternalLink({
  locale = "en",
  href,
  children,
  className = "",
}: Props) {
  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <span className="sr-only">
        {translator(locale)(" (opens in a new tab)")}
      </span>
    </a>
  );
}
