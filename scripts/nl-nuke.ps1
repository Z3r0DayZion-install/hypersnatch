# ==================== NEURALLINK: EMERGENCY REVOKE (K2) ====================
param (
    [Parameter(Mandatory=$true)]
    [string]$PeerId
)

Write-Host "--- ⚠️ EMERGENCY: REVOKING TRUST FOR $PeerId ---" -ForegroundColor Red

# Blocks the peer in the registry and terminates active transfers
& neural-link devices revoke --peer "$PeerId"

Write-Host "--- 🛑 Peer $PeerId has been blacklisted. ---" -ForegroundColor DarkRed
