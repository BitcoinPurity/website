"use client";

import { useState } from "react";
import { CodeBlock } from "./CodeBlock";
import { ExternalLink } from "./ExternalLink";
import { DOCS } from "@/content/links";

const tabs = [
  {
    id: "unix",
    label: "Unix",
    href: DOCS.buildUnix,
    note: "Full notes: doc/build-unix.md. Debian/Ubuntu and Fedora dependency lists live in that file.",
  },
  {
    id: "macos",
    label: "macOS",
    href: DOCS.buildMac,
    note: "Full notes: doc/build-osx.md.",
  },
  {
    id: "windows",
    label: "Windows",
    href: DOCS.buildWindowsMsvc,
    note: "MSVC notes: doc/build-windows-msvc.md. Additional Windows notes: doc/build-windows.md.",
  },
] as const;

const cmake = `cmake -B build
cmake --build build`;

export function OsBuildTabs() {
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("unix");
  const tab = tabs.find((item) => item.id === active) ?? tabs[0];

  return (
    <div>
      <div role="tablist" aria-label="Build notes by platform" className="flex flex-wrap gap-2">
        {tabs.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              id={`tab-${item.id}`}
              aria-controls={`panel-${item.id}`}
              className={`min-h-10 px-4 font-mono text-[12px] tracking-[0.12em] uppercase ${
                selected ? "border border-gold text-gold" : "border border-line text-muted"
              }`}
              onClick={() => setActive(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`panel-${tab.id}`}
        aria-labelledby={`tab-${tab.id}`}
        className="mt-5 space-y-4"
      >
        <CodeBlock code={cmake} label={`${tab.label} CMake`} />
        <p className="text-sm leading-relaxed text-muted">
          {tab.note}{" "}
          <ExternalLink href={tab.href} className="text-gold">
            Open in the repository
          </ExternalLink>
          {tab.id === "windows" ? (
            <>
              {" "}
              ·{" "}
              <ExternalLink href={DOCS.buildWindows} className="text-gold">
                build-windows.md
              </ExternalLink>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
