// Regenerates icon.icns (macOS bundle) and icon.png (Linux / BrowserWindow) from
// icon.svg — the black-background version of the web favicon.
//
//   node apps/desktop/assets/generate-icons.mjs
//
// Needs `sharp` (hoisted in the repo-root node_modules) and macOS `iconutil`.
// The generated files are committed; only re-run this when icon.svg changes.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const dir = path.dirname(fileURLToPath(import.meta.url));
const svg = fs.readFileSync(path.join(dir, "icon.svg"));

// macOS .iconset: each logical size at 1x and 2x.
const iconset = path.join(dir, "icon.iconset");
fs.rmSync(iconset, { recursive: true, force: true });
fs.mkdirSync(iconset);

const specs = [
  [16, 1], [16, 2], [32, 1], [32, 2], [128, 1], [128, 2], [256, 1], [256, 2], [512, 1], [512, 2],
];
for (const [size, scale] of specs) {
  const px = size * scale;
  const name = `icon_${size}x${size}${scale === 2 ? "@2x" : ""}.png`;
  await sharp(svg, { density: 384 }).resize(px, px).png().toFile(path.join(iconset, name));
}

execFileSync("iconutil", ["-c", "icns", iconset, "-o", path.join(dir, "icon.icns")]);
fs.rmSync(iconset, { recursive: true, force: true });

// Standalone 1024px PNG for Linux packaging and the dev BrowserWindow icon.
await sharp(svg, { density: 384 }).resize(1024, 1024).png().toFile(path.join(dir, "icon.png"));

console.log("wrote icon.icns and icon.png");
