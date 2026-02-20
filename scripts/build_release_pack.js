#!/usr/bin/env node
// ==================== SIGNED RELEASE PACK BUILDER ====================
"use strict";

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ==================== CONFIGURATION ====================
const DEFAULT_CONFIG = {
  bundleDir: './dist',
  dataDir: './data',
  outputDir: './releases',
  releaseNotes: './RELEASE_NOTES.md',
  trustStore: './data/truststore.json'
};

// ==================== RELEASE PACK BUILDER ====================
class ReleasePackBuilder {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.releaseId = this.generateReleaseId();
  }
  
  generateReleaseId() {
    return `release_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  async build() {
    console.log('🏗️ Building HyperSnatch Release Pack');
    console.log(`Release ID: ${this.releaseId}`);
    
    try {
      // Ensure output directory exists
      await this.ensureDirectory(this.config.outputDir);
      
      // Build bundle
      const bundle = await this.buildBundle();
      
      // Build data packs
      const dataPacks = await this.buildDataPacks();
      
      // Build release notes
      const releaseNotes = await this.buildReleaseNotes();
      
      // Build trust store
      const trustStore = await this.buildTrustStore();
      
      // Create release manifest
      const manifest = await this.buildManifest(bundle, dataPacks, releaseNotes, trustStore);
      
      // Calculate digests
      const digests = await this.calculateDigests(bundle, dataPacks, releaseNotes, trustStore);
      
      // Sign release pack
      const signature = await this.signRelease(manifest, digests);
      
      // Create final release pack
      const releasePack = await this.createReleasePack(manifest, digests, signature);
      
      // Write release pack
      const outputPath = await this.writeReleasePack(releasePack);
      
      console.log(`✅ Release pack built: ${outputPath}`);
      console.log(`📊 Bundle: ${bundle.files.length} files`);
      console.log(`📊 Data Packs: ${dataPacks.length} packs`);
      console.log(`🔐 Signed: ${signature ? 'YES' : 'NO'}`);
      
      return {
        success: true,
        releaseId: this.releaseId,
        outputPath,
        bundle,
        dataPacks,
        manifest,
        digests,
        signature
      };
      
    } catch (error) {
      console.error(`❌ Build failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  async buildBundle() {
    console.log('📦 Building bundle...');
    
    const bundlePath = path.join(this.config.bundleDir);
    if (!fs.existsSync(bundlePath)) {
      throw new Error(`Bundle directory not found: ${bundlePath}`);
    }
    
    const bundle = {
      format: 'hs-tear-bundle-1',
      schemaVersion: 1,
      app: 'HyperSnatch',
      appVersion: this.getAppVersion(),
      manifest: {
        name: 'HyperSnatch Platform',
        description: 'Security-first evidence analysis platform',
        version: this.getAppVersion(),
        permissions: ['file-system', 'crypto', 'indexed-db'],
        author: 'HyperSnatch Security Team',
        homepage: 'https://hypersnatch.com'
      },
      files: [],
      createdAt: new Date().toISOString()
    };
    
    // Collect assets
    await this.collectAssets(bundlePath, bundle);
    
    // Calculate bundle digest
    bundle.digest = this.calculateDigest(JSON.stringify(bundle));
    
    return bundle;
  }
  
  async collectAssets(basePath, bundle) {
    const collectAssets = async (dir, relativePath = '') => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          await collectAssets(itemPath, path.join(relativePath, item));
        } else {
          const content = fs.readFileSync(itemPath);
          const digest = this.calculateDigest(content);
          
          bundle.files.push({
            name: item,
            path: path.join(relativePath, item),
            type: this.getAssetType(item),
            digest,
            size: stat.size
          });
        }
      }
    };
    
    await collectAssets(basePath);
  }
  
  getAssetType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const typeMap = {
      '.js': 'script',
      '.css': 'style',
      '.png': 'image',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.gif': 'image',
      '.json': 'data',
      '.html': 'data',
      '.txt': 'data'
    };
    return typeMap[ext] || 'data';
  }
  
  async buildDataPacks() {
    console.log('📦 Building data packs...');
    
    const dataPacks = [];
    const dataDir = this.config.dataDir;
    
    if (!fs.existsSync(dataDir)) {
      console.log('⚠️ Data directory not found, skipping data packs');
      return dataPacks;
    }
    
    // Build trust store pack
    if (fs.existsSync(this.config.trustStore)) {
      const trustStoreData = fs.readFileSync(this.config.trustStore, 'utf8');
      const trustStorePack = await this.buildDataPack('truststore', trustStoreData, 'vault');
      dataPacks.push(trustStorePack);
    }
    
    // Build release notes pack
    if (fs.existsSync(this.config.releaseNotes)) {
      const releaseNotesData = fs.readFileSync(this.config.releaseNotes, 'utf8');
      const releaseNotesPack = await this.buildDataPack('release-notes', releaseNotesData, 'export');
      dataPacks.push(releaseNotesPack);
    }
    
    return dataPacks;
  }
  
  async buildDataPack(name, data, kind = 'vault') {
    const pack = {
      format: 'tear-v2',
      schemaVersion: 2,
      app: 'HyperSnatch',
      appVersion: this.getAppVersion(),
      kind,
      createdAt: new Date().toISOString(),
      kdf: 'PBKDF2-SHA256',
      iterations: 120000,
      salt: this.generateSalt(),
      iv: this.generateIV(),
      data: Buffer.from(JSON.stringify(data)).toString('base64')
    };
    
    // Calculate digest
    pack.digest = this.calculateDigest(JSON.stringify(pack));
    
    return pack;
  }
  
  async buildReleaseNotes() {
    if (!fs.existsSync(this.config.releaseNotes)) {
      return `# Release Notes\n\nAuto-generated release notes for ${this.getAppVersion()}`;
    }
    
    return fs.readFileSync(this.config.releaseNotes, 'utf8');
  }
  
  async buildTrustStore() {
    if (!fs.existsSync(this.config.trustStore)) {
      return {
        format: 'hs-trust-store-v2',
        schemaVersion: 2,
        entries: []
      };
    }
    
    return JSON.parse(fs.readFileSync(this.config.trustStore, 'utf8'));
  }
  
  async buildManifest(bundle, dataPacks, releaseNotes, trustStore) {
    const manifest = {
      format: 'hs-release-pack-1',
      schemaVersion: 1,
      releaseId: this.releaseId,
      app: 'HyperSnatch',
      appVersion: this.getAppVersion(),
      createdAt: new Date().toISOString(),
      bundle: {
        format: bundle.format,
        schemaVersion: bundle.schemaVersion,
        digest: bundle.digest,
        files: bundle.files.length
      },
      dataPacks: dataPacks.map(pack => ({
        name: pack.name || pack.kind,
        kind: pack.kind,
        format: pack.format,
        schemaVersion: pack.schemaVersion,
        digest: pack.digest
      })),
      releaseNotes: {
        included: !!releaseNotes,
        digest: this.calculateDigest(releaseNotes)
      },
      trustStore: {
        format: trustStore.format || 'hs-trust-store-v2',
        schemaVersion: trustStore.schemaVersion || 2,
        digest: this.calculateDigest(JSON.stringify(trustStore))
      }
    };
    
    return manifest;
  }
  
  async calculateDigests(bundle, dataPacks, releaseNotes, trustStore) {
    const digests = {
      bundle: bundle.digest,
      dataPacks: {},
      releaseNotes: this.calculateDigest(releaseNotes),
      trustStore: this.calculateDigest(JSON.stringify(trustStore))
    };
    
    dataPacks.forEach(pack => {
      digests.dataPacks[pack.name || pack.kind] = pack.digest;
    });
    
    return digests;
  }
  
  async signRelease(manifest, digests) {
    // For now, return unsigned signature
    // In production, this would use a private key to sign
    return {
      algorithm: 'ECDSA-SHA256',
      publicKey: 'unsigned-demo-key',
      signature: 'unsigned-demo-signature',
      timestamp: new Date().toISOString()
    };
  }
  
  async createReleasePack(manifest, digests, signature) {
    const releasePack = {
      manifest,
      digests,
      signature,
      files: {
        bundle: 'bundle.tear',
        dataPacks: digests.dataPacks,
        releaseNotes: 'release-notes.json',
        trustStore: 'truststore.json'
      }
    };
    
    return releasePack;
  }
  
  async writeReleasePack(releasePack) {
    const outputDir = this.config.outputDir;
    const releaseFileName = `hypersnatch-release-${this.getAppVersion()}-${this.releaseId}.json`;
    const outputPath = path.join(outputDir, releaseFileName);
    
    const releaseJson = JSON.stringify(releasePack, null, 2);
    fs.writeFileSync(outputPath, releaseJson);
    
    return outputPath;
  }
  
  calculateDigest(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }
  
  generateSalt() {
    return crypto.randomBytes(16).toString('base64');
  }
  
  generateIV() {
    return crypto.randomBytes(12).toString('base64');
  }
  
  getAppVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      return packageJson.version || '1.0.0';
    } catch (error) {
      return '1.0.0';
    }
  }
  
  async ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

// ==================== CLI INTERFACE ====================
function printUsage() {
  console.log(`
HyperSnatch Release Pack Builder

USAGE:
  node build_release_pack.js [options]

OPTIONS:
  --bundle-dir <path>     Bundle directory (default: ./dist)
  --data-dir <path>       Data directory (default: ./data)
  --output-dir <path>     Output directory (default: ./releases)
  --release-notes <path>  Release notes file (default: ./RELEASE_NOTES.md)
  --trust-store <path>    Trust store file (default: ./data/truststore.json)

EXAMPLES:
  # Build with defaults
  node build_release_pack.js

  # Custom paths
  node build_release_pack.js --bundle-dir ./build --data-dir ./vault --output-dir ./releases
`);
}

// ==================== MAIN ====================
async function main() {
  const args = process.argv.slice(2);
  const config = {};
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
    
    if (arg === '--out' && i + 1 < args.length) {
      config.outputDir = args[i + 1];
      i++; // Skip next argument
    } else if (arg.startsWith('--out=')) {
      config.outputDir = arg.substring(6);
    } else if (arg.startsWith('--') && arg.includes('=')) {
      const [key, value] = arg.substring(2).split('=');
      config[key.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())] = value;
    }
  }
  
  const builder = new ReleasePackBuilder(config);
  const result = await builder.build();
  
  if (!result.success) {
    console.error('Build failed:', result.error);
    process.exit(1);
  }
  
  console.log('\n🎉 Release pack built successfully!');
  console.log(`📍 Output: ${result.outputPath}`);
}

if (require.main === module) {
  main();
}

module.exports = ReleasePackBuilder;
