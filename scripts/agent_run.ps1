#!/usr/bin/env pwsh
# HyperSnatch Agent Run Script - Windows PowerShell

Write-Host "=== HyperSnatch Agent Run ===" -ForegroundColor Green

# Clean and create directories
Remove-Item -Recurse -Force PROOF_PACK -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist_test -ErrorAction SilentlyContinue
New-Item -ItemType Directory PROOF_PACK -Force | Out-Null
New-Item -ItemType Directory dist_test -Force | Out-Null

# Dump environment info
Write-Host "Environment:" -ForegroundColor Yellow
pwd > PROOF_PACK\00_pwd.txt
node -v > PROOF_PACK\01_node.txt
npm -v > PROOF_PACK\02_npm.txt
git status > PROOF_PACK\03_git_status_before.txt

# Platform scan before purge
Write-Host "Scanning for Platform references before purge..." -ForegroundColor Yellow
Get-ChildItem -Recurse | Select-String -Pattern "hypersnatch|HyperSnatch|\bnexus\b" > PROOF_PACK\07_nexus_hits_before.txt

# Run brand purge
Write-Host "Running brand purge..." -ForegroundColor Yellow
node scripts/brand_purge.js > PROOF_PACK\08_brand_purge_run.txt

# Platform scan after purge
Write-Host "Scanning for Platform references after purge..." -ForegroundColor Yellow
Get-ChildItem -Recurse | Select-String -Pattern "hypersnatch|HyperSnatch|\bnexus\b" > PROOF_PACK\07_nexus_hits_after.txt

# Run npm install
Write-Host "Running npm install..." -ForegroundColor Yellow
npm install > PROOF_PACK\06_npm_install_output.txt 2>&1

# Build release pack
Write-Host "Building release pack..." -ForegroundColor Yellow
node scripts/build_release_pack.js --out ./dist_test > PROOF_PACK\09_build_release_pack.txt 2>&1

# List dist_test contents
Write-Host "Listing dist_test contents..." -ForegroundColor Yellow
Get-ChildItem dist_test -Recurse | Out-String -Width 200 > PROOF_PACK\10_dist_test_listing.txt

# Verify release pack
Write-Host "Verifying release pack..." -ForegroundColor Yellow
$latestPack = Get-ChildItem dist_test\*.json | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($latestPack) {
    node scripts/verify_release_pack.js --in ./dist_test/$($latestPack.Name) > PROOF_PACK\11_verify_release_pack.txt 2>&1
} else {
    Write-Host "No release pack found to verify" -ForegroundColor Red
}

Write-Host "=== Agent Run Complete ===" -ForegroundColor Green
