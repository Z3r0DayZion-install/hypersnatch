/**
 * HyperSnatch Hardening Verification Script
 * Run: node verify_hardening.js
 */
"use strict";

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Stub electron so logger doesn't crash
const Module = require('module');
const _orig = Module._resolveFilename.bind(Module);
Module._resolveFilename = function (req, ...args) {
    if (req === 'electron') return req;
    return _orig(req, ...args);
};
require.cache['electron'] = {
    id: 'electron', filename: 'electron', loaded: true,
    exports: { app: { getPath: () => require('os').tmpdir() } }
};

console.log("=== HyperSnatch Hardening Verification v1.0.1 ===\n");

const TARGET = "1.0.1";
let pass = 0, fail = 0;

function chk(label, ok, note = '') {
    if (ok) { console.log(`  ✅ ${label}${note ? '  ' + note : ''}`); pass++; }
    else { console.log(`  ❌ ${label}${note ? '  →  ' + note : ''}`); fail++; }
}

// ─── 1. VERSION CONSISTENCY ───────────────────────────────────────────────────
console.log("1. Version Consistency");

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
const verjson = JSON.parse(fs.readFileSync('./VERSION.json', 'utf8')).version;
const cargo = (fs.readFileSync('./rust/hs-core/Cargo.toml', 'utf8').match(/version\s*=\s*"([^"]+)"/) || [])[1];
const sovcore = require('./src/core/sovereign_core').version;
const mainSrc = fs.readFileSync('./src/main.js', 'utf8');
const bridge = (mainSrc.match(/version:\s*'1\.0\.1'/) ? TARGET : mainSrc.match(/version:\s*'([^']+)'/)?.[1]) || 'NOT FOUND';

chk('package.json', pkg === TARGET, pkg);
chk('VERSION.json', verjson === TARGET, verjson);
chk('Cargo.toml (hs-core)', cargo === TARGET, cargo);
chk('sovereign_core.js', sovcore === TARGET, sovcore);
chk('main.js Bridge hb', bridge === TARGET, bridge);

// ─── 2. ECDSA VERIFICATION ────────────────────────────────────────────────────
console.log("\n2. ECDSA License Verification (sovereign_auth.js)");

const SovereignAuth = require('./src/core/security/sovereign_auth');

// 2a. Bad hex signature → must reject
const r1 = SovereignAuth.verifyLicense({
    payload: {
        user: 'test@example.com', hwid: 'dummy', edition: 'LEGENDARY',
        expiry: new Date(Date.now() + 86400000).toISOString(), issued: new Date().toISOString()
    },
    signature: 'deadbeef'
}, 'dummy');
chk('Forged signature rejected', !r1.valid,
    r1.reason || JSON.stringify(r1));

// 2b. Expired license → must reject
const r2 = SovereignAuth.verifyLicense({
    payload: {
        user: 'test@example.com', hwid: 'dummy', edition: 'LEGENDARY',
        expiry: '2020-01-01', issued: '2019-01-01'
    },
    signature: 'anything'
}, 'dummy');
chk('Expired license rejected', !r2.valid && r2.reason.includes('Expired'),
    r2.reason);

// 2c. HWID mismatch → must reject
const r3 = SovereignAuth.verifyLicense({
    payload: {
        user: 'test@example.com', hwid: 'MACHINE-A', edition: 'LEGENDARY',
        expiry: new Date(Date.now() + 86400000).toISOString(), issued: new Date().toISOString()
    },
    signature: 'anything'
}, 'MACHINE-B');
chk('HWID mismatch rejected', !r3.valid && r3.reason.includes('Mismatch'),
    r3.reason);

// 2d. Missing signature → must reject
const r4 = SovereignAuth.verifyLicense({ payload: { user: 'x', hwid: 'y' } }, 'y');
chk('Incomplete license rejected', !r4.valid,
    r4.reason);

// ─── 3. TEAR v3.1.0 + PFS ─────────────────────────────────────────────────────
console.log("\n3. TEAR Protocol v3.1.0 + PFS (audit-chain.js)");

const AuditChain = require('./src/core/smartdecode/audit-chain');

(async () => {
    try {
        const s1 = await AuditChain.signSession(
            { candidates: [{ url: 'https://test.example.com/video.mp4' }], refusals: [] },
            { buildId: 'HS-BUILD-001', engineVersion: TARGET }
        );
        const s2 = await AuditChain.signSession(
            { candidates: [{ url: 'https://test.example.com/video.mp4' }], refusals: [] },
            { buildId: 'HS-BUILD-001', engineVersion: TARGET }
        );

        chk('Schema version is 3.1.0', s1.header.version === '3.1.0', s1.header.version);
        chk('Session ID present', typeof s1.header.sessionId === 'string' && s1.header.sessionId.length > 10);
        chk('Signature present', typeof s1.signature === 'string' && s1.signature.length === 64);
        chk('PFS: unique signatures per run', s1.signature !== s2.signature,
            'Sig1: ' + s1.signature.slice(0, 12) + '… Sig2: ' + s2.signature.slice(0, 12) + '…');
        chk('Fingerprint present', typeof s1.fingerprint === 'string' && s1.fingerprint.length === 64);
    } catch (e) {
        console.log(`  ❌ TEAR test threw: ${e.message}`);
        fail++;
    }

    // ─── FINAL SUMMARY ────────────────────────────────────────────────────────────
    console.log("\n=== RESULT ===");
    console.log(`  Passed : ${pass}`);
    console.log(`  Failed : ${fail}`);
    if (fail === 0) {
        console.log("\n  🚀 ALL CHECKS PASSED — v1.0.1 is hardened and consistent.");
    } else {
        console.log("\n  ⚠️  SOME CHECKS FAILED — review the output above.");
        process.exitCode = 1;
    }
})();
