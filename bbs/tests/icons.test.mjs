import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("BBS favicon fallbacks have valid sizes and differ from the main site", () => {
  for (const size of [16, 32]) {
    const png = readFileSync(new URL(`../public/favicon-${size}.png`, import.meta.url));
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(png.subarray(12, 16).toString(), "IHDR");
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
    assert.notDeepEqual(png, readFileSync(new URL(`../../public/favicon-${size}.png`, import.meta.url)));
  }
  const ico = readFileSync(new URL("../public/favicon.ico", import.meta.url));
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 2);
  for (const [index, size] of [16, 32].entries()) {
    const entry = 6 + index * 16;
    assert.equal(ico[entry], size);
    assert.equal(ico[entry + 1], size);
    const length = ico.readUInt32LE(entry + 8);
    const offset = ico.readUInt32LE(entry + 12);
    assert.deepEqual(ico.subarray(offset, offset + length), readFileSync(new URL(`../public/favicon-${size}.png`, import.meta.url)));
  }
});
