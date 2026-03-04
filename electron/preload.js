const { contextBridge, ipcRenderer } = require('electron');

// Secure bridge - expose only controlled APIs to renderer
contextBridge.exposeInMainWorld('hyper', {
  // Clipboard operations
  readClipboard: () => ipcRenderer.invoke('read-clipboard'),
  writeClipboard: (text) => ipcRenderer.invoke('write-clipboard', text),
  
  // File operations
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  saveFile: (filePath, data) => ipcRenderer.invoke('save-file', filePath, data),
  
  // External access (controlled)
  openExternal: (path) => ipcRenderer.invoke('open-external', path),
  
  // Application info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getBuildInfo: () => ipcRenderer.invoke('get-build-info'),
  
  // Evidence logging
  getEvidenceLog: () => ipcRenderer.invoke('get-evidence-log'),
  
  // Configuration
  setReleaseMode: (enabled) => ipcRenderer.invoke('set-release-mode', enabled),
  setAirgapMode: (enabled) => ipcRenderer.invoke('set-airgap-mode', enabled),
  
  // Artifact import
  importArtifact: (filePath) => ipcRenderer.invoke('import-artifact', filePath),
  
  // Event listeners
  onEvidenceLog: (callback) => ipcRenderer.on('evidence-log', callback),
  onReleaseModeChanged: (callback) => ipcRenderer.on('release-mode-changed', callback),
  onAirgapModeChanged: (callback) => ipcRenderer.on('airgap-mode-changed', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Runtime Guard Layer - Override dangerous APIs when airgapped
let isAirgapMode = true;

// Store original API references BEFORE overriding so we can restore them
const _originalFetch = window.fetch;
const _originalXHR = window.XMLHttpRequest;
const _originalWebSocket = window.WebSocket;
const _originalEventSource = window.EventSource;
const _originalSendBeacon = navigator.sendBeacon ? navigator.sendBeacon.bind(navigator) : null;

// Listen for airgap mode changes
ipcRenderer.on('airgap-mode-changed', (event, enabled) => {
  isAirgapMode = enabled;
  enforceAirgapMode();
});

function enforceAirgapMode() {
  if (isAirgapMode) {
    // Override fetch
    window.fetch = function() {
      throw new Error('Airgapped Mode: Network blocked.');
    };
    
    // Override XMLHttpRequest
    window.XMLHttpRequest = function() {
      throw new Error('Airgapped Mode: Network blocked.');
    };
    
    // Override WebSocket
    window.WebSocket = function() {
      throw new Error('Airgapped Mode: Network blocked.');
    };
    
    // Override EventSource
    window.EventSource = function() {
      throw new Error('Airgapped Mode: Network blocked.');
    };
    
    // Override navigator.sendBeacon
    if (navigator.sendBeacon) {
      navigator.sendBeacon = function() {
        throw new Error('Airgapped Mode: Network blocked.');
      };
    }
    
    console.log('[AIRGAP] Network access disabled');
  } else {
    // Restore original APIs from stored references
    window.fetch = _originalFetch;
    window.XMLHttpRequest = _originalXHR;
    window.WebSocket = _originalWebSocket;
    window.EventSource = _originalEventSource;
    if (_originalSendBeacon) {
      navigator.sendBeacon = _originalSendBeacon;
    }
    console.log('[AIRGAP] Network access restored');
  }
}

// Initialize airgap mode
enforceAirgapMode();

// Boot sequence animation
document.addEventListener('DOMContentLoaded', () => {
  const bootScreen = document.createElement('div');
  bootScreen.id = 'boot-screen';
  bootScreen.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #0b1116;
    color: #13d0a6;
    font-family: 'Segoe UI', monospace;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    font-size: 14px;
    line-height: 1.6;
  `;
  
  bootScreen.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 24px; font-weight: 600; margin-bottom: 20px; color: #13d0a6;">
        HYPER SNATCH Platform
      </div>
      <div style="font-size: 12px; color: #8ea0b1; margin-bottom: 30px;">
        Link Resurrection Engine Platform
      </div>
      <div id="boot-log" style="text-align: left; max-width: 400px; margin: 0 auto;">
        <div>[BOOT] Verifying manifest...</div>
        <div>[BOOT] Loading resurrection core...</div>
        <div>[BOOT] Enforcing Cash Policy Shield...</div>
        <div>[BOOT] Airgapped profile active...</div>
        <div>[BOOT] Ready</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(bootScreen);
  
  // Remove boot screen after 2 seconds
  setTimeout(() => {
    if (bootScreen.parentNode) {
      bootScreen.parentNode.removeChild(bootScreen);
    }
  }, 2000);
});

// Evidence log listener
ipcRenderer.on('evidence-log', (event, logEntry) => {
  // Forward to renderer if it has evidence log handling
  if (window.handleEvidenceLog) {
    window.handleEvidenceLog(logEntry);
  }
});

console.log('[PRELOAD] HyperSnatch Platform bridge initialized');
