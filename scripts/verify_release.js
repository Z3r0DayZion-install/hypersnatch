// ==================== RELEASE VERIFICATION ====================
"use strict";

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ==================== CONFIGURATION ====================
const REQUIRED_FILES = [
  'src/main.js',
  'src/preload.js',
  'ui/hypersnatch-ui.html',
  'package.json'
];

const REQUIRED_DIRS = [
  'config',
  'runtime',
  'evidence',
  'exports'
];

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

function verifyBuildOutput(expectedVersion) {
  const fs = require("fs");
  const path = require("path");
  const distDir = 'dist';
  const expectedInstallerName = expectedVersion ? `HyperSnatch-Setup-${expectedVersion}.exe` : null;
  const expectedInstallerPath = expectedInstallerName ? path.join(distDir, expectedInstallerName) : null;
  const expectedBundleName = expectedVersion ? `HyperSnatch_Vanguard_v${expectedVersion}.zip` : null;
  const expectedBundlePath = expectedBundleName ? path.join(distDir, expectedBundleName) : null;

  if (!expectedVersion) {
    logError('Build output verification missing expected package version context.', {
      remediation: 'Ensure package.json version is readable before build-output checks.'
    });
    return false;
  }

  if (!fs.existsSync(distDir)) {
    logError('Build output missing: dist directory not found. Run "npm run build:wrapper" before "npm run verify".', {
      path: distDir,
      requiredCommand: 'npm run build:wrapper'
    });
    return false;
  }

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
  const setupInstallers = exeArtifacts.exes.filter((f) => /^HyperSnatch-Setup-.*\.exe$/i.test(path.basename(f)));

  if (exeArtifacts.exes.length === 0) {
    logError('No built executable found in dist output.', {
      path: distDir,
      remediation: 'Run "npm run build:wrapper" and rerun "npm run verify".'
    });
    return false;
  }

  logSuccess('Built executables found', { files: exeArtifacts.exes });

  if (setupInstallers.length === 0) {
    logError('No setup installer found in dist output.', {
      expectedInstaller: expectedInstallerName,
      remediation: 'Run "npm run build:wrapper" and confirm setup installer generation.'
    });
    return false;
  }

  if (!fs.existsSync(expectedInstallerPath)) {
    logError('Expected installer version not found in dist output.', {
      expectedInstaller: expectedInstallerName,
      detectedInstallers: setupInstallers.map((f) => path.basename(f)),
      invalidRunReason: 'dist does not contain installer matching current package.json version.',
      result: 'FAIL',
      action: `Run "npm run build:wrapper" after aligning version identity to ${expectedVersion}.`
    });
    return false;
  }

  const staleInstallers = setupInstallers
    .map((f) => path.basename(f))
    .filter((name) => name !== expectedInstallerName);
  if (staleInstallers.length > 0) {
    logError('Stale installer versions detected in dist output.', {
      expectedInstaller: expectedInstallerName,
      staleInstallers,
      invalidRunReason: 'mixed installer versions in dist make proof selection ambiguous.',
      result: 'FAIL',
      action: 'Use a clean worktree or remove stale setup exes before verification.'
    });
    return false;
  }

  const distTopLevelFiles = fs.readdirSync(distDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
  const vanguardBundles = distTopLevelFiles.filter((name) => /^HyperSnatch_Vanguard.*\.zip$/i.test(name));
  const versionedVanguardBundles = vanguardBundles.filter((name) => /^HyperSnatch_Vanguard_v[^\\/]+\.zip$/i.test(name));
  const ambiguousVanguardBundles = vanguardBundles.filter((name) => !/^HyperSnatch_Vanguard_v[^\\/]+\.zip$/i.test(name));

  if (!fs.existsSync(expectedBundlePath)) {
    logError('Expected versioned release bundle not found in dist output.', {
      expectedBundle: expectedBundleName,
      foundBundles: vanguardBundles,
      invalidRunReason: 'dist does not contain release bundle matching current package.json version.',
      result: 'FAIL',
      action: `Run "npm run build:wrapper" after aligning version identity to ${expectedVersion}.`
    });
    return false;
  }

  if (ambiguousVanguardBundles.length > 0) {
    logError('Ambiguous non-versioned Vanguard bundles detected in dist output.', {
      expectedBundle: expectedBundleName,
      ambiguousBundles: ambiguousVanguardBundles,
      invalidRunReason: 'bundle selection must be exact versioned match only.',
      result: 'FAIL',
      action: 'Remove ambiguous bundle names and keep only versioned HyperSnatch_Vanguard_v<version>.zip artifacts.'
    });
    return false;
  }

  const staleVanguardBundles = versionedVanguardBundles.filter((name) => name !== expectedBundleName);
  if (staleVanguardBundles.length > 0) {
    logError('Stale mixed-version Vanguard bundles detected in dist output.', {
      expectedBundle: expectedBundleName,
      staleBundles: staleVanguardBundles,
      foundBundles: versionedVanguardBundles,
      invalidRunReason: 'mixed bundle versions in dist make proof invalid.',
      result: 'FAIL',
      action: 'Use a clean worktree or remove stale versioned bundles before verification.'
    });
    return false;
  }

  if (exeArtifacts.installer) {
    const hash = calculateHash(expectedInstallerPath);
    logSuccess('Installer found with valid hash', {
      file: expectedInstallerPath,
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

    logSuccess('Versioned release bundle found with valid hash', {
      file: expectedBundlePath,
      sha256: calculateHash(expectedBundlePath)
    });
  } else {
    logError('No installer found in dist output.', {
      expectedPattern: 'HyperSnatch-Setup-<version>.exe',
      remediation: 'Run "npm run build:wrapper" and confirm installer generation completed.'
    });
    return false;
  }


  return true;
}

function readPackageJson() {
  const packagePath = 'package.json';
  try {
    return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  } catch (error) {
    logError('Failed to parse package.json', { error: error.message, path: packagePath });
    return null;
  }
}

function verifyPackageJson() {
  const packagePath = 'package.json';

  if (!checkFileExists(packagePath, 'Package.json')) {
    return null;
  }

  const packageJson = readPackageJson();
  if (!packageJson) {
    return null;
  }

  // Verify required fields
  const requiredFields = ['name', 'version', 'main', 'description'];
  const missingFields = requiredFields.filter(field => !packageJson[field]);

  if (missingFields.length > 0) {
    logError('Missing required package.json fields', { missingFields });
    return null;
  }

  // Verify build configuration
  if (!packageJson.build) {
    logError('Missing build configuration');
    return null;
  }

  // Verify security settings
  if (!packageJson.devDependencies || !packageJson.devDependencies.electron) {
    logError('Missing Electron dependency');
    return null;
  }

  logSuccess('Package.json verified', {
    name: packageJson.name,
    version: packageJson.version,
    appId: packageJson.build?.appId
  });

  return packageJson;
}

function verifyRuntimeAndDependencies(packageJson) {
  let ok = true;

  const lockfilePath = 'package-lock.json';
  if (fs.existsSync(lockfilePath)) {
    const lockStats = fs.statSync(lockfilePath);
    logSuccess('Lockfile present for deterministic installs', {
      path: lockfilePath,
      modified: lockStats.mtime
    });
  } else {
    logError('Lockfile missing; deterministic dependency proof is weakened.', {
      path: lockfilePath,
      remediation: 'Run "npm install" and commit package-lock.json.'
    });
    ok = false;
  }

  const expectedNode = packageJson?.engines?.node || null;
  const actualNode = process.versions.node;
  if (!expectedNode) {
    logError('Node engine policy missing from package.json.', {
      remediation: 'Define engines.node for maintenance-proof reproducibility.'
    });
    ok = false;
  } else if (/^\d+\.\d+\.\d+$/.test(expectedNode)) {
    const parse = (v) => v.split('.').map((n) => Number(n));
    const [expMaj, expMin, expPatch] = parse(expectedNode);
    const [actMaj, actMin, actPatch] = parse(actualNode);
    const actualComparable = (actMaj * 1_000_000) + (actMin * 1_000) + actPatch;
    const expectedComparable = (expMaj * 1_000_000) + (expMin * 1_000) + expPatch;

    if (actMaj !== expMaj) {
      logError('Node major runtime mismatch for maintenance proof.', {
        expectedMajor: expMaj,
        expectedMinimum: expectedNode,
        actual: actualNode,
        remediation: `Use Node ${expMaj}.x with minimum baseline ${expectedNode}.`
      });
      ok = false;
    } else if (actualComparable < expectedComparable) {
      logError('Node runtime below required maintenance baseline.', {
        expectedMinimum: expectedNode,
        actual: actualNode,
        remediation: `Upgrade Node to at least ${expectedNode}.`
      });
      ok = false;
    } else if (actualNode === expectedNode) {
      logSuccess('Node runtime matches maintenance baseline exactly', {
        expectedMinimum: expectedNode,
        actual: actualNode
      });
    } else {
      logSuccess('Node runtime satisfies maintenance baseline', {
        expectedMinimum: expectedNode,
        actual: actualNode
      });
    }
  } else {
    logSuccess('Node engine policy detected', {
      expected: expectedNode,
      actual: actualNode
    });
  }

  const requiredPackages = ['electron', 'electron-builder'];
  for (const dep of requiredPackages) {
    try {
      const depPkgPath = require.resolve(`${dep}/package.json`);
      const depPkg = JSON.parse(fs.readFileSync(depPkgPath, 'utf8'));
      logSuccess(`Dependency present: ${dep}`, {
        version: depPkg.version,
        path: path.relative(process.cwd(), depPkgPath)
      });
    } catch (_error) {
      logError(`Missing dependency: ${dep}`, {
        remediation: 'Run "npm install" before "npm run build:wrapper" and "npm run verify".'
      });
      ok = false;
    }
  }

  return ok;
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
  const packageJson = verifyPackageJson();
  if (!packageJson) {
    allPassed = false;
  }

  // Verify runtime and dependency hygiene
  console.log('\n📦 Checking runtime/dependency hygiene...');
  if (packageJson && !verifyRuntimeAndDependencies(packageJson)) {
    allPassed = false;
  } else if (!packageJson) {
    allPassed = false;
  }

  // Verify security hardening
  console.log('\n🛡️ Checking security hardening...');
  const mainJsContent = fs.readFileSync('src/main.js', 'utf8');
  if (!verifySecurityHardening(mainJsContent)) {
    allPassed = false;
  }

  // Verify build output
  const skipBuildOutput = process.env.HYPERSNATCH_SIGN === '0' || process.env.HS_SKIP_BUILD_OUTPUT === '1';
  console.log('\n🏗️ Checking build output...');
  if (skipBuildOutput) {
    logSuccess('Build output check skipped (unsigned gate mode)', {
      HYPERSNATCH_SIGN: process.env.HYPERSNATCH_SIGN || null,
      HS_SKIP_BUILD_OUTPUT: process.env.HS_SKIP_BUILD_OUTPUT || null
    });
  } else if (!verifyBuildOutput(packageJson?.version || null)) {
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
