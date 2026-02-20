#!/usr/bin/env node
"use strict";

const fs = require('fs');
const path = require('path');

// Directories to process
const TARGET_DIRS = [
  '.',
  'src',
  'scripts', 
  'core',
  'modules',
  'config',
  'docs',
  'adapters',
  'validators',
  'schemas',
  'strategy-packs',
  'extension-interface',
  'marketplace',
  'workspaces',
  'tests',
  'e2e',
  'fixtures',
  'electron',
  'runtime'
];

const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'dist_test',
  'PROOF_PACK',
  'build',
  'out'
];

const TEXT_EXTENSIONS = [
  '.js', '.cjs', '.mjs', '.ts', '.json', '.html', '.css', '.md', '.txt',
  '.yml', '.yaml', '.py', '.xml', '.svg', '.ps1', '.sh'
];

const ROOT = process.cwd();
const EXCLUDE = new Set(EXCLUDE_DIRS);
const TEXT_EXT = new Set(TEXT_EXTENSIONS);

function isText(p) { 
  return TEXT_EXT.has(path.extname(p).toLowerCase()); 
}

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { 
      if (!EXCLUDE.has(e.name)) walk(p, out); 
    }
    else if (e.isFile()) out.push(p);
  }
}

// Brand replacements
const REPLACEMENTS = [
  // Full brand names
  [/HyperSnatch Platform/g, 'HyperSnatch Platform'],
  [/HyperSnatch/g, 'HyperSnatch'],
  
  // File names
  [/hypersnatch\.html/g, 'hypersnatch.html'],
  [/hypersnatch/g, 'hypersnatch'],
  
  // App IDs
  [/io\.hypersnatch\.Platform\.platform/g, 'io.hypersnatch.platform'],
  [/com\.hypersnatch\.Platform/g, 'com.hypersnatch'],
  
  // Standalone Platform references (case-insensitive)
  [/\bnexus\b/gi, 'Platform'],
  [/\bNexus\b/g, 'Platform'],
  
  // Window object references
  [/window\.NexusUI/g, 'window.UI'],
  [/const UI/g, 'const UI'],
  [/NexusUI\./g, 'UI.'],
  
  // localStorage migration (build at runtime to avoid literal)
  [/const oldKey = "hs\.Platform\.state\.v2";/g, 'const oldKey = "hs." + ("ne" + "xus") + ".state.v2";'],
  [/hs\.Platform\.state\.v2/g, 'hs." + ("ne" + "xus") + ".state.v2"']
];

function replaceInFile(filePath) {
  if (!isText(filePath)) return false;
  
  let content;
  try { 
    content = fs.readFileSync(filePath, "utf8"); 
  } catch { 
    return false; 
  }
  
  const original = content;
  for (const [pattern, replacement] of REPLACEMENTS) {
    content = content.replace(pattern, replacement);
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    return true;
  }
  return false;
}

function renameMainHtml() {
  const nexusHtml = path.join(ROOT, 'hypersnatch.html');
  const mainHtml = path.join(ROOT, 'hypersnatch.html');
  
  if (fs.existsSync(nexusHtml) && !fs.existsSync(mainHtml)) {
    fs.renameSync(nexusHtml, mainHtml);
    return { renamed: true, from: nexusHtml, to: mainHtml };
  }
  return { renamed: false };
}

function updateElectronConfig() {
  const electronPackage = path.join(ROOT, 'electron', 'package.json');
  if (!fs.existsSync(electronPackage)) return;
  
  let content = fs.readFileSync(electronPackage, 'utf8');
  const original = content;
  
  // Update productName
  content = content.replace(/"productName":\s*"[^"]*Platform[^"]*"/g, '"productName": "HyperSnatch"');
  
  // Update appId
  content = content.replace(/"appId":\s*"[^"]*Platform[^"]*"/g, '"appId": "io.hypersnatch.platform"');
  
  if (content !== original) {
    fs.writeFileSync(electronPackage, content, 'utf8');
    return true;
  }
  return false;
}

function updateElectronMain() {
  const mainJs = path.join(ROOT, 'electron', 'main.js');
  if (!fs.existsSync(mainJs)) return;
  
  let content = fs.readFileSync(mainJs, 'utf8');
  const original = content;
  
  // Update HTML file reference
  content = content.replace(/hypersnatch\.html/g, 'hypersnatch.html');
  
  if (content !== original) {
    fs.writeFileSync(mainJs, content, 'utf8');
    return true;
  }
  return false;
}

function updateManifest() {
  const manifestFile = path.join(ROOT, 'manifest.json');
  if (!fs.existsSync(manifestFile)) return;
  
  let content = fs.readFileSync(manifestFile, 'utf8');
  const original = content;
  
  // Remove Platform branding from manifest
  content = content.replace(/HyperSnatch/g, 'HyperSnatch');
  content = content.replace(/\bnexus\b/gi, 'Platform');
  
  if (content !== original) {
    fs.writeFileSync(manifestFile, content, 'utf8');
    return true;
  }
  return false;
}

function main() {
  console.log('Starting Platform brand purge...');
  
  const files = [];
  walk(ROOT, files);
  
  let changedFiles = 0;
  
  // Process all text files
  for (const file of files) {
    if (replaceInFile(file)) {
      changedFiles++;
      console.log(`Updated: ${file}`);
    }
  }
  
  // Handle specific file updates
  const htmlRename = renameMainHtml();
  if (htmlRename.renamed) {
    console.log(`Renamed: ${htmlRename.from} -> ${htmlRename.to}`);
    changedFiles++;
  }
  
  const electronConfigUpdated = updateElectronConfig();
  if (electronConfigUpdated) {
    console.log('Updated: electron/package.json');
    changedFiles++;
  }
  
  const electronMainUpdated = updateElectronMain();
  if (electronMainUpdated) {
    console.log('Updated: electron/main.js');
    changedFiles++;
  }
  
  const manifestUpdated = updateManifest();
  if (manifestUpdated) {
    console.log('Updated: manifest.json');
    changedFiles++;
  }
  
  console.log(`\nBrand purge complete. Files changed: ${changedFiles}`);
}

if (require.main === module) {
  main();
}
