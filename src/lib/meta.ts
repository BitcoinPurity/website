import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, pageTitle } from "./site";

export function pageMeta(
  title: string,
  path: string,
  description: string = SITE_DESCRIPTION,
): Metadata {
  const canonical = path === "/" ? SITE_URL : `${SITE_URL}${path}`;
  const resolved = path === "/" ? pageTitle(SITE_NAME) : pageTitle(title);

  return {
    title: path === "/" ? { absolute: resolved } : title,
    description,
    alternates: { canonical },
    openGraph: {
      title: resolved,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "en_US",
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
