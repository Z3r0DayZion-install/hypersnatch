// ==================== SOVEREIGN ENGINE // TITANIUM-JS CORE ====================
"use strict";

const crypto = require('crypto');

/**
 * Titanium-JS Core: High-performance forensic operations using 
 * Node's native OpenSSL bindings for maximum speed and security.
 */

const SovereignCore = {
    version: "1.0.1",

    /**
     * Native Hardware-Bound Identity Derivation
     */
    async getNativeHWID() {
        return new Promise((resolve) => {
            // Simulate direct hardware sampling + SHA-256
            const rawId = "HARDWARE-SAMPLED-" + Date.now();
            const hash = crypto.createHash('sha256').update(rawId).digest('hex');
            resolve(hash);
        });
    },

    /**
     * Titanium-Grade AES-256-GCM Encryption (Node Native)
     */
    async hardenedEncrypt(plainText, secretKey) {
        const key = crypto.createHash('sha256').update(secretKey).digest();
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

        let ciphertext = cipher.update(plainText, 'utf8', 'base64');
        ciphertext += cipher.final('base64');
        const tag = cipher.getAuthTag();

        return {
            ciphertext: ciphertext,
            iv: iv.toString('base64'),
            tag: tag.toString('base64'),
            algo: "AES-256-GCM"
        };
    },

    /**
     * Titanium-Grade AES-256-GCM Decryption (Node Native)
     */
    async hardenedDecrypt(vault, secretKey) {
        try {
            const key = crypto.createHash('sha256').update(secretKey).digest();
            const iv = Buffer.from(vault.iv, 'base64');
            const tag = Buffer.from(vault.tag, 'base64');
            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(tag);

            let decrypted = decipher.update(vault.ciphertext, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (err) {
            console.error("[SovereignCore] Decryption Failed: " + err.message);
            return null;
        }
    }
};

if (typeof window !== 'undefined') window.SovereignCore = SovereignCore;
module.exports = SovereignCore;
