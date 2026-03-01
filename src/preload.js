// ==================== ELECTRON PRELOAD SCRIPT ====================
"use strict";

const { contextBridge, ipcRenderer, clipboard } = require('electron');

// ==================== SECURITY: IPC ALLOWLIST ====================
// Strictly limited to Vanguard Forensic Utilities
const ALLOWED_IPC_CHANNELS = new Set([
  'get-app-info',
  'open-logs-folder',
  'open-evidence-folder',
  'get-security-events',
  'clear-security-events',
  'validate-url',
  'import-evidence',
  'log-message',
  'export-security-report',
  'validate-license',
  'accept-legal-disclaimer',
  'get-hardware-status',
  'authenticate-license',
  'window-minimize',
  'window-maximize',
  'window-close',
  'window-fullscreen',
  'smart-decode-run',
  'smart-decode-sign-session',
  'smart-decode-verify-session'
]);

function validateIPCChannel(channel) {
  if (!ALLOWED_IPC_CHANNELS.has(channel)) {
    throw new Error(`Security Violation: Disallowed IPC channel '${channel}'`);
  }
}

// ==================== EXPOSED API ====================
const electronAPI = {
  getAppInfo: () => {
    validateIPCChannel('get-app-info');
    return ipcRenderer.invoke('get-app-info');
  },

  acceptLegalDisclaimer: () => {
    validateIPCChannel('accept-legal-disclaimer');
    return ipcRenderer.invoke('accept-legal-disclaimer');
  },

  openLogsFolder: () => {
    validateIPCChannel('open-logs-folder');
    return ipcRenderer.invoke('open-logs-folder');
  },

  openEvidenceFolder: () => {
    validateIPCChannel('open-evidence-folder');
    return ipcRenderer.invoke('open-evidence-folder');
  },

  getSecurityEvents: () => {
    validateIPCChannel('get-security-events');
    return ipcRenderer.invoke('get-security-events');
  },

  clearSecurityEvents: () => {
    validateIPCChannel('clear-security-events');
    return ipcRenderer.invoke('clear-security-events');
  },

  importEvidence: (evidenceData) => {
    validateIPCChannel('import-evidence');
    return ipcRenderer.invoke('import-evidence', evidenceData);
  },

  validateUrl: (url) => {
    validateIPCChannel('validate-url');
    return ipcRenderer.invoke('validate-url', url);
  },

  logMessage: (level, message, meta = {}) => {
    validateIPCChannel('log-message');
    ipcRenderer.send('log-message', { level, message, meta });
  },

  copyToClipboard: (text) => {
    try {
      clipboard.writeText(text);
      ipcRenderer.send('log-message', { level: 'INFO', message: 'CLIPBOARD_WRITE_SUCCESS' });
      return true;
    } catch (err) {
      ipcRenderer.send('log-message', { level: 'ERROR', message: 'CLIPBOARD_WRITE_FAILURE', meta: { error: err.message } });
      return false;
    }
  },

  exportSecurityReport: (data) => {
    validateIPCChannel('export-security-report');
    return ipcRenderer.invoke('export-security-report', data);
  },

  validateLicense: () => {
    validateIPCChannel('validate-license');
    return ipcRenderer.invoke('validate-license');
  }
};

// ==================== INITIALIZATION ====================
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

contextBridge.exposeInMainWorld('smartDecode', {
  run: async (input, options) => {
    validateIPCChannel('smart-decode-run');
    return ipcRenderer.invoke('smart-decode-run', { input, options });
  },
  signSession: async (sessionState, systemInfo) => {
    validateIPCChannel('smart-decode-sign-session');
    return ipcRenderer.invoke('smart-decode-sign-session', { sessionState, systemInfo });
  },
  verifySession: async (bundle) => {
    validateIPCChannel('smart-decode-verify-session');
    return ipcRenderer.invoke('smart-decode-verify-session', bundle);
  }
});
