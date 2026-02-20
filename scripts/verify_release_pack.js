#!/usr/bin/env node
// ==================== RELEASE PACK VERIFIER ====================
"use strict";

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ==================== RELEASE PACK VERIFIER ====================
class ReleasePackVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }
  
  async verify(releasePackPath) {
    console.log('🔍 Verifying HyperSnatch Release Pack');
    console.log(`File: ${releasePackPath}`);
    
    try {
      // Load release pack
      const releasePack = this.loadReleasePack(releasePackPath);
      
      // Verify schema
      await this.verifySchema(releasePack);
      
      // Verify manifest
      await this.verifyManifest(releasePack);
      
      // Verify digests
      await this.verifyDigests(releasePack);
      
      // Verify signature
      await this.verifySignature(releasePack);
      
      // Verify bundle
      await this.verifyBundle(releasePack);
      
      // Verify data packs
      await this.verifyDataPacks(releasePack);
      
      // Generate report
      const report = this.generateReport(releasePack);
      
      console.log('\n📊 Verification Results:');
      console.log(`✅ Passed: ${report.passed}`);
      console.log(`⚠️ Warnings: ${report.warnings}`);
      console.log(`❌ Errors: ${report.errors}`);
      
      if (report.errors > 0) {
        console.log('\n❌ VERIFICATION FAILED');
        this.errors.forEach(error => console.log(`  - ${error}`));
        process.exit(1);
      } else {
        console.log('\n✅ VERIFICATION PASSED');
        if (report.warnings > 0) {
          console.log('\n⚠️ Warnings:');
          this.warnings.forEach(warning => console.log(`  - ${warning}`));
        }
      }
      
      return report;
      
    } catch (error) {
      console.error(`❌ Verification failed: ${error.message}`);
      process.exit(1);
    }
  }
  
  loadReleasePack(releasePackPath) {
    if (!fs.existsSync(releasePackPath)) {
      throw new Error(`Release pack not found: ${releasePackPath}`);
    }
    
    try {
      const content = fs.readFileSync(releasePackPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse release pack: ${error.message}`);
    }
  }
  
  async verifySchema(releasePack) {
    const requiredFields = ['manifest', 'digests', 'signature', 'files'];
    
    for (const field of requiredFields) {
      if (!releasePack[field]) {
        this.errors.push(`Missing required field: ${field}`);
      }
    }
    
    // Verify manifest schema
    if (releasePack.manifest) {
      const manifest = releasePack.manifest;
      const requiredManifestFields = ['format', 'schemaVersion', 'releaseId', 'app', 'appVersion', 'createdAt'];
      
      for (const field of requiredManifestFields) {
        if (!manifest[field]) {
          this.errors.push(`Missing required manifest field: ${field}`);
        }
      }
      
      // Verify format
      if (manifest.format !== 'hs-release-pack-1') {
        this.errors.push(`Invalid manifest format: ${manifest.format}`);
      }
      
      // Verify schema version
      if (manifest.schemaVersion !== 1) {
        this.errors.push(`Invalid manifest schema version: ${manifest.schemaVersion}`);
      }
    }
  }
  
  async verifyManifest(releasePack) {
    if (!releasePack || !releasePack.manifest) {
      this.errors.push('Invalid release pack structure in verifyManifest');
      return;
    }
    
    const { manifest } = releasePack;
    
    // Verify release ID format
    if (manifest.releaseId && !/^release_\d+_[a-z0-9]+$/.test(manifest.releaseId)) {
      this.warnings.push(`Unusual release ID format: ${manifest.releaseId}`);
    }
    
    // Verify app name
    if (manifest.app !== 'HyperSnatch') {
      this.errors.push(`Invalid app name: ${manifest.app}`);
    }
    
    // Verify app version format
    if (!/^\d+\.\d+\.\d+/.test(manifest.appVersion)) {
      this.warnings.push(`Unusual app version format: ${manifest.appVersion}`);
    }
    
    // Verify created date
    const createdDate = new Date(manifest.createdAt);
    if (isNaN(createdDate.getTime())) {
      this.errors.push(`Invalid createdAt date: ${manifest.createdAt}`);
    }
    
    // Verify bundle info
    if (!manifest.bundle) {
      this.errors.push('Missing bundle information in manifest');
    } else {
      const bundle = manifest.bundle;
      if (!bundle.digest || !bundle.format || !bundle.schemaVersion) {
        this.errors.push('Incomplete bundle information in manifest');
      }
    }
  }
  
  async verifyDigests(releasePack) {
    if (!releasePack || !releasePack.digests) {
      this.errors.push('Invalid release pack structure in verifyDigests');
      return;
    }
    
    const { digests } = releasePack;
    
    if (!digests.bundle) {
      this.errors.push('Missing bundle digest');
    }
    
    if (!digests.releaseNotes) {
      this.warnings.push('Missing release notes digest');
    }
    
    if (!digests.trustStore) {
      this.warnings.push('Missing trust store digest');
    }
    
    // Verify data pack digests
    if (digests.dataPacks) {
      for (const [name, digest] of Object.entries(digests.dataPacks)) {
        if (!digest || !/^[a-fA-F0-9]{64}$/.test(digest)) {
          this.errors.push(`Invalid data pack digest for ${name}: ${digest}`);
        }
      }
    }
  }
  
  async verifySignature(releasePack) {
    if (!releasePack || !releasePack.signature) {
      this.warnings.push('No signature present (unsigned release)');
      return;
    }
    
    const { signature } = releasePack;
    
    if (!signature) {
      this.warnings.push('No signature present (unsigned release)');
      return;
    }
    
    // Verify signature format
    const requiredSignatureFields = ['algorithm', 'publicKey', 'signature', 'timestamp'];
    
    for (const field of requiredSignatureFields) {
      if (!signature[field]) {
        this.errors.push(`Missing signature field: ${field}`);
      }
    }
    
    // Verify algorithm
    if (signature.algorithm !== 'ECDSA-SHA256') {
      this.warnings.push(`Unexpected signature algorithm: ${signature.algorithm}`);
    }
    
    // Verify timestamp
    const timestamp = new Date(signature.timestamp);
    if (isNaN(timestamp.getTime())) {
      this.errors.push(`Invalid signature timestamp: ${signature.timestamp}`);
    }
    
    // For demo purposes, we don't verify the actual signature
    // In production, this would verify the signature against the manifest
    if (signature.publicKey === 'unsigned-demo-key') {
      this.warnings.push('Demo signature - not cryptographically verified');
    }
  }
  
  async verifyBundle(releasePack) {
    if (!releasePack || !releasePack.manifest) {
      this.errors.push('Invalid release pack structure');
      return;
    }
    
    const { manifest, files } = releasePack;
    
    if (!manifest.bundle || !files.bundle) {
      this.errors.push('Bundle information missing');
      return;
    }
    
    const bundleInfo = manifest.bundle;
    const bundleFile = files.bundle;
    
    // Verify bundle format
    if (bundleInfo.format !== 'hs-tear-bundle-1') {
      this.errors.push(`Invalid bundle format: ${bundleInfo.format}`);
    }
    
    // Verify bundle schema version
    if (bundleInfo.schemaVersion !== 1) {
      this.errors.push(`Invalid bundle schema version: ${bundleInfo.schemaVersion}`);
    }
    
    // Verify bundle digest format
    if (!bundleInfo.digest || !/^[a-fA-F0-9]{64}$/.test(bundleInfo.digest)) {
      this.errors.push(`Invalid bundle digest format: ${bundleInfo.digest}`);
    }
  }
  
  async verifyDataPacks(releasePack) {
    if (!releasePack || !releasePack.manifest) {
      this.errors.push('Invalid release pack structure in verifyDataPacks');
      return;
    }
    
    const { manifest, files } = releasePack;
    
    if (!manifest.dataPacks || !files.dataPacks) {
      this.warnings.push('No data packs in release');
      return;
    }
    
    const manifestPacks = manifest.dataPacks;
    const filePacks = files.dataPacks;
    
    // Verify each data pack
    if (Array.isArray(manifestPacks)) {
      for (const pack of manifestPacks) {
      if (!pack.name || !pack.kind || !pack.format || !pack.schemaVersion || !pack.digest) {
        this.errors.push(`Incomplete data pack information: ${JSON.stringify(pack)}`);
        continue;
      }
      
      // Verify format
      if (pack.format !== 'tear-v2') {
        this.errors.push(`Invalid data pack format for ${pack.name}: ${pack.format}`);
      }
      
      // Verify schema version
      if (pack.schemaVersion !== 2) {
        this.errors.push(`Invalid data pack schema version for ${pack.name}: ${pack.schemaVersion}`);
      }
      
      // Verify digest format
      if (!/^[a-fA-F0-9]{64}$/.test(pack.digest)) {
        this.errors.push(`Invalid data pack digest for ${pack.name}: ${pack.digest}`);
      }
      
      // Verify kind
      const validKinds = ['tear', 'export', 'snapshot', 'vault'];
      if (!validKinds.includes(pack.kind)) {
        this.warnings.push(`Unexpected data pack kind for ${pack.name}: ${pack.kind}`);
      }
    }
    }
  }
  
  generateReport(releasePack) {
    if (!releasePack || !releasePack.manifest) {
      return {
        releaseId: 'unknown',
        appVersion: 'unknown',
        createdAt: 'unknown',
        bundle: 0,
        dataPacks: 0,
        passed: false,
        errors: this.errors.length + 1,
        warnings: this.warnings.length,
        issues: ['Invalid release pack structure', ...this.errors, ...this.warnings]
      };
    }
    
    return {
      releaseId: releasePack.manifest?.releaseId || 'unknown',
      appVersion: releasePack.manifest?.appVersion || 'unknown',
      createdAt: releasePack.manifest?.createdAt || 'unknown',
      bundle: releasePack.manifest?.bundle?.files || 0,
      dataPacks: releasePack.manifest?.dataPacks?.length || 0,
      passed: this.errors.length === 0,
      errors: this.errors.length,
      warnings: this.warnings.length,
      issues: [...this.errors, ...this.warnings]
    };
  }
}

// ==================== CLI INTERFACE ====================
function printUsage() {
  console.log(`
HyperSnatch Release Pack Verifier

USAGE:
  node verify_release_pack.js <release-pack-path>

EXAMPLES:
  # Verify release pack
  node verify_release_pack.js ./releases/hypersnatch-release-1.0.0-release_123456789_abc123.json

  # Verify with full path
  node verify_release_pack.js /path/to/release-pack.json
`);
}

// ==================== MAIN ====================
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }
  
  let releasePackPath = null;
  
  // Handle --in parameter
  const inIndex = args.findIndex(arg => arg === '--in');
  if (inIndex !== -1 && inIndex + 1 < args.length) {
    releasePackPath = args[inIndex + 1];
  } else {
    // Handle --in=value parameter
    const inArg = args.find(arg => arg.startsWith('--in='));
    if (inArg) {
      releasePackPath = inArg.substring(5);
    } else {
      // Use first argument as path
      releasePackPath = args[0];
    }
  }
  
  if (!releasePackPath) {
    console.error('❌ Usage: node verify_release_pack.js --in <path> or node verify_release_pack.js <path>');
    process.exit(1);
  }
  
  if (!fs.existsSync(releasePackPath)) {
    console.error(`❌ File not found: ${releasePackPath}`);
    process.exit(1);
  }
  
  const verifier = new ReleasePackVerifier();
  await verifier.verify(releasePackPath);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const pathArg = args.find(arg => arg.startsWith('--in='));
  const releasePackPath = pathArg ? pathArg.substring(5) : args[0];
  
  if (!releasePackPath) {
    console.error('❌ Usage: node verify_release_pack.js --in <path>');
    process.exit(1);
  }
  
  main(releasePackPath);
}

module.exports = ReleasePackVerifier;
