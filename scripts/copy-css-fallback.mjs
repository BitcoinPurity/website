import {
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getBuildId, getBuildIdShort } from "./build-id.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "out");
const chunksDir = join(outDir, "_next/static/chunks");
const cssFiles = readdirSync(chunksDir).filter((name) => name.endsWith(".css"));
const buildId = getBuildId();
const buildIdShort = getBuildIdShort(buildId);

if (cssFiles.length === 0) {
  throw new Error("No CSS files found in out/_next/static/chunks");
}

const cssDir = join(outDir, "css");
mkdirSync(cssDir, { recursive: true });

const cssFileName = "site.css";
const cssPath = `/css/${cssFileName}?v=${buildIdShort}`;
writeFileSync(
  join(cssDir, cssFileName),
  cssFiles.map((name) => readFileSync(join(chunksDir, name), "utf8")).join("\n"),
);

const stylesheet = `<link rel="stylesheet" href="${cssPath}" data-precedence="site"/>`;
const copyScript = `<script src="/copy.js?v=${buildIdShort}" defer></script>`;
const buildMeta = `<meta name="x-build-id" content="${buildId}"/>`;

function inject(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      inject(path);
      continue;
    }
    if (!entry.name.endsWith(".html")) continue;

    let html = readFileSync(path, "utf8");
    html = html.replace(
      /<link rel="stylesheet" href="\/_next\/static\/chunks\/[^"]+\.css"[^>]*>/g,
      "",
    );
    html = html.replace(
      /<link rel="stylesheet" href="\/css\/site(?:\.[^"?]+)?\.css[^"]*"[^>]*>/g,
      "",
    );
    if (!html.includes(cssPath)) {
      html = html.replace("</head>", `${stylesheet}</head>`);
    }
    if (!html.includes('name="x-build-id"')) {
      html = html.replace("</head>", `${buildMeta}</head>`);
    }
    html = html.replace(
      /<script src="\/copy\.js(\?v=[^"]*)?" defer><\/script>/g,
      "",
    );
    if (!html.includes("/copy.js")) {
      html = html.replace("</body>", `${copyScript}</body>`);
    }
    writeFileSync(path, html);
  }
}

inject(outDir);

const skipMirror = new Set(["index.html", "404.html", "_not-found.html"]);
for (const entry of readdirSync(outDir)) {
  if (!entry.endsWith(".html") || skipMirror.has(entry)) continue;

  const route = entry.slice(0, -".html".length);
  const routeDir = join(outDir, route);
  mkdirSync(routeDir, { recursive: true });
  writeFileSync(
    join(routeDir, "index.html"),
    readFileSync(join(outDir, entry), "utf8"),
  );
}

writeFileSync(
  join(outDir, ".assetsignore"),
  ["_headers", "_redirects", ".assetsignore", "build-id.txt"].join("\n") + "\n",
);
writeFileSync(join(outDir, "build-id.txt"), `${buildId}\n`);
