const fs = require('fs');
const path = require('path');

// Vanguard v1.1.0 Portable Packaging Logic
const electronPath = path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe');
const appPath = path.join(__dirname, 'dist', 'win-unpacked');

const portableDir = path.join(__dirname, 'RELEASE_VANGUARD');
if (!fs.existsSync(portableDir)) fs.mkdirSync(portableDir);

console.log('Packaging HyperSnatch v1.1.0 Vanguard Portable...');

try {
  // Use the actual built binary from win-unpacked
  const sourceExe = path.join(appPath, 'HyperSnatch.exe');
  const targetExe = path.join(portableDir, 'HyperSnatch-Vanguard.exe');
  
  // Create local runtime redirect
  // Electron handles --user-data-dir natively
  const launcher = `@echo off
  echo [HyperSnatch] Launching Vanguard v1.1.0 in Portable Mode...
  echo [Forensic] Redirecting user-data to local .\\runtime
  start "" "%~dp0win-unpacked\\HyperSnatch.exe" --user-data-dir="%~dp0runtime"`;
  
  fs.writeFileSync(path.join(portableDir, 'HyperSnatch-Vanguard-Portable.bat'), launcher);
  
  console.log('✅ Vanguard Portable Batch created.');
  console.log('📍 Entry Point: HyperSnatch-Vanguard-Portable.bat');
  
} catch (error) {
  console.error('❌ Portable creation failed:', error.message);
  process.exit(1);
}
