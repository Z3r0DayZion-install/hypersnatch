# Multi‑Signature Release Verification

Upgrade release verification.

Pipeline:

build
→ deterministic artifact
→ SHA256 manifest
→ GPG signature
→ release bundle

verify.ps1 should validate:
1 artifact hash
2 manifest hash
3 signature authenticity
