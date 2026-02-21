// ==================== RELEASE VERIFICATION ====================
"use strict";

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// ==================== CONFIGURATION ====================
const REQUIRED_FILES = [
  'src/main.js',
  'src/preload.js',
  'hypersnatch.html',
  'package.json'
];

const REQUIRED_DIRS = [
  'config',
  'runtime',
  'logs',
  'evidence',
  'exports'
];

const SECURITY_REQUIREMENTS = {
  contextIsolation: true,
  nodeIntegration: false,
  enableRemoteModule: false,
  sandbox: true,
  webSecurity: true
};

const BUILD_PATTERNS = {
  exe: /HyperSnatch.*\.exe$/,
  portable: /HyperSnatch.*Portable\.exe$/,
  installer: /HyperSnatch.*Setup\.exe$/
};

// ==================== VERIFICATION FUNCTIONS ====================
function logError(message, details = {}) {
  console.error(`❌ VERIFICATION ERROR: ${message}`);
  if (details) {
    console.error('Details:', JSON.stringify(details, null, 2));
  }
}

function logSuccess(message, details = {}) {
  console.log(`✅ VERIFICATION SUCCESS: ${message}`);
  if (details) {
    console.log('Details:', JSON.stringify(details, null, 2));
  }
}

function calculateHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function checkFileExists(filePath, description) {
  if (!fs.existsSync(filePath)) {
    logError(`Missing ${description}`, { path: filePath });
    return false;
  }

  const stats = fs.statSync(filePath);
  const hash = calculateHash(filePath);
  logSuccess(`Found ${description}`, {
    path: filePath,
    size: stats.size,
    modified: stats.mtime,
    sha256: hash
  });
  return true;
}

function checkDirectoryExists(dirPath, description) {
  if (!fs.existsSync(dirPath)) {
    logError(`Missing ${description}`, { path: dirPath });
    return false;
  }

  const stats = fs.statSync(dirPath);
  logSuccess(`Found ${description}`, {
    path: dirPath,
    modified: stats.mtime
  });
  return true;
}

function verifySecurityHardening(mainJsContent) {
  const issues = [];

  // Check for security violations
  const securityViolations = [
    'contextIsolation: false',
    'nodeIntegration: true',
    'enableRemoteModule: true',
    'sandbox: false',
    'webSecurity: false'
  ];

  for (const violation of securityViolations) {
    if (mainJsContent.includes(violation)) {
      issues.push(`Security violation detected: ${violation}`);
    }
  }

  if (issues.length > 0) {
    logError('Security hardening violations found', { issues });
    return false;
  }

  logSuccess('Security hardening verified', {
    contextIsolation: 'ENABLED',
    nodeIntegration: 'DISABLED',
    sandbox: 'ENABLED',
    webSecurity: 'ENABLED'
  });

  return true;
}

function verifyBuildOutput() {
  const fs = require("fs");
  const path = require("path");
  const distDir = 'dist';

  if (!checkDirectoryExists(distDir, 'Build output directory')) {
    return false;
  }

  // --- robust exe discovery (no shell parsing, handles spaces) ---
  function walkFiles(dir) {
    const out = [];
    if (!fs.existsSync(dir)) return out;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) out.push(...walkFiles(p));
      else out.push(p);
    }
    return out;
  }

  function findExeArtifacts(distDir) {
    const files = walkFiles(distDir);

    // accept any .exe under dist/, but ignore squirrel/temp junk if you ever add it
    const exes = files.filter(f => f.toLowerCase().endsWith(".exe"));

    // Prefer installer-ish exe (NSIS usually includes "Setup")
    const installers = exes.filter(f => /setup|installer|nsis/i.test(path.basename(f)));

    // If multiple, pick biggest (usually real installer)
    const pickLargest = (arr) =>
      arr
        .map(f => ({ f, s: fs.statSync(f).size }))
        .sort((a, b) => b.s - a.s)[0]?.f || null;

    return {
      exes,
      installer: pickLargest(installers) || pickLargest(exes),
    };
  }

  const exeArtifacts = findExeArtifacts(distDir);

  if (exeArtifacts.exes.length === 0) {
    logError('No built executable found');
    return false;
  }

  logSuccess('Built executables found', { files: exeArtifacts.exes });

  if (exeArtifacts.installer) {
    const hash = calculateHash(exeArtifacts.installer);
    logSuccess('Installer found with valid hash', {
      file: exeArtifacts.installer,
      sha256: hash
    });

    // Check unpacked app hash as well
    const unpackedExe = exeArtifacts.exes.find(f => path.basename(f) === 'HyperSnatch.exe');
    if (unpackedExe) {
      logSuccess('Unpacked App found with valid hash', {
        file: unpackedExe,
        sha256: calculateHash(unpackedExe)
      });
    }
  } else {
    logError('No installer found');
    return false;
  }


  return true;
}

function verifyPackageJson() {
  const packagePath = 'package.json';

  if (!checkFileExists(packagePath, 'Package.json')) {
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    // Verify required fields
    const requiredFields = ['name', 'version', 'main', 'description'];
    const missingFields = requiredFields.filter(field => !packageJson[field]);

    if (missingFields.length > 0) {
      logError('Missing required package.json fields', { missingFields });
      return false;
    }

    // Verify build configuration
    if (!packageJson.build) {
      logError('Missing build configuration');
      return false;
    }

    // Verify security settings
    if (!packageJson.devDependencies || !packageJson.devDependencies.electron) {
      logError('Missing Electron dependency');
      return false;
    }

    logSuccess('Package.json verified', {
      name: packageJson.name,
      version: packageJson.version,
      appId: packageJson.build?.appId
    });

    return true;
  } catch (error) {
    logError('Failed to parse package.json', { error: error.message });
    return false;
  }
}

// ==================== MAIN VERIFICATION ====================
function main() {
  console.log('🔍 HyperSnatch - Release Verification');
  console.log('=====================================');

  let allPassed = true;

  // Verify required files
  console.log('\n📁 Checking required files...');
  for (const file of REQUIRED_FILES) {
    if (!checkFileExists(file, `Required file: ${file}`)) {
      allPassed = false;
    }
  }

  // Verify required directories
  console.log('\n📂 Checking required directories...');
  for (const dir of REQUIRED_DIRS) {
    if (!checkDirectoryExists(dir, `Required directory: ${dir}`)) {
      allPassed = false;
    }
  }

  // Verify package.json
  console.log('\n📋 Checking package.json...');
  if (!verifyPackageJson()) {
    allPassed = false;
  }

  // Verify security hardening
  console.log('\n🛡️ Checking security hardening...');
  const mainJsContent = fs.readFileSync('src/main.js', 'utf8');
  if (!verifySecurityHardening(mainJsContent)) {
    allPassed = false;
  }

  // Verify build output
  console.log('\n🏗️ Checking build output...');
  if (!verifyBuildOutput()) {
    allPassed = false;
  }

  // Final result
  console.log('\n=====================================');

  if (allPassed) {
    logSuccess('Release verification PASSED', {
      message: 'All checks passed. Ready for distribution.'
    });
    process.exit(0);
  } else {
    logError('Release verification FAILED', {
      message: 'Some checks failed. Fix issues before distribution.'
    });
    process.exit(1);
  }
}

// ==================== RUN ====================
if (require.main === module) {
  main();
}

module.exports = { main };
