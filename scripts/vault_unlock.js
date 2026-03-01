/**
 * HyperSnatch Forensic Vault Unlock Utility (v1.2)
 * Unlocks hardware-bound encrypted evidence vaults.
 * 
 * Usage: node vault_unlock.js <vault_folder_path> <HardwareID>
 */

"use strict";

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function unlockVault(vaultPath, hwid) {
    console.log(`🔒 Attempting to unlock HyperSnatch Vault: ${vaultPath}`);
    
    try {
        const manifestPath = path.join(vaultPath, 'VAULT_MANIFEST.json');
        if (!fs.existsSync(manifestPath)) {
            throw new Error("VAULT_MANIFEST.json not found in the specified directory.");
        }

        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const outputDir = path.join(vaultPath, 'UNLOCKED_EVIDENCE');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

        // 1. Derive Vault Key (Must match main.js logic)
        const vaultKey = crypto.pbkdf2Sync(hwid, 'HS-VAULT-SALT-V1', 120000, 32, 'sha256');

        console.log(`🔑 Key derived for Node ID: ${hwid.substring(0, 16)}`);

        for (const [vaultFile, meta] of Object.entries(manifest.files)) {
            const filePath = path.join(vaultPath, vaultFile);
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️ File missing from vault: ${vaultFile}`);
                continue;
            }

            console.log(`🔓 Unlocking: ${meta.originalName}...`);

            const encryptedData = fs.readFileSync(filePath);
            const iv = Buffer.from(meta.iv, 'hex');
            const authTag = Buffer.from(meta.authTag, 'hex');

            const decipher = crypto.createDecipheriv('aes-256-gcm', vaultKey, iv);
            decipher.setAuthTag(authTag);
            decipher.setAAD(Buffer.from('HyperSnatch-Vanguard-Vault'));

            try {
                let decrypted = decipher.update(encryptedData);
                decrypted = Buffer.concat([decrypted, decipher.final()]);

                const outPath = path.join(outputDir, meta.originalName);
                fs.writeFileSync(outPath, decrypted);
                console.log(`   ✅ Restored to: ${outPath}`);
            } catch (err) {
                console.error(`   ❌ DECRYPTION FAILED for ${vaultFile}: ${err.message}`);
                console.error("      Hardware ID may be incorrect or evidence has been tampered with.");
            }
        }

        console.log(`
✨ Vault Unlock Sequence Complete.`);
        console.log(`📍 Unlocked files are located in: ${outputDir}`);

    } catch (e) {
        console.error(`❌ FATAL ERROR: ${e.message}`);
        process.exit(1);
    }
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log("Usage: node vault_unlock.js <vault_folder_path> <HardwareID>");
    process.exit(1);
}

unlockVault(args[0], args[1]);
