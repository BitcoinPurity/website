"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode, MouseEvent } from "react";
import { scrollToAnchor } from "@/lib/scroll-to-anchor";

/** Next.js Link often skips hash scrolling; handle same-page and cross-page hashes explicitly. */
export function HashLink({
  href,
  children,
  className,
  title,
  onNavigate,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  title?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [pathPart, hash] = href.split("#");
  const path = pathPart || "/";

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    onNavigate?.();
    if (!hash) return;

    // Same page: update the hash and scroll without a route transition.
    if (pathname === path) {
      event.preventDefault();
      window.history.pushState(null, "", `#${hash}`);
      scrollToAnchor(hash);
      return;
    }

    // Other page: hard navigate so the browser lands on the hash target.
    event.preventDefault();
    window.location.assign(href);
  }

  return (
    <Link
      href={href}
      title={title}
      className={className}
      scroll={false}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
