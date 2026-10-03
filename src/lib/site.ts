export const SITE_URL = "https://bitcoinpurity.org";
export const SITE_NAME = "Bitcoin Purity";
export const SITE_TAGLINE = "Bitcoin is money. Keep it that way.";
export const SITE_DESCRIPTION =
  "Bitcoin Purity is a Bitcoin full node focused on preserving Bitcoin as peer-to-peer electronic cash through permanent Reduced Data consensus rules while retaining SHA256d and Bitcoin transaction compatibility.";

export function absoluteUrl(path = "/") {
  const pathname = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${pathname.endsWith("/") ? pathname : `${pathname}/`}`;
}

export function pageTitle(title: string) {
  if (title === SITE_NAME) return `${SITE_NAME} — Bitcoin Is Money`;
  return `${title} — ${SITE_NAME}`;
}
