# Security Policy

## Supported Versions

| Version | Status |
|---------|--------|
| 1.2.x   | ✅ Active — receiving security fixes |
| 1.1.x   | ⚠️ Security fixes only |
| < 1.1   | ❌ End of life |

## Verification Requirements

All HyperSnatch releases **MUST**:

1. **Include verification scripts** — `verify.ps1` and `verify_node.js`
2. **Provide SHA-256 checksums** — `SHA256SUMS.txt` and `MANIFEST.json`
3. **Be Ed25519 signed** — `manifest.sig` verified against `root_public_key.pem`
4. **Include Sigstore signatures** — cosign blob signatures on all `.exe` artifacts
5. **Generate SLSA provenance** — `provenance.json` with build metadata
6. **Build deterministically** — same source → same binary via `Dockerfile.repro`
7. **Pass CI tests** — `npm run test:ci` must succeed before release
8. **Be self-verifying** — users can verify entirely offline

## Binary Verification

```powershell
# PowerShell (Windows)
.\verify.ps1 -FilePath .\HyperSnatch-Setup-1.2.1.exe

# Node.js (cross-platform)
node verify_node.js HyperSnatch-Setup-1.2.1.exe
```

For the full verification walkthrough, see [docs/VERIFY_RELEASE.md](docs/VERIFY_RELEASE.md).

## Reporting a Vulnerability

### Contact

- **Email**: security@hypersnatch.dev
- **PGP Key**: Available at [keys.openpgp.org](https://keys.openpgp.org)
- **PGP Fingerprint**: Published in `release/verify/ROOT_FINGERPRINT.txt`

### What to include

- Detailed description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (if applicable)

### Response timeline

| Stage | Timeframe |
|---|---|
| Initial acknowledgement | 48–72 hours |
| Severity assessment | 5 business days |
| Patch or mitigation | 7–14 days |
| Coordinated disclosure | Up to 14 days after patch |

## Supply Chain Security

HyperSnatch implements the following supply chain protections:

- [x] Deterministic builds (pinned Node, Electron, lockfile)
- [x] Ed25519 manifest signatures
- [x] Sigstore artifact signatures
- [x] SLSA Level 2 provenance
- [x] Offline verification scripts
- [x] Append-only transparency log
- [x] Hardened CI permissions
- [x] Tag signature verification

For details, see [docs/SUPPLY_CHAIN_SECURITY.md](docs/SUPPLY_CHAIN_SECURITY.md).

## Security Principles

- **Zero Telemetry**: No data collection, no phone-home, no analytics
- **Offline First**: Core functionality works without internet
- **Verified by Default**: Integrity checking is built into the distribution model
- **Minimal Attack Surface**: 3 dependencies, Electron sandboxed, no plugins

Last updated: March 2026
