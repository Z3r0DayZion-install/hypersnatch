"use strict";

/**
 * HyperSnatch Cross-Platform Verifier (Node.js)
 *
 * Verifies binary integrity using the detached verification kit:
 *   1. Loads root_public_key.pem
 *   2. Verifies manifest.sig against manifest.json
 *   3. Verifies artifact SHA-256 against manifest hashes
 *
 * Usage:
 *   node verify_node.js <artifact-path>
 *   node verify_node.js HyperSnatch-Setup-1.2.1.exe
 *   node verify_node.js --self-test
 *
 * Exit codes:
 *   0 = VERIFIED
 *   1 = FILE NOT FOUND
 *   2 = SIGNATURE INVALID
 *   3 = HASH MISMATCH
 *   4 = MANIFEST ERROR
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const SCRIPT_DIR = __dirname;
const ROOT = path.join(SCRIPT_DIR, "..");
const VERIFY_KIT = path.join(ROOT, "release", "verify");

const EXIT = {
    VERIFIED: 0,
    FILE_NOT_FOUND: 1,
    SIGNATURE_INVALID: 2,
    HASH_MISMATCH: 3,
    MANIFEST_ERROR: 4,
};

// ── Utilities ───────────────────────────────────────────────────────────────

function sha256File(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash("sha256");
        const stream = fs.createReadStream(filePath);
        stream.on("data", (chunk) => hash.update(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(hash.digest("hex")));
    });
}

function banner() {
    console.log("");
    console.log("  ╔════════════════════════════════════════════════╗");
    console.log("  ║   HyperSnatch Verifier (Node.js)               ║");
    console.log("  ║   Offline Binary & Manifest Verification        ║");
    console.log("  ╚════════════════════════════════════════════════╝");
    console.log("");
}

function resolveKitPath(filename) {
    // Check multiple locations for the verify kit
    const candidates = [
        path.join(VERIFY_KIT, filename),
        path.join(ROOT, "dist", filename),
        path.join(process.cwd(), filename),
    ];
    return candidates.find((p) => fs.existsSync(p)) || candidates[0];
}

// ── Signature Verification ──────────────────────────────────────────────────

function verifySignature(manifestPath, sigPath, pubKeyPath) {
    console.log("  [1/3] Verifying manifest signature...");

    if (!fs.existsSync(pubKeyPath)) {
        console.log("  ⚠  No public key found — skipping signature check");
        console.log(`     Expected: ${pubKeyPath}`);
        return null; // Not a failure — key may not be published yet
    }

    if (!fs.existsSync(sigPath)) {
        console.log("  ⚠  No signature found — skipping signature check");
        console.log(`     Expected: ${sigPath}`);
        return null;
    }

    const manifest = fs.readFileSync(manifestPath);
    const sigHex = fs.readFileSync(sigPath, "utf8").trim();
    const signature = Buffer.from(sigHex, "hex");
    const publicKey = fs.readFileSync(pubKeyPath, "utf8");

    try {
        const valid = crypto.verify(null, manifest, publicKey, signature);
        if (valid) {
            console.log("  ✅ Manifest signature VALID");
            return true;
        } else {
            console.log("  ❌ SIGNATURE INVALID — manifest may be tampered");
            return false;
        }
    } catch (err) {
        console.log(`  ❌ Signature verification error: ${err.message}`);
        return false;
    }
}

// ── Hash Verification ───────────────────────────────────────────────────────

async function verifyArtifactHash(filePath, manifest) {
    console.log("  [2/3] Computing artifact hash...");

    const hash = await sha256File(filePath);
    const fileName = path.basename(filePath);

    console.log(`        SHA-256: ${hash}`);
    console.log(`        File:    ${fileName}`);

    // Check against manifest files
    if (manifest.files) {
        for (const [rel, entry] of Object.entries(manifest.files)) {
            if (entry.sha256 === hash) {
                console.log(`  ✅ Hash matches manifest entry: ${rel}`);
                return { match: true, entry: rel };
            }
        }
    }

    // Check against hash_manifest.json format (legacy)
    if (manifest.hashes) {
        if (manifest.hashes[hash]) {
            const info = manifest.hashes[hash];
            console.log(`  ✅ Hash matches: ${info.name || info.Name} (v${info.version || info.Version})`);
            return { match: true, entry: info.name || info.Name };
        }
    }

    console.log("  ❌ HASH MISMATCH — this binary does not match any known build");
    console.log("     DO NOT RUN THIS FILE");
    return { match: false };
}

// ── Schema Validation ───────────────────────────────────────────────────────

function validateManifestSchema(manifest) {
    console.log("  [3/3] Validating manifest schema...");

    const required = ["version"];
    const hasFiles = manifest.files || manifest.hashes;

    if (!hasFiles) {
        console.log("  ⚠  Manifest has no file hashes");
        return false;
    }

    for (const field of required) {
        if (!manifest[field]) {
            console.log(`  ⚠  Manifest missing required field: ${field}`);
            return false;
        }
    }

    console.log(`  ✅ Manifest schema valid (v${manifest.version})`);
    return true;
}

// ── Self-Test ───────────────────────────────────────────────────────────────

async function selfTest() {
    console.log("  🧪 Running Self-Test...");
    console.log("");

    let passed = 0;
    let failed = 0;

    // Test 1: Node version
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.replace("v", ""), 10);
    if (major >= 15) {
        console.log(`  ✅ Node ${nodeVersion} (Ed25519 supported)`);
        passed++;
    } else {
        console.log(`  ❌ Node ${nodeVersion} (need 15+ for Ed25519)`);
        failed++;
    }

    // Test 2: SHA-256 computation
    try {
        const testHash = crypto.createHash("sha256").update("test").digest("hex");
        if (testHash === "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08") {
            console.log("  ✅ SHA-256 computation");
            passed++;
        } else {
            console.log("  ❌ SHA-256 computation");
            failed++;
        }
    } catch {
        console.log("  ❌ SHA-256 computation (error)");
        failed++;
    }

    // Test 3: Ed25519 key generation
    try {
        const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519", {
            publicKeyEncoding: { type: "spki", format: "pem" },
            privateKeyEncoding: { type: "pkcs8", format: "pem" },
        });
        const sig = crypto.sign(null, Buffer.from("test"), privateKey);
        const valid = crypto.verify(null, Buffer.from("test"), publicKey, sig);
        if (valid) {
            console.log("  ✅ Ed25519 sign/verify");
            passed++;
        } else {
            console.log("  ❌ Ed25519 sign/verify");
            failed++;
        }
    } catch {
        console.log("  ❌ Ed25519 sign/verify (error)");
        failed++;
    }

    // Test 4: Verify kit exists
    if (fs.existsSync(VERIFY_KIT)) {
        console.log(`  ✅ Verify kit found at ${VERIFY_KIT}`);
        passed++;
    } else {
        console.log(`  ⚠  Verify kit not found at ${VERIFY_KIT}`);
    }

    console.log("");
    console.log(`  📊 Self-Test: ${passed} passed, ${failed} failed`);
    return failed === 0 ? EXIT.VERIFIED : EXIT.MANIFEST_ERROR;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
    banner();

    const args = process.argv.slice(2);

    if (args.includes("--self-test") || args.includes("-t")) {
        const code = await selfTest();
        process.exit(code);
    }

    const filePath = args.find((a) => !a.startsWith("-"));

    if (!filePath) {
        console.log("  Usage: node verify_node.js <artifact-file> [--self-test]");
        console.log("");
        console.log("  Examples:");
        console.log("    node verify_node.js HyperSnatch-Setup-1.2.1.exe");
        console.log("    node verify_node.js --self-test");
        process.exit(EXIT.FILE_NOT_FOUND);
    }

    if (!fs.existsSync(filePath)) {
        console.log(`  ❌ File not found: ${filePath}`);
        process.exit(EXIT.FILE_NOT_FOUND);
    }

    // Load manifest
    const manifestPath = resolveKitPath("manifest.json");
    const hashManifestPath = resolveKitPath("hash_manifest.json");

    let manifest = null;

    if (fs.existsSync(manifestPath)) {
        try {
            manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        } catch (e) {
            console.log(`  ❌ Failed to parse manifest: ${e.message}`);
        }
    }

    if (!manifest && fs.existsSync(hashManifestPath)) {
        try {
            manifest = JSON.parse(fs.readFileSync(hashManifestPath, "utf8"));
        } catch (e) {
            console.log(`  ❌ Failed to parse hash manifest: ${e.message}`);
        }
    }

    if (!manifest) {
        console.log("  ❌ No manifest found. Cannot verify.");
        console.log(`     Checked: ${manifestPath}`);
        console.log(`     Checked: ${hashManifestPath}`);
        process.exit(EXIT.MANIFEST_ERROR);
    }

    // Step 1: Verify manifest signature
    const sigPath = resolveKitPath("manifest.sig");
    const pubKeyPath = resolveKitPath("root_public_key.pem");
    const sigResult = verifySignature(manifestPath, sigPath, pubKeyPath);

    if (sigResult === false) {
        console.log("");
        console.log("  ❌ VERIFICATION FAILED — SIGNATURE INVALID");
        process.exit(EXIT.SIGNATURE_INVALID);
    }

    console.log("");

    // Step 2: Verify artifact hash
    const hashResult = await verifyArtifactHash(filePath, manifest);

    if (!hashResult.match) {
        console.log("");
        console.log("  ❌ VERIFICATION FAILED — HASH MISMATCH");
        process.exit(EXIT.HASH_MISMATCH);
    }

    console.log("");

    // Step 3: Validate manifest schema
    validateManifestSchema(manifest);

    // Final result
    console.log("");
    console.log("  ════════════════════════════════════════════════");
    if (sigResult === true) {
        console.log("  ✅ VERIFIED (signature + hash)");
    } else {
        console.log("  ✅ VERIFIED (hash only — signature not available)");
    }
    console.log("  ════════════════════════════════════════════════");
    console.log("");

    process.exit(EXIT.VERIFIED);
}

main().catch((err) => {
    console.error(`  ❌ ERROR: ${err.message}`);
    process.exit(EXIT.MANIFEST_ERROR);
});
