"use strict";

/**
 * generate_brand_assets.js
 *
 * Rasterizes the HyperSnatch brand SVG sources into PNG/ICO deliverables.
 * Pure-Node: @resvg/resvg-js (SVG -> PNG, system fonts) + png-to-ico (PNG -> ICO).
 *
 * Outputs:
 *   assets/icons/icon-256.png
 *   assets/icons/icon-512.png
 *   assets/icons/icon.ico         (16,32,48,64,128,256)
 *   assets/social/hypersnatch-og-1200x630.png
 *   assets/brand/hypersnatch-hero.png
 *
 * Usage: node scripts/generate_brand_assets.js
 */

const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const ROOT = path.resolve(__dirname, "..");

function renderPng(svgPath, width) {
  const svg = fs.readFileSync(svgPath);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: { loadSystemFonts: true },
    background: "rgba(0,0,0,0)"
  });
  return resvg.render().asPng();
}

function write(rel, buf) {
  const out = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, buf);
  console.log(`  wrote ${rel} (${buf.length} bytes)`);
}

async function main() {
  console.log("HyperSnatch brand asset generation");
  console.log("=".repeat(48));

  const iconSrc = path.join(ROOT, "assets", "icons", "icon-source.svg");
  const ogSrc = path.join(ROOT, "assets", "social", "hypersnatch-og-source.svg");
  const heroSrc = path.join(ROOT, "assets", "brand", "hypersnatch-hero.svg");

  // App icon PNGs
  console.log("\nIcons:");
  write("assets/icons/icon-256.png", renderPng(iconSrc, 256));
  write("assets/icons/icon-512.png", renderPng(iconSrc, 512));

  // ICO (multi-size)
  const icoSizes = [16, 32, 48, 64, 128, 256];
  const icoBuffers = icoSizes.map((s) => renderPng(iconSrc, s));
  const pngToIco = (await import("png-to-ico")).default;
  const ico = await pngToIco(icoBuffers);
  write("assets/icons/icon.ico", ico);

  // Social / OpenGraph
  console.log("\nSocial:");
  write("assets/social/hypersnatch-og-1200x630.png", renderPng(ogSrc, 1200));

  // Hero (raster fallback for README)
  console.log("\nHero:");
  write("assets/brand/hypersnatch-hero.png", renderPng(heroSrc, 1280));

  console.log("\n" + "=".repeat(48));
  console.log("Brand assets generated.");
}

main().catch((err) => {
  console.error("Brand asset generation FAILED:", err.message);
  process.exit(1);
});
