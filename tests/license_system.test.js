#!/usr/bin/env node
/**
 * HyperSnatch — License System Tests
 * 
 * Tests: keypair, signing, verification, tier gating, tampering rejection.
 * Usage: node tests/license_system.test.js
 */
"use strict";

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Require SovereignAuth directly
const SovereignAuth = require(path.join(__dirname, '..', 'src', 'core', 'security', 'sovereign_auth.js'));

let passed = 0;
let failed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`  ✅ ${testName}`);
        passed++;
    } else {
        console.log(`  ❌ ${testName}`);
        failed++;
    }
}

// ==================== HELPERS ====================
function loadKeys() {
    const keysPath = path.join(__dirname, '..', 'founder_keys.json');
    return JSON.parse(fs.readFileSync(keysPath, 'utf8'));
}

function generateTestHWID() {
    return crypto.createHash('sha256').update(`HS-HWID-TEST-${Date.now()}`).digest('hex');
}

function signPayload(payload, privateKey) {
    const sign = crypto.createSign('SHA256');
    sign.update(JSON.stringify(payload));
    sign.end();
    return sign.sign(privateKey, 'hex');
}

// ==================== TEST SUITES ====================
console.log('');
console.log('═'.repeat(60));
console.log('  HYPERSNATCH LICENSE SYSTEM TESTS');
console.log('═'.repeat(60));
console.log('');

// --- 1. Tier Definitions ---
console.log('  § 1: Tier Definitions');
assert(SovereignAuth.TIER_LEVELS['COMMUNITY'] === 0, 'COMMUNITY tier level = 0');
assert(SovereignAuth.TIER_LEVELS['SOVEREIGN'] === 1, 'SOVEREIGN tier level = 1');
assert(SovereignAuth.TIER_LEVELS['INSTITUTIONAL'] === 2, 'INSTITUTIONAL tier level = 2');
assert(SovereignAuth.TIER_FEATURES.COMMUNITY.length >= 1, 'COMMUNITY has features');
assert(SovereignAuth.TIER_FEATURES.SOVEREIGN.includes('PDF_EXPORT'), 'SOVEREIGN has PDF_EXPORT');
assert(SovereignAuth.TIER_FEATURES.SOVEREIGN.includes('FINAL_FREEZE'), 'SOVEREIGN has FINAL_FREEZE');
assert(SovereignAuth.TIER_FEATURES.INSTITUTIONAL.includes('HEADLESS_CLI'), 'INSTITUTIONAL has HEADLESS_CLI');
assert(SovereignAuth.TIER_FEATURES.INSTITUTIONAL.includes('SITE_LICENSE_5'), 'INSTITUTIONAL has SITE_LICENSE_5');
assert(!SovereignAuth.TIER_FEATURES.COMMUNITY.includes('PDF_EXPORT'), 'COMMUNITY lacks PDF_EXPORT');
assert(!SovereignAuth.TIER_FEATURES.COMMUNITY.includes('HEADLESS_CLI'), 'COMMUNITY lacks HEADLESS_CLI');
console.log('');

// --- 2. Tier Gating Logic ---
console.log('  § 2: Tier Gating Logic (meetsMinimumTier)');
assert(SovereignAuth.meetsMinimumTier('COMMUNITY', 'COMMUNITY'), 'COMMUNITY >= COMMUNITY');
assert(!SovereignAuth.meetsMinimumTier('COMMUNITY', 'SOVEREIGN'), 'COMMUNITY < SOVEREIGN');
assert(!SovereignAuth.meetsMinimumTier('COMMUNITY', 'INSTITUTIONAL'), 'COMMUNITY < INSTITUTIONAL');
assert(SovereignAuth.meetsMinimumTier('SOVEREIGN', 'COMMUNITY'), 'SOVEREIGN >= COMMUNITY');
assert(SovereignAuth.meetsMinimumTier('SOVEREIGN', 'SOVEREIGN'), 'SOVEREIGN >= SOVEREIGN');
assert(!SovereignAuth.meetsMinimumTier('SOVEREIGN', 'INSTITUTIONAL'), 'SOVEREIGN < INSTITUTIONAL');
assert(SovereignAuth.meetsMinimumTier('INSTITUTIONAL', 'COMMUNITY'), 'INSTITUTIONAL >= COMMUNITY');
assert(SovereignAuth.meetsMinimumTier('INSTITUTIONAL', 'SOVEREIGN'), 'INSTITUTIONAL >= SOVEREIGN');
assert(SovereignAuth.meetsMinimumTier('INSTITUTIONAL', 'INSTITUTIONAL'), 'INSTITUTIONAL >= INSTITUTIONAL');
console.log('');

// --- 3. Feature Check ---
console.log('  § 3: Feature Check (hasFeature)');
assert(SovereignAuth.hasFeature('SOVEREIGN', 'PDF_EXPORT'), 'SOVEREIGN has PDF_EXPORT');
assert(SovereignAuth.hasFeature('SOVEREIGN', 'FINAL_FREEZE'), 'SOVEREIGN has FINAL_FREEZE');
assert(!SovereignAuth.hasFeature('COMMUNITY', 'PDF_EXPORT'), 'COMMUNITY lacks PDF_EXPORT');
assert(SovereignAuth.hasFeature('INSTITUTIONAL', 'HEADLESS_CLI'), 'INSTITUTIONAL has HEADLESS_CLI');
assert(!SovereignAuth.hasFeature('SOVEREIGN', 'HEADLESS_CLI'), 'SOVEREIGN lacks HEADLESS_CLI');
console.log('');

// --- 4. License Generation & Verification ---
console.log('  § 4: License Sign/Verify (ECDSA secp256k1)');
const keys = loadKeys();
const testHwid = generateTestHWID();

// Valid SOVEREIGN license
const sovereignPayload = SovereignAuth.generateLicensePayload('test@example.com', testHwid, 'SOVEREIGN');
const sovereignSig = signPayload(sovereignPayload, keys.private);
const sovereignLicense = { payload: sovereignPayload, signature: sovereignSig };
const sovereignResult = SovereignAuth.verifyLicense(sovereignLicense, testHwid);
assert(sovereignResult.valid === true, 'SOVEREIGN license verifies OK');
assert(sovereignResult.tier === 'SOVEREIGN', 'SOVEREIGN license tier correct');
assert(sovereignResult.edition === 'SOVEREIGN', 'SOVEREIGN license edition correct');
assert(sovereignResult.features.includes('PDF_EXPORT'), 'SOVEREIGN license includes PDF_EXPORT feature');

// Valid INSTITUTIONAL license
const instPayload = SovereignAuth.generateLicensePayload('corp@example.com', testHwid, 'INSTITUTIONAL');
const instSig = signPayload(instPayload, keys.private);
const instLicense = { payload: instPayload, signature: instSig };
const instResult = SovereignAuth.verifyLicense(instLicense, testHwid);
assert(instResult.valid === true, 'INSTITUTIONAL license verifies OK');
assert(instResult.tier === 'INSTITUTIONAL', 'INSTITUTIONAL license tier correct');
assert(instResult.features.includes('HEADLESS_CLI'), 'INSTITUTIONAL license includes HEADLESS_CLI');
console.log('');

// --- 5. Rejection Cases ---
console.log('  § 5: Rejection Cases');

// Wrong HWID
const wrongHwid = generateTestHWID();
const wrongResult = SovereignAuth.verifyLicense(sovereignLicense, wrongHwid);
assert(wrongResult.valid === false, 'Wrong HWID rejected');
assert(wrongResult.reason.includes('Hardware ID Mismatch'), 'Wrong HWID reason correct');

// Tampered payload
const tamperedLicense = JSON.parse(JSON.stringify(sovereignLicense));
tamperedLicense.payload.edition = 'INSTITUTIONAL';
const tamperedResult = SovereignAuth.verifyLicense(tamperedLicense, testHwid);
assert(tamperedResult.valid === false, 'Tampered payload rejected');
assert(tamperedResult.reason.includes('Signature Invalid') || tamperedResult.reason.includes('tampered'), 'Tampered reason correct');

// Expired license
const expiredPayload = { ...sovereignPayload, expiry: '2020-01-01T00:00:00.000Z' };
const expiredSig = signPayload(expiredPayload, keys.private);
const expiredLicense = { payload: expiredPayload, signature: expiredSig };
const expiredResult = SovereignAuth.verifyLicense(expiredLicense, testHwid);
assert(expiredResult.valid === false, 'Expired license rejected');
assert(expiredResult.reason.includes('Expired'), 'Expired reason correct');

// Missing data
const emptyResult = SovereignAuth.verifyLicense({}, testHwid);
assert(emptyResult.valid === false, 'Empty license rejected');

const nullResult = SovereignAuth.verifyLicense(null, testHwid);
assert(nullResult.valid === false, 'Null license rejected');
console.log('');

// --- 6. Payload Generation Defaults ---
console.log('  § 6: Payload Generation');
const defaultPayload = SovereignAuth.generateLicensePayload('user', testHwid);
assert(defaultPayload.edition === 'SOVEREIGN', 'Default edition is SOVEREIGN');
assert(defaultPayload.version === '1.0.0', 'Payload has version field');
assert(new Date(defaultPayload.expiry) > new Date(), 'Expiry is in the future');
assert(defaultPayload.features.length > 0, 'Features are populated');
console.log('');

// ==================== RESULTS ====================
console.log('═'.repeat(60));
console.log(`  RESULTS: ${passed} PASS | ${failed} FAIL | ${passed + failed} TOTAL`);
console.log('═'.repeat(60));

if (failed > 0) {
    process.exit(1);
}
