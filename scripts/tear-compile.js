#!/usr/bin/env node
// ==================== TEAR COMPILER v1 ====================
"use strict";

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ==================== CONFIGURATION ====================
const SUPPORTED_FORMATS = {
  BUNDLE: 'hs-tear-bundle-1',
  DATA: 'tear-v2'
};

const DEFAULT_ITERATIONS = 120000;
const DEFAULT_SALT_LENGTH = 16;
const DEFAULT_IV_LENGTH = 12;

// ==================== UTILITIES ====================
function generateSalt(length = DEFAULT_SALT_LENGTH) {
  return crypto.randomBytes(length).toString('base64');
}

function generateIV(length = DEFAULT_IV_LENGTH) {
  return crypto.randomBytes(length).toString('base64');
}

function deriveKey(passphrase, salt, iterations = DEFAULT_ITERATIONS) {
  return crypto.pbkdf2Sync(passphrase, salt, iterations, 32, 'sha256');
}

function encryptData(data, key, iv) {
  const cipher = crypto.createCipher('aes-256-gcm', key);
  cipher.setAAD(Buffer.from('tear-v2', 'utf8'));
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    encrypted,
    authTag: cipher.getAuthTag().toString('hex')
  };
}

function calculateDigest(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function canonicalStringify(obj) {
  // Canonical JSON ordering for deterministic output
  return JSON.stringify(obj, Object.keys(obj).sort(), (key, value) => {
    if (value !== null && typeof value === 'object') {
      return canonicalStringify(value);
    }
    return value;
  }, 2);
}

// ==================== BUNDLE COMPILATION ====================
function compileBundle(sourceDir, options = {}) {
  console.log('📦 Compiling bundle from:', sourceDir);
  
  // Validate source directory
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source directory not found: ${sourceDir}`);
  }
  
  // Read manifest if exists
  const manifestPath = path.join(sourceDir, 'manifest.json');
  let manifest = {};
  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }
  
  // Collect assets
  const assets = [];
  const assetDirs = ['scripts', 'styles', 'images', 'data'];
  
  for (const dir of assetDirs) {
    const assetDirPath = path.join(sourceDir, dir);
    if (fs.existsSync(assetDirPath)) {
      const files = fs.readdirSync(assetDirPath);
      for (const file of files) {
        const filePath = path.join(assetDirPath, file);
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath);
        const digest = calculateDigest(content);
        
        assets.push({
          name: file,
          path: path.join(dir, file),
          type: getAssetType(file),
          digest,
          size: stats.size
        });
      }
    }
  }
  
  // Build bundle object
  const bundle = {
    format: SUPPORTED_FORMATS.BUNDLE,
    schemaVersion: 1,
    app: 'HyperSnatch',
    appVersion: options.version || '1.0.0',
    manifest,
    assets,
    createdAt: new Date().toISOString()
  };
  
  // Canonical JSON for deterministic output
  const bundleJson = canonicalStringify(bundle);
  const bundleDigest = calculateDigest(bundleJson);
  
  const finalBundle = {
    ...bundle,
    digest: bundleDigest
  };
  
  // Output bundle
  const outputPath = options.output || 'bundle.tear';
  fs.writeFileSync(outputPath, canonicalStringify(finalBundle));
  
  console.log(`✅ Bundle compiled: ${outputPath}`);
  console.log(`📊 Assets: ${assets.length}`);
  console.log(`🔐 Digest: ${bundleDigest}`);
  
  return finalBundle;
}

// ==================== DATA PACK COMPILATION ====================
function compileDataPack(input, options = {}) {
  console.log('📦 Compiling data pack...');
  
  let data;
  let metadata = {};
  
  // Handle different input types
  if (typeof input === 'string') {
    // File path
    if (fs.existsSync(input)) {
      data = fs.readFileSync(input, 'utf8');
      metadata = {
        title: path.basename(input),
        size: fs.statSync(input).size
      };
    } else {
      throw new Error(`Input file not found: ${input}`);
    }
  } else if (typeof input === 'object') {
    // Direct object
    data = canonicalStringify(input);
    metadata = options.metadata || {};
  } else {
    throw new Error('Input must be file path or object');
  }
  
  // Generate encryption parameters
  const passphrase = options.passphrase || '';
  let encryptedData, salt, iv, digest;
  
  if (passphrase) {
    salt = generateSalt();
    iv = generateIV();
    const key = deriveKey(passphrase, salt);
    const encrypted = encryptData(data, key, iv);
    
    encryptedData = encrypted.encrypted;
    digest = calculateDigest(encryptedData + encrypted.authTag);
    
    console.log('🔐 Data encrypted with passphrase');
  } else {
    encryptedData = Buffer.from(data).toString('base64');
    digest = calculateDigest(data);
    
    console.log('📄 Data stored unencrypted');
  }
  
  // Build data pack object
  const dataPack = {
    format: SUPPORTED_FORMATS.DATA,
    schemaVersion: 2,
    app: 'HyperSnatch',
    appVersion: options.version || '1.0.0',
    kind: options.kind || 'tear',
    createdAt: new Date().toISOString(),
    kdf: 'PBKDF2-SHA256',
    iterations: DEFAULT_ITERATIONS,
    salt,
    iv,
    digest,
    data: encryptedData,
    ...metadata
  };
  
  // Canonical JSON for deterministic output
  const packJson = canonicalStringify(dataPack);
  const packDigest = calculateDigest(packJson);
  
  const finalPack = {
    ...dataPack,
    digest: packDigest
  };
  
  // Output data pack
  const outputPath = options.output || 'data.tear';
  fs.writeFileSync(outputPath, canonicalStringify(finalPack));
  
  console.log(`✅ Data pack compiled: ${outputPath}`);
  console.log(`🔐 Digest: ${packDigest}`);
  
  return finalPack;
}

// ==================== UTILITY FUNCTIONS ====================
function getAssetType(filename) {
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

// ==================== CLI INTERFACE ====================
function printUsage() {
  console.log(`
HyperSnatch Tear Compiler v1

USAGE:
  node tear-compile.js <command> [options]

COMMANDS:
  bundle <source-dir>     Compile runtime bundle from source directory
  data <input>           Compile data pack from file or object

OPTIONS:
  --output <path>        Output file path
  --version <version>      App version (semantic)
  --passphrase <pass>     Encrypt data pack with passphrase
  --kind <kind>           Data pack kind (tear|export|snapshot|vault)
  --deterministic          Force deterministic output

EXAMPLES:
  # Compile bundle from ./my-app directory
  node tear-compile.js bundle ./my-app --output my-app.tear

  # Compile encrypted data pack
  node tear-compile.js data ./evidence.json --passphrase secret --output evidence.tear

  # Compile deterministic data pack
  node tear-compile.js data '{"items": []}' --deterministic --output test.tear
`);
}

// ==================== MAIN ====================
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }
  
  const command = args[0];
  const options = {};
  
  // Parse options
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      if (value) {
        options[key.replace('-', '')] = value;
      } else {
        options[key.replace('-', '')] = true;
      }
    }
  }
  
  try {
    switch (command) {
      case 'bundle':
        if (!args[1]) {
          console.error('❌ Bundle command requires source directory');
          process.exit(1);
        }
        compileBundle(args[1], options);
        break;
        
      case 'data':
        if (!args[1]) {
          console.error('❌ Data command requires input');
          process.exit(1);
        }
        compileDataPack(args[1], options);
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Compilation failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  compileBundle,
  compileDataPack,
  canonicalStringify,
  calculateDigest
};
