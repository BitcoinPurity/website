"use client";

import { useEffect } from "react";

/** Scroll to a page section on mount (accounts for sticky chrome via scroll-margin). */
export function ScrollToId({ id }: { id: string }) {
  useEffect(() => {
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [id]);

  return null;
}
