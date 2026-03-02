/**
 * HyperSnatch Offline License Generation System (v1.2)
 * Used by the Founder to generate hardware-bound, cryptographically signed licenses.
 * 
 * Usage: node keygen.js <User> <HardwareID> [Edition] [DaysValid]
 */

"use strict";

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KEYS_PATH = path.join(__dirname, '..', 'founder_keys.json');

function generateLicense(user, hwid, edition = 'ELITE', daysValid = 365) {
    console.log(`
==================================================`);
    console.log(`🛡️  HyperSnatch Offline KMS // License Generation`);
    console.log(`==================================================`);
    console.log(`User: ${user}`);
    console.log(`Hardware ID: ${hwid}`);
    console.log(`Edition: ${edition}`);
    console.log(`Validity: ${daysValid} Days`);
    console.log(`--------------------------------------------------`);

    try {
        if (!fs.existsSync(KEYS_PATH)) {
            throw new Error(`Founder Keys not found at ${KEYS_PATH}. Cannot sign license.`);
        }

        const keys = JSON.parse(fs.readFileSync(KEYS_PATH, 'utf8'));
        const privateKey = keys.private;

        // 1. Generate Payload
        const issueDate = new Date();
        const expiryDate = new Date(issueDate.getTime() + daysValid * 24 * 60 * 60 * 1000);

        const payload = {
            user,
            hwid,
            edition,
            issued: issueDate.toISOString(),
            expiry: expiryDate.toISOString(),
            features: ["FORENSIC_CORE", "AUDIT_CHAIN", "VAULT_ENCRYPTION"] // Standard v1.2 Features
        };

        if (edition === 'SOVEREIGN' || edition === 'ELITE') {
            payload.features.push("API_ACCESS", "HEADLESS_CLI");
        }

        // 2. Sign Payload (ECDSA SHA256)
        const sign = crypto.createSign('SHA256');
        sign.update(JSON.stringify(payload));
        sign.end();

        const signature = sign.sign(privateKey, 'hex');

        // 3. Assemble Final License Object
        const license = {
            licenseId: crypto.randomUUID(),
            payload,
            signature
        };

        const outPath = path.join(process.cwd(), `license_${user.replace(/\s+/g, '_')}_${hwid.substring(0, 8)}.json`);
        fs.writeFileSync(outPath, JSON.stringify(license, null, 2));

        console.log(`✅ SUCCESS: Cryptographic Signature Applied (ECDSA-SHA256)`);
        console.log(`📁 Saved to: ${outPath}`);
        console.log(`==================================================
`);

    } catch (err) {
        console.error(`❌ FATAL ERROR: ${err.message}
`);
        process.exit(1);
    }
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log("Usage: node scripts/keygen.js <User> <HardwareID> [Edition] [DaysValid]");
    console.log("Example: node scripts/keygen.js "ACME Forensics" "a1b2c3d4e5f6..." ELITE 365");
    process.exit(1);
}

generateLicense(args[0], args[1], args[2], args[3] ? parseInt(args[3], 10) : undefined);
