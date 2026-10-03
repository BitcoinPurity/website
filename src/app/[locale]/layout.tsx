import { notFound } from "next/navigation";
import { SiteLayout, siteMetadata } from "@/components/SiteLayout";
import { isLocale } from "@/lib/i18n";

export const metadata = siteMetadata;

export default async function Layout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === "en") notFound();
  return <SiteLayout locale={locale}>{children}</SiteLayout>;
}
