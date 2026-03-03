# HyperSnatch Binary Verification Script
# Usage: .\verify.ps1 .\HyperSnatch-Setup-1.2.0.exe
# This script is fully offline. No network calls.

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$FilePath
)

$KNOWN_HASHES = @{
    "504d4ed8f4b11664553e88c3d85cb5c1297191a3a5aa1a8b943f29a5d24bbfd8" = "HyperSnatch-Setup-1.2.0.exe (Installer)"
    "fb198e68af79fb67ea35d4335a44c3252a40bff3bd4df04d3191b05733254c13" = "HyperSnatch 1.2.0.exe (Portable)"
}

if (-not (Test-Path $FilePath)) {
    Write-Host "`n  ERROR: File not found: $FilePath" -ForegroundColor Red
    exit 1
}

$resolvedPath = Resolve-Path $FilePath
$fileName = Split-Path $resolvedPath -Leaf
$fileSize = (Get-Item $resolvedPath).Length

Write-Host ""
Write-Host "  ================================================" -ForegroundColor Cyan
Write-Host "  HyperSnatch -- Binary Integrity Verification" -ForegroundColor Cyan
Write-Host "  ================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  File: $fileName" -ForegroundColor White
Write-Host "  Size: $fileSize bytes" -ForegroundColor White
Write-Host "  Computing SHA-256..." -ForegroundColor Yellow

$hash = (Get-FileHash -Path $resolvedPath -Algorithm SHA256).Hash.ToLower()

Write-Host "  Hash: $hash" -ForegroundColor White
Write-Host ""

if ($KNOWN_HASHES.ContainsKey($hash)) {
    $matchedName = $KNOWN_HASHES[$hash]
    Write-Host "  VERIFIED -- Hash matches official manifest" -ForegroundColor Green
    Write-Host "  Artifact: $matchedName" -ForegroundColor Green
    Write-Host "  Status:   AUTHENTIC" -ForegroundColor Green
    Write-Host ""
    Write-Host "  This binary is safe to run." -ForegroundColor Green
    Write-Host ""
    exit 0
}
else {
    Write-Host "  FAILED -- Hash does NOT match any known build" -ForegroundColor Red
    Write-Host "  DO NOT RUN THIS FILE." -ForegroundColor Red
    Write-Host ""
    Write-Host "  Expected one of:" -ForegroundColor Yellow
    foreach ($knownHash in $KNOWN_HASHES.Keys) {
        Write-Host "    $knownHash  ($($KNOWN_HASHES[$knownHash]))" -ForegroundColor DarkYellow
    }
    Write-Host ""
    Write-Host "  Got:" -ForegroundColor Yellow
    Write-Host "    $hash" -ForegroundColor Red
    Write-Host ""
    exit 1
}
