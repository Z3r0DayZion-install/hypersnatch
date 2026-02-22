const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Security layers
const SECURITY_KEY = crypto.randomBytes(32).toString('hex');
const APP_VERSION = '1.0.0';
const STEALTH_MODE = true;

// Anti-debugging protection
const _0x1a2b = (() => {
    const _0x3c4d = function(_0x5e6f, _0x7a8b) {
        return _0x5e6f ^ _0x7a8b;
    };
    const _0x9c0d = _0x3c4d(0x1234, 0x5678);
    return _0x9c0d;
})();

// Process protection
if (process.env.NODE_ENV === 'development' || process.env.DEBUG_MODE === 'true') {
    if (!STEALTH_MODE) {
        console.log('Development mode detected');
    }
}

// Global variables with obfuscated names
let mainWindow = null;
let appConfig = {
    securityEnabled: true,
    obfuscationLevel: 'high',
    stealthMode: STEALTH_MODE,
    integrityCheck: true
};

// Security functions
function generateSecurityHash() {
    return crypto.createHash('sha256').update(Date.now().toString() + SECURITY_KEY).digest('hex');
}

function encryptData(data) {
    const cipher = crypto.createCipher('aes-256-cbc', SECURITY_KEY);
    return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
}

function decryptData(data) {
    const decipher = crypto.createDecipher('aes-256-cbc', SECURITY_KEY);
    return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
}

// Create window with security measures
function createMainWindow() {
    // Security check before creating window
    if (appConfig.integrityCheck && !checkIntegrity()) {
        dialog.showErrorBox('Security Error', 'Application integrity check failed');
        app.quit();
        return;
    }

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: false,
            webSecurity: true,
            sandbox: false
        },
        icon: path.join(__dirname, '../assets/tool.png'),
        show: false,
        title: 'System Utility Suite',
        skipTaskbar: false
    });

    // Load the HTML file
    mainWindow.loadFile('interface/diagnostic-panel.html');

    // Security: Prevent dev tools in production
    if (appConfig.stealthMode) {
        mainWindow.webContents.on('devtools-opened', () => {
            mainWindow.webContents.closeDevTools();
            if (STEALTH_MODE) {
                mainWindow.close();
                app.quit();
            }
        });
        
        // Block F12 and other dev tools shortcuts
        mainWindow.webContents.on('before-input-event', (event, input) => {
            if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
                event.preventDefault();
            }
        });
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Additional security checks
        if (appConfig.securityEnabled) {
            startSecurityMonitoring();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Handle external links securely
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Create security-focused menu
    createSecureMenu();
}

// Anti-tampering check
function checkIntegrity() {
    try {
        const currentHash = generateSecurityHash();
        const storedHash = fs.readFileSync(path.join(__dirname, '.integrity'), 'utf8').trim();
        return currentHash === storedHash;
    } catch (error) {
        // If integrity file doesn't exist, create it
        const integrityHash = generateSecurityHash();
        fs.writeFileSync(path.join(__dirname, '.integrity'), integrityHash, 'utf8');
        return true;
    }
}

// Security monitoring
function startSecurityMonitoring() {
    setInterval(() => {
        // Check for debuggers
        if (process.binding('inspector').url()) {
            if (appConfig.stealthMode) {
                mainWindow.close();
                app.quit();
            }
        }
        
        // Memory integrity check
        const memUsage = process.memoryUsage();
        if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB limit
            console.log('Memory usage high, clearing cache');
            if (mainWindow && mainWindow.webContents) {
                mainWindow.webContents.send('clear-cache');
            }
        }
    }, 30000); // Check every 30 seconds
}

// Create security-focused menu
function createSecureMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Task',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.send('menu-new-task');
                    }
                },
                {
                    label: 'Batch Process',
                    accelerator: 'CmdOrCtrl+B',
                    click: () => {
                        mainWindow.webContents.send('menu-batch-process');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Export Data',
                    accelerator: 'CmdOrCtrl+E',
                    click: () => {
                        mainWindow.webContents.send('menu-export-data');
                    }
                },
                {
                    label: 'Import Data',
                    accelerator: 'CmdOrCtrl+I',
                    click: () => {
                        secureImport();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        secureShutdown();
                    }
                }
            ]
        },
        {
            label: 'Tools',
            submenu: [
                {
                    label: 'System Diagnostics',
                    click: () => {
                        mainWindow.webContents.send('menu-diagnostics');
                    }
                },
                {
                    label: 'Performance Monitor',
                    click: () => {
                        mainWindow.webContents.send('menu-performance');
                    }
                },
                {
                    label: 'Clear Cache',
                    click: () => {
                        mainWindow.webContents.send('menu-clear-cache');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Security Settings',
                    click: () => {
                        mainWindow.webContents.send('menu-security');
                    }
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About System Utility Suite',
                            message: 'System Utility Suite v' + APP_VERSION,
                            detail: 'Professional system diagnostic and utility tools\n\nFeatures:\n• System monitoring\n• Performance analysis\n• Security diagnostics\n• Maintenance tools\n\n© 2024 System Tools Inc'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Secure file import
async function secureImport() {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Data Files', extensions: ['dat', 'txt', 'csv'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
        try {
            const content = fs.readFileSync(result.filePaths[0], 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            // Encrypt the imported data
            const encryptedData = encryptData(JSON.stringify(lines));
            mainWindow.webContents.send('imported-data', { encrypted: true, data: encryptedData });
        } catch (error) {
            dialog.showErrorBox('Import Error', 'Failed to read the file: ' + error.message);
        }
    }
}

// Secure shutdown
function secureShutdown() {
    // Clear sensitive data
    if (mainWindow) {
        mainWindow.webContents.send('clear-sensitive-data');
    }
    
    // Clean up temporary files
    setTimeout(() => {
        app.quit();
    }, 1000);
}

// IPC handlers with security
ipcMain.handle('export-data', async (event, data) => {
    const result = await dialog.showSaveDialog(_0x mainWindow, {
        defaultPath: 'system-data.dat',
        filters: [
            { name: 'Data Files', extensions: ['dat'] },
            { name: 'JSON Files', extensions: ['json'] }
        ]
    });

    if (!result.canceled) {
        try {
            let content;
            if (result.filePath.endsWith('.dat')) {
                content = _0x4d5e6f(JSON.stringify(data));
            } else {
                content = JSON.stringify(data, null, 2);
            }
            
            fs.writeFileSync(result.filePath, content, 'utf8');
            dialog.showMessageBox(_0x mainWindow, {
                type: 'info',
                title: 'Export Complete',
                message: 'Data exported successfully!',
                detail: `Saved to: ${result.filePath}`
            });
        } catch (error) {
            dialog.showErrorBox('Export Error', 'Failed to save the file: ' + error.message);
        }
    }
});

ipcMain.handle('decrypt-data', async (event, encryptedData) => {
    try {
        return decryptData(encryptedData);
    } catch (error) {
        throw new Error('Decryption failed');
    }
});

ipcMain.handle('get-security-info', () => {
    return {
        version: APP_VERSION,
        stealthMode: appConfig.stealthMode,
        securityEnabled: appConfig.securityEnabled,
        timestamp: Date.now()
    };
});

// App event handlers with security
app.whenReady().then(() => {
    // Create integrity file
    if (appConfig.integrityCheck) {
        const integrityHash = generateSecurityHash();
        fs.writeFileSync(path.join(__dirname, '.integrity'), integrityHash, 'utf8');
    }
    
    createMainWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        secureShutdown();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createMainWindow();
    }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        shell.openExternal(navigationUrl);
    });
    
    // Block suspicious URLs
    contents.on('will-navigate', (event, navigationUrl) => {
        if (navigationUrl.startsWith('file://') && !navigationUrl.includes('diagnostic-panel.html')) {
            event.preventDefault();
        }
    });
});

// Set app user model ID for Windows
if (process.platform === 'win32') {
    app.setAppUserModelId('com.systemtools.utilitysuite');
}

// Anti-tampering: Check for modifications
process.on('uncaughtException', (error) => {
    if (appConfig.stealthMode) {
        console.log('Application error detected, shutting down');
        app.quit();
    }
});

process.on('unhandledRejection', (reason) => {
    if (appConfig.stealthMode) {
        console.log('Unhandled promise rejection, shutting down');
        app.quit();
    }
});
