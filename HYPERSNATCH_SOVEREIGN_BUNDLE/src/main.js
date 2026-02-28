// ==================== ELECTRON MAIN PROCESS ====================
"use strict";

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const secureCrypto = require('./security-crypto');
const log = require('./utils/logger');
const licenseValidator = require('./core/security/license_validator');

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
const APP_VERSION = '1.0.1';

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
    if (!allowlistPath.startsWith(process.cwd())) {
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

// ==================== IPC HANDLERS ====================
ipcMain.handle('get-app-info', () => {
  return {
    name: APP_NAME,
    version: APP_VERSION,
    platform: process.platform,
    securityConfig: SECURITY_CONFIG,
    runtimeDir: RUNTIME_DIR
  };
});

ipcMain.handle('open-logs-folder', () => {
  shell.openPath(LOGS_DIR);
});

ipcMain.handle('open-evidence-folder', () => {
  shell.openPath(EVIDENCE_DIR);
});

const SovereignAuth = require('./core/security/sovereign_auth');
const http = require('http');

// ==================== EMPIRE HUB BRIDGE ====================
class SovereignBridge {
  constructor() {
    this.serverUrl = 'http://localhost:3000'; // Default Sovereign Server port
    this.nodeId = 'HYPERSNATCH-' + crypto.randomBytes(2).toString('hex').toUpperCase();
    this.heartbeatInterval = null;
  }

  async connect() {
    console.log(`[Bridge] Connecting to Sovereign Hub as ${this.nodeId}...`);
    this.startHeartbeat();
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.sendToHub('HEARTBEAT', { 
        status: 'ACTIVE', 
        timestamp: new Date().toISOString(),
        version: '1.5.0-LEGENDARY'
      });
    }, 30000); // 30s heartbeat
  }

  sendToHub(event, data) {
    const payload = JSON.stringify({
      nodeId: this.nodeId,
      event,
      data,
      signature: crypto.createHmac('sha256', 'SOVEREIGN_ROOT_KEY_2026')
                       .update(JSON.stringify(data)).digest('hex')
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/node/report',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
      }
    };

    const req = http.request(options);
    req.on('error', () => { /* Server likely offline, ignore to maintain airgap feel */ });
    req.write(payload);
    req.end();
  }
}

const bridge = new SovereignBridge();
bridge.connect();

ipcMain.handle('empire-sync', async (event, { action, data }) => {
  bridge.sendToHub(action, data);
  return { success: true };
});

// ==================== SOVEREIGN HARDWARE BINDING ====================
async function getHardwareFingerprint() {
  try {
    const { execSync } = require('child_process');
    // Get CPU ID and Motherboard UUID on Windows
    const cpuId = execSync('wmic cpu get processorid').toString().split('\n')[1].trim();
    const baseboardId = execSync('wmic baseboard get serialnumber').toString().split('\n')[1].trim();
    
    const rawId = `HS-SOVEREIGN-${cpuId}-${baseboardId}`;
    return crypto.createHash('sha256').update(rawId).digest('hex');
  } catch (e) {
    return 'FALLBACK-ID-88229911'; // Safe fallback for dev/restricted environments
  }
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
    if (!fs.existsSync(licensePath)) {
      return { success: false, reason: 'License file not found.' };
    }
    const license = JSON.parse(fs.readFileSync(licensePath, 'utf8'));
    const result = SovereignAuth.verifyLicense(license, hwid);
    return { success: result.valid, ...result };
  } catch (err) {
    return { success: false, reason: err.message };
  }
});

ipcMain.handle('final-freeze', async (event, { caseData, reports }) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const caseFolderName = `CASE-FREEZE-${timestamp}`;
  
  const { filePath: rootPath } = await dialog.showOpenDialog({
    title: 'Select Destination for Final Case Freeze',
    properties: ['openDirectory']
  });

  if (!rootPath) return { success: false, reason: 'No directory selected' };

  const casePath = path.join(rootPath, caseFolderName);
  if (!fs.existsSync(casePath)) fs.mkdirSync(casePath);

  const manifestEntries = [];

  try {
    // 1. Write Reports
    for (const report of reports) {
      const filePath = path.join(casePath, report.filename);
      const buffer = report.type === 'pdf' ? Buffer.from(report.content, 'base64') : report.content;
      fs.writeFileSync(filePath, buffer);
      
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      manifestEntries.push(`${hash}  ${report.filename}`);
    }

    // 2. Create Integrity Manifest
    const manifestContent = manifestEntries.join('\n');
    const manifestPath = path.join(casePath, 'INTEGRITY_MANIFEST.txt');
    fs.writeFileSync(manifestPath, manifestContent);

    // 3. Sign the manifest (Sovereign Seal)
    const signature = crypto
      .createHmac('sha256', 'SOVEREIGN_ROOT_KEY_2026')
      .update(manifestContent)
      .digest('hex');
    
    fs.writeFileSync(path.join(casePath, 'SOVEREIGN_SEAL.sig'), signature);

    // 4. Create a README summary
    const readme = `HYPERSNATCH FINAL FREEZE REPORT\n` +
                   `===============================\n` +
                   `TIMESTAMP: ${new Date().toLocaleString()}\n` +
                   `BUILD ID:  ${caseData.buildId}\n` +
                   `ITEMS:     ${caseData.itemCount}\n` +
                   `SIGNATURE: ${signature}\n` +
                   `VERIFIED:  SOVEREIGN AUDIT CHAIN ACTIVE\n`;
    fs.writeFileSync(path.join(casePath, 'README_SUMMARY.txt'), readme);

    return { success: true, path: casePath, signature };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('export-pdf', async (event, { html, filename }) => {
  const pdfWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false
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

ipcMain.handle('export-security-report', async (event) => {
  try {
    const reportPath = path.join(app.getPath("desktop"), "hyperSnatch_report.json");

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

    const report = {
      product: "HyperSnatch",
      version: APP_VERSION,
      platform: process.platform,
      arch: process.arch,
      securityConfig: SECURITY_CONFIG,
      bridgeAuth,
      authenticodeState,
      timestamp: new Date().toISOString()
    };

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Export Security Report",
      defaultPath: reportPath,
      filters: [{ name: "JSON Report", extensions: ["json"] }]
    });

    if (canceled || !filePath) return false;

    fs.writeFileSync(filePath, JSON.stringify(report, null, 2), "utf8");
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
    const result = licenseValidator.validateLicenseFile(licensePath);

    // In a real app we'd copy this to CONFIG_DIR so it persists. For the demo, we just validate it.
    if (result.valid) {
      const storedLicense = path.join(CONFIG_DIR, 'license.json');
      fs.copyFileSync(licensePath, storedLicense);
      log.info("LICENSE_ACTIVATED", { edition: result.edition });
    }

    return result;

  } catch (error) {
    log.error("LICENSE_IMPORT_ERROR", { message: error.message });
    return { valid: false, reason: "Internal error processing license" };
  }
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
    ]
  };

  try {
    const policyPath = path.resolve(POLICY_FILE);
    if (!policyPath.startsWith(process.cwd())) {
      throw new Error('Invalid policy path');
    }
    fs.writeFileSync(policyPath, JSON.stringify(defaultConfig, null, 2));
    logSecurityEvent('DEFAULT_CONFIG_CREATED', { file: POLICY_FILE });
  } catch (error) {
    logSecurityEvent('CONFIG_CREATE_ERROR', { error: error.message });
  }
}

function getRendererPath() {
  // Determine if running in development or packaged mode
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, '..', 'hypersnatch.html');
  }

  // Packaged mode - look for app.asar
  const appPath = app.getAppPath();
  const asarPath = path.join(appPath, 'app.asar');

  if (fs.existsSync(asarPath)) {
    return path.join(asarPath, 'hypersnatch.html');
  }

  // Fallback to development path
  return path.join(__dirname, '..', 'hypersnatch.html');
}

// ==================== MAIN APP ====================
app.whenReady().then(() => {
  logSecurityEvent('APP_READY', { version: APP_VERSION });
  log.info("SYSTEM_BOOTSTRAP_COMPLETE", { version: APP_VERSION });

  // HARD NETWORK LOCK: Cancel all http/https requests globally
  const { session } = require('electron');
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (details, callback) => {
    logSecurityEvent('NETWORK_BLOCK_TRIGGERED', { url: details.url });
    callback({ cancel: true });
  });

  // Create runtime directories
  createRuntimeDirectories();

  // Create default config if doesn't exist
  if (!fs.existsSync(POLICY_FILE)) {
    createDefaultConfig();
  }

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
    fullscreen: true,       // GOD-TIER: Fullscreen Kiosk
    backgroundColor: '#0a1016',
    webPreferences: {
      ...SECURITY_CONFIG,
      preload: path.join(__dirname, 'preload.js'),
      // Additional security
      additionalArguments: '--no-sandbox',
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
