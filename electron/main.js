const { app, BrowserWindow, ipcMain, dialog, shell, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Security Configuration
const SECURITY_CONFIG = {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  enableRemoteModule: false,
  webSecurity: true,
  allowRunningInsecureContent: false,
  experimentalFeatures: false,
  plugins: false
};

// Global state
let mainWindow = null;
let isReleaseMode = false;
let isAirgapMode = true;
let manifestVerified = false;

class HyperSnatchPlatform {
  constructor() {
    this.bootStartTime = Date.now();
    this.evidenceLog = [];
    this.buildInfo = {
      APP_VERSION: "1.0.0-beta",
      ENGINE: "RES-CORE-01",
      POLICY: "CASH-SHIELD-01",
      RUNTIME: "ELECTRON AIRGAPPED",
      BUILD: "HS-NX-PLATFORM-01"
    };
  }

  async verifyManifest() {
    try {
      const manifestPath = path.join(__dirname, '..', 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        throw new Error('Manifest file not found');
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Verify build ID matches
      if (manifest.buildId !== this.buildInfo.BUILD) {
        throw new Error('Build ID mismatch');
      }

      // Verify file hashes
      for (const [file, expectedHash] of Object.entries(manifest.fileHashes)) {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
          const fileBuffer = fs.readFileSync(filePath);
          const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
          if (actualHash !== expectedHash) {
            throw new Error(`Hash mismatch for ${file}`);
          }
        }
      }

      manifestVerified = true;
      this.logEvidence('[BOOT] Manifest verified successfully');
      return true;
    } catch (error) {
      this.logEvidence(`[SECURITY] Manifest verification failed: ${error.message}`);
      this.logEvidence('[ABORT] Runtime locked');
      return false;
    }
  }

  logEvidence(entry) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${entry}`;
    this.evidenceLog.push(logEntry);
    console.log(logEntry);
    
    if (mainWindow) {
      mainWindow.webContents.send('evidence-log', logEntry);
    }
  }

  createWindow() {
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 700,
      webPreferences: {
        ...SECURITY_CONFIG,
        preload: path.join(__dirname, 'preload.js'),
        sandbox: true
      },
      icon: path.join(__dirname, '..', 'assets', 'icon.png'),
      show: false,
      titleBarStyle: 'default',
      autoHideMenuBar: true
    });

    // Block external navigation
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      if (parsedUrl.origin !== 'file://') {
        event.preventDefault();
        this.logEvidence(`[SECURITY] Blocked external navigation to: ${navigationUrl}`);
      }
    });

    // Block new window creation
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      this.logEvidence(`[SECURITY] Blocked popup window to: ${url}`);
      return { action: 'deny' };
    });

    // Load the application
    const indexPath = path.join(__dirname, '..', 'hypersnatch.html');
    mainWindow.loadFile(indexPath);

    // Show window after boot sequence
    setTimeout(() => {
      mainWindow.show();
      this.logEvidence('[BOOT] HyperSnatch Platform ready');
    }, 2000);

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  async start() {
    this.logEvidence('[BOOT] Starting HyperSnatch Platform...');
    
    // Verify manifest first
    const manifestValid = await this.verifyManifest();
    if (!manifestValid) {
      // Show error dialog and exit
      dialog.showErrorBox(
        'Security Violation',
        'Manifest verification failed. Runtime locked.\n\nPlease reinstall HyperSnatch Platform.'
      );
      app.quit();
      return;
    }

    this.logEvidence('[BOOT] Loading resurrection core');
    this.logEvidence('[BOOT] Enforcing Cash Policy Shield');
    this.logEvidence('[BOOT] Airgapped profile active');
    
    this.createWindow();
  }
}

// Initialize platform
const platform = new HyperSnatchPlatform();

// App event handlers
app.whenReady().then(() => {
  platform.start();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    platform.createWindow();
  }
});

// Security: Block all remote requests
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
});

// IPC handlers
ipcMain.handle('read-clipboard', () => {
  return clipboard.readText();
});

ipcMain.handle('write-clipboard', (event, text) => {
  clipboard.writeText(text);
  return true;
});

ipcMain.handle('open-external', (event, path) => {
  if (isAirgapMode) {
    throw new Error('Airgapped Mode: External access blocked');
  }
  shell.openExternal(path);
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    platform.logEvidence(`[FILE] Read: ${filePath}`);
    return data;
  } catch (error) {
    platform.logEvidence(`[ERROR] Failed to read file: ${filePath}`);
    throw error;
  }
});

ipcMain.handle('save-file', async (event, filePath, data) => {
  try {
    fs.writeFileSync(filePath, data, 'utf8');
    platform.logEvidence(`[FILE] Saved: ${filePath}`);
    return true;
  } catch (error) {
    platform.logEvidence(`[ERROR] Failed to save file: ${filePath}`);
    throw error;
  }
});

ipcMain.handle('get-app-version', () => {
  return platform.buildInfo;
});

ipcMain.handle('get-build-info', () => {
  return platform.buildInfo;
});

ipcMain.handle('get-evidence-log', () => {
  return platform.evidenceLog;
});

ipcMain.handle('set-release-mode', (event, enabled) => {
  isReleaseMode = enabled;
  platform.logEvidence(`[CONFIG] Release mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
  if (mainWindow) {
    mainWindow.webContents.send('release-mode-changed', enabled);
  }
  return true;
});

ipcMain.handle('set-airgap-mode', (event, enabled) => {
  isAirgapMode = enabled;
  platform.logEvidence(`[CONFIG] Airgap mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
  if (mainWindow) {
    mainWindow.webContents.send('airgap-mode-changed', enabled);
  }
  return true;
});

ipcMain.handle('import-artifact', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    platform.logEvidence(`[IMPORT] Artifact imported: ${filePath}`);
    return data;
  } catch (error) {
    platform.logEvidence(`[ERROR] Failed to import artifact: ${filePath}`);
    throw error;
  }
});

// Security: Prevent certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault();
  callback(false);
});
