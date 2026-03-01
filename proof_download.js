/**
 * PROOF OF EXTRACTION // ELITE DOWNLOAD SIMULATION
 * This script simulates the full HyperSnatch lifecycle:
 * 1. Ingestion of a raw HTML artifact
 * 2. SmartDecode extraction & Ranking
 * 3. Sovereign Audit Chain Signing (The Seal)
 * 4. Vaulting (The Download)
 */

"use strict";

const SmartDecode = require('./src/core/smartdecode');
const AuditChain = require('./src/core/smartdecode/audit-chain');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function simulateDownload() {
    console.log("🚀 INITIATING ELITE EXTRACTION SEQUENCE...");

    // 1. MOCK ARTIFACT (A page containing a hidden high-value link)
    const mockHtml = `
        <div class="content">
            <h1>Forensic Target Page</h1>
            <p>The sensitive data is hidden below:</p>
            <script>
                var _payload = "aHR0cHM6Ly9yYXBpZ2F0b3IubmV0L2ZpbGUvYWJjMTIzL3NlY3JldF9kYXRhLnppcA==";
                // Base64 for https://rapidgator.net/file/abc123/secret_data.zip
            </script>
            <a href="https://benign-site.com">Nothing to see here</a>
        </div>
    `;

    // 2. SMART DECODE (Extract & Rank)
    console.log("🔍 Running SmartDecode Engine...");
    const results = await SmartDecode.run(mockHtml, {
        sourceType: 'html',
        mode: 'strict'
    });

    const topCandidate = results.candidates[0];
    if (!topCandidate) {
        console.error("❌ FAILED: No candidates extracted.");
        return;
    }

    console.log(`✅ EXTRACTED: ${topCandidate.url}`);
    console.log(`📊 CONFIDENCE: ${topCandidate.confidence * 100}%`);
    console.log(`🏷️  HOST: ${topCandidate.host}`);

    // 3. SOVEREIGN SEAL (Sign the finding)
    console.log("🔐 Applying Sovereign Audit Chain Seal...");
    const hwid = "HS-ELITE-DEBUG-HWID-2026-LONG-ENTROPY-BUFFER-DATA";
    const systemInfo = { buildId: "HS-PROD-2026-02-28", engineVersion: "1.1.0-Elite" };
    
    const sessionState = {
        candidates: [topCandidate],
        refusals: results.refusals,
        telemetry: { duration: 450 }
    };

    const signedBundle = await AuditChain.signSession(sessionState, systemInfo, hwid);
    console.log(`⛓️  MERKLE ROOT: ${signedBundle.header.merkleRoot}`);
    console.log(`✍️  SIGNATURE: ${signedBundle.signature.substring(0, 32)}...`);

    // 4. VAULTING (The "Download" to the evidence folder)
    const evidenceDir = path.join(__dirname, 'evidence');
    if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir);

    const filename = `evidence_download_${Date.now()}.tear.json`;
    const savePath = path.join(evidenceDir, filename);

    fs.writeFileSync(savePath, JSON.stringify(signedBundle, null, 2));
    
    console.log(`\n📥 DOWNLOAD COMPLETE: Evidence vaulted to:`);
    console.log(`📂 ${savePath}`);
    console.log("\n--- REALITY RECONSTRUCTED ---");
}

simulateDownload().catch(console.error);
