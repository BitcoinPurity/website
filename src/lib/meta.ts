import {
  translator,
  launchDay,
  localePath,
  locales,
  ogLocales,
  type Locale,
} from "./i18n";
import { protocol } from "@/content/protocol";
import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl, pageTitle } from "./site";

export function pageMeta(
  title: string,
  path: string,
  description: string = SITE_DESCRIPTION,
  locale: Locale = "en",
): Metadata {
  const t = translator(locale);
  const canonical = absoluteUrl(localePath(path, locale));
  const resolved =
    path === "/"
      ? `${SITE_NAME} — ${t("Bitcoin Is Money")}`
      : pageTitle(t(title));
  description = t(description);

  return {
    title: path === "/" ? { absolute: resolved } : t(title),
    description,
    alternates: {
      canonical,
      languages: Object.fromEntries([
        ...locales.map((value) => [
          value,
          absoluteUrl(localePath(path, value)),
        ]),
        ["x-default", absoluteUrl(path)],
      ]),
    },
    openGraph: {
      title: resolved,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: ogLocales[locale],
      alternateLocale: locales
        .filter((value) => value !== locale)
        .map((value) => ogLocales[value]),
      type: "website",
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: "Bitcoin Purity",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolved,
      description,
      images: ["/og.png"],
    },
  };
}

const pageInfo = {
  "/": { title: "Bitcoin Purity", description: SITE_DESCRIPTION },
  "/developers": {
    title: "Developers",
    description:
      "Source of truth for Bitcoin Purity is the repository: vision, consensus, roadmap, and build documentation.",
  },
  "/faq": {
    title: "FAQ",
    description:
      "Answers about Bitcoin Purity: mainnet launch, not a new coin, hard fork rationale, replay behavior, hash-rate risk, and unimplemented protections.",
  },
  "/how-it-works": {
    title: "How It Works",
    description:
      "Permanent Reduced Data consensus, SHA256d, ASERT, and Bitcoin transaction compatibility as specified in the Bitcoin Purity repository.",
  },
  "/miners": {
    title: "For Miners",
    description:
      "Bitcoin Purity keeps SHA256d proof-of-work. Mainnet launched {0} at {1}. Activation is hardcoded at block {2}.",
  },
  "/roadmap": {
    title: "Roadmap",
    description:
      "Bitcoin Purity short-term work in this tree versus later research direction that is not scheduled and not implemented.",
  },
  "/run": {
    title: "Run a Node",
    description: "Download Bitcoin Purity binaries or build from source.",
  },
  "/safety": {
    title: "Safety",
    description:
      "During the Bitcoin Purity transition, treat settlement conservatively. Majority hash power cannot spend other people’s coins, but reorg and double-spend risk remains.",
  },
  "/users": {
    title: "For Users",
    description:
      "Bitcoin Purity keeps Bitcoin addresses, transaction format, and sighash. Compatibility is not the same as finality.",
  },
  "/whitepaper": {
    title: "Whitepaper",
    description: "Read and download the Bitcoin Purity whitepaper.",
  },
  "/why-purity": {
    title: "Why Purity",
    description:
      "Bitcoin Purity exists to keep Bitcoin as money and a payment system in consensus, not only in policy.",
  },
} as const;

export function routeMeta(path: string, locale: Locale = "en"): Metadata {
  const info = pageInfo[path as keyof typeof pageInfo];
  const date = launchDay(locale, protocol.launch.isoUtc);
  return pageMeta(
    info.title,
    path,
    translator(locale)(
      info.description,
      date,
      protocol.launch.timeLabel,
      protocol.launch.activationHeight,
    ),
    locale,
  );
}
