# ==================== NEURALLINK: AIR-LOCK SEND (K1/K2) ====================
param (
    [Parameter(Mandatory=$true)]
    [string]$FilePath,
    
    [Parameter(Mandatory=$true)]
    [string]$PeerId
)

Write-Host "--- 🛡️ NEURALLINK: INITIATING SECURE SEND ---" -ForegroundColor Cyan

# Ensure file exists
if (!(Test-Path $FilePath)) {
    Write-Error "Target file not found: $FilePath"
    exit 1
}

# Execute Kernel Send (K1/K2 Requirement)
# Assumes 'neural-link' is available in path or aliased
& neural-link send "$FilePath" --to "$PeerId" --deleteAfter $true

Write-Host "--- ⏳ Offer expires in 60s ---" -ForegroundColor Yellow
& neural-link transfers status --follow
