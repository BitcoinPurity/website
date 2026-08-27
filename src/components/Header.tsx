"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Logo } from "./Logo";
import { ExternalLink } from "./ExternalLink";
import { HashLink } from "./HashLink";
import { primaryNav } from "@/content/nav";
import { protocol } from "@/content/protocol";

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85 0 1.71.12 2.51.35 1.9-1.32 2.74-1.05 2.74-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.58 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function NavItem({
  href,
  label,
  title,
  current,
  className,
  onNavigate,
}: {
  href: string;
  label: string;
  title?: string;
  current?: boolean;
  className: string;
  onNavigate?: () => void;
}) {
  if (href.includes("#")) {
    return (
      <HashLink
        href={href}
        title={title}
        className={className}
        onNavigate={onNavigate}
      >
        {label}
      </HashLink>
    );
  }

  return (
    <Link
      href={href}
      title={title}
      aria-current={current ? "page" : undefined}
      className={className}
      onClick={onNavigate}
    >
      {label}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="border-b border-line bg-bg">
      <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-5 py-3 sm:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <Logo size={36} />
          <span className="truncate text-sm font-medium tracking-wide text-ink">
            Bitcoin Purity
          </span>
        </Link>

        <nav
          className="hidden flex-1 items-center justify-center gap-x-5 text-[13px] text-muted xl:flex"
          aria-label="Primary"
        >
          {primaryNav.map((item) => {
            const [pathPart, hash] = item.href.split("#");
            const path = pathPart || "/";
            // Hash links on `/` should not steal the "current" state from the homepage.
            const current = pathname === path && !(path === "/" && hash);
            return (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                title={item.full}
                current={current}
                className={`whitespace-nowrap transition-colors hover:text-ink ${current ? "text-ink" : ""}`}
              />
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/safety"
            className="text-[13px] text-muted hover:text-ink xl:hidden"
          >
            Safety
          </Link>
          <ExternalLink
            href={protocol.github}
            className="hidden text-muted hover:text-ink sm:inline-flex"
          >
            <span className="inline-flex items-center gap-1.5 text-[13px]">
              <GitHubIcon />
              GitHub
            </span>
          </ExternalLink>
          <Link
            href="/run"
            className="inline-flex min-h-11 items-center border border-gold px-3 text-[13px] font-medium text-gold hover:bg-gold hover:text-bg"
          >
            Run a Node
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center border border-line text-ink xl:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <span aria-hidden="true" className="font-mono text-sm">
              {open ? "×" : "☰"}
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div
          id={menuId}
          className="border-t border-line bg-bg xl:hidden"
        >
          <nav
            className="mx-auto flex max-w-[1180px] flex-col px-5 py-3 sm:px-8"
            aria-label="Mobile"
          >
            {primaryNav.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.full}
                className="min-h-11 border-b border-line py-3 text-ink last:border-b-0"
                onNavigate={() => setOpen(false)}
              />
            ))}
            <ExternalLink
              href={protocol.github}
              className="min-h-11 py-3 text-muted"
            >
              GitHub
            </ExternalLink>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
