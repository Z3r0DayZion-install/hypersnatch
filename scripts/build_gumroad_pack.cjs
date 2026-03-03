/**
 * HyperSnatch Gumroad Packager
 * Builds a Gumroad-ready zip containing portable + (optional) installer artifacts,
 * plus starter docs and checksums.
 */

"use strict";

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function run(cmd, args, options = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: true, ...options });
  if (res.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
}

function sha256(filePath) {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(filePath));
  return h.digest('hex');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copy(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function write(dest, contents) {
  ensureDir(path.dirname(dest));
  fs.writeFileSync(dest, contents, 'utf8');
}

function main() {
  const pkg = readJson(path.join(ROOT, 'package.json'));
  const version = pkg.version;

  const portableName = `HyperSnatch ${version}.exe`;
  const portablePath = path.join(DIST, portableName);
  const installerPath = path.join(DIST, `HyperSnatch-Setup-${version}.exe`);

  if (!fs.existsSync(DIST)) ensureDir(DIST);

  if (!fs.existsSync(portablePath)) {
    console.log(`\n⏳ Portable EXE not found (${portableName}). Building portable...`);
    const eb = path.join(ROOT, 'node_modules', '.bin', 'electron-builder.cmd');
    run(eb, ['--win', 'portable', '--x64', '--publish=never']);
  }

  if (!fs.existsSync(portablePath)) {
    throw new Error(`Portable build missing after build: ${portablePath}`);
  }

  // Installer is optional
  if (!fs.existsSync(installerPath)) {
    console.log(`\nℹ️ Installer not found (optional): ${path.basename(installerPath)}`);
  }

  const staging = path.join(DIST, `staging_gumroad_v${version}`);
  if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });
  ensureDir(staging);

  const outPortable = path.join(staging, `HyperSnatch_Portable_${version}.exe`);
  copy(portablePath, outPortable);

  const included = [outPortable];

  if (fs.existsSync(installerPath)) {
    const outInstaller = path.join(staging, path.basename(installerPath));
    copy(installerPath, outInstaller);
    included.push(outInstaller);
  }

  const manualPath = path.join(ROOT, 'OPERATORS_MANUAL.md');
  if (fs.existsSync(manualPath)) {
    const outManual = path.join(staging, 'OPERATORS_MANUAL.md');
    copy(manualPath, outManual);
    included.push(outManual);
  }

  const termsPath = path.join(ROOT, 'landing', 'terms.html');
  if (fs.existsSync(termsPath)) {
    const outTerms = path.join(staging, 'TERMS.html');
    copy(termsPath, outTerms);
    included.push(outTerms);
  }

  const latestYml = path.join(DIST, 'latest.yml');
  if (fs.existsSync(latestYml)) {
    const outLatest = path.join(staging, 'latest.yml');
    copy(latestYml, outLatest);
    included.push(outLatest);
  }

  const versionJson = path.join(DIST, 'VERSION.json');
  if (fs.existsSync(versionJson)) {
    const outVersionJson = path.join(staging, 'VERSION.json');
    copy(versionJson, outVersionJson);
    included.push(outVersionJson);
  }

  write(path.join(staging, 'VERSION.txt'), `${version}\n`);

  write(
    path.join(staging, 'README_START_HERE.md'),
    `# HyperSnatch v${version} (Gumroad Build)\n\n## Run (Portable)\n1) Double-click \`HyperSnatch_Portable_${version}.exe\`\n2) In the app: paste HTML/HAR/logs, click Decode, export report\n\n## Installer (Optional)\nIf included: run \`HyperSnatch-Setup-${version}.exe\`\n\n## Licensing\n- If your purchase includes a license file, import it via the in-app activation flow.\n- Terms are in \`TERMS.html\`.\n\n## Integrity\nChecksums are in \`SHA256SUMS.txt\`.\n`
  );

  const sums = included
    .filter((f) => fs.existsSync(f) && fs.statSync(f).isFile())
    .map((f) => `${sha256(f)}  ${path.basename(f)}`)
    .join('\n') + '\n';

  write(path.join(staging, 'SHA256SUMS.txt'), sums);

  const zipPath = path.join(DIST, `HyperSnatch_Gumroad_v${version}.zip`);
  console.log(`\n🗜️ Creating: ${zipPath}`);
  run('powershell', [
    '-NoProfile',
    '-Command',
    `Compress-Archive -Path "${staging}\\*" -DestinationPath "${zipPath}" -Force`
  ]);

  const listingPath = path.join(DIST, `GUMROAD_LISTING_v${version}.md`);
  write(
    listingPath,
    `# Gumroad Listing Copy (Template)\n\n**Product name**: HyperSnatch Vanguard v${version} (Portable)\n\n**Short description**: Offline-first deterministic static analysis utility for extracting embedded media endpoints from HTML/HAR/JS without executing hostile code.\n\n## What you get\n- HyperSnatch portable Windows EXE\n- (Optional) Windows installer\n- Operator\'s manual\n- SHA-256 checksums\n\n## System requirements\n- Windows 10/11 x64\n\n## Notes\n- No accounts, no telemetry.\n- Results are deterministic for the same input.\n\n## Support\nAdd your support email/URL here.\n\n## Refund policy\nAdd your policy here.\n`
  );

  fs.rmSync(staging, { recursive: true, force: true });

  console.log(`\n✅ Gumroad bundle ready:`);
  console.log(`- ${zipPath}`);
  console.log(`- ${listingPath}`);
}

main();
