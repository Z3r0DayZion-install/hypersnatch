# Security Policy

## 🔒 Supported Versions

| Version | Supported |
|---------|-----------|
| 1.2.x   | ✅ Active |
| 1.1.x   | ⚠️ Security fixes |
| < 1.1   | ❌ End of life |

## 🛡️ Verification Requirements

All HyperSnatch releases **MUST**:

1. **Include `verify.ps1`** – Offline binary verifier
2. **Provide SHA-256 hashes** – In release notes and manifest
3. **Build deterministically** – Same source → same binary
4. **Pass CI/CD tests** – Forensic core validation
5. **Be self-verifying** – Users can verify offline

## 🔐 Binary Verification Process

Every release undergoes:
- Deterministic build in GitHub Actions
- SHA-256 hash generation
- Self-verification with `verify.ps1`
- Hash manifest update
- Release with embedded verifier

## 📋 Verifying a Release

```powershell
# Step 1: Download the binary
# Step 2: Run the verifier (offline)
.\scripts\verify.ps1 -FilePath .\HyperSnatch-Setup-*.exe

# Expected output: "VERIFICATION SUCCESSFUL"
```

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability within HyperSnatch, please follow our responsible disclosure process.

### **Where to report**
Email: security@hypersnatch.dev
PGP Key: keys.openpgp.org

### **What to include**
- Detailed description of the vulnerability
- Step-by-step instructions to reproduce
- Potential impact
- Any suggested fixes or mitigations

### **What to expect**
- **48-72 hours**: Initial assessment and acknowledgement
- **7-14 days**: Expected time for a patch or mitigation
- **Up to 14 days**: Public disclosure (coordinated)

## 📜 Security Principles
- **Zero Telemetry**: We never collect data from your machine.
- **Offline First**: Core functionality must work without an internet connection.
- **Verified by Default**: Integrity checking is built into the distribution model.

Last updated: March 2026
