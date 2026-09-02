/** @typedef {{ ASSETS: { fetch: typeof fetch } }} Env */

/** @param {string} pathname */
function isCssAsset(pathname) {
  return pathname === "/css/site.css" || pathname.startsWith("/css/site.");
}

/** @param {string} pathname */
function isFingerprintedAsset(pathname) {
  return pathname.startsWith("/_next/static/");
}

/**
 * @param {string} pathname
 * @param {string} contentType
 */
function isHtmlDocument(pathname, contentType) {
  if (contentType.includes("text/html")) return true;
  if (pathname.endsWith(".html")) return true;
  if (pathname === "/" || pathname.endsWith("/")) return true;
  const last = pathname.split("/").pop() ?? "";
  return last !== "" && !last.includes(".");
}

/**
 * @param {Request} request
 */
function resolveAssetRequest(request) {
  const url = new URL(request.url);
  const { pathname } = url;

  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/css/") ||
    pathname.includes(".")
  ) {
    return request;
  }

  const assetPath =
    pathname === "/" || pathname === ""
      ? "/index.html"
      : `${pathname.replace(/\/$/, "")}-page.html`;

  const assetUrl = new URL(request.url);
  assetUrl.pathname = assetPath;
  return new Request(assetUrl.toString(), request);
}

export default {
  /** @param {Request} request @param {Env} env */
  async fetch(request, env) {
    const assetRequest = resolveAssetRequest(request);
    const response = await env.ASSETS.fetch(assetRequest);
    const url = new URL(request.url);
    const headers = new Headers(response.headers);
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("text/html") || isHtmlDocument(url.pathname, contentType)) {
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
      headers.set("CDN-Cache-Control", "no-store");
      headers.set("Pragma", "no-cache");
      headers.set("Expires", "0");
    } else if (isFingerprintedAsset(url.pathname)) {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("CDN-Cache-Control", "public, max-age=31536000, immutable");
    } else if (isCssAsset(url.pathname)) {
      headers.set("Cache-Control", "public, max-age=0, must-revalidate");
      headers.set("CDN-Cache-Control", "no-cache");
    } else {
      headers.set("Cache-Control", "public, max-age=0, must-revalidate");
      headers.set("CDN-Cache-Control", "no-cache");
    }

    headers.set("X-Content-Type-Options", "nosniff");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
