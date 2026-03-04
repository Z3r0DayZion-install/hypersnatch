"use strict";

/**
 * Ed25519 Manifest Signing Tool
 *
 * Generates a detached Ed25519 signature for MANIFEST.json.
 * Uses Node.js built-in crypto (Ed25519 support since Node 15).
 *
 * Usage:
 *   # Generate keypair (first time only):
 *   node scripts/sign_manifest.cjs --generate-keys
 *
 *   # Sign a manifest:
 *   node scripts/sign_manifest.cjs --sign dist/MANIFEST.json --key release/keys/signing_key.pem
 *
 *   # Verify a signature:
 *   node scripts/sign_manifest.cjs --verify dist/MANIFEST.json --sig dist/manifest.sig --pubkey release/verify/root_public_key.pem
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

// ── Key Generation ──────────────────────────────────────────────────────────

function generateKeypair(outputDir) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519", {
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    fs.mkdirSync(outputDir, { recursive: true });

    const privPath = path.join(outputDir, "signing_key.pem");
    const pubPath = path.join(outputDir, "root_public_key.pem");

    fs.writeFileSync(privPath, privateKey, "utf8");
    fs.writeFileSync(pubPath, publicKey, "utf8");

    // Also copy public key to verify kit
    const verifyKit = path.join(ROOT, "release", "verify");
    fs.mkdirSync(verifyKit, { recursive: true });
    fs.writeFileSync(path.join(verifyKit, "root_public_key.pem"), publicKey, "utf8");

    // Generate fingerprint
    const der = crypto.createPublicKey(publicKey).export({ type: "spki", format: "der" });
    const fingerprint = crypto.createHash("sha256").update(der).digest("hex");
    const formatted = fingerprint.match(/.{1,4}/g).join(" ").toUpperCase();

    const fingerprintContent = [
        "-----BEGIN PUBLIC KEY FINGERPRINT-----",
        "",
        `FINGERPRINT: ${formatted}`,
        `KEY ID:      HS-ROOT-KEY-${new Date().getFullYear()}`,
        `ALGORITHM:   Ed25519`,
        `GENERATED:   ${new Date().toISOString()}`,
        "",
        "-----END PUBLIC KEY FINGERPRINT-----",
        "",
    ].join("\n");

    fs.writeFileSync(path.join(verifyKit, "ROOT_FINGERPRINT.txt"), fingerprintContent, "utf8");

    console.log("✅ Ed25519 keypair generated:");
    console.log(`   Private key: ${privPath}`);
    console.log(`   Public key:  ${pubPath}`);
    console.log(`   Fingerprint: ${formatted}`);
    console.log("");
    console.log("⚠️  KEEP signing_key.pem SECRET. Add release/keys/ to .gitignore.");

    return { privPath, pubPath };
}

// ── Signing ─────────────────────────────────────────────────────────────────

function signManifest(manifestPath, keyPath) {
    if (!fs.existsSync(manifestPath)) {
        console.error(`✗ Manifest not found: ${manifestPath}`);
        process.exit(1);
    }
    if (!fs.existsSync(keyPath)) {
        console.error(`✗ Signing key not found: ${keyPath}`);
        console.error("  Run: node scripts/sign_manifest.cjs --generate-keys");
        process.exit(1);
    }

    const manifest = fs.readFileSync(manifestPath);
    const privateKey = fs.readFileSync(keyPath, "utf8");

    const signature = crypto.sign(null, manifest, privateKey);
    const sigHex = signature.toString("hex");

    // Write detached signature
    const sigPath = manifestPath.replace(/\.json$/i, ".sig");
    fs.writeFileSync(sigPath, sigHex, "utf8");

    // Also write to verify kit
    const verifyKit = path.join(ROOT, "release", "verify");
    fs.mkdirSync(verifyKit, { recursive: true });
    fs.writeFileSync(path.join(verifyKit, "manifest.sig"), sigHex, "utf8");

    console.log("✅ Manifest signed:");
    console.log(`   Manifest:  ${manifestPath}`);
    console.log(`   Signature: ${sigPath}`);
    console.log(`   Sig (hex):  ${sigHex.substring(0, 32)}...`);

    return sigPath;
}

// ── Verification ────────────────────────────────────────────────────────────

function verifyManifest(manifestPath, sigPath, pubKeyPath) {
    if (!fs.existsSync(manifestPath)) {
        console.error(`✗ Manifest not found: ${manifestPath}`);
        process.exit(1);
    }
    if (!fs.existsSync(sigPath)) {
        console.error(`✗ Signature not found: ${sigPath}`);
        process.exit(1);
    }
    if (!fs.existsSync(pubKeyPath)) {
        console.error(`✗ Public key not found: ${pubKeyPath}`);
        process.exit(1);
    }

    const manifest = fs.readFileSync(manifestPath);
    const sigHex = fs.readFileSync(sigPath, "utf8").trim();
    const signature = Buffer.from(sigHex, "hex");
    const publicKey = fs.readFileSync(pubKeyPath, "utf8");

    const valid = crypto.verify(null, manifest, publicKey, signature);

    if (valid) {
        console.log("✅ SIGNATURE VALID");
        console.log(`   Manifest:  ${manifestPath}`);
        console.log(`   Key:       ${pubKeyPath}`);
        return true;
    } else {
        console.error("❌ SIGNATURE INVALID");
        console.error(`   Manifest:  ${manifestPath}`);
        console.error("   The manifest has been tampered with or was signed by a different key.");
        process.exit(2);
    }
}

// ── CLI ─────────────────────────────────────────────────────────────────────

function main() {
    const args = process.argv.slice(2);

    if (args.includes("--generate-keys")) {
        const outputDir = path.join(ROOT, "release", "keys");
        generateKeypair(outputDir);
        return;
    }

    if (args.includes("--sign")) {
        const manifestIdx = args.indexOf("--sign") + 1;
        const keyIdx = args.indexOf("--key") + 1;

        const manifestPath = args[manifestIdx] || path.join(ROOT, "dist", "MANIFEST.json");
        const keyPath = keyIdx > 0 ? args[keyIdx] : path.join(ROOT, "release", "keys", "signing_key.pem");

        signManifest(manifestPath, keyPath);
        return;
    }

    if (args.includes("--verify")) {
        const manifestIdx = args.indexOf("--verify") + 1;
        const sigIdx = args.indexOf("--sig") + 1;
        const pubIdx = args.indexOf("--pubkey") + 1;

        const manifestPath = args[manifestIdx] || path.join(ROOT, "dist", "MANIFEST.json");
        const sigPath = sigIdx > 0 ? args[sigIdx] : manifestPath.replace(/\.json$/i, ".sig");
        const pubKeyPath = pubIdx > 0 ? args[pubIdx] : path.join(ROOT, "release", "verify", "root_public_key.pem");

        verifyManifest(manifestPath, sigPath, pubKeyPath);
        return;
    }

    console.log("Usage:");
    console.log("  node sign_manifest.cjs --generate-keys");
    console.log("  node sign_manifest.cjs --sign <manifest.json> --key <private.pem>");
    console.log("  node sign_manifest.cjs --verify <manifest.json> --sig <manifest.sig> --pubkey <public.pem>");
}

main();
