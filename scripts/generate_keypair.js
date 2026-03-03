#!/usr/bin/env node
/**
 * HyperSnatch — ECDSA Keypair Generator (One-Time Bootstrap)
 * 
 * Generates a secp256k1 keypair and writes it to founder_keys.json.
 * WARNING: Running this will invalidate ALL previously issued licenses.
 * Only run this if you need to regenerate keys from scratch.
 * 
 * Usage: node scripts/generate_keypair.js [--force]
 */
"use strict";

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, '..', 'founder_keys.json');

// Safety check
if (fs.existsSync(OUTPUT_PATH) && !process.argv.includes('--force')) {
    console.error('❌ founder_keys.json already exists.');
    console.error('   Running this will INVALIDATE all existing licenses.');
    console.error('   Use --force to overwrite.');
    process.exit(1);
}

// Generate ECDSA secp256k1 keypair
const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'secp256k1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const keys = {
    public: publicKey,
    private: privateKey,
    generated: new Date().toISOString(),
    algorithm: 'ECDSA-secp256k1-SHA256'
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(keys, null, 2));

console.log('✅ ECDSA secp256k1 keypair generated');
console.log(`   Written to: ${OUTPUT_PATH}`);
console.log('');
console.log('⚠️  CRITICAL: Update the AUTHORITY_PUBLIC_KEY in sovereign_auth.js');
console.log('   with the new public key if you regenerated keys.');
console.log('');
console.log('Public Key:');
console.log(publicKey);
