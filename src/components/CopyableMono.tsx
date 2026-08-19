"use client";

import { useState, type ReactNode } from "react";

export function CopyableMono({
  value,
  invert = false,
  className = "",
  children,
}: {
  value: string;
  invert?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const buttonClass = invert
    ? "min-h-9 shrink-0 px-2 font-mono text-[11px] tracking-[0.12em] uppercase text-bg/80 hover:text-bg"
    : "min-h-9 shrink-0 px-2 font-mono text-[11px] tracking-[0.12em] uppercase text-gold";

  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 ${className}`.trim()}>
      <span className="min-w-0 break-all font-mono text-[13px] leading-relaxed">
        {children ?? <code>{value}</code>}
      </span>
      <button
        type="button"
        onClick={copy}
        className={buttonClass}
        aria-label={copied ? `${value} copied` : `Copy ${value}`}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </span>
  );
}
