import simplified from "./locales/zh-CN.json" with { type: "json" };
import traditional from "./locales/zh-TW.json" with { type: "json" };

export const locales = ["en", "zh-CN", "zh-TW"] as const;
export type Locale = (typeof locales)[number];
export type LocalizedProps = { locale?: Locale };
export const localeNames: Record<Locale, string> = {
  en: "English",
  "zh-CN": "简体中文",
  "zh-TW": "正體中文",
};
export const ogLocales: Record<Locale, string> = {
  en: "en_US",
  "zh-CN": "zh_CN",
  "zh-TW": "zh_TW",
};

export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}

export function localePath(href: string, locale: Locale): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const pathname = href.split(/[?#]/, 1)[0];
  if (pathname.startsWith("/_next/") || pathname.includes(".")) return href;
  const bare = href.replace(/^\/(zh-CN|zh-TW)(?=\/|[?#]|$)/, "");
  const path =
    !bare || bare.startsWith("?") || bare.startsWith("#") ? `/${bare}` : bare;
  return locale === "en" ? path : `/${locale}${path}`;
}

export function translator(locale: Locale) {
  const dictionary: Record<string, string> =
    locale === "zh-CN" ? simplified : traditional;
  return (text: string, ...values: (string | number)[]): string => {
    const translated =
      locale === "en" ? text : (dictionary[text.trim()] ?? text);
    return translated.replace(/\{(\d+)\}/g, (_, index: string) =>
      String(values[Number(index)]),
    );
  };
}

export function launchDay(locale: Locale, isoUtc: string): string {
  const date = new Date(isoUtc);
  if (locale === "en") {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }
  return `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日`;
}

export function launchDate(locale: Locale, isoUtc: string): string {
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(isoUtc));
  const day = launchDay(locale, isoUtc);
  return locale === "en" ? `${time} UTC on ${day}` : `${day} ${time} UTC`;
}
