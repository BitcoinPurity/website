"use client";

import { useState } from "react";

export function CodeBlock({
  code,
  label,
}: {
  code: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
        <p className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">{label}</p>
        <button
          type="button"
          onClick={copy}
          className="min-h-9 px-2 font-mono text-[11px] tracking-[0.12em] text-gold uppercase"
          aria-label={copied ? `${label} copied` : `Copy ${label}`}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[13px] leading-relaxed text-ink">
        <code>{code}</code>
      </pre>
    </div>
  );
}
