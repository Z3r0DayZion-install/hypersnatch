const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Create a simple portable package
const electronPath = path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe');
const appPath = path.join(__dirname, 'dist_test');

if (!fs.existsSync(electronPath)) {
  console.error('Electron not found. Run npm install first.');
  process.exit(1);
}

console.log('Creating portable package...');

// Copy electron.exe to portable directory
const portableDir = path.join(__dirname, 'RELEASE_EVIDENCE');
const portableExe = path.join(portableDir, 'HyperSnatch-Portable-1.0.1.exe');

try {
  fs.copyFileSync(electronPath, portableExe);
  
  // Create a simple launcher batch file
  const launcher = `@echo off
cd /d "%~dp0"
"%~dp0HyperSnatch-Portable-1.0.1.exe" --app="${appPath}" --user-data-app`;
  
  fs.writeFileSync(path.join(portableDir, 'HyperSnatch-Portable-1.0.1.bat'), launcher);
  
  console.log('✅ Portable package created successfully!');
  console.log(`📍 Location: ${portableExe}`);
  
} catch (error) {
  console.error('❌ Failed to create portable package:', error.message);
  process.exit(1);
}
