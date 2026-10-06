import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { locales, localePath } from "../src/lib/i18n.ts";
import { routes } from "../src/content/nav.ts";
import worker from "../worker/index.js";

const origin = "https://bitcoinpurity.org";
const pageUrl = (path) => `${origin}${path.replace(/\/?$/, "/")}`;
const sitemap = readFileSync(
  new URL("../out/sitemap.xml", import.meta.url),
  "utf8",
);

test("Contact shows Discord server and BBS links on every localized homepage and footer", () => {
  for (const locale of locales) {
    for (const route of routes) {
      const path = localePath(route, locale).replace(/\/$/, "");
      const html = readFileSync(
        new URL(`../out${path}/index.html`, import.meta.url),
        "utf8",
      ).replace(/<script[\s\S]*?<\/script>/g, "");
      const sections = [html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0]];
      if (route === "/") {
        sections.push(html.match(/<div id="contact"[\s\S]*?<\/section>/)?.[0]);
      }
      for (const section of sections) {
        assert.ok(section, `${path}: Contact section`);
        for (const href of [
          "https://discord.gg/yjyz9JcZT",
          "https://bbs.bitcoinpurity.org/",
        ]) {
          assert.ok(section.includes(`href="${href}"`), `${path}: ${href}`);
        }
        assert.ok(section.includes("Discord server"), `${path}: Discord label`);
      }
    }
  }
});

test("all languages show v1.0.1 as the latest stable release and use its download and source tag", () => {
  for (const [locale, stable, latest] of [
    ["en", "stable release", "Latest release"],
    ["zh-CN", "正式版", "最新版本"],
    ["zh-TW", "正式版", "最新版本"],
  ]) {
    for (const route of routes) {
      const path = localePath(route, locale).replace(/\/$/, "");
      const html = readFileSync(
        new URL(`../out${path}/index.html`, import.meta.url),
        "utf8",
      );
      const text = html.replace(/<script[\s\S]*?<\/script>/g, "");
      assert.ok(
        !/v?1\.0\.0rc\d+/.test(html),
        `${path}: obsolete release candidate`,
      );
      if (["/", "/run", "/miners", "/developers", "/faq"].includes(route)) {
        assert.ok(text.includes("v1.0.1"), path);
        assert.ok(text.toLowerCase().includes(stable), path);
        assert.ok(
          !/\(release candidate\)|（候选发布版）|（候選發布版）/.test(text),
          `${path}: release candidate label`,
        );
      }
      if (["/", "/run", "/miners"].includes(route)) {
        assert.ok(text.includes(latest), path);
        assert.ok(
          text.includes('href="https://github.com/saltduck/bitcoinpurity/releases/tag/v1.0.1"'),
          path,
        );
        assert.ok(
          text.includes('href="https://github.com/saltduck/bitcoinpurity/tree/v1.0.1"'),
          path,
        );
      }
      if (route === "/run") {
        assert.ok(text.includes("git checkout v1.0.1"), path);
      }
      assert.ok(
        !/https:\/\/github\.com\/saltduck\/bitcoinpurity\/(?:releases\/tag|tree)\/v1\.0\.0\b|git checkout v1\.0\.0\b|\/Purity:1\.0\.0\//.test(text),
        `${path}: obsolete release link, command or node identifier`,
      );
      if (route === "/faq") {
        assert.ok(text.includes("/Satoshi:29.4/Purity:1.0.1/"), path);
      }
      if (route === "/users") {
        assert.ok(
          text.includes('href="https://github.com/BitcoinPurity/PurityWallet/releases/tag/1.0.0"'),
          path,
        );
      }
    }
  }
});

test("all 33 static pages have localized content, metadata and working Worker asset aliases", async () => {
  for (const locale of locales) {
    for (const route of routes) {
      const path = localePath(route, locale);
      const dir = path.replace(/\/$/, "") || "";
      const html = readFileSync(
        new URL(`../out${dir}/index.html`, import.meta.url),
        "utf8",
      );
      assert.ok(html.includes(`<html lang="${locale}"`), path);
      assert.ok(html.includes(`rel="canonical" href="${pageUrl(path)}"`), path);
      for (const alternate of locales) {
        assert.ok(
          html.includes(
            `hrefLang="${alternate}" href="${pageUrl(localePath(route, alternate))}"`,
          ),
          `${path}: ${alternate}`,
        );
      }
      assert.ok(
        html.includes(`hrefLang="x-default" href="${pageUrl(route)}"`),
        path,
      );
      assert.ok(sitemap.includes(`<loc>${pageUrl(path)}</loc>`), path);
      const text = html.replace(/<script[\s\S]*?<\/script>/g, "");
      assert.ok(
        text.includes(
          locale === "en"
            ? "Run a Node"
            : locale === "zh-CN"
              ? "运行节点"
              : "執行節點",
        ),
        path,
      );
      if (locale !== "en") {
        assert.ok(
          /[\u3400-\u9fff]/.test(text.match(/<title>(.*?)<\/title>/s)[1]),
          `${path}: title`,
        );
        assert.ok(
          /[\u3400-\u9fff]/.test(
            text.match(/name="description" content="([^"]+)"/)[1],
          ),
          `${path}: description`,
        );
      }
      for (const match of text.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
        const href = match[1];
        if (href.startsWith("/") && !href.startsWith("//")) {
          assert.equal(href, localePath(href, locale), `${path}: ${href}`);
        }
      }
      assert.ok(html.includes("/copy.js?v="), path);
      for (const suffix of ["", "/"]) {
        let assetPath;
        const response = await worker.fetch(
          new Request(`${origin}${path.replace(/\/$/, "")}${suffix}`),
          {
            ASSETS: {
              fetch: async (request) => {
                assetPath = new URL(request.url).pathname;
                return new Response(
                  readFileSync(new URL(`../out${assetPath}`, import.meta.url)),
                  { headers: { "content-type": "text/html" } },
                );
              },
            },
          },
        );
        assert.equal(response.status, 200, `${path}: ${assetPath}`);
        assert.equal(await response.text(), html, path);
      }
    }
  }
  assert.equal((sitemap.match(/<loc>/g) ?? []).length, 33);
});

test("Chinese wallet, mining and safety pages preserve compatibility boundaries and raw commands", () => {
  for (const locale of ["zh-CN", "zh-TW"]) {
    const wallet = readFileSync(
      new URL(`../out/${locale}/users/index.html`, import.meta.url),
      "utf8",
    );
    assert.ok(wallet.includes("Sparrow Wallet 2.5.3"));
    assert.ok(wallet.includes("electrum.bitcoinpurity.org:50002:s"));
    assert.ok(wallet.includes("app-debug.apk"));
    assert.ok(wallet.includes("npm ci"));
    const miners = readFileSync(
      new URL(`../out/${locale}/miners/index.html`, import.meta.url),
      "utf8",
    );
    assert.ok(miners.includes("smartpool-a.bitcoinpurity.org:3333"));
    assert.ok(miners.includes("23334"));
    const safety = readFileSync(
      new URL(`../out/${locale}/safety/index.html`, import.meta.url),
      "utf8",
    );
    assert.ok(
      safety.includes(
        locale === "zh-CN" ? "双花冻结尚未实现" : "雙花凍結尚未實現",
      ),
    );
  }
});

test("mobile navigation is included in static HTML for each language", () => {
  for (const [locale, label] of [
    ["en", "Mobile"],
    ["zh-CN", "移动端导航"],
    ["zh-TW", "移動端導航"],
  ]) {
    const path = localePath("/", locale).replace(/\/$/, "");
    const html = readFileSync(
      new URL(`../out${path}/index.html`, import.meta.url),
      "utf8",
    );
    assert.ok(html.includes(`aria-label="${label}"`), locale);
  }
});
