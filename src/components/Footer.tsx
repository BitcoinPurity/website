import Link from "next/link";
import { Logo } from "./Logo";
import { ExternalLink } from "./ExternalLink";
import { HashLink } from "./HashLink";
import { CONTACT, DOCS } from "@/content/links";
import { protocol } from "@/content/protocol";

const footerLinks = [
  { href: "/why-purity", label: "Vision" },
  { href: "/how-it-works", label: "Consensus" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/run", label: "Build" },
  { href: "/safety", label: "Safety" },
  { href: "/faq", label: "FAQ" },
  { href: "/#contact", label: "Contact" },
] as const;

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.2fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <Logo size={44} />
            <span className="text-lg text-ink">Bitcoin Purity</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Bitcoin as pure money and a payment system.
          </p>
          <div className="mt-6 space-y-3 text-sm">
            <p className="font-mono text-[11px] tracking-[0.2em] text-gold uppercase">
              Contact
            </p>
            <p>
              <span className="text-muted">Email · </span>
              <a href={CONTACT.emailHref} className="text-ink hover:text-gold">
                {CONTACT.email}
              </a>
            </p>
            <p>
              <span className="text-muted">X · </span>
              <ExternalLink
                href={CONTACT.xHref}
                className="text-ink hover:text-gold"
              >
                {CONTACT.x}
              </ExternalLink>
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {footerLinks.map((link) =>
            link.href.includes("#") ? (
              <HashLink
                key={link.href}
                href={link.href}
                className="text-muted hover:text-ink"
              >
                {link.label}
              </HashLink>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted hover:text-ink"
              >
                {link.label}
              </Link>
            ),
          )}
          <ExternalLink
            href={protocol.github}
            className="text-muted hover:text-ink"
          >
            GitHub
          </ExternalLink>
          <ExternalLink
            href={DOCS.contributing}
            className="text-muted hover:text-ink"
          >
            Contributing
          </ExternalLink>
          <ExternalLink
            href={DOCS.security}
            className="text-muted hover:text-ink"
          >
            Security
          </ExternalLink>
          <ExternalLink
            href={DOCS.copying}
            className="text-muted hover:text-ink"
          >
            MIT license
          </ExternalLink>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-2 px-5 py-6 font-mono text-[11px] tracking-[0.12em] text-muted uppercase sm:px-8 sm:flex-row sm:justify-between">
          <p>Open-source software. Verify, don&apos;t trust.</p>
          <p>MIT license</p>
        </div>
      </div>
    </footer>
  );
}
