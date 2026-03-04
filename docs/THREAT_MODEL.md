# Threat Model

> HyperSnatch v1.2.1 — Last updated March 2026

## Scope

This threat model covers the **distribution and verification pipeline** of HyperSnatch, not the forensic analysis payload itself. The goal is to ensure users can verify that the binary they received is identical to the one built in CI.

## Assets

| Asset | Description |
|---|---|
| **Build artifact integrity** | The `.exe` in `dist/` must be bit-identical to CI output |
| **Manifest integrity** | `MANIFEST.json` and `SHA256SUMS.txt` must not be forged |
| **Signing key integrity** | The JWK used for release gate reports must be protected |
| **User trust** | Users must be able to independently verify without trusting the distributor |

## Adversaries

| Adversary | Capability | Goal |
|---|---|---|
| **CDN / mirror compromise** | Replace hosted `.exe` with trojanized binary | Distribute malware via HyperSnatch brand |
| **CI compromise** | Modify GitHub Actions workflow or inject secrets | Produce signed but malicious artifacts |
| **MITM on download** | Intercept HTTP download (non-HTTPS) | Swap binary in transit |
| **Malware on user machine** | Modify binary after download | Bypass verification by altering both binary and verifier |
| **Insider / maintainer** | Push malicious commit or tag | Ship backdoored release |

## Trust Boundaries

```
TRUSTED                          UNTRUSTED
─────────────────────────────    ─────────────────────────
GitHub Actions runner            User's download channel
Source code (reviewed commits)   User's filesystem
npm lockfile (pinned deps)       Third-party CDN/mirror
Electron builder (pinned)        User's OS integrity
```

## Mitigations

| Threat | Mitigation | Implementation | Status |
|---|---|---|---|
| Binary tampering | SHA-256 hash comparison | `verify.ps1`, `verify_node.js` | ✅ Implemented |
| Manifest forgery | Ed25519 detached signature | `sign_manifest.cjs`, `manifest.sig` | ✅ Implemented |
| Supply chain (npm) | `npm ci` from lockfile, pinned versions | `package-lock.json`, Node 20.17.0 | ✅ Implemented |
| Supply chain (Electron) | Pinned `electron@28.3.3`, `electron-builder@24.13.3` | `package.json` devDependencies | ✅ Implemented |
| Artifact substitution | Sigstore keyless signing | cosign in `release.yml` | ✅ Implemented |
| CI compromise | Hardened permissions, tag verification, SLSA provenance | `release.yml`, `provenance.json` | ✅ Implemented |
| Build non-determinism | `SOURCE_DATE_EPOCH`, Docker container | `Dockerfile.repro` | ✅ Implemented |
| Silent releases | Append-only transparency log | `release/transparency.log` | ✅ Implemented |
| Runtime code injection | Electron sandbox: `contextIsolation`, `nodeIntegration: false` | `src/main.js`, preload bridge | ✅ Implemented |
| External script loading | CSP enforcement, navigation blocking | `security_hardening.js` | ✅ Implemented |
| DevTools tampering | F12/right-click blocked in release mode | `security_hardening.js` | ✅ Implemented |
| Key compromise | — | Rotation/revocation not yet defined | ⚠️ Partial |
| Compromised host OS | — | Out of scope | ⛔ Not claimable |
| SmartScreen reputation | — | Requires EV code signing certificate | ⛔ Not claimable |

## Compromise Scenarios

### Scenario 1: CI Compromise

**Attacker workflow:**
1. Attacker gains access to GitHub Actions (via compromised PAT or workflow injection)
2. Modifies `release.yml` to inject malicious code into build step
3. CI produces trojanized `.exe` with valid hashes (because CI generates the hashes)

**Detection:**
- Tag signature verification rejects unsigned tags
- Transparency log shows unexpected release entries
- `provenance.json` contains wrong commit hash — doesn't match tagged source
- Independent rebuild via `Dockerfile.repro` produces different artifact hashes
- Sigstore transparency log (rekor) records all signatures publicly

**Residual risk:** If attacker also compromises the signing key, detection relies on independent rebuild only.

### Scenario 2: Key Compromise

**Attacker workflow:**
1. Attacker obtains `release/keys/signing_key.pem`
2. Signs malicious manifest with valid Ed25519 signature
3. Publishes forged release with matching signature

**Detection:**
- Sigstore signatures use ephemeral keys (no long-lived key to steal)
- Transparency log entries can be cross-referenced with GitHub Actions run IDs
- Independent rebuild produces different hashes

**Current limitations:**
- No key rotation schedule defined
- No revocation mechanism
- No secondary/backup signing key

**Future mitigation:**
- Define 90-day key rotation
- Publish revocation list at `release/verify/revoked_keys.txt`
- Add backup key for emergency re-signing

### Scenario 3: Mirror / CDN Compromise

**Attacker workflow:**
1. Attacker compromises a download mirror or CDN
2. Replaces `.exe` with trojanized binary
3. User downloads compromised file

**Detection:**
```powershell
.\verify.ps1 -FilePath .\HyperSnatch-Setup-1.2.1.exe
# ❌ VERIFICATION FAILED — hash mismatch
```

**Why it works:** The verifier compares against hashes committed to the Git repository and signed by the Ed25519 root key. The attacker would need to compromise both the CDN *and* the signing key.

## Explicitly Out of Scope

- **Compromised user OS**: If the user's OS is rooted, verification is meaningless
- **SmartScreen / Gatekeeper**: Reputation-based blocking requires EV certificates and download volume
- **Network-level exfiltration**: HyperSnatch is offline-only — there is no network surface to attack
- **Side-channel attacks**: Not applicable to a desktop analysis tool

## Failure Modes

| Scenario | User sees |
|---|---|
| Binary hash doesn't match manifest | `❌ VERIFICATION FAILED — DO NOT RUN THIS FILE` |
| Ed25519 signature invalid | `❌ SIGNATURE INVALID — manifest may be tampered` |
| Manifest file missing | `⚠️ No manifest found — cannot verify` |
| Verifier script modified | Self-test fails: `❌ SELF TEST FAILED` |
| Sigstore verification fails | `❌ cosign verify-blob failed` |
| Release built outside CI | No matching hash in `SHA256SUMS.txt` |

## Future Hardening

- [x] SLSA Level 2 provenance attestation
- [x] Sigstore/cosign signatures on release artifacts
- [x] Ed25519 manifest signing
- [x] Transparency log
- [ ] SLSA Level 3 (hermetic build)
- [ ] Key rotation schedule (90-day)
- [ ] Key revocation mechanism
- [ ] Merkle tree over source files
- [ ] Hardware-bound license fingerprinting (CPU/MAC)
