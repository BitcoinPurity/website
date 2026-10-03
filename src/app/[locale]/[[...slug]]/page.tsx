import { notFound } from "next/navigation";
import HomeView from "@/views/HomeView";
import DevelopersPage from "@/views/DevelopersPage";
import FaqPage from "@/views/FaqPage";
import HowItWorksPage from "@/views/HowItWorksPage";
import MinersPage from "@/views/MinersPage";
import RoadmapPage from "@/views/RoadmapPage";
import RunPage from "@/views/RunPage";
import SafetyPage from "@/views/SafetyPage";
import UsersPage from "@/views/UsersPage";
import WhitepaperPage from "@/views/WhitepaperPage";
import WhyPurityPage from "@/views/WhyPurityPage";
import { routes } from "@/content/nav";
import { isLocale, locales } from "@/lib/i18n";
import { routeMeta } from "@/lib/meta";

const pages = {
  "/": HomeView,
  "/developers": DevelopersPage,
  "/faq": FaqPage,
  "/how-it-works": HowItWorksPage,
  "/miners": MinersPage,
  "/roadmap": RoadmapPage,
  "/run": RunPage,
  "/safety": SafetyPage,
  "/users": UsersPage,
  "/whitepaper": WhitepaperPage,
  "/why-purity": WhyPurityPage,
};

export const dynamicParams = false;

export function generateStaticParams() {
  return locales
    .filter((locale) => locale !== "en")
    .flatMap((locale) =>
      routes.map((path) => ({
        locale,
        slug: path === "/" ? [] : [path.slice(1)],
      })),
    );
}

async function resolvePage(
  params: PageProps<"/[locale]/[[...slug]]">["params"],
) {
  const { locale, slug } = await params;
  const path = `/${(slug ?? []).join("/")}`;
  if (!isLocale(locale) || locale === "en" || !Object.hasOwn(pages, path))
    notFound();
  return { locale, path, View: pages[path as keyof typeof pages] };
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/[[...slug]]">) {
  const { path, locale } = await resolvePage(params);
  return routeMeta(path, locale);
}

export default async function Page({
  params,
}: PageProps<"/[locale]/[[...slug]]">) {
  const { View, locale } = await resolvePage(params);
  return <View locale={locale} />;
}
