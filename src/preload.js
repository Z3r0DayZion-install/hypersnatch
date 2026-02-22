// ==================== ELECTRON PRELOAD SCRIPT ====================
"use strict";

const { contextBridge, ipcRenderer, clipboard } = require('electron');

// ==================== SECURITY: IPC ALLOWLIST ====================
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
  'validate-license'
]);

// ==================== SECURE CONTEXT BRIDGE ====================
function validateIPCChannel(channel) {
  if (!ALLOWED_IPC_CHANNELS.has(channel)) {
    throw new Error(`IPC channel not allowed: ${channel}`);
  }
}

// ==================== EXPOSED API ====================
window.electronAPI = {
  // App information
  getAppInfo: () => {
    validateIPCChannel('get-app-info');
    return ipcRenderer.sendSync('get-app-info');
  },

  // File system access (controlled)
  openLogsFolder: () => {
    validateIPCChannel('open-logs-folder');
    return ipcRenderer.sendSync('open-logs-folder');
  },

  openEvidenceFolder: () => {
    validateIPCChannel('open-evidence-folder');
    return ipcRenderer.sendSync('open-evidence-folder');
  },

  getSecurityEvents: () => {
    validateIPCChannel('get-security-events');
    return ipcRenderer.sendSync('get-security-events');
  },

  clearSecurityEvents: () => {
    validateIPCChannel('clear-security-events');
    return ipcRenderer.sendSync('clear-security-events');
  },

  // Evidence import (controlled)
  importEvidence: (evidenceData) => {
    validateIPCChannel('import-evidence');
    return new Promise((resolve, reject) => {
      try {
        const result = ipcRenderer.sendSync('import-evidence', evidenceData);
        if (result.success) {
          resolve(result);
        } else {
          reject(new Error(result.error));
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  // URL validation (controlled)
  validateUrl: (url) => {
    validateIPCChannel('validate-url');
    return new Promise((resolve, reject) => {
      try {
        const result = ipcRenderer.sendSync('validate-url', url);
        if (result.success) {
          resolve(result);
        } else {
          reject(new Error(result.error));
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  // Logging (controlled)
  logMessage: (level, message, meta = {}) => {
    validateIPCChannel('log-message');
    try {
      ipcRenderer.send('log-message', { level, message, meta });
    } catch (error) {
      // Avoid infinite loops
    }
  },

  // Clipboard operations with logging
  copyToClipboard: (text) => {
    try {
      clipboard.writeText(text);
      this.logMessage('INFO', 'CLIPBOARD_WRITE_SUCCESS');
      return true;
    } catch (err) {
      this.logMessage('ERROR', 'CLIPBOARD_WRITE_FAILURE', { error: err.message });
      return false;
    }
  },

  exportSecurityReport: () => {
    validateIPCChannel('export-security-report');
    return ipcRenderer.invoke('export-security-report');
  },

  validateLicense: () => {
    validateIPCChannel('validate-license');
    return ipcRenderer.invoke('validate-license');
  }
};

// ==================== SECURITY: CONSOLE INTERCEPTION ====================
// Log all renderer console messages for security monitoring
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error
};

console.log = (...args) => {
  originalConsole.log('[RENDERER]', ...args);
  // Send to main process for security logging
  if (args.length > 0 && typeof args[0] === 'string') {
    const message = args[0];
    if (message.includes('ERROR') || message.includes('CRASH') || message.includes('SECURITY')) {
      try {
        validateIPCChannel('log-message');
        ipcRenderer.send('log-message', {
          level: 'error',
          message: message,
          meta: { source: 'renderer_console', timestamp: new Date().toISOString() }
        });
      } catch (e) {
        // Avoid infinite loops
      }
    }
  }
  originalConsole.log(...args);
};

console.warn = (...args) => {
  originalConsole.warn('[RENDERER]', ...args);
  originalConsole.log(...args);
};

console.error = (...args) => {
  originalConsole.error('[RENDERER]', ...args);
  originalConsole.log(...args);
};

const SmartDecode = require('./core/smartdecode');

// Extraneous block removed

// ... (existing console interception)

// ==================== INITIALIZATION ====================
// Expose the secure API to the renderer
contextBridge.exposeInMainWorld('electronAPI', window.electronAPI);

// Expose SmartDecode 2.0 Engine
contextBridge.exposeInMainWorld('smartDecode', {
  run: async (input) => {
    try {
      return await SmartDecode.run(input);
    } catch (err) {
      console.error('SmartDecode Execution Error:', err);
      return null;
    }
  },
  signSession: async (sessionState, systemInfo) => {
    try {
      const AuditChain = require('./core/smartdecode/audit-chain');
      return await AuditChain.signSession(sessionState, systemInfo);
    } catch (err) {
      console.error('AuditChain Signing Error:', err);
      return null;
    }
  }
});

// Security: Prevent access to Node APIs
// ...
