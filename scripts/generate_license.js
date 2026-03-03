#!/usr/bin/env node
/**
 * HyperSnatch — License Key Generator (Founder-Only CLI)
 * 
 * Generates hardware-bound, ECDSA-signed license files for purchasers.
 * 
 * Usage:
 *   node scripts/generate_license.js --hwid <HWID> --user <name> --edition SOVEREIGN
 *   node scripts/generate_license.js --hwid <HWID> --user <name> --edition INSTITUTIONAL --expiry-years 2
 *   node scripts/generate_license.js --hwid <HWID> --user <name> --edition SOVEREIGN --output my_license.json
 *   node scripts/generate_license.js   (auto-detect local HWID, default SOVEREIGN)
 * 
 * Buyer workflow:
 *   1. Buyer runs HyperSnatch → Settings → copies their HWID
 *   2. Buyer sends HWID via Gumroad/email
 *   3. Founder runs this script with their HWID
 *   4. Founder sends back the license.json
 *   5. Buyer imports license.json via HyperSnatch UI
 */
"use strict";

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ==================== TIER DEFINITIONS ====================
const TIERS = {
  SOVEREIGN: {
    price: '$149',
    features: [
      'UNLIMITED_ANALYSIS',
      'PDF_EXPORT',
      'FINAL_FREEZE',
      'AUDIT_CHAIN',
      'QUANTUM_VAULT',
      'EVIDENCE_VAULT',
      'POLICY_SHIELD'
    ]
  },
  INSTITUTIONAL: {
    price: '$499',
    features: [
      'UNLIMITED_ANALYSIS',
      'PDF_EXPORT',
      'FINAL_FREEZE',
      'AUDIT_CHAIN',
      'QUANTUM_VAULT',
      'EVIDENCE_VAULT',
      'POLICY_SHIELD',
      'HEADLESS_CLI',
      'SITE_LICENSE_5',
      'PRIORITY_SUPPORT'
    ]
  }
};

// ==================== ARGUMENT PARSING ====================
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--hwid': parsed.hwid = args[++i]; break;
      case '--user': parsed.user = args[++i]; break;
      case '--edition': parsed.edition = (args[++i] || '').toUpperCase(); break;
      case '--expiry-years': parsed.expiryYears = parseInt(args[++i], 10); break;
      case '--output': parsed.output = args[++i]; break;
      case '--help':
        printHelp();
        process.exit(0);
      default:
        // Support legacy positional: generate_license.js <hwid> <edition> <email>
        if (!parsed.hwid) { parsed.hwid = args[i]; }
        else if (!parsed.edition) { parsed.edition = args[i].toUpperCase(); }
        else if (!parsed.user) { parsed.user = args[i]; }
    }
  }

  return parsed;
}

function printHelp() {
  console.log(`
HyperSnatch License Generator v2.0

Usage:
  node scripts/generate_license.js --hwid <HWID> --user <name> --edition <SOVEREIGN|INSTITUTIONAL>

Options:
  --hwid           Machine hardware fingerprint (SHA-256 hex, 64 chars)
                   If omitted, auto-detects local machine HWID.
  --user           Licensee name or email (default: founder@hypersnatch.com)
  --edition        SOVEREIGN ($149) or INSTITUTIONAL ($499) (default: SOVEREIGN)
  --expiry-years   License validity in years (default: 1)
  --output         Output file path (default: license_<edition>_<timestamp>.json)
  --help           Show this help

Examples:
  node scripts/generate_license.js
  node scripts/generate_license.js --hwid abc123...def --user john@example.com --edition SOVEREIGN
  node scripts/generate_license.js --hwid abc123...def --user "Acme Corp" --edition INSTITUTIONAL --expiry-years 2
`);
}

// ==================== HWID AUTO-DETECTION ====================
function autoDetectHwid() {
  const cpuId = os.cpus()[0].model.replace(/\s+/g, '_');
  const baseboardId = `${os.hostname()}_${os.userInfo().username}`;
  return crypto.createHash('sha256').update(`HS-HWID-${cpuId}-${baseboardId}`).digest('hex');
}

// ==================== MAIN ====================
async function main() {
  const args = parseArgs();

  // Load founder keys
  const keysPath = path.join(__dirname, '..', 'founder_keys.json');
  if (!fs.existsSync(keysPath)) {
    console.error('❌ founder_keys.json not found. Run generate_keypair.js first.');
    process.exit(1);
  }
  const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
  if (!keys.private) {
    console.error('❌ Private key not found in founder_keys.json.');
    process.exit(1);
  }

  // Defaults
  const hwid = args.hwid || autoDetectHwid();
  const user = args.user || 'founder@hypersnatch.com';
  const edition = args.edition || 'SOVEREIGN';
  const expiryYears = args.expiryYears || 1;

  if (!TIERS[edition]) {
    console.error(`❌ Unknown edition: ${edition}. Use SOVEREIGN or INSTITUTIONAL.`);
    process.exit(1);
  }

  if (!args.hwid) {
    console.log(`⚙️  Auto-detected local HWID: ${hwid}`);
  }

  if (!/^[a-f0-9]{64}$/i.test(hwid)) {
    console.error('⚠️  Warning: HWID does not look like a SHA-256 hash (expected 64 hex chars).');
    console.error(`   Got: ${hwid}`);
    console.error('   Proceeding anyway...');
  }

  // Build payload
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + expiryYears);

  const tierDef = TIERS[edition];
  const payload = {
    user,
    hwid,
    edition,
    expiry: expiry.toISOString(),
    issued: new Date().toISOString(),
    features: tierDef.features,
    version: '1.0.0'
  };

  // Sign with ECDSA secp256k1
  const sign = crypto.createSign('SHA256');
  sign.update(JSON.stringify(payload));
  sign.end();
  const signature = sign.sign(keys.private, 'hex');

  const license = {
    payload,
    signature,
    meta: {
      generator: 'HyperSnatch License Generator v2.0.0',
      algorithm: 'ECDSA-secp256k1-SHA256',
      tier: edition,
      tierPrice: tierDef.price
    }
  };

  // Write output
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputPath = args.output || `license_${edition}_${timestamp}.json`;
  fs.writeFileSync(outputPath, JSON.stringify(license, null, 2));

  console.log('');
  console.log('═'.repeat(60));
  console.log('  HYPERSNATCH LICENSE GENERATOR');
  console.log('═'.repeat(60));
  console.log('');
  console.log(`  User:       ${user}`);
  console.log(`  Edition:    ${edition} (${tierDef.price})`);
  console.log(`  HWID:       ${hwid.substring(0, 16)}...`);
  console.log(`  Expiry:     ${payload.expiry}`);
  console.log(`  Features:   ${payload.features.length} unlocked`);
  console.log(`  Signature:  ${signature.substring(0, 32)}...`);
  console.log('');
  console.log(`  ✅ License written to: ${outputPath}`);
  console.log('');
  console.log('  Send this file to the buyer. They import it via:');
  console.log('  HyperSnatch → Settings → Import License Key');
  console.log('');
  console.log('═'.repeat(60));
}

main().catch(err => {
  console.error('❌ License generation failed:', err.message);
  process.exit(1);
});
