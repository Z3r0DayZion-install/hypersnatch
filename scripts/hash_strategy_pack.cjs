"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function sha256Hex(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function readFileOrThrow(p) {
  if (!fs.existsSync(p)) throw new Error(`Missing: ${p}`);
  return fs.readFileSync(p);
}

function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error("Usage: node scripts/hash_strategy_pack.cjs <strategy-pack-dir>");
    process.exit(2);
  }

  const packDir = path.resolve(dir);
  const packJsonPath = path.join(packDir, "pack.json");
  const packJsonRaw = readFileOrThrow(packJsonPath);

  let manifest;
  try {
    manifest = JSON.parse(packJsonRaw.toString("utf8"));
  } catch (e) {
    throw new Error(`Invalid pack.json: ${e.message}`);
  }

  const mainFile = String(manifest.main || "strategy.js");
  const mainPath = path.join(packDir, mainFile);
  const mainRaw = readFileOrThrow(mainPath);

  // Stable hash input: raw bytes (no normalization) + separator + raw bytes.
  const combined = Buffer.concat([packJsonRaw, Buffer.from("\n"), mainRaw]);

  const out = {
    name: manifest.name || path.basename(packDir),
    version: manifest.version || "unknown",
    main: mainFile,
    sha256: sha256Hex(combined),
  };

  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
}

main();
