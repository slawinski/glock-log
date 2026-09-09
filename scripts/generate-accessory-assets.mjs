import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

const root = new URL("../", import.meta.url);
const output = new URL("assets/images/accessories/", root);
const theme = readFileSync(new URL("src/theme/colors.ts", root), "utf8");
const green = theme.match(/TERMINAL_GREEN:\s*"(#[\da-fA-F]{6})"/)?.[1];

if (!green) throw new Error("Cannot read TERMINAL_GREEN from theme");

const path = (d, width = 28) => `<path d="${d}" stroke-width="${width}"/>`;
const ellipse = (x, y, rx, ry, width = 28) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" stroke-width="${width}"/>`;
const rect = (x, y, w, h, radius = 18, width = 28) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" stroke-width="${width}"/>`;

const artwork = {
  "red-dot": [
    path("M 290 610 L 290 365 Q 290 315 340 315 L 560 315 Q 610 315 610 365 L 610 610 Z"),
    path("M 610 365 L 735 410 L 735 645 L 610 610 M 560 315 L 690 360 Q 735 370 735 410"),
    rect(345, 370, 210, 175, 30),
    ellipse(450, 458, 12, 12, 18),
    path("M 260 610 L 600 610 L 760 655 L 760 710 L 420 710 L 260 665 Z M 260 610 L 420 655 L 760 655 M 420 655 L 420 710"),
  ],
  scope: [
    ellipse(255, 515, 80, 95),
    ellipse(255, 515, 42, 58, 20),
    path("M 255 420 L 340 420 L 390 470 L 600 470 L 685 400 L 770 400 M 255 610 L 340 610 L 390 560 L 600 560 L 685 630 L 770 630"),
    ellipse(770, 515, 65, 115),
    ellipse(770, 515, 32, 75, 20),
    path("M 450 468 L 450 405 L 520 405 L 520 468 M 460 405 L 460 380 L 510 380 L 510 405", 22),
    path("M 400 563 L 400 650 L 455 650 L 455 563 M 555 563 L 555 650 L 610 650 L 610 568", 24),
  ],
  magnifier: [
    ellipse(345, 480, 110, 130),
    ellipse(345, 480, 62, 80, 22),
    path("M 345 350 L 675 350 M 345 610 L 675 610"),
    ellipse(675, 480, 85, 130),
    ellipse(675, 480, 45, 85, 22),
    path("M 550 357 Q 495 480 550 603 M 550 610 L 550 665 L 650 665 L 650 610", 24),
    path("M 510 665 L 670 665 L 720 700 L 720 745 L 560 745 L 510 710 Z M 510 665 L 560 700 L 720 700 M 560 700 L 560 745"),
  ],
  "iron-sights": [
    path("M 170 680 L 340 640 L 430 675 L 430 730 L 250 775 L 170 735 Z M 170 680 L 250 720 L 430 675 M 250 720 L 250 775"),
    path("M 230 665 L 230 450 Q 230 420 260 420 L 315 420 L 315 490 L 365 490 L 365 420 L 415 420 L 415 665"),
    path("M 570 540 L 750 500 L 840 540 L 840 590 L 660 635 L 570 590 Z M 570 540 L 660 580 L 840 540 M 660 580 L 660 635"),
    path("M 635 525 L 660 365 L 745 365 L 785 520 M 705 510 L 705 315 M 680 315 L 730 315"),
  ],
  flashlight: [
    path("M 235 455 L 565 455 L 635 410 L 735 410 M 235 585 L 565 585 L 635 630 L 735 630"),
    ellipse(235, 520, 50, 65),
    ellipse(735, 520, 75, 110),
    ellipse(735, 520, 42, 72, 22),
    path("M 340 459 Q 305 520 340 581 M 565 455 Q 520 520 565 585", 22),
    path("M 400 453 L 400 390 L 525 390 L 525 453 M 385 390 L 540 390", 24),
  ],
  laser: [
    path("M 245 450 L 570 450 L 765 510 L 765 665 L 435 665 L 245 595 Z M 245 450 L 435 515 L 765 510 M 435 515 L 435 665 M 570 450 L 570 585 L 765 665"),
    ellipse(675, 588, 35, 39),
    rect(305, 385, 170, 65, 12, 24),
    path("M 475 385 L 585 420 L 585 450 M 340 543 L 390 560", 22),
  ],
  suppressor: [
    ellipse(225, 535, 55, 110),
    path("M 225 425 L 785 425 M 225 645 L 785 645"),
    ellipse(785, 535, 70, 110),
    ellipse(785, 535, 28, 44, 22),
    path("M 325 427 Q 270 535 325 643 M 390 427 Q 335 535 390 643", 22),
    path("M 185 480 L 150 480 L 150 590 L 185 590", 24),
  ],
  bipod: [
    path("M 405 260 L 590 260 L 640 305 L 640 360 L 455 360 L 405 315 Z M 405 260 L 455 305 L 640 305 M 455 305 L 455 360"),
    ellipse(515, 430, 65, 65),
    path("M 485 365 L 485 345 M 545 365 L 545 345 M 465 468 L 300 735 L 350 765 L 510 505 M 560 470 L 735 735 L 685 765 L 520 505"),
    path("M 275 740 L 350 785 M 680 785 L 760 740 M 340 665 L 390 695 M 645 695 L 700 665", 24),
  ],
  grip: [
    path("M 350 260 L 585 260 L 670 305 L 670 375 L 430 375 L 350 325 Z M 350 260 L 430 305 L 670 305 M 430 305 L 430 375"),
    path("M 405 355 L 385 715 Q 385 755 425 755 L 550 755 Q 590 755 590 715 L 605 375 M 590 755 L 645 710 L 657 375"),
    path("M 435 475 L 545 475 M 430 560 L 540 560 M 425 645 L 535 645", 22),
  ],
  "stock-brace": [
    path("M 260 365 L 565 365 L 625 425 L 800 425 L 800 510 L 610 510 L 335 695 L 240 695 L 220 415 Q 215 365 260 365 Z"),
    path("M 320 430 L 515 430 L 560 465 L 335 610 Z", 24),
    path("M 245 365 L 300 315 L 610 315 L 670 375 L 830 375 L 830 460 L 800 510 M 565 365 L 610 315 M 625 425 L 670 375 M 800 425 L 830 375 M 335 695 L 380 655", 24),
    path("M 220 440 L 250 685", 20),
  ],
  sling: [
    path("M 340 335 C 155 510 160 760 380 785 C 585 805 825 540 690 310 M 385 350 C 230 525 235 695 390 720 C 550 740 745 515 640 335"),
    path("M 340 335 L 350 250 Q 350 230 370 230 L 410 230 Q 430 230 430 250 L 425 315 Q 420 345 385 350 M 690 310 L 700 240 Q 700 220 680 220 L 640 220 Q 620 220 620 240 L 615 310 Q 615 335 640 335"),
    path("M 620 555 L 715 605 L 670 685 L 575 635 Z M 597 595 L 690 645", 24),
  ],
  "mount-adapter": [
    path("M 230 570 L 580 495 L 805 575 L 805 650 L 445 735 L 230 650 Z M 230 570 L 445 650 L 805 575 M 445 650 L 445 735"),
    path("M 350 610 L 350 430 L 645 365 L 645 535 M 350 430 L 440 460 L 730 395 L 645 365 M 440 460 L 440 640 M 730 395 L 730 548"),
    path("M 410 417 L 480 440 M 495 398 L 565 421 M 580 380 L 650 402", 22),
  ],
  other: [
    rect(245, 375, 530, 355, 35),
    path("M 245 450 L 775 450 M 405 375 L 405 300 Q 405 280 425 280 L 595 280 Q 615 280 615 300 L 615 375"),
    rect(335, 420, 60, 90, 10, 22),
    rect(625, 420, 60, 90, 10, 22),
    path("M 285 670 L 735 670", 22),
  ],
};

mkdirSync(output, { recursive: true });
for (const [category, shapes] of Object.entries(artwork)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><g transform="rotate(-8 512 512)" fill="none" stroke="${green}" stroke-linecap="round" stroke-linejoin="round">${shapes.join("")}</g></svg>\n`;
  writeFileSync(new URL(`${category}.svg`, output), svg);
}

if (Object.keys(artwork).length !== 13) {
  throw new Error(`Incomplete accessory artwork in ${fileURLToPath(output)}`);
}
