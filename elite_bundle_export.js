/**
 * ELITE BUNDLE EXPORT // FINAL VERIFICATION
 */

"use strict";

const AuditChain = require('./src/core/smartdecode/audit-chain');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function createEliteBundle() {
    console.log("\n🛠️  CONSTRUCTING SOVEREIGN FORENSIC BUNDLE...");

    // 1. ASSETS (The "Downloads")
    const assets = [
        { name: "evidence_log.json", content: JSON.stringify({ event: "INTEL_FOUND", host: "rapidgator.net" }) },
        { name: "screenshot_hash.txt", content: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" }
    ];

    const bundleDir = path.join(__dirname, 'FORENSIC_EXPORT_ELITE');
    if (!fs.existsSync(bundleDir)) fs.mkdirSync(bundleDir);

    const assetMetas = [];

    for (const asset of assets) {
        const filePath = path.join(bundleDir, asset.name);
        fs.writeFileSync(filePath, asset.content);
        
        const digest = crypto.createHash('sha256').update(asset.content).digest('hex');
        assetMetas.push({
            name: asset.name,
            path: `./${asset.name}`,
            size: asset.content.length,
            digest: digest
        });
        console.log(`   [+] Added Asset: ${asset.name} (${digest.substring(0, 8)}...)`);
    }

    // 2. SOVEREIGN AUDIT CHAIN (The Seal)
    console.log("\n🔐 GENERATING SOVEREIGN AUDIT CHAIN...");
    
    const hwid = "HS-ELITE-SILICON-DNA-PROD-2026-LONG-BUFFER-DATA";
    const systemInfo = { buildId: "HS-PROD-2026-02-28", engineVersion: "1.1.0-Elite" };
    
    // Pass assets as part of telemetry so they are included in the signed payload
    const sessionState = {
        candidates: [
            { url: "https://rapidgator.net/file/abc123/malicious.zip", host: "rapidgator.net", confidence: 0.95 }
        ],
        refusals: [],
        telemetry: { 
            exportType: "FULL_BUNDLE",
            bundleAssets: assetMetas 
        }
    };

    const signedBundle = await AuditChain.signSession(sessionState, systemInfo, hwid);
    
    const manifestPath = path.join(bundleDir, "MANIFEST.tear.json");
    fs.writeFileSync(manifestPath, JSON.stringify(signedBundle, null, 2));

    console.log(`✅ BUNDLE SEALED: ${manifestPath}`);
    console.log(`✍️  SIGNATURE: ${signedBundle.signature.substring(0, 32)}...`);
    console.log(`⛓️  MERKLE ROOT: ${signedBundle.header.merkleRoot}`);

    console.log("\n[VERIFICATION] Attempting to verify sealed bundle...");
    const isVerified = AuditChain.verifySession(signedBundle, hwid);
    
    if (isVerified) {
        console.log("🟢 SOVEREIGN TRUST VERIFIED: Bundle is authentic and untampered.");
    } else {
        console.log("🔴 VERIFICATION FAILED: Signature or Merkle mismatch.");
    }
}

createEliteBundle().catch(console.error);
