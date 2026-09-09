/* global process, console */
// Verifies the generated firearm SVG asset pack against the layered-render
// contract: identical canvas, single neon colour, safe margins, accessories
// physically anchored to their base, and the required composite loadouts.
//
// Run: node scripts/verify-firearm-assets.mjs
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { CANVAS, GREEN } from "./generate-firearm-assets.mjs";

const require = createRequire(import.meta.url);
const { PNG } = require("pngjs");

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const ASSETS = join(ROOT, "assets", "images", "firearms");
const MIN_EDGE_GAP = 40;
const ANCHOR_DILATION = 10;

const EXPECTED = {
  pistol: ["red-dot", "flashlight", "laser", "suppressor"],
  revolver: [],
  pcc: ["red-dot", "magnifier", "scope", "flashlight", "laser", "suppressor", "grip"],
  rifle: ["red-dot", "magnifier", "scope", "flashlight", "laser", "suppressor", "bipod", "grip"],
  "bolt-action-rifle": ["scope", "suppressor", "bipod"],
  shotgun: ["red-dot", "flashlight"],
  other: [],
};

const COMPOSITES = {
  A: ["pistol", "red-dot", "flashlight", "suppressor"],
  B: ["pcc", "red-dot", "magnifier", "flashlight"],
  C: ["rifle", "red-dot", "magnifier", "flashlight", "suppressor", "grip"],
  D: ["bolt-action-rifle", "scope", "bipod", "suppressor"],
  E: ["shotgun", "red-dot", "flashlight"],
};

const failures = [];
const fail = (msg) => failures.push(msg);
const scratch = mkdtempSync(join(tmpdir(), "triggernote-firearm-verify-"));

const assetPath = (family, name) =>
  name === "base" ? join(ASSETS, family, "base.svg") : join(ASSETS, family, "layers", `${name}.svg`);

const rasterize = (svgPath) => {
  const out = join(scratch, `${svgPath.replaceAll("/", "_")}.png`);
  execFileSync("rsvg-convert", ["-w", String(CANVAS), "-h", String(CANVAS), svgPath, "-o", out]);
  return PNG.sync.read(readFileSync(out));
};

const maskOf = (png) => {
  const mask = new Uint8Array(CANVAS * CANVAS);
  for (let i = 0; i < CANVAS * CANVAS; i++) mask[i] = png.data[(i << 2) + 3] > 8 ? 1 : 0;
  return mask;
};

const boundsOf = (mask) => {
  const b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity, count: 0 };
  for (let y = 0; y < CANVAS; y++) {
    for (let x = 0; x < CANVAS; x++) {
      if (!mask[y * CANVAS + x]) continue;
      b.count += 1;
      if (x < b.minX) b.minX = x;
      if (x > b.maxX) b.maxX = x;
      if (y < b.minY) b.minY = y;
      if (y > b.maxY) b.maxY = y;
    }
  }
  return b;
};

const dilate = (mask, r) => {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < CANVAS; y++) {
    for (let x = 0; x < CANVAS; x++) {
      if (!mask[y * CANVAS + x]) continue;
      for (let dy = -r; dy <= r; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= CANVAS) continue;
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx;
          if (xx >= 0 && xx < CANVAS) out[yy * CANVAS + xx] = 1;
        }
      }
    }
  }
  return out;
};

const overlapCount = (a, b) => {
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i] && b[i]) n += 1;
  return n;
};

const bboxesDisjoint = (a, b) => a.maxX < b.minX || b.maxX < a.minX || a.maxY < b.minY || b.maxY < a.minY;

const checkSvgSource = (file) => {
  const src = readFileSync(file, "utf8");
  if (!src.includes(`viewBox="0 0 ${CANVAS} ${CANVAS}"`)) fail(`${file}: wrong viewBox`);
  if (!src.includes(`width="${CANVAS}" height="${CANVAS}"`)) fail(`${file}: wrong intrinsic size`);
  if (!src.includes(`stroke="${GREEN}"`)) fail(`${file}: missing theme stroke colour`);
  const colours = [...src.matchAll(/#[0-9a-fA-F]{3,8}/g)].map((m) => m[0].toLowerCase());
  for (const c of colours) if (c !== GREEN) fail(`${file}: unexpected colour ${c}`);
  if (/fill="(?!none")/.test(src)) fail(`${file}: filled shape found`);
  if (/<(filter|image|text|linearGradient|radialGradient)\b/.test(src)) fail(`${file}: disallowed element`);
};

const checkPixels = (png, label) => {
  for (let i = 0; i < CANVAS * CANVAS; i++) {
    const a = png.data[(i << 2) + 3];
    if (a === 0) continue;
    const [r, g, b] = [png.data[i << 2], png.data[(i << 2) + 1], png.data[(i << 2) + 2]];
    if (r > 40 || g < 200 || b > 40) {
      fail(`${label}: non-green pixel rgb(${r},${g},${b}) a=${a}`);
      return;
    }
  }
};

for (const [family, layers] of Object.entries(EXPECTED)) {
  const dir = join(ASSETS, family, "layers");
  const onDisk = existsSync(dir) ? readdirSync(dir).map((f) => f.replace(/\.svg$/, "")).sort() : [];
  const expectedSorted = [...layers].sort();
  if (JSON.stringify(onDisk) !== JSON.stringify(expectedSorted)) {
    fail(`${family}: layers on disk ${onDisk.join(",")} != expected ${expectedSorted.join(",")}`);
  }

  const baseFile = assetPath(family, "base");
  checkSvgSource(baseFile);
  const basePng = rasterize(baseFile);
  checkPixels(basePng, `${family}/base`);
  const baseMask = maskOf(basePng);
  const baseAnchor = dilate(baseMask, ANCHOR_DILATION);
  const union = { ...boundsOf(baseMask) };
  const layerBounds = {};

  for (const name of layers) {
    const file = assetPath(family, name);
    checkSvgSource(file);
    const png = rasterize(file);
    checkPixels(png, `${family}/${name}`);
    const mask = maskOf(png);
    const b = boundsOf(mask);
    layerBounds[name] = b;
    if (b.count === 0) fail(`${family}/${name}: empty layer`);
    if (b.count > union.count * 0.6) fail(`${family}/${name}: layer too large (${b.count}px) - base pixels leaked?`);
    if (overlapCount(mask, baseAnchor) === 0) fail(`${family}/${name}: accessory floats - does not touch the firearm`);
    union.minX = Math.min(union.minX, b.minX);
    union.minY = Math.min(union.minY, b.minY);
    union.maxX = Math.max(union.maxX, b.maxX);
    union.maxY = Math.max(union.maxY, b.maxY);
  }

  const gaps = [union.minX, union.minY, CANVAS - 1 - union.maxX, CANVAS - 1 - union.maxY];
  if (Math.min(...gaps) < MIN_EDGE_GAP) fail(`${family}: full loadout too close to canvas edge (gaps ${gaps.join("/")})`);

  if (layerBounds["red-dot"] && layerBounds.magnifier) {
    const rd = layerBounds["red-dot"];
    const mg = layerBounds.magnifier;
    if (!bboxesDisjoint(rd, mg)) fail(`${family}: red-dot and magnifier overlap`);
    if (mg.minX > rd.minX) fail(`${family}: magnifier must sit behind (left of) the red dot`);
  }

  if (layerBounds.suppressor) {
    const baseBounds = boundsOf(baseMask);
    const gap = layerBounds.suppressor.minX - baseBounds.maxX;
    if (gap > 12 || gap < -80) fail(`${family}: suppressor not abutting the muzzle (gap ${gap}px)`);
  }

  console.log(`${family.padEnd(18)} ok  base=${boundsOf(baseMask).count}px layers=${layers.length} edge-gap=${Math.min(...gaps)}`);
}

for (const [test, [family, ...layers]] of Object.entries(COMPOSITES)) {
  const files = ["base", ...layers].map((n) => assetPath(family, n));
  for (const f of files) if (!existsSync(f)) fail(`composite ${test}: missing ${f}`);
  console.log(`composite ${test}: ${family} + ${layers.join(" + ")} -> ${files.every(existsSync) ? "ok" : "FAIL"}`);
}

if (failures.length) {
  console.error(`\n${failures.length} failure(s):`);
  for (const f of failures) console.error(" - " + f);
  process.exit(1);
}
console.log("\nall firearm assets verified");
