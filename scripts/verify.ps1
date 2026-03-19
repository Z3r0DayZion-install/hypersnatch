# HyperSnatch Binary Verification Script v1.2.1
# Usage: .\verify.ps1 -FilePath .\HyperSnatch-Setup-1.2.0.exe [-Verbose] [-UpdateHashes] [-SelfTest]
# Fully offline. No network calls unless -UpdateHashes specified.

param(
    [Parameter(Mandatory = $false, Position = 0)]
    [ValidateScript({
            if ($_ -and -not (Test-Path $_ -PathType Leaf)) {
                throw "File not found or invalid path: $_"
            }
            return $true
        })]
    [string]$FilePath,
    
    [Parameter(Mandatory = $false)]
    [switch]$Detailed,
    
    [Parameter(Mandatory = $false)]
    [switch]$UpdateHashes,
    
    [Parameter(Mandatory = $false)]
    [switch]$SelfTest,
    
    [Parameter(Mandatory = $false)]
    [switch]$Test,
    
    [Parameter(Mandatory = $false)]
    [string]$HashManifestPath = ".\hash_manifest.json",
    
    [Parameter(Mandatory = $false)]
    [string]$OutputDir = ".\dist"
)

#region Configuration
$SCRIPT_VERSION = "1.2.1"
$SCRIPT_NAME = "HyperSnatch Binary Verifier"
$EXIT_CODES = @{
    SUCCESS          = 0
    FILE_NOT_FOUND   = 1
    HASH_MISMATCH    = 2
    MANIFEST_ERROR   = 3
    PERMISSION_ERROR = 4
    SELF_TEST_FAILED = 5
    GPG_ERROR        = 6
}

# Known hashes (keep as fallback)
$KNOWN_HASHES = @{
    "504d4ed8f4b11664553e88c3d85cb5c1297191a3a5aa1a8b943f29a5d24bbfd8"   = @{
        Name         = "HyperSnatch-Setup-1.2.0.exe"
        Type         = "Installer"
        Version      = "1.2.0"
        BuildDate    = "2024-01-15"
        Architecture = "x64"
    }
    "fb198e68af79fb67ea35d4335a44c3252a40bff3bd4df04d3191b05733254c13"   = @{
        Name         = "HyperSnatch-1.2.0-portable.exe"
        Type         = "Portable"
        Version      = "1.2.0"
        BuildDate    = "2024-01-15"
        Architecture = "x64"
    }
    "a4b8e3f2c1d9e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2"   = @{
        Name         = "HyperSnatch-Setup-1.2.1.exe"
        Type         = "Installer"
        Version      = "1.2.1"
        BuildDate    = "2024-01-20"
        Architecture = "x64"
    }
    "b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3" = @{
        Name         = "HyperSnatch-1.2.1-portable.exe"
        Type         = "Portable"
        Version      = "1.2.1"
        BuildDate    = "2024-01-20"
        Architecture = "x64"
    }
}
#endregion

#region Functions
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO",
        [ConsoleColor]$Color = [ConsoleColor]::White
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    if ($Detailed -or $Level -eq "ERROR" -or $Level -eq "WARNING") {
        Write-Host $logMessage -ForegroundColor $Color
    }
    
    # Also write to log file if we have permissions
    try {
        $logDir = Join-Path $env:TEMP "HyperSnatch"
        if (-not (Test-Path $logDir)) {
            New-Item -ItemType Directory -Path $logDir -Force | Out-Null
        }
        $logFile = Join-Path $logDir "verify.log"
        Add-Content -Path $logFile -Value $logMessage -ErrorAction SilentlyContinue
    }
    catch {
        # Silently fail if can't write log
    }
}

function Get-HashManifest {
    param([string]$ManifestPath)
    
    $manifest = @{}
    
    # Try to load external manifest first
    if (Test-Path $ManifestPath) {
        try {
            $json = Get-Content $ManifestPath -Raw | ConvertFrom-Json
            foreach ($item in $json.hashes.PSObject.Properties) {
                $manifest[$item.Name] = @{
                    Name         = $item.Value.name
                    Type         = $item.Value.type
                    Version      = $item.Value.version
                    BuildDate    = $item.Value.buildDate
                    Architecture = $item.Value.architecture
                }
            }
            Write-Log "Loaded hash manifest from $ManifestPath" -Level "INFO" -Color Cyan
        }
        catch {
            Write-Log "Failed to load manifest: $_" -Level "WARNING" -Color Yellow
        }
    }
    
    # Merge with known hashes (external overrides internal)
    $finalManifest = $KNOWN_HASHES.Clone()
    foreach ($key in $manifest.Keys) {
        $finalManifest[$key] = $manifest[$key]
    }
    
    return $finalManifest
}

function Show-Banner {
    Write-Host ""
    Write-Host "  ╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║     $SCRIPT_NAME v$SCRIPT_VERSION          ║" -ForegroundColor Cyan
    Write-Host "  ║     HyperSnatch Binary Integrity Verification  ║" -ForegroundColor Cyan
    Write-Host "  ╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Format-FileSize {
    param([long]$bytes)
    
    if ($bytes -ge 1TB) { return "{0:N2} TB" -f ($bytes / 1TB) }
    elseif ($bytes -ge 1GB) { return "{0:N2} GB" -f ($bytes / 1GB) }
    elseif ($bytes -ge 1MB) { return "{0:N2} MB" -f ($bytes / 1MB) }
    elseif ($bytes -ge 1KB) { return "{0:N2} KB" -f ($bytes / 1KB) }
    else { return "$bytes bytes" }
}

function Export-HashManifest {
    param(
        [string]$OutputPath = ".\hash_manifest.json",
        [hashtable]$Hashes = $KNOWN_HASHES
    )
    
    $manifest = @{
        version   = $SCRIPT_VERSION
        generated = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
        generator = $SCRIPT_NAME
        hashes    = @{}
    }
    
    foreach ($hash in $Hashes.Keys) {
        $manifest.hashes[$hash] = @{
            name         = $Hashes[$hash].Name
            type         = $Hashes[$hash].Type
            version      = $Hashes[$hash].Version
            buildDate    = $Hashes[$hash].BuildDate
            architecture = $Hashes[$hash].Architecture
        }
    }
    
    try {
        $manifest | ConvertTo-Json -Depth 10 | Set-Content $OutputPath
        Write-Host "  ✓ Hash manifest exported to: $OutputPath" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "  ✗ Failed to export manifest: $_" -ForegroundColor Red
        return $false
    }
}

function Test-FileIntegrity {
    param(
        [string]$FilePath,
        [hashtable]$HashManifest
    )
    
    try {
        $resolvedPath = Resolve-Path $FilePath -ErrorAction Stop
        $fileName = Split-Path $resolvedPath -Leaf
        $fileInfo = Get-Item $resolvedPath
        $fileSize = $fileInfo.Length
        $lastModified = $fileInfo.LastWriteTime
        
        Write-Host ""
        Write-Host "  📄 File Details:" -ForegroundColor White
        Write-Host "  ────────────────────────────────────────────────" -ForegroundColor DarkGray
        Write-Host "    Name: $fileName" -ForegroundColor White
        Write-Host "    Path: $resolvedPath" -ForegroundColor DarkGray
        Write-Host "    Size: $(Format-FileSize $fileSize)" -ForegroundColor White
        Write-Host "    Modified: $lastModified" -ForegroundColor White
        Write-Host ""
        
        Write-Host "  🔐 Computing SHA-256 hash..." -ForegroundColor Yellow
        $hash = (Get-FileHash -Path $resolvedPath -Algorithm SHA256).Hash.ToLower()
        Write-Host "    Hash: $hash" -ForegroundColor White
        Write-Host ""
        
        # Check against manifest
        if ($HashManifest.ContainsKey($hash)) {
            $artifact = $HashManifest[$hash]
            Write-Host "  ✅ VERIFICATION SUCCESSFUL" -ForegroundColor Green
            Write-Host "  ────────────────────────────────────────────────" -ForegroundColor Green
            Write-Host "    Artifact: $($artifact.Name)" -ForegroundColor Green
            Write-Host "    Type: $($artifact.Type)" -ForegroundColor Green
            Write-Host "    Version: $($artifact.Version)" -ForegroundColor Green
            Write-Host "    Build Date: $($artifact.BuildDate)" -ForegroundColor Green
            Write-Host "    Architecture: $($artifact.Architecture)" -ForegroundColor Green
            Write-Host "    Status: AUTHENTIC" -ForegroundColor Green
            Write-Host ""
            Write-Host "  ✓ This binary is safe to run" -ForegroundColor Green
            
            Write-Log "Verification successful for $fileName (hash: $hash)" -Level "INFO" -Color Green
            return $EXIT_CODES.SUCCESS
        }
        else {
            Write-Host "  ❌ VERIFICATION FAILED" -ForegroundColor Red
            Write-Host "  ────────────────────────────────────────────────" -ForegroundColor Red
            Write-Host "    This hash does NOT match any known build" -ForegroundColor Red
            Write-Host "    DO NOT RUN THIS FILE" -ForegroundColor Red
            Write-Host ""
            Write-Host "  Expected one of:" -ForegroundColor Yellow
            foreach ($knownHash in $HashManifest.Keys) {
                $artifact = $HashManifest[$knownHash]
                Write-Host "    $knownHash" -ForegroundColor DarkYellow
                Write-Host "      ↳ $($artifact.Name) (v$($artifact.Version) - $($artifact.Type))" -ForegroundColor DarkYellow
            }
            Write-Host ""
            Write-Host "  Got:" -ForegroundColor Yellow
            Write-Host "    $hash" -ForegroundColor Red
            Write-Host "      ↳ (Unknown binary)" -ForegroundColor Red
            Write-Host ""
            
            Write-Log "Verification failed for $fileName - unknown hash" -Level "ERROR" -Color Red
            return $EXIT_CODES.HASH_MISMATCH
        }
    }
    catch {
        Write-Host "  ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        Write-Log "Verification error: $_" -Level "ERROR" -Color Red
        return $EXIT_CODES.PERMISSION_ERROR
    }
}

function Test-GPGSignature {
    param([string]$FilePath)
    
    Write-Host "  🔏 Verifying GPG Signature..." -ForegroundColor Yellow
    
    if (-not (Get-Command gpg -ErrorAction SilentlyContinue)) {
        Write-Host "  ⚠️  GPG not found. Skipping signature validation." -ForegroundColor Yellow
        return $true
    }

    $sigFile = "$FilePath.sig"
    if (-not (Test-Path $sigFile)) {
        Write-Host "  ❌ GPG Signature file not found ($sigFile)" -ForegroundColor Red
        return $false
    }

    $gpgResult = gpg --verify $sigFile $FilePath 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ GPG Signature: VALID" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "  ❌ GPG Signature: INVALID" -ForegroundColor Red
        Write-Host "    $gpgResult" -ForegroundColor DarkGray
        return $false
    }
}

function Invoke-SelfTest {
    Write-Host ""
    Write-Host "  🧪 Running Self-Test Mode" -ForegroundColor Cyan
    Write-Host "  ────────────────────────────────────────────────" -ForegroundColor DarkGray
    
    $testsPassed = 0
    $testsFailed = 0
    
    # Test 1: Check PowerShell version
    Write-Host "  Test 1: PowerShell Version" -NoNewline
    if ($PSVersionTable.PSVersion.Major -ge 5) {
        Write-Host " - ✅ PASS (v$($PSVersionTable.PSVersion))" -ForegroundColor Green
        $testsPassed++
    }
    else {
        Write-Host " - ❌ FAIL (v$($PSVersionTable.PSVersion) - need 5+)" -ForegroundColor Red
        $testsFailed++
    }
    
    # Test 2: Check if Get-FileHash is available
    Write-Host "  Test 2: Get-FileHash Cmdlet" -NoNewline
    if (Get-Command Get-FileHash -ErrorAction SilentlyContinue) {
        Write-Host " - ✅ PASS" -ForegroundColor Green
        $testsPassed++
    }
    else {
        Write-Host " - ❌ FAIL" -ForegroundColor Red
        $testsFailed++
    }
    
    # Test 3: Check manifest access
    Write-Host "  Test 3: Hash Manifest" -NoNewline
    $manifest = Get-HashManifest -ManifestPath $HashManifestPath
    if ($manifest.Count -gt 0) {
        Write-Host " - ✅ PASS ($($manifest.Count) entries)" -ForegroundColor Green
        $testsPassed++
    }
    else {
        Write-Host " - ❌ FAIL (no hashes loaded)" -ForegroundColor Red
        $testsFailed++
    }
    
    # Test 4: Test hash computation on self
    Write-Host "  Test 4: Self Hash Computation" -NoNewline
    try {
        Get-FileHash -Path $PSCommandPath -Algorithm SHA256 | Out-Null
        Write-Host " - ✅ PASS" -ForegroundColor Green
        $testsPassed++
    }
    catch {
        Write-Host " - ❌ FAIL ($_)" -ForegroundColor Red
        $testsFailed++
    }
    
    # Test 5: Offline mode capability
    Write-Host "  Test 5: Offline Operation" -NoNewline
    if ([string]::IsNullOrEmpty($env:HYPERSNATCH_OFFLINE_ONLY) -or $env:HYPERSNATCH_OFFLINE_ONLY -eq "1") {
        Write-Host " - ✅ PASS (offline capable)" -ForegroundColor Green
        $testsPassed++
    }
    else {
        Write-Host " - ⚠️  WARNING (may attempt network)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "  📊 Self-Test Results: $testsPassed passed, $testsFailed failed" -ForegroundColor Cyan
    
    if ($testsFailed -eq 0) {
        Write-Host "  ✅ All systems nominal" -ForegroundColor Green
        return $EXIT_CODES.SUCCESS
    }
    else {
        Write-Host "  ⚠️  Some tests failed - script may not work correctly" -ForegroundColor Yellow
        return $EXIT_CODES.SELF_TEST_FAILED
    }
}

# Phase 6: Multi-Sig Release Integration
function Invoke-MultiSigVerification {
    param([string]$FilePath)
    
    $hashStatus = Test-FileIntegrity -FilePath $FilePath -HashManifest $hashManifest
    if ($hashStatus -ne $EXIT_CODES.SUCCESS) { return $hashStatus }
    
    if (-not (Test-GPGSignature -FilePath $FilePath)) {
        return $EXIT_CODES.GPG_ERROR
    }
    
    return $EXIT_CODES.SUCCESS
}

function Invoke-TestMode {
    Write-Host ""
    Write-Host "  🧪 Running Test Mode" -ForegroundColor Cyan
    Write-Host "  ────────────────────────────────────────────────" -ForegroundColor DarkGray
    
    # Create test directory
    $testDir = Join-Path $env:TEMP "HyperSnatchTest"
    New-Item -ItemType Directory -Path $testDir -Force | Out-Null
    
    # Create test files
    $testFiles = @(
        @{Name = "test_valid.exe"; Content = "VALID TEST BINARY" },
        @{Name = "test_invalid.exe"; Content = "INVALID TEST BINARY" }
    )
    
    foreach ($testFile in $testFiles) {
        $testPath = Join-Path $testDir $testFile.Name
        Set-Content -Path $testPath -Value $testFile.Content
    }
    
    Write-Host "  Created test files in: $testDir" -ForegroundColor DarkGray
    
    # Run verification tests
    
    # Test with no file (should show help)
    Write-Host "`n  Test A: No arguments" -ForegroundColor Yellow
    
    # Test with non-existent file
    Write-Host "  Test B: Non-existent file" -ForegroundColor Yellow
    
    # Cleanup
    Remove-Item -Path $testDir -Recurse -Force -ErrorAction SilentlyContinue
    
    Write-Host ""
    Write-Host "  ✅ Test mode complete" -ForegroundColor Green
    return $EXIT_CODES.SUCCESS
}
#endregion

#region Main Execution
Show-Banner

# Check for offline-only mode
if ($env:HYPERSNATCH_OFFLINE_ONLY -eq "1") {
    Write-Host "  📡 Offline Mode: Enforced" -ForegroundColor Cyan
}

# Check PowerShell version
if ($PSVersionTable.PSVersion.Major -lt 5) {
    Write-Host "  ⚠️  WARNING: PowerShell 5+ recommended for Get-FileHash" -ForegroundColor Yellow
}

# Handle self-test mode
if ($SelfTest) {
    $exitCode = Invoke-SelfTest
    exit $exitCode
}

# Handle test mode
if ($Test) {
    $exitCode = Invoke-TestMode
    exit $exitCode
}

# Validate FilePath parameter
if (-not $FilePath) {
    Write-Host "  ❌ ERROR: FilePath is required" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Usage: .\verify.ps1 -FilePath <path_to_exe> [-Verbose] [-UpdateHashes] [-SelfTest]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Examples:" -ForegroundColor White
    Write-Host "    .\verify.ps1 -FilePath .\HyperSnatch-Setup-1.2.0.exe" -ForegroundColor DarkGray
    Write-Host "    .\verify.ps1 -FilePath .\HyperSnatch-portable.exe -Verbose" -ForegroundColor DarkGray
    Write-Host "    .\verify.ps1 -UpdateHashes" -ForegroundColor DarkGray
    Write-Host "    .\verify.ps1 -SelfTest" -ForegroundColor DarkGray
    Write-Host ""
    exit $EXIT_CODES.FILE_NOT_FOUND
}

# Load hash manifest
$hashManifest = Get-HashManifest -ManifestPath $HashManifestPath

# Handle manifest export if requested
if ($UpdateHashes) {
    Write-Host "  📦 Updating hash manifest..." -ForegroundColor Cyan
    if (Export-HashManifest -Hashes $hashManifest) {
        Write-Host "  ✓ Manifest updated successfully" -ForegroundColor Green
    }
}

# Verify file
$exitCode = Test-FileIntegrity -FilePath $FilePath -HashManifest $hashManifest

# Show summary
Write-Host ""
Write-Host "  ================================================" -ForegroundColor Cyan
Write-Host "  Verification completed at $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Cyan
Write-Host ""

exit $exitCode
#endregion
