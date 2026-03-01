const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const files = [
    'src/core/neuralcache-core.js',
    'rust/hs-core/src/main.rs',
    'docs/security/CRYPTOGRAPHIC_ARCHITECTURE_SPEC.md',
    'release/manifest.schema.json'
];

const ROOT = path.join(__dirname, '..');
let output = "--- NeuralCache-Core v1.0.0 EXPECTED SHA256 HASHES ---\n\n";

files.forEach(f => {
    const fullPath = path.join(ROOT, f);
    if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath);
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        output += `${hash}  ${f}\n`;
    } else {
        output += `MISSING: ${f}\n`;
    }
});

fs.writeFileSync(path.join(ROOT, 'release-proof/EXPECTED_HASHES.txt'), output);
console.log("✅ HASHES GENERATED.");
