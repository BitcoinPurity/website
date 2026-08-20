import {
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "out");
const chunksDir = join(outDir, "_next/static/chunks");
const cssFiles = readdirSync(chunksDir).filter((name) => name.endsWith(".css"));

if (cssFiles.length === 0) {
  throw new Error("No CSS files found in out/_next/static/chunks");
}

mkdirSync(join(outDir, "css"), { recursive: true });
writeFileSync(
  join(outDir, "css/site.css"),
  cssFiles.map((name) => readFileSync(join(chunksDir, name), "utf8")).join("\n"),
);

const stylesheet =
  '<link rel="stylesheet" href="/css/site.css" data-precedence="site"/>';
const copyScript = '<script src="/copy.js" defer></script>';

function inject(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      inject(path);
      continue;
    }
    if (!entry.name.endsWith(".html")) continue;

    let html = readFileSync(path, "utf8");
    html = html.replace(/<link rel="stylesheet" href="\/_next\/static\/chunks\/[^"]+\.css"[^>]*>/g, "");
    if (!html.includes('href="/css/site.css"')) {
      html = html.replace("</head>", `${stylesheet}</head>`);
    }
    if (!html.includes('src="/copy.js"')) {
      html = html.replace("</body>", `${copyScript}</body>`);
    }
    writeFileSync(path, html);
  }
}

inject(outDir);
