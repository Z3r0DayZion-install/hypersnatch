// ==================== SIGNED RELEASE PACK BUILDER ====================
"use strict";

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const RELEASE_DIR = path.join(ROOT_DIR, 'release');
const SECRET_KEY = process.env.HS_RELEASE_KEY || 'SOVEREIGN_ROOT_KEY_2026'; // Default for dev

async function buildRelease() {
  console.log("--- HyperSnatch Signed Release Pack Builder ---");
  
  if (!fs.existsSync(DIST_DIR)) {
    console.error("Error: 'dist' directory not found. Run build first.");
    process.exit(1);
  }

  if (!fs.existsSync(RELEASE_DIR)) {
    fs.mkdirSync(RELEASE_DIR);
  }

  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
  const version = packageJson.version;
  const buildId = crypto.randomBytes(4).toString('hex');

  console.log(`Building release v${version} (Build: ${buildId})...`);

  const manifest = {
    header: {
      format: "HS-RELEASE-PACK",
      version: version,
      buildId: buildId,
      timestamp: new Date().toISOString()
    },
    files: []
  };

  // Generate hashes for all files in dist
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else {
        const content = fs.readFileSync(filePath);
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        manifest.files.push({
          path: path.relative(DIST_DIR, filePath).replace(/\\/g, '/'),
          size: stat.size,
          hash: hash
        });
      }
    }
  }

  walkDir(DIST_DIR);

  // Sign manifest
  const canonicalManifest = JSON.stringify(manifest, Object.keys(manifest).sort());
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(canonicalManifest)
    .digest('hex');

  const releasePack = {
    ...manifest,
    signature: signature,
    signer: "HyperSnatch Sovereign Authority"
  };

  const releasePath = path.join(RELEASE_DIR, `release-v${version}-${buildId}.json`);
  fs.writeFileSync(releasePath, JSON.stringify(releasePack, null, 2));

  console.log(`✅ Release pack created and signed: ${releasePath}`);
  console.log(`✅ Files indexed: ${manifest.files.length}`);
  console.log(`✅ Signature: ${signature.substring(0, 16)}...`);
}

buildRelease().catch(err => {
  console.error("Release build failed:", err);
  process.exit(1);
});
