/**
 * HyperSnatch — Electron Wrapper Build Script
 * Orchestrates electron-builder to produce SmartSnatch.exe
 *
 * Usage: node scripts/build_wrapper.js [--dir]
 *   --dir  Build unpacked directory instead of installer
 *
 * Outputs:
 *   dist/SmartSnatch-Setup-<version>.exe   (NSIS installer)
 *   dist/build_manifest.json               (build metadata)
 */

"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

// ── Configuration ──
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const VERSION = PKG.version;
const PRODUCT_NAME = "SmartSnatch";
const BUILD_TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

console.log("═".repeat(60));
console.log(`  SmartSnatch Build Script`);
console.log(`  Version: ${VERSION}`);
console.log(`  Product: ${PRODUCT_NAME}`);
console.log(`  Time: ${BUILD_TIMESTAMP}`);
console.log("═".repeat(60));

// ── Pre-flight Checks ──
function preflight() {
    console.log("\n[1/4] Pre-flight checks...");

    // Check electron is installed
    try {
        require.resolve("electron");
        console.log("  ✅ electron found");
    } catch (e) {
        console.error("  ❌ electron not installed. Run: npm install --save-dev electron");
        process.exit(42);
    }

    // Check electron-builder is installed
    try {
        require.resolve("electron-builder");
        console.log("  ✅ electron-builder found");
    } catch (e) {
        console.error("  ❌ electron-builder not installed. Run: npm install --save-dev electron-builder");
        process.exit(42);
    }

    // Check required files exist
    const required = [
        "src/main.js",
        "src/preload.js",
        "hypersnatch.html",
        "package.json",
    ];
    for (const f of required) {
        const full = path.join(ROOT, f);
        if (!fs.existsSync(full)) {
            console.error(`  ❌ Missing required file: ${f}`);
            process.exit(42);
        }
        console.log(`  ✅ ${f} exists`);
    }
}

// ── Prepare Build ──
function prepare() {
    console.log("\n[2/4] Preparing build...");

    // Ensure dist directory exists
    if (!fs.existsSync(DIST)) {
        fs.mkdirSync(DIST, { recursive: true });
    }

    // Run prebuild script if exists
    if (PKG.scripts && PKG.scripts.prebuild) {
        console.log("  Running prebuild script...");
        try {
            execSync("npm run prebuild", { cwd: ROOT, stdio: "inherit" });
        } catch (e) {
            console.warn("  ⚠ prebuild script failed — continuing anyway");
        }
    }

    console.log("  ✅ Build prepared");
}

// ── Run Build ──
function build() {
    console.log("\n[3/4] Building SmartSnatch...");

    const isDirMode = process.argv.includes("--dir");
    const cmd = isDirMode
        ? "npx electron-builder --dir --publish=never"
        : "npx electron-builder --publish=never";

    console.log(`  Command: ${cmd}`);
    console.log("  This may take several minutes...\n");

    try {
        execSync(cmd, {
            cwd: ROOT,
            stdio: "inherit",
            env: {
                ...process.env,
                ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES: "true",
            },
        });
        console.log("\n  ✅ Build completed");
    } catch (e) {
        console.error("\n  ❌ Build failed:", e.message);
        process.exit(42);
    }
}

// ── Generate Manifest ──
function generateManifest() {
    console.log("\n[4/4] Generating build manifest...");

    const artifacts = [];
    if (fs.existsSync(DIST)) {
        const files = fs.readdirSync(DIST).filter(f =>
            f.endsWith(".exe") || f.endsWith(".msi") || f.endsWith(".AppImage") || f.endsWith(".dmg")
        );

        for (const f of files) {
            const fullPath = path.join(DIST, f);
            const stat = fs.statSync(fullPath);
            const hash = crypto.createHash("sha256")
                .update(fs.readFileSync(fullPath))
                .digest("hex");

            artifacts.push({
                file: f,
                size: stat.size,
                sha256: hash,
            });
            console.log(`  📦 ${f} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
            console.log(`     SHA-256: ${hash}`);
        }
    }

    const manifest = {
        schemaVersion: "build_manifest.v1",
        product: PRODUCT_NAME,
        version: VERSION,
        buildTimestamp: BUILD_TIMESTAMP,
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        artifacts,
    };

    const manifestPath = path.join(DIST, "build_manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
    console.log(`\n  ✅ Manifest written to ${manifestPath}`);

    return manifest;
}

// ── Main ──
try {
    preflight();
    prepare();
    build();
    const manifest = generateManifest();

    console.log("\n" + "═".repeat(60));
    console.log(`  BUILD COMPLETE`);
    console.log(`  ${manifest.artifacts.length} artifact(s) in dist/`);
    console.log("═".repeat(60) + "\n");
} catch (e) {
    console.error("Build script fatal error:", e.message);
    process.exit(42);
}
