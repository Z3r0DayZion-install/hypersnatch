# ==================== NEURALLINK: MANUAL ACCEPT (K2) ====================
Write-Host "--- 🛡️ NEURALLINK: AWAITING INCOMING ---" -ForegroundColor Cyan

# List pending transfers to identify unknown PeerIDs
Write-Host "[RECON] Scanning for pending transfers..." -ForegroundColor Gray
& neural-link transfers list --status "awaiting_accept"

# Explicitly accept the transfer (K2 Security Policy)
$confirm = Read-Host "Accept pending transfer? (y/n)"
if ($confirm -eq 'y') {
    & neural-link recv --accept
    Write-Host "✅ Transfer Accepted. Transport Kernel engaged." -ForegroundColor Green
} else {
    Write-Host "❌ Transfer Rejected. Security Boundary maintained." -ForegroundColor Red
}
