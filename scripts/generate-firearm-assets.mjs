/* global process, console */
// TriggerNote firearm artwork generator.
//
// Emits the modular 2D layered SVG asset system consumed by
// src/features/firearm-visuals: for every firearm family one BASE image plus
// transparent ACCESSORY OVERLAY images, all sharing an identical
// 1024x1024 viewBox. The renderer stacks them at (0,0) with no translation or
// scaling, so pixel-perfect registration between a base and its layers is the
// primary design constraint here.
//
// How registration is guaranteed:
//   * every family declares its geometry ONCE in a shared design space;
//   * the base and each layer are wrapped in the exact same family transform
//     (rotation + scale + translation), computed from the union envelope of the
//     base AND every accessory, so no runtime combination can ever be cropped.
//
// Style: clean neon-green wireframe (stroke only, no fills, no filters), so
// the files render identically through expo-image on iOS/Android/web.
//
// Output: assets/images/firearms/<family>/base.svg and
//         assets/images/firearms/<family>/layers/<name>.svg
//
// Run: node scripts/generate-firearm-assets.mjs
// Requires rsvg-convert (librsvg) on PATH for envelope measurement; pngjs.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { PNG } = require("pngjs");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "assets", "images", "firearms");

export const CANVAS = 1024;
export const MARGIN = 68;
export const GREEN = "#00ff00";

const SW = { outer: 20, inner: 13, detail: 10, accOuter: 17, accInner: 11, accDetail: 9 };

// ── SVG primitives ─────────────────────────────────────────────────────────

const rr = (x, y, w, h, r, sw = SW.outer) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}" stroke-width="${sw}"/>`;
const circle = (cx, cy, r, sw = SW.inner) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" stroke-width="${sw}"/>`;
const ellipse = (cx, cy, rx, ry, sw = SW.inner) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" stroke-width="${sw}"/>`;
const line = (x1, y1, x2, y2, sw = SW.inner) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-width="${sw}"/>`;
const path = (d, sw = SW.outer) => `<path d="${d}" stroke-width="${sw}"/>`;

// Three-quarter depth cue: the muzzle face is a narrow ellipse with a bore dot.
const muzzle = (x, cy, ry, sw = SW.inner) =>
  ellipse(x, cy, Math.max(7, Math.round(ry * 0.42)), ry, sw) +
  circle(x + 1, cy, Math.max(4, Math.round(ry * 0.28)), sw - 2);

// ── Accessory vocabulary (shared across families) ──────────────────────────

const redDot = (x, railY, w = 95) => {
  const h = 64;
  const y = railY - h;
  return (
    rr(x, y, w, h, 12, SW.accOuter) +
    rr(x + Math.round(w * 0.3), y + 12, Math.round(w * 0.55), 40, 8, SW.accInner) +
    circle(x + Math.round(w * 0.57), y + 32, 6, SW.accDetail)
  );
};

const magnifier = (x, railY, w = 95) => {
  const h = 60;
  const y = railY - h;
  return (
    rr(x, y, w, h, 14, SW.accOuter) +
    circle(x + 24, y + 30, 13, SW.accInner) +
    line(x + w - 20, y + 12, x + w - 20, y + h - 12, SW.accInner)
  );
};

const scope = (x, railY, w = 235) => {
  const tubeTop = railY - 52;
  return (
    rr(x + 20, tubeTop, w - 40, 44, 22, SW.accOuter) +
    rr(x, tubeTop - 6, 46, 56, 12, SW.accOuter) +
    rr(x + w - 54, tubeTop - 8, 54, 60, 14, SW.accOuter) +
    rr(x + Math.round(w * 0.45), tubeTop - 14, 28, 16, 5, SW.accDetail) +
    line(x + Math.round(w * 0.3), tubeTop + 44, x + Math.round(w * 0.3), railY, SW.accInner) +
    line(x + Math.round(w * 0.68), tubeTop + 44, x + Math.round(w * 0.68), railY, SW.accInner)
  );
};

const flashlight = (x, y, w = 110, h = 52) => {
  const headW = 36;
  return (
    rr(x, y, w - headW + 10, h, 14, SW.accOuter) +
    rr(x + w - headW, y - 6, headW, h + 12, 10, SW.accInner) +
    ellipse(x + w, y + h / 2, 7, Math.round(h * 0.42), SW.accDetail)
  );
};

const laser = (x, y, w = 80, h = 40) =>
  rr(x, y, w, h, 10, SW.accOuter) +
  circle(x + w + 4, y + h / 2, 7, SW.accDetail) +
  circle(x + Math.round(w * 0.4), y + h / 2, 5, SW.accDetail - 2);

const suppressor = (x, cy, w, h) =>
  rr(x, cy - h / 2, w, h, Math.round(h * 0.3), SW.accOuter) +
  line(x + 26, cy - h / 2 + 10, x + 26, cy + h / 2 - 10, SW.accDetail) +
  ellipse(x + w, cy, 9, Math.round(h * 0.42), SW.accDetail) +
  circle(x + w + 1, cy, 6, SW.accDetail - 2);

const foregrip = (x, y, w = 48, h = 98) =>
  rr(x, y, w, h, 12, SW.accOuter) +
  line(x + 12, y + 36, x + w - 12, y + 36, SW.accDetail - 1) +
  line(x + 12, y + 64, x + w - 12, y + 64, SW.accDetail - 1);

const bipod = (cx, y, legLen = 108, spread = 46) =>
  rr(cx - 18, y - 2, 36, 24, 6, SW.accInner) +
  line(cx - 8, y + 22, cx - spread, y + legLen, SW.accOuter - 2) +
  line(cx + 8, y + 22, cx + spread, y + legLen, SW.accOuter - 2);

// ── Families: ONE locked geometry each ─────────────────────────────────────

export const FAMILIES = {
  pistol: {
    rotate: -8,
    base: () =>
      rr(300, 330, 520, 88, 18) +
      ellipse(820, 374, 14, 42, SW.inner) +
      circle(822, 366, 8, SW.detail) +
      rr(630, 346, 90, 36, 8, SW.inner) +
      line(350, 348, 350, 400, SW.inner) +
      line(378, 348, 378, 400, SW.inner) +
      line(406, 348, 406, 400, SW.inner) +
      rr(306, 312, 36, 20, 6, SW.inner) +
      rr(776, 314, 20, 18, 5, SW.inner) +
      rr(330, 418, 470, 52, 12, 18) +
      path("M 350 470 L 470 470 L 410 740 Q 405 760 385 760 L 295 760 Q 275 760 280 740 Z") +
      path("M 470 470 Q 470 560 540 560 L 600 560 Q 620 560 620 540 L 620 470", 16) +
      path("M 530 490 Q 520 520 530 545", SW.inner),
    layers: {
      "red-dot": () => redDot(345, 332, 125),
      flashlight: () => flashlight(610, 470, 202, 64),
      laser: () => laser(640, 470, 110, 48),
      suppressor: () => suppressor(838, 375, 150, 78),
    },
  },

  revolver: {
    rotate: -8,
    base: () =>
      rr(560, 356, 340, 50, 14) +
      rr(560, 400, 250, 26, 10, SW.inner) +
      ellipse(900, 381, 9, 22, SW.inner) +
      circle(901, 378, 6, SW.detail) +
      rr(860, 338, 22, 20, 5, SW.inner) +
      rr(430, 336, 130, 100, 22) +
      line(450, 366, 540, 366, SW.detail) +
      line(450, 396, 540, 396, SW.detail) +
      rr(380, 336, 60, 110, 10, 16) +
      path("M 396 336 L 386 306 Q 380 292 396 290 L 412 292", 14) +
      path("M 384 446 L 460 446 L 450 470 Q 420 560 400 640 Q 396 668 372 670 L 300 670 Q 276 670 282 644 Q 300 560 360 470 Z", 18) +
      path("M 460 446 Q 456 520 520 520 Q 570 520 570 466", 14) +
      path("M 505 460 Q 498 480 506 496", SW.detail),
    layers: {},
  },

  pcc: {
    rotate: -10,
    base: () =>
      rr(110, 376, 90, 96, 16) +
      rr(190, 398, 120, 36, 10, 16) +
      rr(300, 376, 350, 96, 14) +
      rr(310, 360, 450, 18, 6, SW.detail + 2) +
      rr(560, 396, 60, 30, 6, SW.detail) +
      rr(640, 384, 150, 80, 12, 18) +
      line(665, 410, 765, 410, SW.detail) +
      line(665, 438, 765, 438, SW.detail) +
      rr(790, 404, 60, 36, 10, 16) +
      muzzle(850, 422, 18) +
      path("M 470 472 L 545 472 L 565 640 Q 567 656 551 656 L 490 656 Q 474 656 474 640 Z", 18) +
      path("M 360 472 L 430 472 L 405 590 Q 400 606 384 606 L 322 606 Q 306 606 310 590 Z", 18) +
      path("M 430 472 Q 432 528 470 528 L 474 528", 14) +
      path("M 450 488 Q 444 505 450 518", SW.detail),
    layers: {
      "red-dot": () => redDot(520, 362),
      magnifier: () => magnifier(400, 362),
      scope: () => scope(398, 362, 230),
      flashlight: () => flashlight(705, 468, 122, 52),
      laser: () => laser(712, 470, 82, 42),
      suppressor: () => suppressor(856, 422, 130, 68),
      grip: () => foregrip(643, 464, 46, 98),
    },
  },

  rifle: {
    rotate: -10,
    base: () =>
      rr(80, 366, 130, 112, 18) +
      rr(200, 392, 140, 40, 10, 16) +
      rr(330, 376, 290, 64, 12) +
      rr(340, 436, 270, 46, 10, 18) +
      rr(340, 360, 490, 18, 6, SW.detail + 2) +
      rr(540, 392, 64, 32, 6, SW.detail) +
      rr(620, 382, 210, 82, 12, 18) +
      line(650, 404, 800, 404, SW.detail) +
      line(650, 442, 800, 442, SW.detail) +
      rr(830, 404, 55, 36, 10, 16) +
      muzzle(885, 422, 18) +
      path("M 470 482 L 550 482 L 580 620 Q 583 636 566 640 L 510 652 Q 494 656 490 640 Z", 18) +
      path("M 380 482 L 450 482 L 420 596 Q 416 612 400 612 L 342 612 Q 326 612 330 596 Z", 18) +
      path("M 450 482 Q 450 536 490 536 L 500 536", 14) +
      path("M 470 496 Q 464 514 470 528", SW.detail),
    layers: {
      "red-dot": () => redDot(560, 362),
      magnifier: () => magnifier(430, 362),
      scope: () => scope(420, 362, 245),
      flashlight: () => flashlight(690, 416, 126, 48),
      laser: () => laser(700, 420, 80, 40),
      suppressor: () => suppressor(891, 422, 118, 66),
      bipod: () => bipod(760, 464),
      grip: () => foregrip(630, 464),
    },
  },

  "bolt-action-rifle": {
    rotate: -10,
    base: () =>
      path(
        "M 96 372 L 300 372 L 330 386 L 330 440 L 660 444 Q 680 452 664 470 L 470 486 L 448 486 L 420 540 Q 412 556 394 552 L 376 546 Q 362 540 370 524 L 388 490 L 380 490 L 230 516 L 112 562 Q 94 568 94 550 Z"
      ) +
      rr(330, 386, 230, 54, 10, 18) +
      rr(440, 396, 60, 24, 5, SW.detail - 1) +
      path("M 516 412 Q 548 418 552 452", 14) +
      circle(554, 458, 13, SW.inner) +
      path("M 560 398 L 900 405", 16) +
      path("M 560 428 L 900 421", 16) +
      muzzle(900, 413, 13) +
      path("M 470 486 Q 472 516 500 516 L 520 516 Q 540 516 540 496", 12) +
      path("M 500 490 Q 494 500 500 510", SW.detail - 1),
    layers: {
      scope: () => scope(352, 386, 250),
      suppressor: () => suppressor(906, 413, 96, 60),
      bipod: () => bipod(626, 474),
    },
  },

  shotgun: {
    rotate: -10,
    base: () =>
      path("M 96 380 L 330 384 L 330 450 L 300 452 Q 250 460 200 500 L 112 570 Q 94 578 94 556 Z") +
      rr(330, 384, 190, 66, 10, 18) +
      rr(420, 398, 64, 28, 5, SW.detail - 1) +
      rr(520, 392, 380, 26, 12, 16) +
      circle(884, 384, 5, SW.detail - 2) +
      muzzle(900, 405, 13) +
      rr(520, 428, 290, 22, 10, 14) +
      rr(600, 420, 130, 54, 12, 18) +
      line(632, 432, 632, 462, SW.detail - 1) +
      line(664, 432, 664, 462, SW.detail - 1) +
      line(696, 432, 696, 462, SW.detail - 1) +
      path("M 400 450 Q 402 500 440 500 L 470 500 Q 490 500 490 480 L 490 450", 14) +
      path("M 445 462 Q 440 478 446 490", SW.detail - 1),
    layers: {
      "red-dot": () => redDot(380, 386),
      flashlight: () => flashlight(742, 452, 112, 50),
    },
  },

  other: {
    rotate: -8,
    base: () =>
      rr(250, 386, 540, 72, 18) +
      muzzle(790, 422, 26) +
      rr(170, 396, 90, 52, 12, 16) +
      rr(740, 370, 22, 18, 5, SW.inner) +
      rr(270, 370, 24, 18, 5, SW.inner) +
      path("M 380 458 L 460 458 L 430 580 Q 426 596 410 596 L 350 596 Q 334 596 338 580 Z", 18) +
      path("M 460 458 Q 460 512 510 512 L 520 512", 14) +
      path("M 485 470 Q 480 488 486 504", SW.detail),
    layers: {},
  },
};

// ── Rendering ──────────────────────────────────────────────────────────────

export const svgDocument = (body, transform) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">` +
  `<g transform="${transform}" fill="none" stroke="${GREEN}" stroke-linecap="round" stroke-linejoin="round">` +
  body +
  `</g></svg>\n`;

const rasterize = (svgPath, pngPath) =>
  execFileSync("rsvg-convert", ["-w", String(CANVAS), "-h", String(CANVAS), svgPath, "-o", pngPath], {
    stdio: "inherit",
  });

const alphaBounds = (pngPath) => {
  const png = PNG.sync.read(readFileSync(pngPath));
  const b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      if (png.data[((y * png.width + x) << 2) + 3] > 8) {
        if (x < b.minX) b.minX = x;
        if (x > b.maxX) b.maxX = x;
        if (y < b.minY) b.minY = y;
        if (y > b.maxY) b.maxY = y;
      }
    }
  }
  return b;
};

const familyTransform = (family, spec, scratch) => {
  const rotation = `rotate(${spec.rotate} ${CANVAS / 2} ${CANVAS / 2})`;
  const parts = [["base", spec.base()], ...Object.entries(spec.layers).map(([n, fn]) => [n, fn()])];

  const union = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const [name, body] of parts) {
    const probe = join(scratch, `${family}-${name}`);
    writeFileSync(`${probe}.svg`, svgDocument(body, rotation));
    rasterize(`${probe}.svg`, `${probe}.png`);
    const b = alphaBounds(`${probe}.png`);
    union.minX = Math.min(union.minX, b.minX);
    union.minY = Math.min(union.minY, b.minY);
    union.maxX = Math.max(union.maxX, b.maxX);
    union.maxY = Math.max(union.maxY, b.maxY);
  }

  const w = union.maxX - union.minX;
  const h = union.maxY - union.minY;
  const available = CANVAS - 2 * MARGIN;
  const scale = Math.min(available / w, available / h, 1.18);
  const cx = union.minX + w / 2;
  const cy = union.minY + h / 2;
  const transform =
    `translate(${CANVAS / 2} ${CANVAS / 2}) scale(${scale.toFixed(4)}) ` +
    `translate(${(-cx).toFixed(1)} ${(-cy).toFixed(1)}) ${rotation}`;
  console.log(`${family.padEnd(18)} envelope ${w}x${h} -> scale ${scale.toFixed(3)}`);
  return { transform, parts };
};

const main = () => {
  const scratch = mkdtempSync(join(tmpdir(), "triggernote-firearm-art-"));
  let written = 0;
  for (const [family, spec] of Object.entries(FAMILIES)) {
    const { transform, parts } = familyTransform(family, spec, scratch);
    for (const [name, body] of parts) {
      const rel = name === "base" ? `${family}/base.svg` : `${family}/layers/${name}.svg`;
      const full = join(OUT, rel);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, svgDocument(body, transform));
      written += 1;
    }
  }
  console.log(`wrote ${written} svg assets to ${OUT}`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
