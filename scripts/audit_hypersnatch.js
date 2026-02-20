#!/usr/bin/env node

/**
 * HyperSnatch Project Audit Script
 * Generates comprehensive project status report
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');

function countLines(dir, extensions) {
  let totalLines = 0;
  let fileCount = 0;
  
  function walkDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walkDir(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (extensions.includes(ext)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n').length;
            totalLines += lines;
            fileCount++;
          } catch (e) {
            // Skip binary files
          }
        }
      }
    }
  }
  
  walkDir(dir);
  return { totalLines, fileCount };
}

function getDirectorySize(dir) {
  let totalSize = 0;
  let fileCount = 0;
  
  function walkDir(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          walkDir(fullPath);
        } else if (stat.isFile()) {
          totalSize += stat.size;
          fileCount++;
        }
      }
    } catch (e) {
      // Skip directories we can't read
    }
  }
  
  walkDir(dir);
  return { totalSize, fileCount };
}

function findCoreModules() {
  const modules = [];
  const srcDir = path.join(ROOT, 'src');
  
  if (fs.existsSync(srcDir)) {
    const items = fs.readdirSync(srcDir);
    for (const item of items) {
      if (item.endsWith('.js')) {
        modules.push(`src/${item}`);
      }
    }
  }
  
  const modulesDir = path.join(ROOT, 'modules');
  if (fs.existsSync(modulesDir)) {
    const items = fs.readdirSync(modulesDir);
    for (const item of items) {
      const fullPath = path.join(modulesDir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        modules.push(`modules/${item}/`);
      }
    }
  }
  
  return modules;
}

function generateAuditReport() {
  console.log('🔍 HyperSnatch Project Audit');
  console.log('============================');
  
  // File counts
  const jsStats = countLines(ROOT, ['.js']);
  const htmlStats = countLines(ROOT, ['.html']);
  const mdStats = countLines(ROOT, ['.md']);
  
  console.log(`\n📊 File Statistics:`);
  console.log(`JavaScript: ${jsStats.fileCount} files, ${jsStats.totalLines.toLocaleString()} lines`);
  console.log(`HTML: ${htmlStats.fileCount} files, ${htmlStats.totalLines.toLocaleString()} lines`);
  console.log(`Markdown: ${mdStats.fileCount} files, ${mdStats.totalLines.toLocaleString()} lines`);
  
  // Directory sizes
  const srcSize = getDirectorySize(path.join(ROOT, 'src'));
  const distSize = getDirectorySize(path.join(ROOT, 'dist'));
  const docsSize = getDirectorySize(path.join(ROOT, 'docs'));
  
  console.log(`\n📁 Directory Sizes:`);
  console.log(`src/: ${(srcSize.totalSize / 1024).toFixed(1)}KB, ${srcSize.fileCount} files`);
  console.log(`dist/: ${(distSize.totalSize / 1024).toFixed(1)}KB, ${distSize.fileCount} files`);
  console.log(`docs/: ${(docsSize.totalSize / 1024).toFixed(1)}KB, ${docsSize.fileCount} files`);
  
  // Core modules
  const coreModules = findCoreModules();
  console.log(`\n🧩 Core Modules (${coreModules.length}):`);
  coreModules.forEach(module => console.log(`  - ${module}`));
  
  // Build status
  const packageJson = path.join(ROOT, 'package.json');
  if (fs.existsSync(packageJson)) {
    const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
    console.log(`\n📦 Package Information:`);
    console.log(`  Name: ${pkg.name}`);
    console.log(`  Version: ${pkg.version}`);
    console.log(`  Scripts: ${Object.keys(pkg.scripts || {}).length}`);
  }
  
  // Main files
  const mainHtml = path.join(ROOT, 'hypersnatch.html');
  if (fs.existsSync(mainHtml)) {
    const stats = fs.statSync(mainHtml);
    console.log(`\n🏠 Main Application:`);
    console.log(`  hypersnatch.html: ${(stats.size / 1024).toFixed(1)}KB`);
  }
  
  console.log(`\n✅ Audit Complete`);
  console.log(`Generated: ${new Date().toISOString()}`);
}

// Ensure docs directory exists
if (!fs.existsSync(DOCS)) {
  fs.mkdirSync(DOCS, { recursive: true });
}

// Run audit
generateAuditReport();
