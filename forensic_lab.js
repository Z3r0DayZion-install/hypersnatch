/**
 * HYPERSNATCH ELITE // FORENSIC RESURRECTION LAB
 * -----------------------------------------------
 */

"use strict";

const SmartDecode = require('./src/core/smartdecode');
const AuditChain = require('./src/core/smartdecode/audit-chain');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function runForensicLab() {
    console.log("\n[1] INGESTING OBFUSCATED ARTIFACT...");
    
    // A complex "dirty" artifact with multiple hidden signals
    const artifact = `
        <html>
            <body>
                <div id="content">
                    <p>Benign content here...</p>
                    
                    <!-- SIGNAL A: Obfuscated Script Variable -->
                    <script>
                        var _init_data = "aHR0cHM6Ly9raGFyZWQuY29tL2ZpbGUvYTIzYjliYmYvbGVha2VkX2RvY3VtZW50cy5wZGY=";
                    </script>

                    <!-- SIGNAL B: Fake Link (Honeypot) -->
                    <a href="https://example.com/not-real">Download Here</a>

                    <!-- SIGNAL C: Data Attribute Link -->
                    <div class="media-player" data-source="https://vidoza.net/v/abc123xyz.mp4"></div>
                </div>
            </body>
        </html>
    `;

    console.log("[2] RUNNING SMARTDECODE RESURRECTION...");
    const results = await SmartDecode.run(artifact, {
        sourceType: 'html',
        mode: 'strict'
    });

    console.log(`\n🔍 DISCOVERY COMPLETE: Found ${results.candidates.length} Forensic Candidates.`);
    
    results.candidates.sort((a, b) => b.confidence - a.confidence).forEach((c, i) => {
        console.log(`   ${i+1}. [${(c.confidence * 100).toFixed(0)}%] ${c.url}`);
        console.log(`      -> Layer: ${c.sourceLayer} // Host: ${c.host}`);
    });

    console.log("\n[3] INITIATING SOVEREIGN FINAL FREEZE...");
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const casePath = path.join(__dirname, `CASE-LAB-FREEZE-${timestamp}`);
    if (!fs.existsSync(casePath)) fs.mkdirSync(casePath);

    // Prepare Evidence Pack
    const evidenceReport = JSON.stringify({
        caseId: "LAB-RESURRECTION-01",
        timestamp: new Date().toISOString(),
        findings: results.candidates
    }, null, 2);

    // Write Evidence Files
    fs.writeFileSync(path.join(casePath, "findings.json"), evidenceReport);
    fs.writeFileSync(path.join(casePath, "original_artifact.html"), artifact);

    // Sign the Case (The Sovereign Seal)
    const hwid = "HS-ELITE-SILICON-DNA-PROD-2026-LONG-BUFFER-DATA";
    const systemInfo = { buildId: "HS-PROD-2026-02-28", engineVersion: "1.1.0-Elite" };
    
    const signedBundle = await AuditChain.signSession({
        candidates: results.candidates,
        refusals: results.refusals,
        telemetry: { duration: 120 }
    }, systemInfo, hwid);

    fs.writeFileSync(path.join(casePath, "SOVEREIGN_AUDIT_CHAIN.tear.json"), JSON.stringify(signedBundle, null, 2));

    console.log("\n[4] VAULTING COMPLETE.");
    console.log(`📂 CASE DIRECTORY: ${casePath}`);
    
    // List the resulting files
    const files = fs.readdirSync(casePath);
    console.log("\n--- FROZEN ASSETS ---");
    files.forEach(f => console.log(`[FILE] ${f}`));
    
    console.log("\n✅ REALITY RECONSTRUCTED AND SEALED.");
}

runForensicLab().catch(console.error);
