const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const version = require('../VERSION.json').version;

const filesToHash = [
    "dist/hypersnatch.exe",
    "release/bridge/ui-bridge.exe",
    "dist/HyperSnatch_release.zip"
];

function hashFile(file) {
    if (!fs.existsSync(file)) return null;
    const data = fs.readFileSync(file);
    return crypto.createHash('sha256').update(data).digest('hex');
}

let sumsText = "";
const manifest = {
    version: version,
    buildDate: new Date().toISOString(),
    files: {}
};

for (const tf of filesToHash) {
    const full = path.join(__dirname, "..", tf);
    const hash = hashFile(full);
    const base = path.basename(tf);

    if (hash) {
        manifest.files[base] = {
            sha256: hash,
            size: fs.statSync(full).size
        };
        sumsText += `${hash}  ${base}\n`;
    }
}

fs.writeFileSync(path.join(__dirname, "../dist/SHA256SUMS.txt"), sumsText, "utf8");
fs.writeFileSync(path.join(__dirname, "../dist/MANIFEST.json"), JSON.stringify(manifest, null, 2), "utf8");

console.log("✅ Manifest and checksums generated.");
