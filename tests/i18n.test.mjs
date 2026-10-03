import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  localePath,
  translator,
  locales,
  launchDate,
} from "../src/lib/i18n.ts";

test("localized links retain anchors and leave external and asset paths intact", () => {
  assert.equal(
    localePath("/miners#trial-solo-pool", "zh-CN"),
    "/zh-CN/miners#trial-solo-pool",
  );
  assert.equal(localePath("/#contact", "zh-TW"), "/zh-TW/#contact");
  assert.equal(
    localePath("/zh-CN/users/?a=1#download", "zh-TW"),
    "/zh-TW/users/?a=1#download",
  );
  for (const href of [
    "https://example.org/run",
    "//example.org/run",
    "mailto:a@example.org",
    "#main",
    "/og.png",
    "/_next/a.js",
  ]) {
    assert.equal(localePath(href, "zh-CN"), href);
  }
  assert.equal(localePath("/run", "en"), "/run");
});

test("language switching preserves page, search and fragment", () => {
  assert.equal(
    localePath("/zh-CN/users/?wallet=1#download", "zh-TW"),
    "/zh-TW/users/?wallet=1#download",
  );
  assert.equal(
    localePath("/zh-TW/users/?wallet=1#download", "en"),
    "/users/?wallet=1#download",
  );
  assert.equal(localePath("/?a=1#contact", "zh-CN"), "/zh-CN/?a=1#contact");
});

test("translations preserve dynamic protocol values", () => {
  assert.equal(
    translator("en")("Copy {0}", "stratum+tcp://pool:3333"),
    "Copy stratum+tcp://pool:3333",
  );
  assert.equal(
    translator("zh-CN")("Copy {0}", "stratum+tcp://pool:3333"),
    "复制 stratum+tcp://pool:3333",
  );
  assert.equal(
    translator("zh-TW")("Copy {0}", "stratum+tcp://pool:3333"),
    "複製 stratum+tcp://pool:3333",
  );
});

test("both Chinese dictionaries have complete and matching placeholders", () => {
  const dictionaries = locales
    .filter((locale) => locale !== "en")
    .map((locale) =>
      JSON.parse(
        readFileSync(
          new URL(`../src/lib/locales/${locale}.json`, import.meta.url),
        ),
      ),
    );
  assert.deepEqual(
    Object.keys(dictionaries[0]).sort(),
    Object.keys(dictionaries[1]).sort(),
  );
  for (const dictionary of dictionaries) {
    for (const [key, value] of Object.entries(dictionary)) {
      assert.ok(value.trim(), `empty translation: ${key}`);
      assert.deepEqual(
        value.match(/\{\d+\}/g)?.sort() ?? [],
        key.match(/\{\d+\}/g)?.sort() ?? [],
        key,
      );
    }
  }
});

test("every literal translation used by page and shared component code is present", async () => {
  const { default: ts } = await import("typescript");
  const { readdirSync } = await import("node:fs");
  const dictionary = JSON.parse(
    readFileSync(new URL("../src/lib/locales/zh-CN.json", import.meta.url)),
  );
  function inspect(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = `${dir}/${entry.name}`;
      if (entry.isDirectory()) inspect(file);
      else if (/\.tsx?$/.test(file)) {
        const source = ts.createSourceFile(
          file,
          readFileSync(file, "utf8"),
          ts.ScriptTarget.Latest,
          true,
          file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
        );
        function visit(node) {
          if (
            ts.isCallExpression(node) &&
            node.expression.getText(source) === "t" &&
            ts.isStringLiteral(node.arguments[0])
          ) {
            assert.ok(
              Object.hasOwn(dictionary, node.arguments[0].text.trim()),
              `${file}: ${node.arguments[0].text}`,
            );
          }
          ts.forEachChild(node, visit);
        }
        visit(source);
      }
    }
  }
  inspect(new URL("../src", import.meta.url).pathname);
});

test("copy feedback uses the page language and restores the accessible label", async () => {
  const { runInNewContext } = await import("node:vm");
  for (const [locale, copy, copied] of [
    ["en", "Copy", "Copied"],
    ["zh-CN", "复制", "已复制"],
    ["zh-TW", "複製", "已複製"],
  ]) {
    let onClick;
    let onTimeout;
    let copiedValue;
    const attributes = {
      "data-copy": "stratum+tcp://pool:3333",
      "aria-label": `${copy} stratum+tcp://pool:3333`,
    };
    const button = {
      dataset: {},
      textContent: copy,
      getAttribute: (name) => attributes[name],
      setAttribute: (name, value) => {
        attributes[name] = value;
      },
    };
    runInNewContext(
      readFileSync(new URL("../public/copy.js", import.meta.url), "utf8"),
      {
        document: {
          documentElement: { lang: locale },
          addEventListener: (_, callback) => {
            onClick = callback;
          },
        },
        navigator: {
          clipboard: {
            writeText: async (value) => {
              copiedValue = value;
            },
          },
        },
        window: {
          isSecureContext: true,
          setTimeout: (callback) => {
            onTimeout = callback;
          },
        },
      },
    );
    onClick({ target: { closest: () => button } });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(copiedValue, "stratum+tcp://pool:3333");
    assert.equal(button.textContent, copied);
    onTimeout();
    assert.equal(button.textContent, copy);
    assert.equal(attributes["aria-label"], `${copy} stratum+tcp://pool:3333`);
  }
});

test("launch dates derive from protocol time and use UTC in every locale", () => {
  assert.equal(
    launchDate("en", "2026-08-19T10:00:00Z"),
    "10:00 UTC on 19 August 2026",
  );
  assert.equal(
    launchDate("zh-CN", "2027-01-02T03:04:00Z"),
    "2027年1月2日 03:04 UTC",
  );
  assert.equal(
    launchDate("zh-TW", "2027-01-02T03:04:00Z"),
    "2027年1月2日 03:04 UTC",
  );
});
