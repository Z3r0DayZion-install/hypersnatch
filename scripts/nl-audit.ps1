# ==================== NEURALLINK: LIVE POLICY AUDIT ====================
Write-Host "--- 🔍 NEURALLINK: LIVE POLICY AUDIT ---" -ForegroundColor Cyan

# Tails the machine-parseable JSONL log and filters for critical events
& neural-link logs tail --follow | Select-String -Pattern "policy", "denied", "completed"
