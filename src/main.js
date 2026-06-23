// ==================== ELECTRON MAIN PROCESS ====================
"use strict";

const { app, BrowserWindow, ipcMain, dialog, shell, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const secureCrypto = require('./security-crypto');
const log = require('./utils/logger');
const SmartDecode = require('./core/smartdecode');
const SovereignAuth = require('./core/security/sovereign_auth');

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
  sandbox: false,           // OS sandbox (AppContainer) blocks file:// asar in packaged builds on Windows
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

// ==================== SAMPLE PROOF WORKSPACE IPC ====================
function sampleWorkspaceDir() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'samples', 'demo-case')
    : path.join(__dirname, '..', 'samples', 'demo-case');
}

ipcMain.handle('read-sample-workspace', async () => {
  try {
    const base = sampleWorkspaceDir();
    const proofDir = path.join(base, 'proof');
    const manifest = JSON.parse(fs.readFileSync(path.join(proofDir, 'manifest.json'), 'utf8'));
    const receipt = JSON.parse(fs.readFileSync(path.join(proofDir, 'receipt.json'), 'utf8'));
    const sumsText = fs.readFileSync(path.join(proofDir, 'SHA256SUMS.txt'), 'utf8');
    const files = Array.isArray(manifest.files) ? manifest.files : [];
    return {
      success: true,
      base,
      proofDir,
      synthetic: Boolean(manifest.synthetic),
      case: manifest.case || {},
      capture: manifest.capture || {},
      files,
      counts: { artifacts: files.length, hashes: files.length, receipts: 1 },
      hashAlgorithm: manifest.hashAlgorithm || 'sha256',
      manifest: { path: 'proof/manifest.json', sha256: (receipt.manifest && receipt.manifest.sha256) || null },
      receipt,
      sumsText
    };
  } catch (err) {
    log.error('READ_SAMPLE_WORKSPACE_ERROR', { message: err.message });
    return { success: false, error: err.message };
  }
});

ipcMain.handle('verify-sample-workspace', async () => {
  try {
    const crypto = require('crypto');
    const base = sampleWorkspaceDir();
    const manifest = JSON.parse(fs.readFileSync(path.join(base, 'proof', 'manifest.json'), 'utf8'));
    const files = Array.isArray(manifest.files) ? manifest.files : [];
    const results = files.map((f) => {
      let actual = null;
      let verified = false;
      try {
        const buf = fs.readFileSync(path.join(base, f.path));
        actual = crypto.createHash('sha256').update(buf).digest('hex');
        verified = actual === f.sha256;
      } catch (e) {
        actual = null;
      }
      return { path: f.path, role: f.role, expected: f.sha256, actual, verified };
    });
    return { success: true, results, allVerified: results.length > 0 && results.every((r) => r.verified) };
  } catch (err) {
    log.error('VERIFY_SAMPLE_WORKSPACE_ERROR', { message: err.message });
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-sample-proof-folder', () => {
  try {
    shell.openPath(path.join(sampleWorkspaceDir(), 'proof'));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ==================== EXPORT PROOF BUNDLE IPC ====================

ipcMain.handle('select-export-destination', async () => {
  try {
    const mainWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose Export Destination Folder',
      properties: ['openDirectory', 'createDirectory'],
      buttonLabel: 'Export Here'
    });
    if (canceled || !filePaths || filePaths.length === 0) {
      return { success: false, canceled: true };
    }
    return { success: true, destPath: filePaths[0] };
  } catch (err) {
    log.error('SELECT_EXPORT_DESTINATION_ERROR', { message: err.message });
    return { success: false, error: err.message };
  }
});

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) + '-' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds());
}

const SKIP_NAMES = new Set(['.gitattributes', '.gitignore', '.gitkeep', '.DS_Store', 'Thumbs.db', 'README.md', '.git']);

// Files that must never appear inside an exported proof bundle. Prove It Again
// flags any of these as a hygiene failure.
const REPO_HYGIENE_NAMES = new Set(['.gitattributes', '.gitignore', '.gitkeep', '.DS_Store', 'Thumbs.db', 'README.md', '.git', '.gitmodules']);

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (SKIP_NAMES.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Recursively count repo-hygiene files present under a directory.
function scanRepoHygiene(dir) {
  const found = [];
  function walk(d, rel) {
    let entries = [];
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const entry of entries) {
      const childRel = rel ? rel + '/' + entry.name : entry.name;
      if (REPO_HYGIENE_NAMES.has(entry.name)) { found.push(childRel); continue; }
      if (entry.isDirectory()) walk(path.join(d, entry.name), childRel);
    }
  }
  walk(dir, '');
  return found;
}

// Client-side runtime for the exported offline verifier (VERIFY-HYPERSNATCH.html).
// Serialized via .toString() so it ships as inline JS inside the exported file.
// It is NOT the app renderer, so it does not affect the app's CSP promise.
// Pure-local: no network, no CDN, no fonts, no analytics. Uses crypto.subtle and
// falls back to manual `sha256sum -c` instructions when crypto.subtle is absent.
function capsuleClientScript() {
  var DATA = window.__HS_CAPSULE__ || {};
  function $(id) { return document.getElementById(id); }
  function text(id, v) { var n = $(id); if (n) n.textContent = (v == null ? '\u2014' : String(v)); }
  function setStatus(label, kind) { var p = $('capStatus'); if (!p) return; p.textContent = label; p.className = 'cap-status' + (kind ? ' ' + kind : ''); }
  function basename(p) { var i = p.lastIndexOf('/'); return i >= 0 ? p.slice(i + 1) : p; }
  function stripTop(rel) { var i = rel.indexOf('/'); return i >= 0 ? rel.slice(i + 1) : rel; }

  text('mBundleId', DATA.bundle_id);
  text('mApp', (DATA.app || 'HyperSnatch') + ' ' + (DATA.app_version || ''));
  text('mCreated', DATA.created_at);
  var c = DATA.counts || {};
  text('mArtifacts', c.artifacts);
  text('mReceipts', c.receipts);
  text('mHashes', c.sha256_entries);
  var priv = DATA.privacy || {};
  text('mCloud', priv.cloud_required ? 'Yes' : 'No');
  var claims = DATA.claims || {};
  text('mCourt', claims.court_certified ? 'Yes' : 'No');

  var sumsPre = $('sumsPre');
  if (sumsPre) sumsPre.textContent = (DATA.sums || []).map(function (e) { return e.hash + '  ' + e.path; }).join('\n');

  var hasSubtle = !!(window.crypto && window.crypto.subtle && window.crypto.subtle.digest);
  if (!hasSubtle) {
    var auto = $('autoVerify'); if (auto) auto.style.display = 'none';
    var man = $('manualFallback'); if (man) man.style.display = 'block';
    setStatus('Manual verification only', '');
    return;
  }

  async function sha256(file) {
    var buf = await file.arrayBuffer();
    var d = await window.crypto.subtle.digest('SHA-256', buf);
    return Array.prototype.slice.call(new Uint8Array(d)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  var selected = null;

  function indexFiles(files) {
    var byRel = {}, byBase = {}, hasPassport = false, hasVerifier = false, n = 0;
    for (var i = 0; i < files.length; i++) {
      var f = files[i]; n++;
      var rp = f.webkitRelativePath || f._relPath || f.name;
      byRel[stripTop(rp)] = f; byRel[rp] = f;
      var bn = basename(rp); byBase[bn] = f;
      if (bn === 'PROOF-PASSPORT.json') hasPassport = true;
      if (bn === 'VERIFY-HYPERSNATCH.html') hasVerifier = true;
    }
    return { byRel: byRel, byBase: byBase, hasPassport: hasPassport, hasVerifier: hasVerifier, count: n };
  }

  function onFiles(files) {
    if (!files || !files.length) return;
    selected = indexFiles(files);
    setStatus('Files selected (' + selected.count + ')', '');
    var b = $('btnVerify'); if (b) b.disabled = false;
  }

  function renderRows(rows) {
    var tb = $('resultsBody'); if (!tb) return;
    tb.innerHTML = '';
    rows.forEach(function (r) {
      var tr = document.createElement('tr');
      var td1 = document.createElement('td'); td1.textContent = r.path; td1.className = 'mono';
      var td2 = document.createElement('td'); td2.textContent = r.state; td2.className = (r.state === 'OK' ? 'ok' : 'bad');
      tr.appendChild(td1); tr.appendChild(td2); tb.appendChild(tr);
    });
    var rt = $('resultsTable'); if (rt) rt.style.display = 'table';
  }

  async function verify() {
    if (!selected) return;
    setStatus('Verifying\u2026', '');
    var rows = [], verified = 0, failed = 0, missing = 0;
    var sums = DATA.sums || [];
    for (var i = 0; i < sums.length; i++) {
      var e = sums[i];
      var f = selected.byRel[e.path] || selected.byBase[basename(e.path)];
      if (!f) { missing++; rows.push({ path: e.path, state: 'Missing file' }); continue; }
      var got = await sha256(f);
      if (got === e.hash) { verified++; rows.push({ path: e.path, state: 'OK' }); }
      else { failed++; rows.push({ path: e.path, state: 'Changed file' }); }
    }
    renderRows(rows);
    var passportOk = selected.hasPassport;
    var clean = failed === 0 && missing === 0 && verified === sums.length && passportOk;
    if (clean) {
      setStatus('Clean', 'clean');
      text('summaryLine', 'Clean. ' + verified + '/' + sums.length + ' hashes verified. Proof Passport present. No cloud required.');
    } else {
      setStatus('Needs review', 'bad');
      var reasons = [];
      if (failed) reasons.push('Hash mismatch: ' + failed);
      if (missing) reasons.push('Missing file: ' + missing);
      if (!passportOk) reasons.push('Passport missing');
      text('summaryLine', 'Needs review. Changed or missing files detected. (' + reasons.join(', ') + ')');
    }
  }

  function walkEntry(entry, prefix, out) {
    return new Promise(function (resolve) {
      if (entry.isFile) {
        entry.file(function (f) { try { f._relPath = prefix + entry.name; } catch (_) {} out.push(f); resolve(); }, function () { resolve(); });
      } else if (entry.isDirectory) {
        var reader = entry.createReader(); var all = [];
        (function readBatch() {
          reader.readEntries(function (batch) {
            if (!batch.length) { Promise.all(all.map(function (ch) { return walkEntry(ch, prefix + entry.name + '/', out); })).then(resolve); }
            else { all = all.concat(Array.prototype.slice.call(batch)); readBatch(); }
          }, function () { resolve(); });
        })();
      } else { resolve(); }
    });
  }

  var dir = $('dirInput'); if (dir) dir.addEventListener('change', function (e) { onFiles(e.target.files); });
  var fil = $('fileInput'); if (fil) fil.addEventListener('change', function (e) { onFiles(e.target.files); });
  var bv = $('btnVerify'); if (bv) bv.addEventListener('click', function () { verify(); });

  var dz = $('dropZone');
  if (dz) {
    ['dragenter', 'dragover'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('drag'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('drag'); }); });
    dz.addEventListener('drop', async function (e) {
      var items = e.dataTransfer && e.dataTransfer.items;
      if (items && items.length && items[0].webkitGetAsEntry) {
        var files = [], entries = [];
        for (var i = 0; i < items.length; i++) { var en = items[i].webkitGetAsEntry(); if (en) entries.push(en); }
        await Promise.all(entries.map(function (en) { return walkEntry(en, '', files); }));
        onFiles(files);
      } else if (e.dataTransfer && e.dataTransfer.files) { onFiles(e.dataTransfer.files); }
    });
  }

  setStatus('Ready', '');
}

function buildOfflineVerifierHtml(meta) {
  var css = [
    ':root{color-scheme:dark}',
    '*{box-sizing:border-box}',
    'body{margin:0;padding:2rem 1.25rem;background:#0e1116;color:#e6edf3;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.5}',
    '.wrap{max-width:880px;margin:0 auto}',
    'h1{font-size:1.4rem;margin:0 0 .25rem}',
    '.sub{color:#9aa7b4;font-size:.9rem;margin:0 0 1.25rem}',
    '.card{background:#161b22;border:1px solid #283039;border-radius:10px;padding:1rem 1.2rem;margin:0 0 1rem}',
    '.cap-status{display:inline-block;font-size:.72rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:3px 10px;border-radius:999px;border:1px solid #283039;color:#9aa7b4}',
    '.cap-status.clean{color:#3fb950;border-color:#3fb950}',
    '.cap-status.bad{color:#f85149;border-color:#f85149}',
    '.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.4rem 1.4rem;margin-top:.6rem}',
    '@media(max-width:560px){.grid{grid-template-columns:1fr}}',
    '.row{display:flex;justify-content:space-between;gap:1rem;font-size:.85rem;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.05)}',
    '.row .k{color:#9aa7b4}.row .v{text-align:right}',
    '.mono{font-family:ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace;font-size:.8rem}',
    '#dropZone{border:1.5px dashed #3a4452;border-radius:10px;padding:1.4rem;text-align:center;color:#9aa7b4;transition:.15s;cursor:default}',
    '#dropZone.drag{border-color:#3fb950;color:#e6edf3;background:#10261a}',
    '.controls{display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;margin-top:.8rem}',
    'button{font:inherit;background:#21262d;color:#e6edf3;border:1px solid #3a4452;border-radius:7px;padding:.45rem .9rem;cursor:pointer}',
    'button:disabled{opacity:.5;cursor:not-allowed}',
    'label.btn{display:inline-block;background:#21262d;border:1px solid #3a4452;border-radius:7px;padding:.45rem .9rem;cursor:pointer;font-size:.85rem}',
    'input[type=file]{display:none}',
    'table{width:100%;border-collapse:collapse;margin-top:.8rem;display:none}',
    'th,td{text-align:left;padding:.35rem .5rem;border-bottom:1px solid #283039;font-size:.82rem}',
    'td.ok{color:#3fb950}td.bad{color:#f85149}',
    '#summaryLine{margin-top:.8rem;font-size:.92rem}',
    'details{margin-top:.6rem}summary{cursor:pointer;color:#9aa7b4;font-size:.85rem}',
    'pre{background:#0b0f14;border:1px solid #283039;border-radius:8px;padding:.8rem;overflow:auto;font-size:.75rem}',
    '.note{color:#9aa7b4;font-size:.78rem;margin-top:.5rem}'
  ].join('');

  var html = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>HyperSnatch Offline Proof Verifier</title>',
    '<style>' + css + '</style>',
    '</head>',
    '<body>',
    '<div class="wrap">',
    '<h1>HyperSnatch Offline Proof Verifier</h1>',
    '<p class="sub">Self-verifying proof bundle. Tamper-evident, hash-verified, offline. No install, no account, no network.</p>',

    '<div class="card">',
    '<span class="cap-status" id="capStatus">Ready</span>',
    '<div class="grid">',
    '<div class="row"><span class="k">Bundle ID</span><span class="v mono" id="mBundleId">\u2014</span></div>',
    '<div class="row"><span class="k">App</span><span class="v" id="mApp">\u2014</span></div>',
    '<div class="row"><span class="k">Exported</span><span class="v" id="mCreated">\u2014</span></div>',
    '<div class="row"><span class="k">Artifacts</span><span class="v" id="mArtifacts">\u2014</span></div>',
    '<div class="row"><span class="k">Receipts</span><span class="v" id="mReceipts">\u2014</span></div>',
    '<div class="row"><span class="k">SHA-256 entries</span><span class="v" id="mHashes">\u2014</span></div>',
    '<div class="row"><span class="k">Cloud required</span><span class="v" id="mCloud">No</span></div>',
    '<div class="row"><span class="k">Court certified</span><span class="v" id="mCourt">No</span></div>',
    '</div>',
    '</div>',

    '<div class="card" id="autoVerify">',
    '<strong>Verify this bundle</strong>',
    '<p class="note">Drag the whole bundle folder here, or pick it below. Files are hashed locally in your browser with SHA-256. Nothing is uploaded.</p>',
    '<div id="dropZone">Drop the bundle folder (or its files) here</div>',
    '<div class="controls">',
    '<label class="btn">Select bundle folder<input type="file" id="dirInput" webkitdirectory directory multiple></label>',
    '<label class="btn">Select files<input type="file" id="fileInput" multiple></label>',
    '<button id="btnVerify" disabled>Verify</button>',
    '</div>',
    '<table id="resultsTable"><thead><tr><th>File</th><th>Status</th></tr></thead><tbody id="resultsBody"></tbody></table>',
    '<div id="summaryLine"></div>',
    '</div>',

    '<div class="card" id="manualFallback" style="display:none">',
    '<strong>Manual verification</strong>',
    '<p class="note">This browser does not expose SHA-256 hashing for local files. Verify from a terminal in the bundle folder:</p>',
    '<pre>sha256sum -c SHA256SUMS.txt</pre>',
    '</div>',

    '<details>',
    '<summary>Expected checksums (SHA256SUMS.txt)</summary>',
    '<pre id="sumsPre"></pre>',
    '<p class="note">These are the expected SHA-256 hashes for the corpus. PROOF-PASSPORT.json and this verifier are confirmed by presence (not self-hashed).</p>',
    '</details>',

    '<p class="note">Generated by HyperSnatch. This is an offline, self-verifying bundle. It is tamper-evident and hash-verified. It is not a court certification, chain-of-custody record, or legal admissibility determination.</p>',
    '</div>',
    '<script>window.__HS_CAPSULE__=' + JSON.stringify(meta) + ';</script>',
    '<script>(' + capsuleClientScript.toString() + ')();</script>',
    '</body>',
    '</html>'
  ].join('\n');
  return html;
}

ipcMain.handle('export-proof-bundle', async (_event, { destDir }) => {
  try {
    if (!destDir || typeof destDir !== 'string') {
      return { success: false, error: 'No destination directory specified.' };
    }
    const bundleName = 'HyperSnatch-Proof-Bundle-' + timestamp();
    const bundlePath = path.join(destDir, bundleName);
    if (fs.existsSync(bundlePath)) {
      return { success: false, error: 'A proof bundle already exists at ' + bundlePath + '. Choose a different location.' };
    }
    const src = sampleWorkspaceDir();
    copyDirRecursive(src, bundlePath);

    const crypto = require('crypto');
    const sumsEntries = ['captured-page/index.html', 'captured-page/dom-snapshot.html', 'captured-page/screenshot-placeholder.svg', 'artifacts/sample-report.txt', 'artifacts/sample-download.bin', 'proof/manifest.json', 'proof/receipt.json', 'proof/SHA256SUMS.txt', 'proof/download-receipt.md', 'proof/page-receipt.md'];
    const sumsLines = [];
    let fileCount = 0;
    for (const rel of sumsEntries) {
      const fp = path.join(bundlePath, rel);
      if (fs.existsSync(fp)) {
        const buf = fs.readFileSync(fp);
        const hash = crypto.createHash('sha256').update(buf).digest('hex');
        sumsLines.push(hash + '  ' + rel);
        fileCount++;
      }
    }

    const sumsText = sumsLines.join('\n') + '\n';
    fs.writeFileSync(path.join(bundlePath, 'SHA256SUMS.txt'), sumsText);

    // ── Proof Passport ────────────────────────────────────────────────────
    // Deterministic bundle id derived from the (sorted) checksum corpus so the
    // id is tied to the proof, not random.
    const idDigest = crypto.createHash('sha256')
      .update([...sumsLines].sort().join('\n'))
      .digest('hex').slice(0, 6).toUpperCase();
    const bundleId = 'HS-' + timestamp() + '-' + idDigest;

    const missingFiles = sumsEntries.length - fileCount;
    const hygieneFound = scanRepoHygiene(bundlePath);
    // Count proof/ vs artifact entries from the corpus list (honest, not scored).
    const proofFileCount = sumsEntries.filter((r) => r.startsWith('proof/')).length;
    const artifactCount = sumsEntries.length - proofFileCount;
    const verificationStatus = (missingFiles === 0 && hygieneFound.length === 0) ? 'clean' : 'needs_review';

    const passport = {
      schema: 'hypersnatch.proof_passport.v1',
      app: 'HyperSnatch',
      app_version: app.getVersion(),
      bundle_id: bundleId,
      bundle_type: 'sample-proof-export',
      created_at: new Date().toISOString(),
      source: { kind: 'bundled-sample-workspace', name: 'HyperSnatch Sample Proof Workspace' },
      counts: { artifacts: artifactCount, receipts: 1, sha256_entries: fileCount },
      verification: {
        status: verificationStatus,
        hashes_verified: fileCount,
        hashes_failed: 0,
        missing_files: missingFiles,
        repo_hygiene_files_found: hygieneFound.length
      },
      privacy: { cloud_required: false, telemetry_required: false, local_first: true },
      claims: { court_certified: false, chain_of_custody_claimed: false },
      // Offline Proof Capsule: the bundle ships a standalone, no-network verifier.
      // Like the passport, it is verified by presence (not self-hashed) to avoid a
      // circular checksum and to keep the SHA256SUMS corpus count stable.
      capsule: { offline_verifier: 'VERIFY-HYPERSNATCH.html', verifier_included: true, verifier_schema: 'hypersnatch.proof_capsule.v1' },
      // PROOF-PASSPORT.json is intentionally NOT listed in SHA256SUMS.txt: it
      // summarizes that corpus, so self-listing would couple its identity to its
      // own checksum line. It is instead verified by presence + schema during
      // "Prove It Again". The corpus checksum count stays stable at sha256_entries.
      notes: 'Verify the corpus with `sha256sum -c SHA256SUMS.txt`. This passport is verified by presence and schema, not self-listed in SHA256SUMS.'
    };
    fs.writeFileSync(path.join(bundlePath, 'PROOF-PASSPORT.json'), JSON.stringify(passport, null, 2) + '\n');

    // ── Offline Proof Capsule ──────────────────────────────────────────────
    // Standalone local verifier the recipient can open without installing
    // HyperSnatch. Presence-verified (not in SHA256SUMS) to avoid self-hashing.
    const verifierMeta = {
      schema: 'hypersnatch.proof_capsule.v1',
      app: 'HyperSnatch',
      app_version: app.getVersion(),
      bundle_id: bundleId,
      bundle_name: bundleName,
      created_at: passport.created_at,
      counts: passport.counts,
      privacy: passport.privacy,
      claims: passport.claims,
      sums: sumsLines.map((line) => {
        const idx = line.indexOf('  ');
        return { hash: line.slice(0, idx), path: line.slice(idx + 2) };
      })
    };
    fs.writeFileSync(path.join(bundlePath, 'VERIFY-HYPERSNATCH.html'), buildOfflineVerifierHtml(verifierMeta));

    const readme = [
      'HyperSnatch Proof Bundle',
      '========================',
      '',
      'Bundle: ' + bundleName,
      'Bundle ID: ' + bundleId,
      'Exported: ' + new Date().toISOString(),
      'Schema: hypersnatch.demo.manifest/v1 (synthetic)',
      '',
      'Contents:',
      '  artifacts/            -- Download artifacts',
      '  captured-page/        -- Page capture (HTML, DOM snapshot, screenshot)',
      '  proof/                -- Original manifest, receipt, and SHA256SUMS',
      '  SHA256SUMS.txt        -- Recomputed SHA-256 checksums (' + fileCount + ' files)',
      '  PROOF-PASSPORT.json   -- Bundle identity card (counts + verification summary)',
      '  VERIFY-HYPERSNATCH.html -- Offline verifier (open in a browser, no install)',
      '',
      'Verification:',
      '  Open VERIFY-HYPERSNATCH.html in a browser, then drag this folder in to verify.',
      '  Or run  sha256sum -c SHA256SUMS.txt  to verify file integrity.',
      '  Open PROOF-PASSPORT.json for the bundle id and a verification summary.',
      '',
      'This bundle was exported from a local instance of HyperSnatch.',
      'No cloud calls were made during extraction or export.',
      'https://github.com/Z3r0DayZion-install/hypersnatch'
    ].join('\n') + '\n';
    fs.writeFileSync(path.join(bundlePath, 'README.txt'), readme);

    return { success: true, bundlePath, bundleName, fileCount, bundleId, passport };
  } catch (err) {
    log.error('EXPORT_PROOF_BUNDLE_ERROR', { message: err.message });
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-export-folder', async (_event, { bundlePath }) => {
  try {
    if (!bundlePath || typeof bundlePath !== 'string') {
      return { success: false, error: 'No bundle path specified.' };
    }
    const resolved = path.resolve(bundlePath);
    if (!fs.existsSync(resolved)) {
      return { success: false, error: 'Export folder no longer exists: ' + resolved };
    }
    shell.openPath(resolved);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Verify a proof bundle directory: re-hash every SHA256SUMS entry, plus check
// passport presence/schema, receipt/manifest presence, offline verifier
// presence, and repo-hygiene cleanliness. Returns a structured result (no IPC
// wrapper). Shared by "Prove It Again" and "Tamper Trial".
function verifyBundleDir(resolved) {
  const crypto = require('crypto');
  const sumsPath = path.join(resolved, 'SHA256SUMS.txt');
  if (!fs.existsSync(sumsPath)) {
    return { error: 'SHA256SUMS.txt not found in bundle.' };
  }
  const sumsText = fs.readFileSync(sumsPath, 'utf8');
  const lines = sumsText.split(/\r?\n/).filter((l) => l.trim().length > 0);

  let verified = 0, failed = 0, missing = 0;
  const failures = [];
  for (const line of lines) {
    const m = /^([0-9a-fA-F]{64})\s+(.+)$/.exec(line.trim());
    if (!m) continue;
    const expected = m[1].toLowerCase();
    const rel = m[2].trim();
    const fp = path.join(resolved, rel);
    if (!fs.existsSync(fp)) { missing++; failures.push('missing: ' + rel); continue; }
    const actual = crypto.createHash('sha256').update(fs.readFileSync(fp)).digest('hex');
    if (actual === expected) { verified++; }
    else { failed++; failures.push('hash mismatch: ' + rel); }
  }
  const total = verified + failed + missing;

  // Proof Passport presence + schema
  let passportPresent = false, passportValid = false, bundleId = null;
  const passportPath = path.join(resolved, 'PROOF-PASSPORT.json');
  if (fs.existsSync(passportPath)) {
    passportPresent = true;
    try {
      const pp = JSON.parse(fs.readFileSync(passportPath, 'utf8'));
      passportValid = pp && pp.schema === 'hypersnatch.proof_passport.v1';
      bundleId = (pp && pp.bundle_id) || null;
    } catch (e) { passportValid = false; }
  }

  const receiptPresent = fs.existsSync(path.join(resolved, 'proof', 'receipt.json'));
  const manifestPresent = fs.existsSync(path.join(resolved, 'proof', 'manifest.json'));
  const hygieneFound = scanRepoHygiene(resolved);
  const verifierPresent = fs.existsSync(path.join(resolved, 'VERIFY-HYPERSNATCH.html'));

  const clean = failed === 0 && missing === 0 && total > 0 &&
    passportPresent && passportValid && receiptPresent && manifestPresent &&
    verifierPresent && hygieneFound.length === 0;

  return {
    status: clean ? 'clean' : 'failed',
    bundleId,
    total, verified, failed, missing,
    passportPresent, passportValid,
    receiptPresent, manifestPresent,
    verifierPresent,
    repoHygieneFound: hygieneFound.length,
    repoHygieneFiles: hygieneFound,
    failures
  };
}

// Re-verify an exported proof bundle from disk ("Prove It Again").
// Path safety: only a path that exists on disk (returned by a prior export or
// selected by the user) is inspected; nothing outside the bundle is scanned.
ipcMain.handle('reverify-export-bundle', async (_event, { bundlePath }) => {
  try {
    if (!bundlePath || typeof bundlePath !== 'string') {
      return { success: false, error: 'No bundle path specified.' };
    }
    const resolved = path.resolve(bundlePath);
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
      return { success: false, error: 'Bundle folder no longer exists: ' + resolved };
    }

    const r = verifyBundleDir(resolved);
    if (r.error) return { success: false, error: r.error };
    return Object.assign({ success: true }, r);
  } catch (err) {
    log.error('REVERIFY_EXPORT_BUNDLE_ERROR', { message: err.message });
    return { success: false, error: err.message };
  }
});

// Tamper Trial: prove HyperSnatch catches tampering.
// Safety model:
//   - Only operates on a HyperSnatch export bundle (name prefix + required files).
//   - NEVER modifies the original bundle. Each tamper case runs on a fresh copy
//     made under the OS temp dir. All writes stay inside that temp trial folder.
//   - Reuses verifyBundleDir() (the exact "Prove It Again" logic).
const TAMPER_BUNDLE_PREFIX = 'HyperSnatch-Proof-Bundle-';

function isSafeBundlePath(resolved) {
  try {
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) return false;
    if (!path.basename(resolved).startsWith(TAMPER_BUNDLE_PREFIX)) return false;
    if (!fs.existsSync(path.join(resolved, 'SHA256SUMS.txt'))) return false;
    if (!fs.existsSync(path.join(resolved, 'PROOF-PASSPORT.json'))) return false;
    return true;
  } catch (e) { return false; }
}

ipcMain.handle('run-tamper-trial', async (_event, { bundlePath }) => {
  try {
    if (!bundlePath || typeof bundlePath !== 'string') {
      return { success: false, error: 'No bundle path specified.' };
    }
    const source = path.resolve(bundlePath);
    if (!isSafeBundlePath(source)) {
      return { success: false, error: 'Tamper Trial only runs on a HyperSnatch export bundle. This path is not a recognized export.' };
    }

    const os = require('os');
    const trialRoot = path.join(os.tmpdir(), 'HyperSnatch-Tamper-Trial-' + timestamp());
    fs.mkdirSync(trialRoot, { recursive: true });

    // Baseline: original export must remain clean (we only read it).
    const baseline = verifyBundleDir(source);
    const originalStatus = baseline && !baseline.error ? baseline.status : 'error';

    // Each case: isolated copy under trialRoot, one deterministic tamper, verify.
    const caseDefs = [
      {
        case: 'modified_hashed_file', expected_detection: 'hash_mismatch',
        apply: (dir) => {
          const fp = path.join(dir, 'artifacts', 'sample-report.txt');
          fs.appendFileSync(fp, '\n<<tamper-trial-modification>>\n');
          return 'artifacts/sample-report.txt';
        },
        detect: (r) => r.failed >= 1
      },
      {
        case: 'missing_hashed_file', expected_detection: 'missing_file',
        apply: (dir) => {
          const fp = path.join(dir, 'artifacts', 'sample-download.bin');
          fs.unlinkSync(fp);
          return 'artifacts/sample-download.bin';
        },
        detect: (r) => r.missing >= 1
      },
      {
        case: 'altered_passport', expected_detection: 'passport_invalid',
        apply: (dir) => {
          const fp = path.join(dir, 'PROOF-PASSPORT.json');
          const pp = JSON.parse(fs.readFileSync(fp, 'utf8'));
          pp.schema = 'tampered.not_a_real_schema';
          pp.bundle_id = 'TAMPERED';
          fs.writeFileSync(fp, JSON.stringify(pp, null, 2) + '\n');
          return 'PROOF-PASSPORT.json';
        },
        detect: (r) => r.passportPresent === true && r.passportValid === false
      },
      {
        case: 'missing_verifier', expected_detection: 'verifier_missing',
        apply: (dir) => {
          fs.unlinkSync(path.join(dir, 'VERIFY-HYPERSNATCH.html'));
          return 'VERIFY-HYPERSNATCH.html';
        },
        detect: (r) => r.verifierPresent === false
      }
    ];

    const cases = [];
    let idx = 0;
    for (const def of caseDefs) {
      idx++;
      const caseDir = path.join(trialRoot, 'case-' + idx + '-' + def.case);
      copyDirRecursive(source, caseDir);
      let target = null, applyError = null;
      try { target = def.apply(caseDir); } catch (e) { applyError = e.message; }
      const r = verifyBundleDir(caseDir);
      const verifyFailed = r && !r.error && r.status === 'failed';
      const detected = !applyError && !r.error && def.detect(r) && verifyFailed;
      cases.push({
        case: def.case,
        expected_detection: def.expected_detection,
        target_file: target,
        detected: !!detected,
        verify_status: r && r.error ? 'error' : r.status,
        signals: r && !r.error ? { failed: r.failed, missing: r.missing, passportValid: r.passportValid, verifierPresent: r.verifierPresent } : null
      });
    }

    const caught = cases.filter((c) => c.detected).length;
    const total = cases.length;
    const status = caught === total ? 'passed' : 'needs_review';

    const result = {
      schema: 'hypersnatch.tamper_trial.v1',
      created_at: new Date().toISOString(),
      app_version: app.getVersion(),
      source_bundle: source,
      source_bundle_id: baseline && baseline.bundleId ? baseline.bundleId : null,
      original_status: originalStatus,
      trial_bundle: trialRoot,
      cases,
      summary: { caught, total, status }
    };
    const resultPath = path.join(trialRoot, 'TAMPER-TRIAL-RESULT.json');
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + '\n');

    return { success: true, trialBundle: trialRoot, resultPath, originalStatus, cases, summary: result.summary };
  } catch (err) {
    log.error('RUN_TAMPER_TRIAL_ERROR', { message: err.message });
    return { success: false, error: err.message };
  }
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

// ==================== SMARTSNATCH AUTOMATION ENGINE ====================
const clipboardWatcher = require('./automation/clipboardWatcher');
const decodeQueue = require('./automation/decodeQueue');
const decodeScheduler = require('./automation/decodeScheduler');

// Configure Watcher
clipboardWatcher.setProvider(async () => {
  return clipboard.readText();
});

// Configure Scheduler
decodeScheduler.setExecutor(async (job) => {
  log.info('AUTOMATION_DECODE_START', { id: job.id, url: job.url, host: job.host, caseId: job.caseId || null });
  BrowserWindow.getAllWindows().forEach((w) => w.webContents.send('automation-event', {
    type: 'DECODE_START',
    data: {
      id: job.id,
      url: job.url,
      host: job.host,
      caseId: job.caseId || null
    }
  }));

  const intelPath = app.isPackaged
    ? path.join(process.resourcesPath, 'config', 'forensic_intelligence.json')
    : path.join(__dirname, '..', 'config', 'forensic_intelligence.json');

  try {
    const out = await SmartDecode.run(job.url, { intelligencePath: intelPath });
    const summary = decodeQueue.constructor.summarizeResult(out);

    BrowserWindow.getAllWindows().forEach((w) => w.webContents.send('automation-event', {
      type: 'DECODE_COMPLETE',
      data: {
        id: job.id,
        url: job.url,
        host: job.host,
        caseId: job.caseId || null,
        out,
        summary
      }
    }));

    return out;
  } catch (err) {
    BrowserWindow.getAllWindows().forEach((w) => w.webContents.send('automation-event', {
      type: 'DECODE_FAILED',
      data: {
        id: job.id,
        url: job.url,
        host: job.host,
        caseId: job.caseId || null,
        error: err && err.message ? err.message : String(err)
      }
    }));
    throw err;
  }
});

// Start loopers
decodeScheduler.start(1000);
clipboardWatcher.start(1000);

// ==================== CASE MANAGEMENT SYSTEM (Phase 57) ====================
const CaseStore = require('./cases/caseStore');
const BundleAttachment = require('./cases/bundleAttachment');
const CaseNotes = require('./cases/caseNotes');
const FindingsRegistry = require('./cases/findingsRegistry');
const CaseComparator = require('./cases/caseComparator');

// ==================== INSTITUTIONAL TRUST LAYER (Phase 58) ====================
const AuditLogger = require('./audit/auditLogger');
const CustodyChain = require('./audit/custodyChain');
const BundleSigner = require('./audit/bundleSigner');
const SignatureVerifier = require('./audit/signatureVerifier');
const ExportSeal = require('./audit/exportSeal');

const SimilarityEngine = require('./intelligence/similarityEngine');

// ==================== PLUGIN ECOSYSTEM (Phase 60) ====================
const PluginLoader = require('./plugins/pluginLoader');
const PluginSandbox = require('./plugins/pluginSandbox');

// ==================== INTELLIGENCE GRAPH ====================
const IntelligenceGraph = require('./intelligence/intelligenceGraph');

// ==================== HYPERQUERY ENGINE (Phase 61) ====================
const IndexManager = require('./query/indexManager');
const HyperQueryEngine = require('./query/hyperQueryEngine');

// ==================== REPLAY MUTATION ENGINE (Phase 62) ====================
const ReplayMutationEngine = require('./replay/replayMutationEngine');
const mutationEngine = new ReplayMutationEngine();

// ==================== DETECTION RULE ENGINE (Phase 63) ====================
const DetectionRuleEngine = require('./rules/detectionRuleEngine');
const ruleEngine = new DetectionRuleEngine();

// ==================== RESEARCH MODE TOOLKIT (Phase 64) ====================
const ResearchSandbox = require('./research/researchSandbox');
const RESEARCH_DIR = path.join(RUNTIME_DIR, 'research');
const researchSandbox = new ResearchSandbox(RESEARCH_DIR);

// ==================== DATASET EXPORT SYSTEM (Phase 65) ====================
const DatasetExporter = require('./export/datasetExporter');
const exporter = new DatasetExporter();

// ==================== PATTERN DISCOVERY ENGINE (Phase 66) ====================
const PatternDiscoveryEngine = require('./intelligence/patternDiscoveryEngine');
const ClusterEngine = require('./intelligence/clusterEngine');
const AnomalyDetector = require('./intelligence/anomalyDetector');
const patternEngine = new PatternDiscoveryEngine();
const clusterEngine = new ClusterEngine();
const anomalyDetector = new AnomalyDetector();

// ==================== TOPOLOGY MAPPER (Phase 67) ====================
const TopologyMapper = require('./intelligence/topologyMapper');
const topologyMapper = new TopologyMapper();

// ==================== INSIGHT GENERATOR (Phase 68) ====================
const InsightGenerator = require('./intelligence/insightGenerator');
const insightGenerator = new InsightGenerator();

// ==================== CASE INTELLIGENCE ASSISTANT (Phase 69) ====================
const CaseIntelligenceAssistant = require('./assistant/caseIntelligenceAssistant');
const caseAssistant = new CaseIntelligenceAssistant(patternEngine, anomalyDetector, insightGenerator);

// ==================== AUTONOMOUS INVESTIGATOR (Phase 70) ====================
const AutonomousInvestigator = require('./autonomy/autonomousInvestigator');
const autoInvestigator = new AutonomousInvestigator({
  patternDiscovery: patternEngine,
  anomalyDetector: anomalyDetector,
  insightGenerator: insightGenerator,
  topologyMapper: topologyMapper,
  ruleEngine: ruleEngine
});

// ==================== AI PATTERN CLASSIFIER (Phase 71) ====================
const PatternClassifier = require('./ai/patternClassifier');
const patternClassifier = new PatternClassifier();

// ==================== ANOMALY SCORER (Phase 72) ====================
const AnomalyScorer = require('./ai/anomalyScorer');
const anomalyScorer = new AnomalyScorer();

// ==================== FINGERPRINT LIBRARY (Phase 73) ====================
const FingerprintLibrary = require('./library/fingerprintLibrary');
const fpLibraryPath = path.join(RUNTIME_DIR, 'fingerprint_library.json');
const fingerprintLibrary = new FingerprintLibrary(fpLibraryPath);

// ==================== CROSS-CASE MINER (Phase 74) ====================
const CrossCaseMiner = require('./intelligence/crossCaseMiner');
const crossCaseMiner = new CrossCaseMiner();

// ==================== AUTONOMOUS RESEARCH MODE (Phase 75) ====================
const AutonomousResearchMode = require('./research/autonomousResearchMode');
const autoResearch = new AutonomousResearchMode();

// ==================== WORKSPACE STORE (Phase 76) ====================
const WorkspaceStore = require('./workspaces/workspaceStore');
const workspaceStore = new WorkspaceStore();

// ==================== TRUST REGISTRY (Phase 77) ====================
const TrustRegistry = require('./federation/trustRegistry');
const trustRegistry = new TrustRegistry();

// ==================== CENTRALITY ENGINE (Phase 78) ====================
const CentralityEngine = require('./graph/centralityEngine');
const centralityEngine = new CentralityEngine();

// ==================== POLICY ENGINE (Phase 79) ====================
const PolicyEngine = require('./policy/policyEngine');
const policyEngine = new PolicyEngine();

// ==================== DEPLOYMENT PROFILES (Phase 80) ====================
const DeploymentProfiles = require('./enterprise/deploymentProfiles');
const deploymentProfiles = new DeploymentProfiles();

// ==================== REVIEW WORKFLOW (Phase 81) ====================
const ReviewWorkflow = require('./collaboration/reviewWorkflow');
const reviewWorkflow = new ReviewWorkflow();

// ==================== REDACTION ENGINE (Phase 82) ====================
const RedactionEngine = require('./redaction/redactionEngine');
const redactionEngine = new RedactionEngine();

// ==================== PUBLICATION PIPELINE (Phase 83) ====================
const PublicationPipeline = require('./publication/publicationPipeline');
const publicationPipeline = new PublicationPipeline();

// ==================== MODEL REPORTER (Phase 84) ====================
const ModelReporter = require('./reporting/modelReporter');
const modelReporter = new ModelReporter();

// ==================== DEPLOYMENT ORCHESTRATOR (Phase 85) ====================
const DeploymentOrchestrator = require('./deployment/deploymentOrchestrator');
const deploymentOrchestrator = new DeploymentOrchestrator();

// ==================== TIMELINE ENGINE (Phase 86) ====================
const TimelineEngine = require('./timeline/timelineEngine');
const timelineEngine = new TimelineEngine();

// ==================== INFRASTRUCTURE TRACKER (Phase 87) ====================
const InfrastructureTracker = require('./evolution/infrastructureTracker');
const infrastructureTracker = new InfrastructureTracker();

// ==================== PREDICTIVE ANOMALY (Phase 88) ====================
const PredictiveAnomaly = require('./predictive/predictiveAnomaly');
const predictiveAnomaly = new PredictiveAnomaly();

// ==================== FORENSIC SIMULATOR (Phase 89) ====================
const ForensicSimulator = require('./simulation/forensicSimulator');
const forensicSimulator = new ForensicSimulator();

// ==================== THREAT REPORTER (Phase 90) ====================
const ThreatReporter = require('./threat/threatReporter');
const threatReporter = new ThreatReporter();

// ==================== GLOBAL GRAPH (Phase 91) ====================
const GlobalGraph = require('./global/globalGraph');
const globalGraph = new GlobalGraph();

// ==================== INFRA ATTRIBUTION (Phase 92) ====================
const InfraAttributionEngine = require('./attribution/infraAttributionEngine');
const infraAttributionEngine = new InfraAttributionEngine();

// ==================== ADVERSARY FINGERPRINTING (Phase 93) ====================
const AdversaryFingerprintEngine = require('./fingerprinting/adversaryFingerprintEngine');
const adversaryFingerprintEngine = new AdversaryFingerprintEngine();

// ==================== SELF HEALING (Phase 94) ====================
const SelfHealingOrchestrator = require('./healing/selfHealingOrchestrator');
const selfHealingOrchestrator = new SelfHealingOrchestrator();

// ==================== AUTONOMOUS DISCOVERY (Phase 95) ====================
const AutonomousDiscoveryEngine = require('./discovery/autonomousDiscoveryEngine');
const autonomousDiscoveryEngine = new AutonomousDiscoveryEngine();

// ==================== ENDGAME MASTER PACK (Phases 96-100) ====================
const MissionReplayEngine = require('./endgame/missionReplayEngine');
const missionReplayEngine = new MissionReplayEngine();

const CounterfactualSimulator = require('./endgame/counterfactualEngine');
const counterfactualSimulator = new CounterfactualSimulator();

const EvidenceWeightEngine = require('./endgame/evidenceWeightEngine');
const evidenceWeightEngine = new EvidenceWeightEngine();

const ChallengeModeEngine = require('./endgame/challengeModeEngine');
const challengeModeEngine = new ChallengeModeEngine();

const StrategicCommandEngine = require('./endgame/strategicCommandEngine');
const strategicCommandEngine = new StrategicCommandEngine(
  missionReplayEngine,
  counterfactualSimulator,
  evidenceWeightEngine,
  challengeModeEngine
);

const indexManager = new IndexManager();

const PLUGINS_DIR = path.join(RUNTIME_DIR, 'plugins');
const pluginLoader = new PluginLoader(PLUGINS_DIR);
const pluginSandbox = new PluginSandbox();

const intelGraph = new IntelligenceGraph();
const hyperQuery = new HyperQueryEngine(indexManager, intelGraph);

// Trust Layer IPC Handlers
const AUDIT_STORAGE = path.join(RUNTIME_DIR, 'audit');
const KEYS_DIR = path.join(RUNTIME_DIR, 'identity');

const auditLogger = new AuditLogger(AUDIT_STORAGE);
const custodyChain = new CustodyChain(AUDIT_STORAGE);
const bundleSigner = new BundleSigner(KEYS_DIR);
const exportSeal = new ExportSeal(bundleSigner, SignatureVerifier);

// Ensure workstation identity on boot
const workstationPubKey = bundleSigner.ensureKeyPair();
log.info("FORENSIC_STATION_IDENTITY_READY", { publicKey: workstationPubKey.substring(0, 64) + "..." });

// Trust Layer IPC Handlers
ipcMain.handle('audit-log', (event, { type, data }) => {
  auditLogger.log(type, data, 'ANALYST_01'); // In real build, current analyst ID
  return { success: true };
});

ipcMain.handle('audit-get-logs', () => auditLogger.getLogs());

ipcMain.handle('custody-record', (event, { fingerprint, action, details }) => {
  custodyChain.recordEvent(fingerprint, action, details);
  return { success: true };
});

ipcMain.handle('custody-get-chain', (event, fingerprint) => custodyChain.getChain(fingerprint));

ipcMain.handle('evidence-sign', (event, data) => {
  return bundleSigner.signData(data);
});

ipcMain.handle('evidence-verify', (event, { data, signature, publicKey }) => {
  return SignatureVerifier.verifyData(data, signature, publicKey);
});

ipcMain.handle('evidence-seal-case', async (event, { caseId, destinationDir }) => {
  const gateCheck = await requireTier('INSTITUTIONAL', 'Sealed Evidence Packaging');
  if (gateCheck) return gateCheck;

  const caseData = caseStore.loadCase(caseId);
  if (!caseData) throw new Error("Case not found");

  const context = {
    custodyChain: caseData.bundles.map(b => ({
      fingerprint: b.fingerprint,
      chain: custodyChain.getChain(b.fingerprint)
    })),
    auditLogs: auditLogger.getLogs().filter(l => l.data?.caseId === caseId)
  };

  return exportSeal.sealCase(caseData, destinationDir, context);
});

// Intelligence Graph IPC Handlers
ipcMain.handle('intelligence-get-graph', () => {
  return {
    nodes: intelGraph.getAllNodes(),
    edges: intelGraph.getAllEdges()
  };
});

ipcMain.handle('intelligence-get-similar', (event, fingerprint) => {
  const allBundles = [];
  // Gather all bundles from all cases for similarity comparison
  caseStore.listCases().forEach(cSummary => {
    const fullCase = caseStore.loadCase(cSummary.id);
    if (fullCase && fullCase.bundles) {
      fullCase.bundles.forEach(b => {
        if (b.fingerprint_data) allBundles.push(b);
      });
    }
  });

  const targetNode = intelGraph.getNode(fingerprint);
  if (!targetNode || !targetNode.data.fingerprint) return [];

  return SimilarityEngine.findSimilar(targetNode.data.fingerprint, allBundles);
});

ipcMain.handle('intelligence-rebuild-graph', () => {
  intelGraph.clear();
  caseStore.listCases().forEach(cSummary => {
    const fullCase = caseStore.loadCase(cSummary.id);
    if (fullCase && fullCase.bundles) {
      fullCase.bundles.forEach(bundle => {
        updateIntelligenceGraph(bundle, fullCase.case_id);
      });
    }
  });
  return { success: true };
});

// Plugin Ecosystem IPC Handlers
ipcMain.handle('plugins-list', () => pluginLoader.getAllPlugins());

ipcMain.handle('plugins-load', (event, pluginPath) => {
  return pluginLoader.loadPlugin(pluginPath);
});

ipcMain.handle('plugins-run-capability', async (event, { pluginId, capability, context }) => {
  const plugin = pluginLoader.getPlugin(pluginId);
  if (!plugin || !plugin.enabled) throw new Error("Plugin not found or disabled");

  if (!plugin.capabilities.includes(capability)) {
    throw new Error(`Plugin ${pluginId} does not support capability: ${capability}`);
  }

  return await pluginSandbox.run(plugin.main, { capability, context });
});

// HyperQuery IPC Handlers
ipcMain.handle('query-execute', (event, queryStr) => {
  return hyperQuery.execute(queryStr).map(bid => {
    const node = intelGraph.getNode(bid);
    return node ? { id: bid, ...node } : { id: bid, type: 'UNKNOWN' };
  });
});

ipcMain.handle('query-stats', () => {
  return indexManager.getStatistics();
});

// Replay Mutation IPC Handlers
ipcMain.handle('replay-mutate-set', (event, { sessionId, config }) => {
  mutationEngine.setMutation(sessionId, config);
  return { success: true };
});

ipcMain.handle('replay-mutate-clear', (event, sessionId) => {
  mutationEngine.clearMutation(sessionId);
  return { success: true };
});

// Detection Rules IPC Handlers
ipcMain.handle('rules-scan-bundle', (event, bundle) => {
  return ruleEngine.evaluate(bundle);
});

// Research Mode IPC Handlers
ipcMain.handle('research-list-scripts', () => researchSandbox.listScripts());

ipcMain.handle('research-run-script', async (event, { scriptName, context }) => {
  return await researchSandbox.executeResearchScript(scriptName, context);
});

// Dataset Export IPC Handlers
ipcMain.handle('export-case-data', async (event, { caseData, format, targetPath }) => {
  await exporter.exportCase(caseData, format, targetPath);
  return { success: true };
});

// Pattern Discovery IPC Handlers (Phase 66)
ipcMain.handle('patterns-discover', (event, bundles) => {
  return patternEngine.discover(bundles);
});

ipcMain.handle('patterns-cluster', (event, { bundles, traits }) => {
  return clusterEngine.cluster(bundles, traits);
});

ipcMain.handle('patterns-anomalies', (event, { bundles, patterns }) => {
  return anomalyDetector.detect(bundles, patterns);
});

ipcMain.handle('patterns-stats', () => {
  return {
    patterns: patternEngine.getStats(),
    clusters: clusterEngine.getStats(),
    anomalies: anomalyDetector.getStats()
  };
});

// Topology Mapper IPC (Phase 67)
ipcMain.handle('topology-map-case', (event, bundles) => {
  return topologyMapper.mapCase(bundles);
});

// Insight Generator IPC (Phase 68)
ipcMain.handle('insights-generate', (event, { patterns, anomalies, topology }) => {
  return insightGenerator.generate(patterns, anomalies, topology);
});

// Case Assistant IPC (Phase 69)
ipcMain.handle('assistant-briefing', (event, caseData) => {
  return caseAssistant.generateBriefing(caseData);
});

ipcMain.handle('assistant-suggest-related', (event, { targetBundle, allBundles }) => {
  return caseAssistant.suggestRelated(targetBundle, allBundles);
});

ipcMain.handle('assistant-propose-experiments', (event, bundle) => {
  return caseAssistant.proposeExperiments(bundle);
});

// Autonomous Investigator IPC (Phase 70)
ipcMain.handle('auto-investigate', async (event, bundles) => {
  return await autoInvestigator.run(bundles);
});

// Pattern Classifier IPC (Phase 71)
ipcMain.handle('ai-classify-bundles', (event, bundles) => {
  return patternClassifier.classifyBundles(bundles);
});

// Anomaly Scorer IPC (Phase 72)
ipcMain.handle('ai-score-anomalies', (event, observations) => {
  return anomalyScorer.scoreBundles(observations);
});

// Fingerprint Library IPC (Phase 73)
ipcMain.handle('fplib-add', (event, entry) => {
  return fingerprintLibrary.add(entry);
});
ipcMain.handle('fplib-search', (event, features) => {
  return fingerprintLibrary.findSimilar(features);
});
ipcMain.handle('fplib-compare', (event, candidate) => {
  return fingerprintLibrary.compare(candidate);
});
ipcMain.handle('fplib-export', () => {
  return fingerprintLibrary.export();
});

// Cross-Case Miner IPC (Phase 74)
ipcMain.handle('cross-case-mine', (event, cases) => {
  return crossCaseMiner.mine(cases);
});

// Autonomous Research Mode IPC (Phase 75)
ipcMain.handle('research-generate', (event, context) => {
  return autoResearch.generate(context);
});
ipcMain.handle('research-update-state', (event, { id, state }) => {
  return autoResearch.updateState(id, state);
});
ipcMain.handle('research-review-packet', () => {
  return autoResearch.generateReviewPacket();
});

// Workspace Store IPC (Phase 76)
ipcMain.handle('ws-create', (event, { name, options }) => {
  return workspaceStore.createWorkspace(name, options);
});
ipcMain.handle('ws-list', () => {
  return workspaceStore.listWorkspaces();
});
ipcMain.handle('ws-add-member', (event, { wsId, member }) => {
  return workspaceStore.addMember(wsId, member);
});
ipcMain.handle('ws-assign-case', (event, { wsId, caseId, analystId }) => {
  return workspaceStore.assignCase(wsId, caseId, analystId);
});
ipcMain.handle('ws-activity-feed', (event, wsId) => {
  return workspaceStore.getActivityFeed(wsId);
});

// Trust Registry IPC (Phase 77)
ipcMain.handle('trust-add-source', (event, source) => {
  return trustRegistry.addSource(source);
});
ipcMain.handle('trust-verify', (event, sourceId) => {
  return trustRegistry.verifySource(sourceId);
});
ipcMain.handle('trust-log-exchange', (event, data) => {
  return trustRegistry.logExchange(data);
});
ipcMain.handle('trust-audit', () => {
  return trustRegistry.getExchangeAudit();
});

// Centrality Engine IPC (Phase 78)
ipcMain.handle('graph-centrality', (event, graph) => {
  return centralityEngine.score(graph);
});
ipcMain.handle('graph-bridges', (event, graph) => {
  return centralityEngine.detectBridges(graph);
});
ipcMain.handle('graph-rank-clusters', (event, graph) => {
  return centralityEngine.rankClusters(graph);
});
ipcMain.handle('graph-hot-nodes', (event, graph) => {
  return centralityEngine.scoreHotNodes(graph);
});

// Policy Engine IPC (Phase 79)
ipcMain.handle('policy-load', (event, rules) => {
  return policyEngine.loadPolicies(rules);
});
ipcMain.handle('policy-evaluate', (event, { context, actor }) => {
  return policyEngine.evaluate(context, actor);
});
ipcMain.handle('policy-check', (event, { action, context }) => {
  return policyEngine.isAllowed(action, context);
});
ipcMain.handle('policy-audit', () => {
  return policyEngine.getAuditLog();
});

// Deployment Profiles IPC (Phase 80)
ipcMain.handle('deploy-list', () => {
  return deploymentProfiles.listProfiles();
});
ipcMain.handle('deploy-activate', (event, name) => {
  return deploymentProfiles.activateProfile(name);
});
ipcMain.handle('deploy-compliance', (event, { action, context }) => {
  return deploymentProfiles.checkCompliance(action, context);
});
ipcMain.handle('deploy-quota', () => {
  return deploymentProfiles.getQuotaReport();
});

// Review Workflow IPC (Phase 81)
ipcMain.handle('review-create', (event, { caseId, reviewer, options }) => {
  return reviewWorkflow.createReview(caseId, reviewer, options);
});
ipcMain.handle('review-comment', (event, { reviewId, author, text }) => {
  return reviewWorkflow.comment(reviewId, author, text);
});
ipcMain.handle('review-decide', (event, { reviewId, decision, reason }) => {
  return reviewWorkflow.decide(reviewId, decision, reason);
});
ipcMain.handle('review-pending', () => {
  return reviewWorkflow.getPending();
});

// Redaction Engine IPC (Phase 82)
ipcMain.handle('redact-text', (event, { text, rules }) => {
  return redactionEngine.redact(text, { rules });
});
ipcMain.handle('redact-bundle', (event, bundle) => {
  return redactionEngine.redactBundle(bundle);
});

// Publication Pipeline IPC (Phase 83)
ipcMain.handle('pub-submit', (event, { report, author }) => {
  return publicationPipeline.submit(report, author);
});
ipcMain.handle('pub-transition', (event, { itemId, state, actor }) => {
  return publicationPipeline.transition(itemId, state, actor);
});
ipcMain.handle('pub-list', (event, state) => {
  return state ? publicationPipeline.getByState(state) : publicationPipeline.items;
});

// Model Reporter IPC (Phase 84)
ipcMain.handle('report-generate', (event, caseData) => {
  return modelReporter.generate(caseData);
});

// Deployment Orchestrator IPC (Phase 85)
ipcMain.handle('orchestrate-deploy', (event, { profile, environment }) => {
  return deploymentOrchestrator.deploy(profile, environment);
});
ipcMain.handle('orchestrate-rollback', (event, deploymentId) => {
  return deploymentOrchestrator.rollback(deploymentId);
});
ipcMain.handle('orchestrate-history', () => {
  return deploymentOrchestrator.getHistory();
});

// Timeline Engine IPC (Phase 86)
ipcMain.handle('timeline-reconstruct', (event, { caseId, events }) => {
  return timelineEngine.reconstruct(caseId, events);
});
ipcMain.handle('timeline-get', (event, caseId) => {
  return timelineEngine.getTimeline(caseId);
});

// Infrastructure Tracker IPC (Phase 87)
ipcMain.handle('infra-record', (event, { node, caseId, timestamp }) => {
  return infrastructureTracker.record(node, caseId, timestamp);
});
ipcMain.handle('infra-history', (event, nodeId) => {
  return infrastructureTracker.getHistory(nodeId);
});
ipcMain.handle('infra-migrations', () => {
  return infrastructureTracker.getMigrations();
});
ipcMain.handle('infra-drift', () => {
  return infrastructureTracker.getDriftAnalysis();
});

// Predictive Anomaly IPC (Phase 88)
ipcMain.handle('predict-risk', (event, { patternHistory, context }) => {
  return predictiveAnomaly.predict(patternHistory, context);
});
ipcMain.handle('predict-high-risk', () => {
  return predictiveAnomaly.getHighRiskPredictions();
});

// Forensic Simulator IPC (Phase 89)
ipcMain.handle('simulate-scenario', (event, { scenario, bundle }) => {
  return forensicSimulator.simulate(scenario, bundle);
});
ipcMain.handle('simulate-history', () => {
  return forensicSimulator.getHistory();
});

// Threat Reporter IPC (Phase 90)
ipcMain.handle('threat-generate', (event, caseData) => {
  return threatReporter.generate(caseData);
});
ipcMain.handle('threat-list', () => {
  return threatReporter.getReports();
});

// Global Graph IPC (Phase 91)
ipcMain.handle('global-graph-add-node', (event, { id, type, data, sourceCtx }) => {
  return globalGraph.addNode(id, type, data, sourceCtx);
});
ipcMain.handle('global-graph-add-edge', (event, { sourceId, targetId, relation, data, sourceCtx }) => {
  return globalGraph.addEdge(sourceId, targetId, relation, data, sourceCtx);
});
ipcMain.handle('global-graph-neighborhood', (event, { nodeId, depth }) => {
  return globalGraph.getNeighborhood(nodeId, depth);
});
ipcMain.handle('global-graph-lineage', (event, elementId) => {
  return globalGraph.getLineage(elementId);
});
ipcMain.handle('global-graph-summary', () => {
  return globalGraph.summary();
});

// Infra Attribution IPC (Phase 92)
ipcMain.handle('attrib-attribute', (event, context) => {
  return infraAttributionEngine.attribute(context);
});

// Adversary Fingerprinting IPC (Phase 93)
ipcMain.handle('advfp-fingerprint', (event, observation) => {
  return adversaryFingerprintEngine.fingerprint(observation);
});
ipcMain.handle('advfp-compare', (event, { fp1_label, fp2_label }) => {
  return adversaryFingerprintEngine.compare(fp1_label, fp2_label);
});
ipcMain.handle('advfp-group', () => {
  return adversaryFingerprintEngine.groupPatterns();
});

// Self-Healing Orchestrator IPC (Phase 94)
ipcMain.handle('heal-recover', (event, failureContext) => {
  return selfHealingOrchestrator.recover(failureContext);
});
ipcMain.handle('heal-audit', () => {
  return selfHealingOrchestrator.getAuditLog();
});

// Autonomous Discovery IPC (Phase 95)
ipcMain.handle('discovery-run', (event, context) => {
  return autonomousDiscoveryEngine.discover(context);
});
ipcMain.handle('discovery-history', () => {
  return autonomousDiscoveryEngine.getHistory();
});

// Endgame Command Layer IPC (Phases 96-100)
ipcMain.handle('endgame-command', (event, { command, payload }) => {
  return strategicCommandEngine.executeCommand(command, payload);
});
ipcMain.handle('endgame-history', () => {
  return strategicCommandEngine.getCommandHistory();
});
ipcMain.handle('endgame-replay-get', (event, caseId) => {
  return missionReplayEngine.getReplay(caseId);
});

// Expansion APIs
ipcMain.handle('exp-memory-record', (event, { caseId, analystId, suggestionId, decision, notes }) => {
  return analystMemoryLayer.recordDecision(caseId, analystId, suggestionId, decision, notes);
});
ipcMain.handle('exp-memory-annotate', (event, { caseId, analystId, targetId, text }) => {
  return analystMemoryLayer.annotate(caseId, analystId, targetId, text);
});
ipcMain.handle('exp-heatmap-generate', (event, graphContext) => {
  return threatHeatmapEngine.generateHeatmap(graphContext);
});
ipcMain.handle('exp-prov-tag', (event, { signalId, source, dataset }) => {
  return dataProvenanceSystem.tagSignal(signalId, source, dataset);
});
ipcMain.handle('exp-prov-step', (event, { signalId, stepName, weight }) => {
  return dataProvenanceSystem.appendStep(signalId, stepName, weight);
});
ipcMain.handle('exp-explain', (event, { type, context }) => {
  return explainabilityLayer.explain(type, context);
});

// Ultimate Evolution APIs (Phases 101-150)
ipcMain.handle('adv-narrative-track', (event, graphSequence) => {
  return narrativePropagationEngine.trackPropagation(graphSequence);
});
ipcMain.handle('adv-operator-model', (event, { operatorId, telemetryLogs }) => {
  return operatorBehaviorEngine.modelBehavior(operatorId, telemetryLogs);
});
ipcMain.handle('adv-operator-get', (event, operatorId) => {
  return operatorBehaviorEngine.getProfile(operatorId);
});
ipcMain.handle('adv-predict-future', (event, { graphTrends, behaviorProfile }) => {
  return advPredictiveEngine.forecast(graphTrends, behaviorProfile);
});
ipcMain.handle('adv-assistant-synthesize', (event, { graphSequence, telemetryLogs }) => {
  return advAssistantEngine.synthesize(graphSequence, telemetryLogs);
});

function updateIntelligenceGraph(bundle, caseId) {
  const fingerprint = FingerprintEngine.generateFingerprint(bundle);
  bundle.fingerprint_data = fingerprint; // Tag bundle with fingerprint

  indexManager.indexBundle(bundle); // Index for HyperQuery

  const bid = bundle.fingerprint || bundle.path;

  // Add Bundle Node
  intelGraph.addNode('BUNDLE', bid, {
    caseId,
    path: bundle.path,
    fingerprint: fingerprint
  });

  // Add Infrastructure Nodes and Edges
  if (bundle.cdn) {
    intelGraph.addNode('CDN', bundle.cdn);
    intelGraph.addEdge(bid, bundle.cdn, 'SERVED_BY');
  }
  if (bundle.protocol) {
    intelGraph.addNode('PROTOCOL', bundle.protocol);
    intelGraph.addEdge(bid, bundle.protocol, 'USES_PROTOCOL');
  }
  if (bundle.playerSignature) {
    intelGraph.addNode('PLAYER', bundle.playerSignature);
    intelGraph.addEdge(bid, bundle.playerSignature, 'MANAGED_BY');
  }
}

const CASES_DIR = path.join(RUNTIME_DIR, 'cases');
const caseStore = new CaseStore(CASES_DIR);

ipcMain.handle('case-list', () => caseStore.listCases());
ipcMain.handle('case-create', (event, title) => caseStore.createCase(title));
ipcMain.handle('case-load', (event, caseId) => caseStore.loadCase(caseId));
ipcMain.handle('case-save', (event, caseData) => {
  caseStore.saveCase(caseData);
  return { success: true };
});
ipcMain.handle('case-delete', (event, caseId) => caseStore.deleteCase(caseId));

ipcMain.handle('case-attach-bundle', (event, { caseId, bundlePath }) => {
  const fullCase = caseStore.loadCase(caseId);
  if (!fullCase) throw new Error("Case not found");

  // Update bundle with intelligence data before attaching
  const bundleInfo = {
    path: bundlePath,
    // Add dummy data if bundle file doesn't exist yet for testing, 
    // in real flow this would be parsed from the .hyper file
    cdn: 'MOCK_CDN',
    protocol: 'MOCK_PROTO',
    playerSignature: 'MOCK_PLAYER'
  };

  updateIntelligenceGraph(bundleInfo, caseId);

  const updated = BundleAttachment.attachBundle(fullCase, bundlePath);
  updated.bundles[updated.bundles.length - 1].fingerprint_data = bundleInfo.fingerprint_data;

  caseStore.saveCase(updated);
  return updated;
});

ipcMain.handle('case-add-note', (event, { caseId, content }) => {
  const caseData = caseStore.loadCase(caseId);
  if (!caseData) throw new Error("Case not found");
  const updated = CaseNotes.addNote(caseData, content);
  caseStore.saveCase(updated);
  return updated;
});

ipcMain.handle('case-export-notes', async (event, { caseId, filename }) => {
  const caseData = caseStore.loadCase(caseId);
  if (!caseData) throw new Error("Case not found");

  const { filePath } = await dialog.showSaveDialog({
    title: 'Export Case Notes',
    defaultPath: path.join(app.getPath('downloads'), filename || 'notes.md'),
    filters: [{ name: 'Markdown Files', extensions: ['md'] }]
  });

  if (filePath) {
    CaseNotes.exportToMarkdown(caseData, filePath);
    return { success: true, filePath };
  }
  return { success: false, reason: 'Export cancelled' };
});

ipcMain.handle('case-add-finding', (event, { caseId, findingData }) => {
  const caseData = caseStore.loadCase(caseId);
  if (!caseData) throw new Error("Case not found");
  const updated = FindingsRegistry.addFinding(caseData, findingData);
  caseStore.saveCase(updated);
  return updated;
});

ipcMain.handle('case-update-finding', (event, { caseId, findingId, updates }) => {
  const caseData = caseStore.loadCase(caseId);
  if (!caseData) throw new Error("Case not found");
  const updated = FindingsRegistry.updateFinding(caseData, findingId, updates);
  caseStore.saveCase(updated);
  return updated;
});

ipcMain.handle('case-compare', (event, { bundlePathA, bundlePathB }) => {
  const report = CaseComparator.compare(bundlePathA, bundlePathB);
  const markdown = CaseComparator.generateMarkdown(report);
  return { report, markdown };
});

// IPC Endpoints
ipcMain.handle('automation-set-mode', (event, mode) => {
  clipboardWatcher.setMode(mode);
  return true;
});

function parseAutomationTarget(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;
  let host = 'raw-input';
  try {
    host = new URL(text).hostname || 'raw-input';
  } catch (e) {
    host = 'raw-input';
  }
  return { url: text, host };
}

ipcMain.handle('automation-queue-add', (event, payload) => {
  const targets = Array.isArray(payload?.targets) ? payload.targets : [];
  const source = payload?.source || 'operator';
  const manualReview = Boolean(payload?.manualReview);
  const caseId = payload?.caseId || null;
  const caseTitle = payload?.caseTitle || null;

  const prepared = targets
    .map((t) => parseAutomationTarget(t))
    .filter(Boolean)
    .map((t) => ({ ...t, source, manualReview, caseId, caseTitle }));

  const { added, skipped } = decodeQueue.enqueueMany(prepared, { source, manualReview, caseId, caseTitle });
  return {
    success: true,
    added,
    skipped,
    queue: decodeQueue.getQueue(),
    metrics: decodeQueue.getMetrics()
  };
});

ipcMain.handle('automation-queue-action', (event, payload) => {
  const id = payload?.id;
  const action = String(payload?.action || '').toLowerCase();
  const reason = payload?.reason ? String(payload.reason) : null;
  if (!id || !action) return { success: false, reason: 'Missing queue action payload' };

  let success = false;
  if (action === 'pause') success = decodeQueue.pause(id, 'operator');
  if (action === 'resume') success = decodeQueue.resume(id, 'operator');
  if (action === 'cancel') success = decodeQueue.cancel(id, reason || 'Cancelled by operator.', 'operator');
  if (action === 'requeue') success = decodeQueue.requeue(id, 'operator', reason || 'Requeued by operator.');
  if (action === 'manual-review') success = decodeQueue.markManualReview(id, reason || 'Moved to manual review by operator.', 'operator');

  return {
    success,
    queue: decodeQueue.getQueue(),
    history: decodeQueue.getHistory(20),
    metrics: decodeQueue.getMetrics(),
    activeJob: decodeScheduler.getActiveJob()
  };
});

ipcMain.handle('automation-queue-bind-case', (event, payload) => {
  const id = payload?.id;
  const caseId = payload?.caseId || null;
  const caseTitle = payload?.caseTitle || null;
  if (!id || !caseId) return { success: false, reason: 'Missing id or caseId' };
  return {
    success: decodeQueue.attachCase(id, caseId, caseTitle, 'operator'),
    queue: decodeQueue.getQueue(),
    history: decodeQueue.getHistory(20)
  };
});

ipcMain.handle('automation-queue-clear-history', () => {
  decodeQueue.clearHistory();
  return { success: true };
});

ipcMain.handle('automation-get-state', () => {
  return {
    mode: clipboardWatcher.mode,
    queue: decodeQueue.getQueue(),
    history: decodeQueue.getHistory(20),
    metrics: decodeQueue.getMetrics(),
    activeJob: decodeScheduler.getActiveJob()
  };
});

// Periodic State Persistence
const automationEventsLog = [];
clipboardWatcher.setEventHandler((type, data) => {
  log.info(`AUTOMATION_${type}`, data);
  automationEventsLog.unshift({ type, data, ts: Date.now() });
  if (automationEventsLog.length > 500) automationEventsLog.pop();

  BrowserWindow.getAllWindows().forEach(w => w.webContents.send('automation-event', { type, data }));
});

function persistAutomationState() {
  try {
    const RUNTIME_DIR = path.join(app.getPath('userData'), 'HyperSnatch', 'runtime');
    const autoPath = path.join(RUNTIME_DIR, 'automation');
    if (!fs.existsSync(autoPath)) fs.mkdirSync(autoPath, { recursive: true });

    fs.writeFileSync(path.join(autoPath, 'clipboard_events.json'), JSON.stringify(automationEventsLog, null, 2));
    fs.writeFileSync(path.join(autoPath, 'decode_queue.json'), JSON.stringify(decodeQueue.getQueue(), null, 2));
    fs.writeFileSync(path.join(autoPath, 'decode_history.json'), JSON.stringify(decodeQueue.getHistory(100), null, 2));
  } catch (e) { }
}

setInterval(persistAutomationState, 5000);

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

ipcMain.handle('get-forensic-snapshot', async (event, snapshotPath) => {
  try {
    let targetDir = snapshotPath;
    if (!targetDir) {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Select Target Evidence Directory',
        properties: ['openDirectory'],
        defaultPath: path.join(__dirname, '..', 'tests', 'evidence')
      });
      if (canceled || filePaths.length === 0) {
        return { success: false, error: 'No directory selected' };
      }
      targetDir = filePaths[0];
    }

    const harPath = path.join(targetDir, 'network.har');
    const domPath = path.join(targetDir, 'dom_snapshot.html');
    const configPath = path.join(targetDir, 'player_config.json');
    const tracePath = path.join(targetDir, 'stream_trace.json');

    const result = { success: true, targetDir, artifacts: {} };
    if (fs.existsSync(harPath)) result.artifacts.networkHar = JSON.parse(fs.readFileSync(harPath, 'utf8'));
    if (fs.existsSync(domPath)) result.artifacts.domSnapshot = fs.readFileSync(domPath, 'utf8');
    if (fs.existsSync(configPath)) result.artifacts.playerConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (fs.existsSync(tracePath)) result.artifacts.streamTrace = JSON.parse(fs.readFileSync(tracePath, 'utf8'));

    return result;
  } catch (error) {
    log.error('FORENSIC_SNAPSHOT_ERROR', { error: error.message });
    return { success: false, error: error.message };
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
// Security: Prevent multiple instances (must be before app.whenReady)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

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
          "script-src 'self'; " + // Renderer JS is packaged (ui/hypersnatch-ui.js); no inline script allowed
          "style-src 'self' 'unsafe-inline'; " + // Inline styles still used by UI components (separate hardening lane)
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
  if (!gotTheLock) {
    logSecurityEvent('SINGLE_INSTANCE_ENFORCED');
    app.quit();
    return;
  }

  // Create main window with hardened security
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 800,
    center: true,           // Center on launch so the front door is fully visible
    resizable: true,
    show: true,             // Show immediately — ready-to-show unreliable when renderer crashes in sandbox
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
  logSecurityEvent('WINDOW_CREATED', { securityConfig: SECURITY_CONFIG, rendererPath: getRendererPath() });

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
    logSecurityEvent('WINDOW_SHOWN');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    logSecurityEvent('RENDERER_LOAD_FAILED', { errorCode, errorDescription });
  });

  // Safety: force focus after load regardless of renderer state
  setTimeout(() => { if (!mainWindow.isDestroyed()) mainWindow.focus(); }, 1000);

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
