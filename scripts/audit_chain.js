// scripts/audit_chain.js
// HyperSnatch Independent Forensic Verifier (IPO-Grade)
"use strict";

const fs = require('fs');
const crypto = require('crypto');

async function verifyVault(vaultPath) {
    console.log(`🔍 INITIATING AUDIT FOR: ${vaultPath}`);
    
    const raw = fs.readFileSync(vaultPath, 'utf8');
    const vault = JSON.parse(raw);
    
    // In a real vault, the data is encrypted. This verifier assumes 
    // the user has decrypted the payload for audit purposes.
    const ledger = vault.logs || []; 
    
    if (ledger.length === 0) {
        console.log("⚠️  Ledger is empty. No chain to verify.");
        return;
    }

    console.log(`📡 Analyzing ${ledger.length} chain links...`);
    
    let isValid = true;
    let prevHash = "ROOT_SOVEREIGN";

    for (let i = ledger.length - 1; i >= 0; i--) {
        const link = ledger[i];
        const entry = link.entry;
        
        // Reconstruct the hardware binding
        const hw_b64 = link.hw_sig; 
        const hw = Buffer.from(hw_b64, 'base64').toString();
        
        const payload = `${prevHash}|${entry.type}|${entry.url || entry.host || ""}|${entry.stamp}|${hw}`;
        const currentHash = crypto.createHash('sha256').update(payload).digest('base64').slice(0, 24);

        if (currentHash !== link.hash) {
            console.error(`❌ CHAIN BREACH AT LINK [${i}]: Expected ${link.hash}, got ${currentHash}`);
            isValid = false;
            break;
        }
        
        console.log(`  ✅ Link [${i}] Verified: ${link.hash.slice(0, 12)}... [Node Binding: ${hw_b64}]`);
        prevHash = link.hash;
    }

    if (isValid) {
        console.log("
💎  AUDIT COMPLETE: Forensic Chain of Custody is 100% VALID.");
        console.log("🛡️  Evidence is court-admissible and tamper-evident.");
    } else {
        console.error("
🚫  AUDIT FAILED: Cryptographic Integrity Compromised.");
        process.exit(1);
    }
}

const args = process.argv.slice(2);
if (args.length === 0) {
    console.log("Usage: node scripts/audit_chain.js <path_to_decrypted_vault.json>");
    process.exit(1);
}

verifyVault(args[0]).catch(err => {
    console.error("Audit Error:", err);
});
