import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/site";
import { protocol } from "@/content/protocol";
import "@/app/globals.css";
import { translator, localePath, type Locale } from "@/lib/i18n";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Bitcoin Is Money`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Bitcoin Purity" }],
  openGraph: {
    title: `${SITE_NAME} — Bitcoin Is Money`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "Bitcoin Purity" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Bitcoin Is Money`,
    description: SITE_DESCRIPTION,
    images: ["/og.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  codeRepository: protocol.github,
  programmingLanguage: "C++",
  license: protocol.docs.copying,
  isAccessibleForFree: true,
  additionalType: "https://schema.org/SoftwareApplication",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Linux, macOS, Windows",
  slogan: SITE_TAGLINE,
};

export function SiteLayout({
  children,
  locale = "en",
}: {
  children: React.ReactNode;
  locale?: Locale;
}) {
  const t = translator(locale);
  return (
    <html
      lang={locale}
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg font-sans text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              ...jsonLd,
              description: t(SITE_DESCRIPTION),
              slogan: t(SITE_TAGLINE),
              url: `${SITE_URL}${localePath("/", locale)}`,
              inLanguage: locale,
            }),
          }}
        />
        <a href="#main" className="skip-link">
          {t("Skip to content")}
        </a>
        <div className="sticky top-0 z-40">
          <Header locale={locale} />
        </div>
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer locale={locale} />
      </body>
    </html>
  );
}
