import type { MetadataRoute } from "next";
import { locales, localePath } from "@/lib/i18n";
import { routes } from "@/content/nav";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) =>
    routes.map((path) => ({
      url: absoluteUrl(localePath(path, locale)),
      alternates: {
        languages: Object.fromEntries(
          locales.map((value) => [value, absoluteUrl(localePath(path, value))]),
        ),
      },
      changeFrequency: path === "/" ? "weekly" : "monthly",
      priority: path === "/" ? 1 : path === "/safety" ? 0.9 : 0.7,
    })),
  );
}
