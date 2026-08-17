export const SITE_URL = "https://bitcoinpurity.org";
export const SITE_NAME = "Bitcoin Purity";
export const SITE_TAGLINE = "Bitcoin is money. Keep it that way.";
export const SITE_DESCRIPTION =
  "Bitcoin Purity is a Bitcoin full node focused on preserving Bitcoin as peer-to-peer electronic cash through permanent Reduced Data consensus rules while retaining SHA256d and Bitcoin transaction compatibility.";

export function absoluteUrl(path = "/") {
  if (path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageTitle(title: string) {
  if (title === SITE_NAME) return `${SITE_NAME} — Bitcoin Is Money`;
  return `${title} — ${SITE_NAME}`;
}
