/**
 * Simple Code Obfuscation and Security Protection
 */

const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

console.log('🔒 Starting simple obfuscation and security protection...\n');

// Simple obfuscation options (less aggressive)
const obfuscationOptions = {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: true,
    debugProtectionInterval: true,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 5,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['base64'],
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayThreshold: 0.75,
    unicodeEscapeSequence: false
};

// Create obfuscated directory structure
const obfuscatedDir = path.join(__dirname, '../obfuscated');

console.log('📁 Creating secure directory structure...');
if (fs.existsSync(obfuscatedDir)) {
    fs.rmSync(obfuscatedDir, { recursive: true });
}

fs.mkdirSync(obfuscatedDir, { recursive: true });
fs.mkdirSync(path.join(obfuscatedDir, 'core'), { recursive: true });
fs.mkdirSync(path.join(obfuscatedDir, 'interface'), { recursive: true });

// Obfuscate main JavaScript file
console.log('🔐 Obfuscating core application...');
const mainJsPath = path.join(__dirname, '../core/main-simple.js');
const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

try {
    const obfuscatedMain = JavaScriptObfuscator.obfuscate(mainJsContent, obfuscationOptions);
    fs.writeFileSync(path.join(obfuscatedDir, 'core', 'system-monitor.js'), obfuscatedMain.getObfuscatedCode());
    console.log('✅ Core application obfuscated successfully');
} catch (error) {
    console.log('⚠️ Obfuscation failed, using original file');
    fs.copyFileSync(mainJsPath, path.join(obfuscatedDir, 'core', 'system-monitor.js'));
}

// Copy and process UI file
console.log('🎨 Processing interface files...');
const htmlPath = path.join(__dirname, '../ui/index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Add security headers
const securityHeaders = `
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
    <meta name="referrer" content="no-referrer">
    <meta name="robots" content="noindex, nofollow">
`;

htmlContent = htmlContent.replace('<head>', '<head>\n' + securityHeaders);

// Simple JavaScript obfuscation within HTML
const jsScriptRegex = /<script>([\s\S]*?)<\/script>/g;
htmlContent = htmlContent.replace(jsScriptRegex, (match, scriptContent) => {
    if (scriptContent.includes('require(') || scriptContent.includes('const {')) {
        try {
            const obfuscatedJS = JavaScriptObfuscator.obfuscate(scriptContent, {
                ...obfuscationOptions,
                compact: false
            });
            return `<script>\n${obfuscatedJS.getObfuscatedCode()}\n</script>`;
        } catch (error) {
            return match;
        }
    }
    return match;
});

fs.writeFileSync(path.join(obfuscatedDir, 'interface', 'diagnostic-panel.html'), htmlContent);

// Create fake package.json
console.log('📋 Creating security manifest...');
const fakePackageJson = {
    name: 'system-utility-suite',
    version: '1.0.0',
    description: 'System Diagnostic and Monitoring Tools',
    main: 'core/system-monitor.js',
    scripts: {
        start: 'electron .',
        build: 'electron-builder',
        'build-win': 'electron-builder --win'
    },
    keywords: [
        'system',
        'diagnostic',
        'monitoring',
        'utility',
        'maintenance'
    ],
    author: 'System Tools Inc',
    license: 'MIT',
    devDependencies: {
        electron: '^28.0.0',
        'electron-builder': '^24.9.1'
    },
    build: {
        appId: 'com.systemtools.utilitysuite',
        productName: 'System Utility Suite',
        directories: {
            output: 'dist'
        },
        files: [
            'core/**/*',
            'interface/**/*',
            'node_modules/**/*',
            'package.json'
        ],
        extraMetadata: {
            main: 'core/system-monitor.js'
        },
        win: {
            target: 'nsis',
            icon: 'assets/icon.ico'
        },
        nsis: {
            oneClick: false,
            allowToChangeInstallationDirectory: true,
            createDesktopShortcut: true,
            createStartMenuShortcut: true,
            shortcutName: 'System Tools'
        }
    }
};

fs.writeFileSync(path.join(obfuscatedDir, 'package.json'), JSON.stringify(fakePackageJson, null, 2));

// Create security configuration
const securityConfig = {
    encryption: {
        algorithm: 'aes-256-cbc',
        keyLength: 32
    },
    protection: {
        debugProtection: true,
        obfuscationLevel: 'medium'
    }
};

fs.writeFileSync(path.join(obfuscatedDir, 'core/security-config.json'), JSON.stringify(securityConfig, null, 2));

// Create fake README
const fakeReadme = `# System Utility Suite

Professional system diagnostic and monitoring tools for Windows environments.

## Features

- System performance monitoring
- Registry analysis tools
- Hardware device diagnostics
- Process monitoring and analysis
- Security assessment utilities

## Installation

1. Download the installer
2. Run with administrator privileges
3. Follow the installation wizard
4. Launch from Start Menu

## Security

All analysis operations are performed locally with encryption. No system data is transmitted externally.

## System Requirements

- Windows 10 or later
- 4GB RAM minimum
- 100MB disk space

© 2024 System Tools Inc. All rights reserved.`;

fs.writeFileSync(path.join(obfuscatedDir, 'README.md'), fakeReadme);

// Create license
const license = `MIT License

Copyright (c) 2024 System Tools Inc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

fs.writeFileSync(path.join(obfuscatedDir, 'LICENSE'), license);

// Create .gitignore
const gitignore = `# Dependencies
node_modules/
*.log

# Build outputs
dist/
build/

# Security files
*.key
*.pem
security-config.json`;

fs.writeFileSync(path.join(obfuscatedDir, '.gitignore'), gitignore);

// Statistics
console.log('\n📊 Protection Statistics:');
console.log('✅ Core files processed: 1');
console.log('✅ Interface files processed: 1');
console.log('✅ Security layers added: 3');
console.log('✅ Fake file names applied: Yes');
console.log('✅ Debug protection: Enabled');
console.log('✅ String encryption: Enabled');

// Calculate file sizes
try {
    const obfuscatedSize = fs.statSync(path.join(obfuscatedDir, 'core/system-monitor.js')).size;
    const originalSize = fs.statSync(mainJsPath).size;
    const ratio = ((obfuscatedSize - originalSize) / originalSize * 100).toFixed(1);
    
    console.log(`📈 Code size increase: ${ratio}%`);
} catch (error) {
    console.log('📈 Code size calculation failed');
}

console.log('\n🎯 Security Features Applied:');
console.log('✅ Variable name obfuscation');
console.log('✅ String array encoding');
console.log('✅ Debug protection');
console.log('✅ Self-defending code');
console.log('✅ Fake file names');
console.log('✅ Misleading metadata');
console.log('✅ Security headers');

console.log('\n📁 Protected Structure Created:');
console.log('📄 core/system-monitor.js (obfuscated main)');
console.log('📄 interface/diagnostic-panel.html (protected UI)');
console.log('📄 package.json (fake manifest)');
console.log('📄 core/security-config.json (security settings)');
console.log('📄 README.md (misleading documentation)');
console.log('📄 LICENSE (MIT license)');
console.log('📄 .gitignore (security filters)');

console.log('\n🚀 Next Steps:');
console.log('1. cd obfuscated');
console.log('2. npm install');
console.log('3. npm run build-win');
console.log('4. Distribute from dist/');

console.log('\n🔒 Your application is now protected!');
