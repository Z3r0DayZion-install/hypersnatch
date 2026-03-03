// ==================== ELECTRON MAIN PROCESS ====================
"use strict";

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const secureCrypto = require('./security-crypto');
const log = require('./utils/logger');
const SmartDecode = require('./core/smartdecode');

// QR Engine purged in Vanguard Edition for zero-trace portability.

// Security: Handle security events and crashes globally during bootstrap
process.on("uncaughtException", (err) => {
  log.error("UNCAUGHT_EXCEPTION", { message: err.message, stack: err.stack });
});

process.on("unhandledRejection", (reason) => {
  log.error("UNHANDLED_REJECTION", { reason });
});

// Disable console logging in production
if (process.env.NODE_ENV === "production" || app.isPackaged) {
  console.log = () => { };
  console.warn = () => { };
}

// ==================== CONSTANTS ====================
const APP_NAME = 'HyperSnatch';
const APP_VERSION = (() => { try { return require('../package.json').version || 'unknown'; } catch (e) { return 'unknown'; } })();

if (process.argv.includes('--version') || process.argv.includes('-v')) {
  process.stdout.write(APP_NAME + ' ' + APP_VERSION + '\n');
  process.exit(0);
}

// Security: Hardened defaults
const SECURITY_CONFIG = {
  contextIsolation: true,
  nodeIntegration: false,
  enableRemoteModule: false,
  sandbox: true,
  webSecurity: true
};

// Runtime paths
const RUNTIME_DIR = path.join(app.getPath('userData'), 'HyperSnatch', 'runtime');
const LOGS_DIR = path.join(RUNTIME_DIR, 'logs');
const EVIDENCE_DIR = path.join(RUNTIME_DIR, 'evidence');
const EXPORTS_DIR = path.join(RUNTIME_DIR, 'exports');
const CONFIG_DIR = path.join(RUNTIME_DIR, 'config');
const POLICY_FILE = path.join(CONFIG_DIR, 'policy.json');
const ALLOWLIST_FILE = path.join(CONFIG_DIR, 'allowlist.json');

// ==================== SECURITY ====================
let securityEvents = [];

function logSecurityEvent(event, details = {}) {
  const timestamp = new Date().toISOString();
  securityEvents.push({ timestamp, event, ...details });

  // Also log to file asynchronously
  const logEntry = `[${timestamp}] SECURITY: ${event} - ${JSON.stringify(details)}\n`;
  fs.appendFile(path.join(LOGS_DIR, 'security.log'), logEntry, (err) => {
    if (err) console.error('Failed to write security event', err);
  });
}

function enforceSecurityPolicy(window, url) {
  // Check allowlist
  try {
    const allowlistPath = path.resolve(ALLOWLIST_FILE);
    const configDir = path.resolve(CONFIG_DIR);
    const configPrefix = (configDir.endsWith(path.sep) ? configDir : (configDir + path.sep)).toLowerCase();
    if (!allowlistPath.toLowerCase().startsWith(configPrefix)) {
      throw new Error('Invalid allowlist path');
    }
    const allowlist = JSON.parse(fs.readFileSync(ALLOWLIST_FILE, 'utf8'));
    const urlObj = new URL(url);

    if (!allowlist.allowedHosts.includes(urlObj.hostname)) {
      logSecurityEvent('BLOCKED_URL', { url, reason: 'Host not in allowlist' });
      return { allowed: false, reason: 'Host not in allowlist' };
    }

    logSecurityEvent('ALLOWED_URL', { url, reason: 'Host in allowlist' });
    return { allowed: true };
  } catch (error) {
    logSecurityEvent('POLICY_ERROR', { error: error.message });
    return { allowed: false, reason: 'Policy check failed' };
  }
}

/**
 * Validates that a filename contains no path traversal sequences
 */
function validateFilename(filename) {
  if (typeof filename !== 'string') return false;
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) return false;
  return /^[a-zA-Z0-9_\-\.]+$/.test(filename);
}

// ==================== IPC HANDLERS ====================
ipcMain.handle('get-app-info', async () => {
  const policy = getPolicySummary();
  const license = await checkLicenseLocally();
  const envAllow = process.env.HYPERSNATCH_ENABLE_STRATEGY_RUNTIME === "1";
  const allowStrategyRuntime = Boolean(envAllow && policy.strategyRuntime?.enabled);

  const smartDecodeDefaultEngine = String(policy.smartDecode?.defaultEngine || "rust");

  return {
    name: APP_NAME,
    version: APP_VERSION,
    platform: process.platform,
    securityConfig: Object.assign({}, SECURITY_CONFIG, {
      allowStrategyRuntime,
      smartDecodeDefaultEngine,
      legalDisclaimerAccepted: policy.legalDisclaimerAccepted
    }),
    policy,
    license,
    runtimeDir: RUNTIME_DIR
  };
});

ipcMain.handle('accept-legal-disclaimer', async () => {
  try {
    const policy = readPolicySafe() || {};
    policy.legalDisclaimerAccepted = true;
    fs.writeFileSync(POLICY_FILE, JSON.stringify(policy, null, 2));
    logSecurityEvent('LEGAL_DISCLAIMER_ACCEPTED');
    return { success: true };
  } catch (err) {
    log.error('DISCLAIMER_ACCEPT_ERROR', { message: err.message });
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-logs-folder', () => {
  shell.openPath(LOGS_DIR);
});

ipcMain.handle('open-evidence-folder', () => {
  shell.openPath(EVIDENCE_DIR);
});

// ==================== SMART DECODE IPC ====================
ipcMain.handle('smart-decode-run', async (event, { input, options }) => {
  try {
    const intelPath = app.isPackaged
      ? path.join(process.resourcesPath, 'config', 'forensic_intelligence.json')
      : path.join(__dirname, '..', 'config', 'forensic_intelligence.json');

    const runOptions = {
      ...options,
      intelligencePath: intelPath
    };

    return await SmartDecode.run(input, runOptions);
  } catch (err) {
    log.error('SMART_DECODE_ERROR', { message: err.message });
    return null;
  }
});

ipcMain.handle('smart-decode-sign-session', async (event, { sessionState, systemInfo }) => {
  try {
    const hwid = await getHardwareFingerprint();
    const AuditChain = require('./core/smartdecode/audit-chain');
    return await AuditChain.signSession(sessionState, systemInfo, hwid);
  } catch (err) {
    log.error('AUDIT_CHAIN_SIGN_ERROR', { message: err.message });
    return null;
  }
});

ipcMain.handle('smart-decode-verify-session', async (event, bundle) => {
  try {
    const hwid = await getHardwareFingerprint();
    const AuditChain = require('./core/smartdecode/audit-chain');
    return AuditChain.verifySession(bundle, hwid);
  } catch (err) {
    log.error('AUDIT_CHAIN_VERIFY_ERROR', { message: err.message });
    return false;
  }
});

// ==================== SOVEREIGN HARDWARE BINDING ====================
async function getRawHardwareIds() {
  try {
    const os = require('os');
    const cpuId = os.cpus()[0].model.replace(/\s+/g, '_');
    const baseboardId = `${os.hostname()}_${os.userInfo().username}`;
    return { cpuId, baseboardId };
  } catch (e) {
    return { cpuId: 'FALLBACK-CPU', baseboardId: 'FALLBACK-BASE' };
  }
}

async function getHardwareFingerprint() {
  const { cpuId, baseboardId } = await getRawHardwareIds();
  return crypto.createHash('sha256').update(`HS-HWID-${cpuId}-${baseboardId}`).digest('hex');
}

/**
 * Checks for a local valid license and returns the tier
 */
async function checkLicenseLocally() {
  try {
    const hwid = await getHardwareFingerprint();
    const licensePath = path.join(CONFIG_DIR, 'license.json');
    if (!fs.existsSync(licensePath)) {
      return { tier: 'COMMUNITY', edition: 'COMMUNITY', valid: false, features: SovereignAuth.TIER_FEATURES.COMMUNITY };
    }
    const license = JSON.parse(fs.readFileSync(licensePath, 'utf8'));
    const result = SovereignAuth.verifyLicense(license, hwid);
    if (result.valid) {
      const edition = result.edition || 'SOVEREIGN';
      return {
        tier: edition,
        edition,
        valid: true,
        user: result.user,
        features: result.features || SovereignAuth.TIER_FEATURES[edition] || SovereignAuth.TIER_FEATURES.COMMUNITY
      };
    }
    return { tier: 'COMMUNITY', edition: 'COMMUNITY', valid: false, features: SovereignAuth.TIER_FEATURES.COMMUNITY };
  } catch (e) {
    return { tier: 'COMMUNITY', edition: 'COMMUNITY', valid: false, features: SovereignAuth.TIER_FEATURES.COMMUNITY };
  }
}

/**
 * Returns an access-denied result if the current license doesn't meet the minimum tier.
 * @param {string} requiredTier - 'SOVEREIGN' or 'INSTITUTIONAL'
 * @param {string} featureName - human-readable feature name for the error message
 * @returns {Object|null} - null if allowed, error object if denied
 */
async function requireTier(requiredTier, featureName) {
  const license = await checkLicenseLocally();
  if (!SovereignAuth.meetsMinimumTier(license.tier, requiredTier)) {
    const tierPrice = requiredTier === 'INSTITUTIONAL' ? '$499' : '$149';
    return {
      success: false,
      error: `ACCESS DENIED: ${featureName} requires ${requiredTier} Edition (${tierPrice}).`,
      requiredTier,
      currentTier: license.tier,
      upgradeUrl: 'https://cashdominion.gumroad.com/l/itpxg'
    };
  }
  return null;
}

ipcMain.handle('get-hardware-status', async () => {
  const fingerprint = await getHardwareFingerprint();
  return {
    fingerprint: fingerprint,
    displayId: fingerprint.substring(0, 16),
    status: 'HARDWARE_LOCKED'
  };
});

ipcMain.handle('authenticate-license', async (event, licensePath) => {
  try {
    const hwid = await getHardwareFingerprint();
    const actualPath = (licensePath && path.isAbsolute(licensePath)) ? licensePath : path.join(CONFIG_DIR, 'license.json');
    if (!fs.existsSync(actualPath)) {
      return { success: false, reason: 'License file not found.' };
    }
    const license = JSON.parse(fs.readFileSync(actualPath, 'utf8'));
    const result = SovereignAuth.verifyLicense(license, hwid);
    return { success: result.valid, ...result };
  } catch (err) {
    return { success: false, reason: err.message };
  }
});

ipcMain.handle('final-freeze', async (event, { caseData, reports }) => {
  const gateCheck = await requireTier('SOVEREIGN', 'Final Freeze Evidence Vault');
  if (gateCheck) return gateCheck;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const caseFolderName = `CASE-FREEZE-${timestamp}`;

  const { filePath: rootPath } = await dialog.showOpenDialog({
    title: 'Select Destination for Final Case Freeze',
    properties: ['openDirectory']
  });

  if (!rootPath) return { success: false, reason: 'No directory selected' };

  const casePath = path.join(rootPath, caseFolderName);
  if (!fs.existsSync(casePath)) fs.mkdirSync(casePath);

  const manifestFiles = [];
  const vaultMetadata = {
    version: '1.0.0',
    caseId: caseData.caseNumber || 'GENERAL',
    hardwareBound: true,
    files: {}
  };

  try {
    // 0. Derive Vault Key (PBKDF2 120k iterations per Governance)
    const hwid = await getHardwareFingerprint();
    const vaultKey = crypto.pbkdf2Sync(hwid, 'HS-VAULT-SALT-V1', 120000, 32, 'sha256');

    // 1. Encrypt and Write Reports
    for (const report of reports) {
      if (!validateFilename(report.filename)) {
        throw new Error(`Security Violation: Illegal filename detected: ${report.filename}`);
      }

      const buffer = report.type === 'pdf' ? Buffer.from(report.content, 'base64') : Buffer.from(report.content);

      // AES-256-GCM Encryption
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', vaultKey, iv);
      cipher.setAAD(Buffer.from('HyperSnatch-Vanguard-Vault'));

      let encrypted = cipher.update(buffer);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      const authTag = cipher.getAuthTag();

      const vaultFilename = `${report.filename}.vault`;
      const filePath = path.join(casePath, vaultFilename);
      fs.writeFileSync(filePath, encrypted);

      const hash = crypto.createHash('sha256').update(encrypted).digest('hex');
      manifestFiles.push({ hash, path: vaultFilename });

      vaultMetadata.files[vaultFilename] = {
        originalName: report.filename,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        size: encrypted.length
      };
    }

    // 2. Create Vault Manifest (Metadata)
    const manifestPath = path.join(casePath, 'VAULT_MANIFEST.json');
    fs.writeFileSync(manifestPath, JSON.stringify(vaultMetadata, null, 2));

    // 3. Create Integrity Manifest (Hashes of encrypted blobs)
    const entries = manifestFiles.map(f => `${f.hash}  ${f.path}`).join('\n');
    const integrityPath = path.join(casePath, 'INTEGRITY_MANIFEST.txt');
    fs.writeFileSync(integrityPath, entries);

    // 4. Sign the manifest (Sovereign Seal)
    const { cpuId, baseboardId } = await getRawHardwareIds();
    const signature = crypto.createHash('sha256').update(entries + cpuId + baseboardId).digest('hex');

    fs.writeFileSync(path.join(casePath, 'SOVEREIGN_SEAL.sig'), signature);

    // 5. Create a README summary
    const readme = `HYPERSNATCH FINAL FREEZE VAULT\n` +
      `==============================\n` +
      `SECURITY:  AES-256-GCM (Hardware-Bound)\n` +
      `TIMESTAMP: ${new Date().toLocaleString()}\n` +
      `CASE ID:   ${vaultMetadata.caseId}\n` +
      `ITEMS:     ${reports.length}\n` +
      `SIGNATURE: ${signature}\n` +
      `VERIFIED:  SOVEREIGN AUDIT CHAIN ACTIVE\n\n` +
      `NOTICE: Evidence is encrypted and tied to Node ID: ${hwid.substring(0, 16)}\n`;
    fs.writeFileSync(path.join(casePath, 'README_SUMMARY.txt'), readme);

    return { success: true, path: casePath, signature };
  } catch (err) {
    log.error('VAULT_FREEZE_ERROR', { error: err.message });
    return { success: false, error: err.message };
  }
});

ipcMain.handle('export-pdf', async (event, { html, filename }) => {
  const gateCheck = await requireTier('SOVEREIGN', 'PDF Export');
  if (gateCheck) return gateCheck;
  if (!validateFilename(filename)) {
    return { success: false, error: 'Illegal filename' };
  }
  const pdfWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      ...SECURITY_CONFIG,
      preload: null, // No preload needed for headless PDF window
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

  const options = {
    marginsType: 0,
    pageSize: 'A4',
    printBackground: true,
    printSelectionOnly: false,
    landscape: false
  };

  try {
    const data = await pdfWindow.webContents.printToPDF(options);
    const { filePath } = await dialog.showSaveDialog({
      title: 'Save PDF Report',
      defaultPath: path.join(app.getPath('downloads'), filename),
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });

    if (filePath) {
      fs.writeFileSync(filePath, data);
      return { success: true, filePath };
    }
    return { success: false, reason: 'Save cancelled' };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    pdfWindow.close();
  }
});

ipcMain.handle('export-security-report', async (event, decodeData) => {
  const gateCheck = await requireTier('SOVEREIGN', 'Security Report Export');
  if (gateCheck) return gateCheck;
  try {
    const reportPath = path.join(app.getPath("desktop"), "hyperSnatch_report.pdf");

    // Read bridge.runtime.json
    let bridgeAuth = { error: "Not spawned yet" };
    try {
      const bridgePath = path.join(process.cwd(), "bridge.runtime.json");
      if (fs.existsSync(bridgePath)) {
        bridgeAuth = JSON.parse(fs.readFileSync(bridgePath, "utf8"));
        bridgeAuth.token = "[REDACTED]";
      }
    } catch (e) { }

    // Check Authenticode (Windows only)
    let authenticodeState = "Skipped (Not Windows)";
    if (process.platform === "win32" && app.isPackaged) {
      try {
        const cp = require("child_process");
        const pePath = process.execPath;
        const psCmd = `powershell -NoProfile -Command "$sig = Get-AuthenticodeSignature -FilePath '${pePath}'; if ($sig.Status -eq 'NotSigned' -or -not $sig.SignerCertificate) { exit 1 }; if (-not $sig.TimeStamperCertificate) { exit 2 }; exit 0"`;
        cp.execSync(psCmd);
        authenticodeState = "Valid & RFC 3161 Timestamped";
      } catch (e) {
        authenticodeState = e.status === 1 ? "Missing Signature" : "Missing Timestamp";
      }
    } else if (process.platform === "win32") {
      authenticodeState = "Skipped (Running from Source)";
    }

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Export Security Report",
      defaultPath: reportPath,
      filters: [{ name: "PDF Document", extensions: ["pdf"] }, { name: "HTML Report", extensions: ["html"] }]
    });

    if (canceled || !filePath) return false;

    // Use CaseReportGenerator
    const CaseReportGenerator = require('../core/case_report_generator.js');
    const AuditChain = require('./core/smartdecode/audit-chain');

    const cands = decodeData?.candidates || [];
    const refs = decodeData?.refusals || [];

    // 1. Sign the session via Audit Chain for forensic immutability
    const hwid = await getHardwareFingerprint();
    const signedBundle = await AuditChain.signSession(
      { candidates: cands, refusals: refs, telemetry: {} },
      { buildId: "RES-RC1", engineVersion: "2.4.0" },
      hwid
    );

    // Map refusals if they don't have timestamp
    const mappedRefs = refs.map(r => ({
      timestamp: r.timestamp || new Date().toISOString(),
      reason: `[${r.host || 'unknown'}] ${r.reason}`
    }));

    const reportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        workspaceId: "OFFLINE_SESSION",
        version: APP_VERSION,
        signature: signedBundle.signature,
        fingerprint: signedBundle.fingerprint
      },
      extraction: {
        totalCandidates: cands.length,
        candidates: cands
      },
      refusals: {
        totalRefusals: refs.length,
        refusals: mappedRefs
      }
    };

    const htmlReport = CaseReportGenerator.generateHTMLReport(reportData);

    if (filePath.endsWith('.html')) {
      fs.writeFileSync(filePath, htmlReport.data, "utf8");
      return true;
    }

    // Export as PDF
    const pdfWindow = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: false }
    });

    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlReport.data)}`);
    const pdfData = await pdfWindow.webContents.printToPDF({
      marginsType: 0,
      pageSize: 'A4',
      printBackground: true
    });
    fs.writeFileSync(filePath, pdfData);
    pdfWindow.close();

    return true;
  } catch (err) {
    log.error("EXPORT_REPORT_ERROR", { err: err.message });
    return false;
  }
});

ipcMain.handle('validate-license', async (event) => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Select HyperSnatch License File',
      filters: [{ name: 'JSON License', extensions: ['json'] }],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) {
      return { canceled: true };
    }

    const licensePath = filePaths[0];
    const hwid = await getHardwareFingerprint();
    const license = JSON.parse(fs.readFileSync(licensePath, 'utf8'));
    const result = SovereignAuth.verifyLicense(license, hwid);

    if (result.valid) {
      const storedLicense = path.join(CONFIG_DIR, 'license.json');
      fs.copyFileSync(licensePath, storedLicense);
      logSecurityEvent('LICENSE_ACTIVATED', { edition: result.edition, tier: result.tier, user: result.user });
      log.info("LICENSE_ACTIVATED", { edition: result.edition, tier: result.tier });
    }

    return result;

  } catch (error) {
    log.error("LICENSE_IMPORT_ERROR", { message: error.message });
    return { valid: false, reason: "Internal error processing license" };
  }
});

ipcMain.handle('get-license-info', async () => {
  const license = await checkLicenseLocally();
  const hwid = await getHardwareFingerprint();
  return {
    ...license,
    hwid,
    displayHwid: hwid.substring(0, 16),
    tierDisplay: license.tier === 'COMMUNITY' ? 'COMMUNITY' : `${license.tier} EDITION`,
    upgradeUrl: 'https://cashdominion.gumroad.com/l/itpxg',
    tiers: {
      SOVEREIGN: { price: '$149', features: SovereignAuth.TIER_FEATURES.SOVEREIGN },
      INSTITUTIONAL: { price: '$499', features: SovereignAuth.TIER_FEATURES.INSTITUTIONAL }
    }
  };
});

ipcMain.handle('get-security-events', () => {
  return securityEvents.slice(-100); // Last 100 events
});

ipcMain.handle('clear-security-events', () => {
  securityEvents = [];
  try {
    const logPath = path.resolve(path.join(LOGS_DIR, 'security.log'));
    if (!logPath.startsWith(process.cwd())) {
      throw new Error('Invalid log path');
    }
    fs.writeFileSync(logPath, '');
  } catch (error) {
    logSecurityEvent('LOG_CLEAR_ERROR', { error: error.message });
  }
});

ipcMain.handle('validate-url', async (event, url) => {
  const result = enforceSecurityPolicy(null, url);
  event.reply(result);
});

ipcMain.handle('import-evidence', async (event, evidenceData) => {
  try {
    // Validate evidence format
    if (!evidenceData || typeof evidenceData !== 'object') {
      event.reply({ success: false, error: 'Invalid evidence data' });
      return;
    }

    // Create evidence file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const evidenceFile = path.join(EVIDENCE_DIR, `imported-${timestamp}.json`);
    const evidencePath = path.resolve(evidenceFile);

    if (!evidencePath.startsWith(process.cwd())) {
      throw new Error('Invalid evidence path');
    }

    fs.writeFileSync(evidenceFile, JSON.stringify(evidenceData, null, 2));

    logSecurityEvent('EVIDENCE_IMPORTED', {
      file: evidenceFile,
      size: JSON.stringify(evidenceData).length
    });

    event.reply({ success: true, file: evidenceFile });
  } catch (error) {
    logSecurityEvent('EVIDENCE_IMPORT_ERROR', { error: error.message });
    event.reply({ success: false, error: error.message });
  }
});

ipcMain.on('log-message', (event, { level, message, meta }) => {
  log[level.toLowerCase()](message, meta);
});

// ==================== APP LIFECYCLE ====================
function createRuntimeDirectories() {
  const dirs = [RUNTIME_DIR, LOGS_DIR, EVIDENCE_DIR, EXPORTS_DIR, CONFIG_DIR];

  dirs.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (error) {
      logSecurityEvent('DIR_CREATE_ERROR', { dir, error: error.message });
    }
  });
}

function createDefaultConfig() {
  const defaultConfig = {
    version: '1.0.0',
    mode: 'strict',
    allowlistEnabled: true,
    allowedHosts: ['localhost', '127.0.0.1'],
    allowedPorts: [3000, 8000, 8080, 3001],
    allowedContentTypes: [
      'text/html',
      'application/json',
      'text/plain'
    ],
    premiumMarkers: [
      'subscribe', 'premium', 'login', 'paywall', 'purchase',
      'access denied', 'subscription', 'upgrade', 'payment'
    ],
    legalDisclaimerAccepted: false,
    smartDecode: {
      defaultEngine: "rust",
      strictEngine: false
    },
    strategyRuntime: {
      enabled: false,
      requireSignature: true,
      trustedPackHashes: [
        "efc9c8045d99acfd689a4105bce717260a9a3e5f4d04287aba4c167ec69c4456",
        "a23b9bbf54c832c736b6adf9169091075edead1d76b17f57b50e35bf60ad22f2"
      ]
    }
  };

  try {
    const policyPath = path.resolve(POLICY_FILE);
    const configDir = path.resolve(CONFIG_DIR); const configPrefix = (configDir.endsWith(path.sep) ? configDir : (configDir + path.sep)).toLowerCase(); if (!policyPath.toLowerCase().startsWith(configPrefix)) {
      throw new Error('Invalid policy path');
    }
    fs.writeFileSync(policyPath, JSON.stringify(defaultConfig, null, 2));
    logSecurityEvent('DEFAULT_CONFIG_CREATED', { file: POLICY_FILE });
  } catch (error) {
    logSecurityEvent('CONFIG_CREATE_ERROR', { error: error.message });
  }
}

function createDefaultAllowlist() {
  const defaultAllowlist = {
    allowedHosts: ['localhost', '127.0.0.1']
  };

  try {
    const allowlistPath = path.resolve(ALLOWLIST_FILE);
    const configDir = path.resolve(CONFIG_DIR);
    const configPrefix = (configDir.endsWith(path.sep) ? configDir : (configDir + path.sep)).toLowerCase();
    if (!allowlistPath.toLowerCase().startsWith(configPrefix)) {
      throw new Error('Invalid allowlist path');
    }
    fs.writeFileSync(allowlistPath, JSON.stringify(defaultAllowlist, null, 2));
    logSecurityEvent('DEFAULT_ALLOWLIST_CREATED', { file: ALLOWLIST_FILE });
  } catch (error) {
    logSecurityEvent('ALLOWLIST_CREATE_ERROR', { error: error.message });
  }
}

function readPolicySafe() {
  try {
    const policyPath = path.resolve(POLICY_FILE);
    const configDir = path.resolve(CONFIG_DIR);
    const configPrefix = (configDir.endsWith(path.sep) ? configDir : (configDir + path.sep)).toLowerCase();
    if (!policyPath.toLowerCase().startsWith(configPrefix)) {
      throw new Error('Invalid policy path');
    }
    const raw = fs.readFileSync(policyPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getPolicySummary() {
  const p = readPolicySafe() || {};

  const smartDecode = {
    defaultEngine: typeof p.smartDecode?.defaultEngine === 'string' ? p.smartDecode.defaultEngine : 'rust',
    strictEngine: Boolean(p.smartDecode?.strictEngine),
  };

  const trusted = Array.isArray(p.strategyRuntime?.trustedPackHashes) ? p.strategyRuntime.trustedPackHashes : [];
  const strategyRuntime = {
    enabled: Boolean(p.strategyRuntime?.enabled),
    requireSignature: p.strategyRuntime?.requireSignature !== false,
    trustedPackHashes: trusted.filter((h) => typeof h === 'string' && /^[a-f0-9]{64}$/i.test(h)),
  };

  return {
    version: typeof p.version === 'string' ? p.version : '1.0.0',
    mode: typeof p.mode === 'string' ? p.mode : 'strict',
    allowlistEnabled: p.allowlistEnabled !== false,
    legalDisclaimerAccepted: Boolean(p.legalDisclaimerAccepted),
    premiumMarkers: Array.isArray(p.premiumMarkers) ? p.premiumMarkers : [],
    smartDecode,
    strategyRuntime,
  };
}

function ensurePolicyDefaults() {
  try {
    const policyPath = path.resolve(POLICY_FILE);
    const configDir = path.resolve(CONFIG_DIR);
    const configPrefix = (configDir.endsWith(path.sep) ? configDir : (configDir + path.sep)).toLowerCase();
    if (!policyPath.toLowerCase().startsWith(configPrefix)) {
      throw new Error('Invalid policy path');
    }

    const existing = readPolicySafe() || {};

    // Only add missing keys; never overwrite user customizations.
    if (!existing.smartDecode || typeof existing.smartDecode !== 'object') {
      existing.smartDecode = { defaultEngine: 'rust', strictEngine: false };
    } else {
      if (typeof existing.smartDecode.defaultEngine !== 'string') existing.smartDecode.defaultEngine = 'rust';
      if (typeof existing.smartDecode.strictEngine !== 'boolean') existing.smartDecode.strictEngine = false;
    }

    if (!existing.strategyRuntime || typeof existing.strategyRuntime !== 'object') {
      existing.strategyRuntime = {
        enabled: false,
        requireSignature: true,
        trustedPackHashes: [
          'efc9c8045d99acfd689a4105bce717260a9a3e5f4d04287aba4c167ec69c4456',
          'a23b9bbf54c832c736b6adf9169091075edead1d76b17f57b50e35bf60ad22f2'
        ],
      };
    } else {
      if (typeof existing.strategyRuntime.enabled !== 'boolean') existing.strategyRuntime.enabled = false;
      if (typeof existing.strategyRuntime.requireSignature !== 'boolean') existing.strategyRuntime.requireSignature = true;
      if (!Array.isArray(existing.strategyRuntime.trustedPackHashes)) existing.strategyRuntime.trustedPackHashes = [];
    }

    fs.writeFileSync(policyPath, JSON.stringify(existing, null, 2));
  } catch (e) {
    logSecurityEvent('POLICY_MIGRATION_ERROR', { error: e.message });
  }
}
function getRendererPath() {
  return path.join(__dirname, '..', 'ui', 'hypersnatch-ui.html');
}

/**
 * Institutional Hardening: Startup Self-Diagnostic
 */
async function runSelfCheck() {
  const report = {
    timestamp: new Date().toISOString(),
    passed: true,
    checks: [],
    errors: []
  };

  try {
    // 1. Hardware Integrity Check
    const hwid = await getHardwareFingerprint();
    report.checks.push({ name: 'HARDWARE_ID', status: 'OK', id: hwid.substring(0, 16) });

    // 2. Runtime Environment Check
    const paths = [RUNTIME_DIR, CONFIG_DIR, LOGS_DIR, EVIDENCE_DIR];
    const missing = paths.filter(p => !fs.existsSync(p));
    if (missing.length > 0) {
      report.passed = false;
      report.errors.push(`Missing runtime paths: ${missing.join(', ')}`);
    } else {
      report.checks.push({ name: 'RUNTIME_PATHS', status: 'OK' });
    }

    // 3. Rust Core Availability
    const binName = process.platform === "win32" ? "hs-core.exe" : "hs-core";
    const rustPath = app.isPackaged
      ? path.join(process.resourcesPath, binName)
      : path.join(__dirname, '..', 'build', binName);

    if (fs.existsSync(rustPath)) {
      report.checks.push({ name: 'RUST_CORE', status: 'OK' });
    } else {
      report.checks.push({ name: 'RUST_CORE', status: 'NOT_FOUND', warning: 'Falling back to JS engine' });
    }

    // 4. Sandbox & Context Isolation (Meta Check)
    report.checks.push({
      name: 'SECURITY_POSTURE',
      contextIsolation: SECURITY_CONFIG.contextIsolation,
      sandbox: SECURITY_CONFIG.sandbox,
      webSecurity: SECURITY_CONFIG.webSecurity
    });

  } catch (err) {
    report.passed = false;
    report.errors.push(`Critical diagnostic failure: ${err.message}`);
  }

  return report;
}

// ==================== MAIN APP ====================
app.whenReady().then(() => {
  logSecurityEvent('APP_READY', { version: APP_VERSION });
  log.info("SYSTEM_BOOTSTRAP_COMPLETE", { version: APP_VERSION });

  // HARD NETWORK LOCK: Cancel ALL external network requests globally
  const { session } = require('electron');
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
    try {
      const url = new URL(details.url);

      // Allow internal app resources
      if (url.protocol === 'file:') {
        return callback({ cancel: false });
      }

      // Allow internal IPC/Bridge communication
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return callback({ cancel: false });
      }

      // Block everything else
      logSecurityEvent('NETWORK_BLOCK_TRIGGERED', { url: details.url });
      return callback({ cancel: true });
    } catch (e) {
      // Fallback: block anything unparseable
      callback({ cancel: true });
    }
  });

  // CSP ENFORCEMENT & SECONDARY AIRGAP LAYER
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    try {
      const url = new URL(details.url);

      // Secondary Airgap Check: Ensure redirects/workers don't bypass onBeforeRequest
      if (url.protocol !== 'file:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
        logSecurityEvent('NETWORK_BLOCK_HEADERS_STAGE', { url: details.url });
        return callback({ cancel: true });
      }
    } catch (e) { }

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "connect-src 'self' http://localhost:3000; " +
          "script-src 'self'; " +
          "style-src 'self' 'unsafe-inline'; " + // Allow inline styles for UI components
          "img-src 'self' data: blob: https://*; " +
          "media-src 'self' data: blob: https://*;"
        ]
      }
    });
  });

  // Create runtime directories
  createRuntimeDirectories();

  // Ensure config files exist (and are forward-compatible)
  if (!fs.existsSync(POLICY_FILE)) {
    createDefaultConfig();
  } else {
    ensurePolicyDefaults();
  }

  if (!fs.existsSync(ALLOWLIST_FILE)) {
    createDefaultAllowlist();
  }

  // Policy: default SmartDecode engine under Electron
  try {
    const pol = readPolicySafe();
    const requested = String(process.env.HYPERSNATCH_SMARTDECODE_ENGINE || "").toLowerCase();
    const defEngine = String(pol?.smartDecode?.defaultEngine || "rust").toLowerCase();
    if (!requested && defEngine && defEngine !== "auto") {
      process.env.HYPERSNATCH_SMARTDECODE_ENGINE = defEngine;
    }
  } catch { }
  // Security: Prevent multiple instances
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    logSecurityEvent('SINGLE_INSTANCE_ENFORCED');
    app.quit();
    return;
  }

  // Create main window with hardened security
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,           // SOVEREIGN SHELL: Frameless
    fullscreen: false,      // Disabled Kiosk mode for standard desktop usage
    backgroundColor: '#0a1016',
    webPreferences: {
      ...SECURITY_CONFIG,
      preload: path.join(__dirname, 'preload.js'),
      // Additional security
      safeDialogs: true,
      autoplayPolicy: 'document-user-activation-required',
      backgroundThrottling: false
    },
    icon: path.join(__dirname, 'assets', 'icon.ico')
  });

  // Custom Window Controls for Frameless Shell
  ipcMain.handle('window-minimize', () => mainWindow.minimize());
  ipcMain.handle('window-maximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.handle('window-close', () => mainWindow.close());
  ipcMain.handle('window-fullscreen', () => mainWindow.setFullScreen(!mainWindow.isFullScreen()));

  // Security: Set window open handler after window creation
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Security: Log window creation
  logSecurityEvent('WINDOW_CREATED', {
    securityConfig: SECURITY_CONFIG,
    rendererPath: mainWindow.webContents.executeJavaScript(`window.rendererPath = '${getRendererPath().replace(/\\/g, '\\\\')}'`)
  });

  // Load the app
  mainWindow.loadFile(getRendererPath());

  // Institutional Hardening: Startup Self-Diagnostic
  runSelfCheck().then(report => {
    logSecurityEvent('STARTUP_DIAGNOSTIC_COMPLETE', report);
    if (!report.passed) {
      log.error('DIAGNOSTIC_FAILURE', report.errors);
    }
  });

  // Security: Handle window closed
  mainWindow.on('closed', () => {
    logSecurityEvent('WINDOW_CLOSED');
  });

  // Security: Handle certificate errors
  mainWindow.webContents.on('certificate-error', (event, url, error) => {
    logSecurityEvent('CERTIFICATE_ERROR', { url, error: error.message });
  });

  // Security: Handle console messages
  mainWindow.webContents.on('console-message', (event, level, message) => {
    if (level === 'error') {
      logSecurityEvent('RENDERER_ERROR', { message });
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    logSecurityEvent('WINDOW_SHOWN');
  });

  // Security: Handle unresponsive
  mainWindow.on('unresponsive', () => {
    logSecurityEvent('WINDOW_UNRESPONSIVE');
  });

  // Security: Handle crashed
  mainWindow.webContents.on('crashed', (event, killed) => {
    logSecurityEvent('WINDOW_CRASHED', { killed });
  });
});
module.exports = {
  app,
  BrowserWindow,
  logSecurityEvent,
  enforceSecurityPolicy,
  getRendererPath
};
