// One-time developer placeholder artwork generator for the firearm visual
// loadout system. Produces 1024×1024 transparent RGBA PNGs: accessory layers
// plus the two base silhouettes that have no existing art (bolt-action rifle,
// other). Real art direction is a later phase; this script exists so the typed
// manifest has a real asset for every entry and the layered renderer is
// end-to-end functional.
//
// Run: node scripts/generate-firearm-assets.mjs
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { PNG } = require("pngjs");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "assets", "images", "firearms");

const W = 1024;
const H = 1024;
const GREEN = [0, 255, 0, 255];
const GREEN_DIM = [0, 255, 0, 90];

const makeCanvas = () => {
  const png = new PNG({ width: W, height: H });
  return png;
};

const setPx = (png, x, y, [r, g, b, a]) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const idx = (y * W + x) << 2;
  const srcA = a / 255;
  const dstA = png.data[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA === 0) return;
  png.data[idx] = Math.round((r * srcA + png.data[idx] * dstA * (1 - srcA)) / outA);
  png.data[idx + 1] = Math.round((g * srcA + png.data[idx + 1] * dstA * (1 - srcA)) / outA);
  png.data[idx + 2] = Math.round((b * srcA + png.data[idx + 2] * dstA * (1 - srcA)) / outA);
  png.data[idx + 3] = Math.round(outA * 255);
};

const fillRect = (png, x0, y0, x1, y1, color) => {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) setPx(png, x, y, color);
};

const fillCircle = (png, cx, cy, r, color) => {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) setPx(png, x, y, color);
    }
  }
};

const outlineRect = (png, x0, y0, x1, y1, t, color) => {
  fillRect(png, x0, y0, x1, y0 + t - 1, color);
  fillRect(png, x0, y1 - t + 1, x1, y1, color);
  fillRect(png, x0, y0, x0 + t - 1, y1, color);
  fillRect(png, x1 - t + 1, y0, x1, y1, color);
};

const save = (png, relPath) => {
  const full = join(OUT, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, PNG.sync.write(png));
  console.log("wrote", relPath);
};

// ── accessory layers ──────────────────────────────────────────────────────

const drawRedDot = (png) => {
  // base mount + window housing
  fillRect(png, 380, 330, 470, 360, GREEN_DIM);
  outlineRect(png, 380, 330, 470, 360, 4, GREEN);
  // hood + lens
  fillRect(png, 405, 300, 445, 330, GREEN_DIM);
  outlineRect(png, 405, 300, 445, 330, 4, GREEN);
  fillCircle(png, 425, 315, 14, GREEN);
};

const drawMagnifier = (png) => {
  fillRect(png, 250, 340, 350, 380, GREEN_DIM);
  outlineRect(png, 250, 340, 350, 380, 4, GREEN);
  fillCircle(png, 300, 360, 16, GREEN);
  fillRect(png, 330, 345, 350, 375, GREEN);
};

const drawScope = (png) => {
  fillRect(png, 250, 330, 470, 360, GREEN_DIM);
  outlineRect(png, 250, 330, 470, 360, 4, GREEN);
  fillCircle(png, 360, 345, 13, GREEN);
  fillRect(png, 300, 322, 330, 368, GREEN);
  fillRect(png, 420, 322, 450, 368, GREEN);
};

const drawFlashlight = (png) => {
  fillRect(png, 640, 570, 800, 620, GREEN_DIM);
  outlineRect(png, 640, 570, 800, 620, 4, GREEN);
  fillRect(png, 760, 580, 800, 610, GREEN);
  fillCircle(png, 655, 595, 10, GREEN);
};

const drawSuppressor = (png) => {
  fillRect(png, 840, 430, 1000, 500, GREEN_DIM);
  outlineRect(png, 840, 430, 1000, 500, 4, GREEN);
  for (let x = 880; x <= 960; x += 40) fillRect(png, x, 432, x + 8, 498, GREEN);
};

const drawGrip = (png) => {
  fillRect(png, 490, 580, 550, 730, GREEN_DIM);
  outlineRect(png, 490, 580, 550, 730, 4, GREEN);
  fillRect(png, 496, 590, 544, 600, GREEN);
  fillRect(png, 496, 700, 544, 710, GREEN);
};

const drawBipod = (png) => {
  // two legs fanning down from a front mounting point
  for (let i = 0; i < 16; i++) {
    const t = i / 15;
    const x = 700 + t * 80;
    const y = 660 + t * 120;
    fillCircle(png, x, y, 6, GREEN);
  }
  for (let i = 0; i < 16; i++) {
    const t = i / 15;
    const x = 820 - t * 80;
    const y = 660 + t * 120;
    fillCircle(png, x, y, 6, GREEN);
  }
  fillRect(png, 730, 650, 790, 666, GREEN);
};

// ── base silhouettes (bolt-action rifle, other) ───────────────────────────

const drawRifleBody = (png, withBolt = false) => {
  // barrel
  fillRect(png, 480, 470, 920, 520, GREEN_DIM);
  outlineRect(png, 480, 470, 920, 520, 4, GREEN);
  // receiver + stock
  fillRect(png, 200, 480, 500, 540, GREEN_DIM);
  outlineRect(png, 200, 480, 500, 540, 4, GREEN);
  // pistol grip
  fillRect(png, 300, 540, 350, 620, GREEN_DIM);
  outlineRect(png, 300, 540, 350, 620, 4, GREEN);
  if (withBolt) {
    fillCircle(png, 430, 500, 14, GREEN);
    fillRect(png, 424, 470, 436, 500, GREEN);
  }
  // trigger guard
  outlineRect(png, 360, 560, 400, 600, 4, GREEN);
};

const drawBoltActionBase = (png) => {
  drawRifleBody(png, true);
  // scope rail + magazine
  fillRect(png, 260, 452, 460, 470, GREEN);
  fillRect(png, 380, 620, 430, 640, GREEN_DIM);
  outlineRect(png, 380, 620, 430, 640, 4, GREEN);
};

const drawOtherBase = (png) => {
  drawRifleBody(png, false);
};

const layerWriters = {
  "red-dot": drawRedDot,
  magnifier: drawMagnifier,
  scope: drawScope,
  flashlight: drawFlashlight,
  suppressor: drawSuppressor,
  grip: drawGrip,
  bipod: drawBipod,
};

const layerByType = {
  pistol: ["red-dot", "flashlight"],
  revolver: [],
  pcc: ["red-dot", "magnifier", "flashlight"],
  rifle: ["red-dot", "magnifier", "scope", "flashlight", "suppressor", "grip"],
  "bolt-action-rifle": ["scope", "bipod"],
  shotgun: ["red-dot", "flashlight"],
  other: [],
};

for (const [type, layers] of Object.entries(layerByType)) {
  for (const name of layers) {
    const png = makeCanvas();
    layerWriters[name](png);
    save(png, `${type}/layers/${name}.png`);
  }
}

const boltBase = makeCanvas();
drawBoltActionBase(boltBase);
save(boltBase, "bolt-action-rifle/base.png");

const otherBase = makeCanvas();
drawOtherBase(otherBase);
save(otherBase, "other/base.png");

console.log("done");
