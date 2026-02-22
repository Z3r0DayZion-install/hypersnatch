const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Security configuration
const SECURITY_KEY = 'system-utility-security-key-2024';
const APP_VERSION = '1.0.0';
const STEALTH_MODE = true;

let mainWindow = null;
let appConfig = {
    securityEnabled: true,
    stealthMode: STEALTH_MODE,
    integrityCheck: true
};

// Security functions
function generateHash() {
    return crypto.createHash('sha256').update(Date.now() + SECURITY_KEY).digest('hex');
}

function encryptData(data) {
    try {
        const cipher = crypto.createCipher('aes-256-cbc', SECURITY_KEY);
        return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
    } catch (error) {
        return data;
    }
}

function decryptData(data) {
    try {
        const decipher = crypto.createDecipher('aes-256-cbc', SECURITY_KEY);
        return decipher.update(data, 'hex', 'utf8') + decipher.final('utf8');
    } catch (error) {
        return data;
    }
}

// Create main window
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, '../assets/icon.png'),
        show: false,
        title: 'System Utility Suite'
    });

    mainWindow.loadFile('interface/index.html');

    // Security: Prevent dev tools
    if (appConfig.stealthMode) {
        mainWindow.webContents.on('devtools-opened', () => {
            mainWindow.webContents.closeDevTools();
        });
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    createMenu();
}

// Create menu
function createMenu() {
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
                    label: 'Exit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
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
                            detail: 'Professional system diagnostic tools\n\n© 2024 System Tools Inc'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// IPC handlers
ipcMain.handle('export-data', async (event, data) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: 'system-data.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (!result.canceled) {
        try {
            const encryptedData = encryptData(JSON.stringify(data));
            fs.writeFileSync(result.filePath, encryptedData, 'utf8');
            dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Export Complete',
                message: 'Data exported successfully!'
            });
        } catch (error) {
            dialog.showErrorBox('Export Error', error.message);
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
        securityEnabled: appConfig.securityEnabled,
        timestamp: Date.now()
    };
});

// App events
app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Security
if (process.platform === 'win32') {
    app.setAppUserModelId('com.systemtools.utilitysuite');
}
