"use client";

import { useState } from "react";

type Props = {
  href: string;
  filename?: string;
  className?: string;
  children: string;
};

export function DownloadPdfButton({
  href,
  filename = "bitcoin-purity-whitepaper.pdf",
  className = "",
  children,
}: Props) {
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(href);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Cross-origin hosts without CORS still need a fallback.
      window.location.assign(href);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={busy}
      aria-busy={busy}
    >
      {busy ? "Downloading…" : children}
    </button>
  );
}
