import { translator, localePath, type LocalizedProps } from "@/lib/i18n";
import Link from "next/link";
import { Logo } from "./Logo";
import { ExternalLink } from "./ExternalLink";
import { HashLink } from "./HashLink";
import { CONTACT, DOCS, SERVICES } from "@/content/links";
import { protocol } from "@/content/protocol";

export function Footer({ locale = "en" }: LocalizedProps = {}) {
  const t = translator(locale);
  const footerLinks = [
    { href: "/why-purity", label: t("Vision") },
    { href: "/how-it-works", label: t("Consensus") },
    { href: "/roadmap", label: t("Roadmap") },
    { href: "/run", label: t("Build") },
    { href: "/safety", label: t("Safety") },
    { href: "/faq", label: t("FAQ") },
    { href: "/#contact", label: t("Contact") },
  ] as const;

  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.2fr_1fr]">
        <div>
          <Link
            href={localePath("/", locale)}
            className="inline-flex items-center gap-3"
          >
            <Logo size={44} />
            <span className="text-lg text-ink">Bitcoin Purity</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            {t("Bitcoin as pure money and a payment system.")}
          </p>
          <div className="mt-6 space-y-3 text-sm">
            <p className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
              {t("Contact")}
            </p>
            <p>
              <span className="text-muted">{t("Email · ")}</span>
              <a href={CONTACT.emailHref} className="text-ink hover:text-gold">
                {CONTACT.email}
              </a>
            </p>
            <p>
              <span className="text-muted">{t("X · ")}</span>
              <ExternalLink
                locale={locale}
                href={CONTACT.xHref}
                className="text-ink hover:text-gold"
              >
                {CONTACT.x}
              </ExternalLink>
            </p>
            <p>
              <span className="text-muted">{t("Telegram · ")}</span>
              <ExternalLink
                locale={locale}
                href={CONTACT.telegramHref}
                className="text-ink hover:text-gold"
              >
                {CONTACT.telegram}
              </ExternalLink>
            </p>
            <p>
              <span className="text-muted">{t("BBS · ")}</span>
              <ExternalLink
                locale={locale}
                href={CONTACT.bbsHref}
                className="text-ink hover:text-gold"
              >
                {CONTACT.bbs}
              </ExternalLink>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {footerLinks.map((link) =>
            link.href.includes("#") ? (
              <HashLink
                key={link.href}
                href={localePath(link.href, locale)}
                className="text-muted hover:text-ink"
              >
                {t(link.label)}
              </HashLink>
            ) : (
              <Link
                key={link.href}
                href={localePath(link.href, locale)}
                className="text-muted hover:text-ink"
              >
                {t(link.label)}
              </Link>
            ),
          )}
          <ExternalLink
            locale={locale}
            href={SERVICES.bbs}
            className="text-muted hover:text-ink"
          >
            {t("BBS")}
          </ExternalLink>
          <ExternalLink
            locale={locale}
            href={protocol.github}
            className="text-muted hover:text-ink"
          >
            GitHub
          </ExternalLink>
          <ExternalLink
            locale={locale}
            href={DOCS.contributing}
            className="text-muted hover:text-ink"
          >
            {t("Contributing")}
          </ExternalLink>
          <ExternalLink
            locale={locale}
            href={DOCS.security}
            className="text-muted hover:text-ink"
          >
            {t("Security")}
          </ExternalLink>
          <ExternalLink
            locale={locale}
            href={DOCS.copying}
            className="text-muted hover:text-ink"
          >
            {t("MIT license")}
          </ExternalLink>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-2 px-5 py-6 font-mono text-[11px] tracking-[0.12em] text-muted uppercase sm:px-8 sm:flex-row sm:justify-between">
          <p>{t("Open-source software. Verify, don't trust.")}</p>
          <p>{t("MIT license")}</p>
        </div>
      </div>
    </footer>
  );
}
