"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { scrollToAnchor } from "@/lib/scroll-to-anchor";

function scrollToHash() {
  const id = window.location.hash.slice(1);
  if (!id) return;

  const tryScroll = (attempts: number) => {
    if (scrollToAnchor(id) || attempts <= 0) return;
    requestAnimationFrame(() => tryScroll(attempts - 1));
  };

  tryScroll(40);
}

/** Scroll to the URL hash target just below the sticky chrome. */
export function HashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, [pathname]);

  return null;
}
