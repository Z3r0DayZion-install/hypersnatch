// ==================== ELECTRON PRELOAD SCRIPT ====================
"use strict";

const { contextBridge, ipcRenderer } = require('electron');

// ==================== SECURITY: IPC ALLOWLIST ====================
const ALLOWED_IPC_CHANNELS = [
  'get-app-info',
  'open-logs-folder',
  'open-evidence-folder', 
  'get-security-events',
  'clear-security-events',
  'validate-url',
  'import-evidence'
];

// ==================== SECURE CONTEXT BRIDGE ====================
function validateIPCChannel(channel) {
  if (!ALLOWED_IPC_CHANNELS.includes(channel)) {
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
        ipcRenderer.send('console-security-event', {
          level: 'error',
          message: message,
          timestamp: new Date().toISOString()
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

// ==================== INITIALIZATION ====================
// Expose the secure API to the renderer
contextBridge.exposeInMainWorld('electronAPI', window.electronAPI);

// Security: Prevent access to Node APIs
delete window.require;
delete window.exports;
delete window.process;

// Security: Remove dangerous globals
delete window.eval;
delete window.Function;
delete window.setTimeout;

console.log('HyperSnatch preload script loaded securely');
