/**
 * HyperSnatch Reproducible Build Verifier (v1.2)
 * Verifies local source file hashes against the official Vanguard manifest.
 */

"use strict";

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MANIFEST_PATH = path.join(__dirname, '..', 'VANGUARD_SOURCE_MANIFEST.json');

function verify() {
    console.log(`
==================================================`);
    console.log(`🛡️  HyperSnatch Vanguard // Source Integrity Check`);
    console.log(`==================================================
`);

    if (!fs.existsSync(MANIFEST_PATH)) {
        console.error("❌ ERROR: Source manifest not found. Cannot verify integrity.");
        process.exit(1);
    }

    try {
        const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
        console.log(`Manifest Version: ${manifest.version} (${manifest.build})`);
        console.log(`Timestamp: ${manifest.timestamp}
`);

        let passed = 0;
        let failed = 0;

        for (const [file, expectedHash] of Object.entries(manifest.source_hashes)) {
            const filePath = path.join(__dirname, '..', file);
            
            if (!fs.existsSync(filePath)) {
                console.log(`[MISSING] ${file}`);
                failed++;
                continue;
            }

            const content = fs.readFileSync(filePath);
            const actualHash = crypto.createHash('sha256').update(content).digest('hex');

            if (actualHash === expectedHash) {
                console.log(`[  OK   ] ${file}`);
                passed++;
            } else {
                console.log(`[TAMPERED] ${file}`);
                console.log(`          Expected: ${expectedHash}`);
                console.log(`          Actual:   ${actualHash}`);
                failed++;
            }
        }

        console.log(`
--------------------------------------------------`);
        if (failed === 0) {
            console.log(`✅ VERIFICATION SUCCESS: All ${passed} core files match the manifest.`);
            console.log(`Institutional Trust Verified.`);
        } else {
            console.log(`❌ VERIFICATION FAILURE: ${failed} files failed integrity check.`);
            process.exit(1);
        }
        console.log(`==================================================
`);

    } catch (err) {
        console.error(`❌ FATAL ERROR: ${err.message}`);
        process.exit(1);
    }
}

verify();
