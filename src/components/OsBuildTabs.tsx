"use client";

import { translator, type LocalizedProps } from "@/lib/i18n";

import { useState } from "react";
import { CodeBlock } from "./CodeBlock";
import { ExternalLink } from "./ExternalLink";
import { DOCS } from "@/content/links";

const cmake = `cmake -B build
cmake --build build`;

export function OsBuildTabs({ locale = "en" }: LocalizedProps = {}) {
  const t = translator(locale);
  const tabs = [
    {
      id: "unix",
      label: "Unix",
      href: DOCS.buildUnix,
      note: t(
        "Full notes: doc/build-unix.md. Debian/Ubuntu and Fedora dependency lists live in that file.",
      ),
    },
    {
      id: "macos",
      label: "macOS",
      href: DOCS.buildMac,
      note: t("Full notes: doc/build-osx.md."),
    },
    {
      id: "windows",
      label: "Windows",
      href: DOCS.buildWindowsMsvc,
      note: t(
        "MSVC notes: doc/build-windows-msvc.md. Additional Windows notes: doc/build-windows.md.",
      ),
    },
  ] as const;

  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("unix");
  const tab = tabs.find((item) => item.id === active) ?? tabs[0];

  return (
    <div>
      <div
        role="tablist"
        aria-label={t("Build notes by platform")}
        className="flex flex-wrap gap-2"
      >
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
                selected
                  ? "border border-gold text-gold"
                  : "border border-line text-muted"
              }`}
              onClick={() => setActive(item.id)}
            >
              {t(item.label)}
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
        <CodeBlock
          locale={locale}
          code={cmake}
          label={t("{0} CMake", tab.label)}
        />
        <p className="text-sm leading-relaxed text-muted">
          {t(tab.note)}{" "}
          <ExternalLink locale={locale} href={tab.href} className="text-gold">
            {t("Open in the repository")}
          </ExternalLink>
          {tab.id === "windows" ? (
            <>
              {" "}
              ·{" "}
              <ExternalLink
                locale={locale}
                href={DOCS.buildWindows}
                className="text-gold"
              >
                build-windows.md
              </ExternalLink>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
