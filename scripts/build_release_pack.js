/**
 * HyperSnatch Vanguard Release Packager (v1.2)
 * Assembles the final commercial zip archive for Gumroad distribution.
 */

"use strict";

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const APP_VERSION = "1.2.0";
const DIST_DIR = path.join(__dirname, '..', 'dist');
const OUTPUT_ZIP = path.join(DIST_DIR, `HyperSnatch_Vanguard_v${APP_VERSION}.zip`);
const STAGING_DIR = path.join(DIST_DIR, 'staging_vanguard');

function buildPack() {
    console.log(`\n==================================================`);
    console.log(`📦 HyperSnatch Vanguard // Commercial Release Packager`);
    console.log(`==================================================\n`);

    const exePath = path.join(DIST_DIR, `HyperSnatch-Setup-${APP_VERSION}.exe`);
    if (!fs.existsSync(exePath)) {
        console.log(`\n⏳ Installer not found. Building HyperSnatch v${APP_VERSION}...`);
        spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true });
    }

    if (fs.existsSync(STAGING_DIR)) {
        fs.rmSync(STAGING_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(STAGING_DIR, { recursive: true });

    const assets = [
        { src: `dist/HyperSnatch-Setup-${APP_VERSION}.exe`, dest: `HyperSnatch-Setup-${APP_VERSION}.exe`, required: true },
        { src: 'VANGUARD_RELEASE_HASHES.txt', dest: 'VANGUARD_RELEASE_HASHES.txt', required: false },
        { src: 'OPERATORS_MANUAL.md', dest: 'OPERATORS_MANUAL.md', required: true },
        { src: 'scripts/verify_audit_chain.js', dest: 'verify_audit_chain.js', required: true },
        { src: 'scripts/vault_unlock.js', dest: 'vault_unlock.js', required: true }
    ];

    let missingCritical = false;

    assets.forEach(asset => {
        const srcPath = path.join(__dirname, '..', asset.src);
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, path.join(STAGING_DIR, asset.dest));
            console.log(`✅ Included: ${asset.dest}`);
        } else {
            console.log(`❌ Missing: ${asset.src}`);
            if (asset.required) missingCritical = true;
        }
    });

    if (missingCritical) {
        console.error(`\n❌ FATAL ERROR: Critical assets missing. Cannot build release package.`);
        process.exit(1);
    }

    console.log(`\n🗜️ Compressing artifacts into release bundle...`);

    // Use PowerShell to zip the staging directory
    const psCmd = `Compress-Archive -Path "${STAGING_DIR}\\*" -DestinationPath "${OUTPUT_ZIP}" -Force`;
    const result = spawnSync('powershell', ['-NoProfile', '-Command', psCmd]);

    if (result.status === 0) {
        console.log(`✅ SUCCESS: Commercial release package assembled.`);
        console.log(`📁 Saved to: ${OUTPUT_ZIP}`);
        
        // Cleanup staging
        fs.rmSync(STAGING_DIR, { recursive: true, force: true });
    } else {
        console.error(`❌ ERROR: Zip compression failed.`);
        console.error(result.stderr.toString());
        process.exit(1);
    }
    console.log(`==================================================\n`);
}

buildPack();
