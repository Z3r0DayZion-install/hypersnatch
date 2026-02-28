// ==================== SOVEREIGN LICENSE GENERATOR ====================
// Usage: node generate_license.js "User Name" "HWID"
"use strict";

const fs = require('fs');
const SovereignAuth = require('../src/core/security/sovereign_auth');

const userName = process.argv[2] || "Empire Founder";
const hwid = process.argv[3];

if (!hwid) {
  console.error("Error: Hardware ID (HWID) is required.");
  console.log('Usage: node generate_license.js "User Name" "FULL-HWID-STRING"');
  process.exit(1);
}

console.log(`Generating Legendary License for: ${userName}`);
console.log(`Target Hardware ID: ${hwid}`);

const payload = SovereignAuth.generateLicensePayload(userName, hwid);

// Simulate ECDSA Signing
const license = {
  payload,
  signature: "MOCK_ECDSA_SIGNATURE_" + Buffer.from(JSON.stringify(payload)).toString('base64').substring(0, 32),
  signer: "HyperSnatch Sovereign Authority"
};

const outputPath = 'license.json';
fs.writeFileSync(outputPath, JSON.stringify(license, null, 2));

console.log(`✅ Sovereign License generated successfully: ${outputPath}`);
console.log(`Move this file to the app root to unlock Legendary Features.`);
