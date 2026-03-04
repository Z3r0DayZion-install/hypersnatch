# HyperSnatch Reproducible Build Script
# Usage: .\scripts\reproduce.ps1
# Verifies toolchain, builds from source, generates hashes, and compares.
# Fully offline after npm ci.

param(
    [switch]$SkipInstall,
    [switch]$CompareOnly
)

$ErrorActionPreference = "Stop"
$REQUIRED_NODE = "20"
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$ROOT = Split-Path -Parent $SCRIPT_DIR

Set-Location $ROOT

Write-Host ""
Write-Host "  ╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║   HyperSnatch Reproducible Build           ║" -ForegroundColor Cyan
Write-Host "  ╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Verify Node version ──────────────────────────────────────────────
Write-Host "  [1/5] Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = (node -v 2>$null)
if (-not $nodeVersion) {
    Write-Host "  ✗ Node.js not found. Install Node 20.17.0" -ForegroundColor Red
    exit 1
}

$majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($majorVersion -ne [int]$REQUIRED_NODE) {
    Write-Host "  ✗ Node $nodeVersion found, need v$REQUIRED_NODE.x" -ForegroundColor Red
    Write-Host "    Install: https://nodejs.org/en/download/" -ForegroundColor DarkGray
    exit 1
}
Write-Host "  ✓ Node $nodeVersion" -ForegroundColor Green

# ── Step 2: npm ci ───────────────────────────────────────────────────────────
if (-not $SkipInstall) {
    Write-Host "  [2/5] Installing dependencies (npm ci)..." -ForegroundColor Yellow
    
    if (-not (Test-Path "package-lock.json")) {
        Write-Host "  ✗ package-lock.json not found" -ForegroundColor Red
        exit 1
    }
    
    npm ci --ignore-scripts 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ npm ci failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ Dependencies installed from lockfile" -ForegroundColor Green
}
else {
    Write-Host "  [2/5] Skipping install (--SkipInstall)" -ForegroundColor DarkGray
}

# ── Step 3: Build ────────────────────────────────────────────────────────────
if (-not $CompareOnly) {
    Write-Host "  [3/5] Building (npm run build:repro)..." -ForegroundColor Yellow
    
    $env:SOURCE_DATE_EPOCH = [int][double]::Parse(
        (Get-Date -Date "2026-03-03T00:00:00Z" -UFormat %s)
    )
    
    npm run build:repro 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ Build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ Build complete" -ForegroundColor Green
}
else {
    Write-Host "  [3/5] Skipping build (--CompareOnly)" -ForegroundColor DarkGray
}

# ── Step 4: Generate manifest ────────────────────────────────────────────────
Write-Host "  [4/5] Generating hashes..." -ForegroundColor Yellow

$distDir = "dist"
if (-not (Test-Path $distDir)) {
    Write-Host "  ✗ dist/ directory not found. Run build first." -ForegroundColor Red
    exit 1
}

$artifacts = Get-ChildItem -Path $distDir -Filter "*.exe" -ErrorAction SilentlyContinue
if ($artifacts.Count -eq 0) {
    Write-Host "  ⚠ No .exe artifacts found in dist/" -ForegroundColor Yellow
    
    # Fall back: hash app.asar if present
    $asar = Join-Path $distDir "win-unpacked\resources\app.asar"
    if (Test-Path $asar) {
        $artifacts = @(Get-Item $asar)
        Write-Host "  → Found app.asar for comparison" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "  ── Local Build Hashes ──────────────────────────" -ForegroundColor White

foreach ($file in $artifacts) {
    $hash = (Get-FileHash -Path $file.FullName -Algorithm SHA256).Hash.ToLower()
    $name = $file.Name
    Write-Host "  $hash" -ForegroundColor Cyan
    Write-Host "    ↳ $name ($([math]::Round($file.Length/1MB, 2)) MB)" -ForegroundColor DarkGray
}

# ── Step 5: Compare with published hashes ────────────────────────────────────
Write-Host ""
Write-Host "  [5/5] Comparing with published hashes..." -ForegroundColor Yellow

$manifestPath = Join-Path $distDir "SHA256SUMS.txt"
if (Test-Path $manifestPath) {
    Write-Host ""
    Write-Host "  ── Published Hashes (SHA256SUMS.txt) ───────────" -ForegroundColor White
    Get-Content $manifestPath | ForEach-Object {
        Write-Host "  $_" -ForegroundColor DarkGray
    }
}
else {
    Write-Host "  ⚠ No SHA256SUMS.txt found in dist/" -ForegroundColor Yellow
    Write-Host "    Run: node scripts/generate_manifest.cjs" -ForegroundColor DarkGray
}

$hashManifest = "hash_manifest.json"
if (Test-Path $hashManifest) {
    Write-Host ""
    Write-Host "  ── Release Manifest (hash_manifest.json) ──────" -ForegroundColor White
    $manifest = Get-Content $hashManifest -Raw | ConvertFrom-Json
    foreach ($prop in $manifest.hashes.PSObject.Properties) {
        Write-Host "  $($prop.Name)" -ForegroundColor Cyan
        Write-Host "    ↳ $($prop.Value.name) (v$($prop.Value.version))" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "  ════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Compare the hashes above to verify reproducibility." -ForegroundColor White
Write-Host "  If they match, the build is deterministic." -ForegroundColor Green
Write-Host ""
