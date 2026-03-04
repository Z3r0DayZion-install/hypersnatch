# Supply Chain Security

> How HyperSnatch protects against supply chain attacks.

## Protections Matrix

| Attack Vector | Protection | Implementation | Status |
|---|---|---|---|
| **Binary tampering** | SHA-256 hash verification | `verify.ps1`, `verify_node.js` | ✅ |
| **Manifest forgery** | Ed25519 detached signature | `sign_manifest.cjs` | ✅ |
| **CDN compromise** | Detached verifier ships separately | `release/verify/` kit | ✅ |
| **CI compromise** | Hardened permissions, tag verification | `release.yml` | ✅ |
| **Dependency injection** | `npm ci` from lockfile, pinned versions | `package-lock.json` | ✅ |
| **Artifact substitution** | Sigstore keyless signing | cosign in CI | ✅ |
| **Build non-determinism** | `SOURCE_DATE_EPOCH`, pinned toolchain | `Dockerfile.repro` | ✅ |
| **Silent releases** | Append-only transparency log | `release/transparency.log` | ✅ |
| **Provenance forgery** | SLSA attestation with CI metadata | `release/provenance.json` | ✅ |

## Supply Chain Security Checklist

- [x] Deterministic builds (`npm ci`, pinned Node 20.17.0, pinned Electron 28.3.3)
- [x] Pinned dependencies (lockfile, no `npm install`)
- [x] Offline verification (`verify.ps1`, `verify_node.js`)
- [x] Manifest hashing (`SHA256SUMS.txt`, `MANIFEST.json`)
- [x] Ed25519 manifest signatures (`manifest.sig`)
- [x] Sigstore artifact signatures (cosign)
- [x] SLSA provenance attestation (`provenance.json`)
- [x] Build reproducibility container (`Dockerfile.repro`)
- [x] Transparency log (`transparency.log`)
- [x] Hardened CI permissions (read-only defaults)
- [x] Tag signature verification in CI
- [ ] SLSA Level 3 (hermetic build — requires further isolation)
- [ ] Root key rotation procedure
- [ ] Key revocation mechanism

## Attack Scenarios

### 1. CDN Compromise

**Attack:** Attacker replaces `.exe` on download mirror.

**Detection:**
```powershell
.\verify.ps1 -FilePath .\HyperSnatch-Setup-1.2.1.exe
# ❌ VERIFICATION FAILED — hash mismatch
```

**Why it works:** The verifier compares against hashes committed to the Git repository, not the CDN. The attacker would need to compromise both the CDN and the Git repository.

### 2. CI Compromise

**Attack:** Attacker modifies GitHub Actions workflow to inject malicious code.

**Detection:**
- Tag signature verification rejects unsigned tags
- Transparency log shows unexpected entries
- Provenance metadata shows wrong commit hash
- Independent rebuild via `Dockerfile.repro` produces different hashes

**Mitigation:** Hardened CI permissions limit blast radius. Only `id-token: write` is granted for Sigstore.

### 3. Manifest Forgery

**Attack:** Attacker updates `MANIFEST.json` with hashes of malicious binary.

**Detection:**
```bash
node verify_node.js --verify MANIFEST.json --sig manifest.sig --pubkey root_public_key.pem
# ❌ SIGNATURE INVALID
```

**Why it works:** The manifest is Ed25519-signed. The attacker would need the private key to forge a valid signature.

### 4. Dependency Injection

**Attack:** Malicious npm package introduces backdoor via transitive dependency.

**Mitigation:**
- `npm ci` installs from lockfile only — no resolution
- Only 3 runtime/dev dependencies (minimal attack surface)
- Dependencies are pinned to exact versions
- `Dockerfile.repro` builds in isolated container

### 5. Key Compromise

**Status:** Root key rotation and revocation procedures are not yet implemented.

**Current mitigation:** Signing key is stored in CI secrets, never committed to the repository. Public key is published in `release/verify/root_public_key.pem`.

**Future work:**
- Define key rotation schedule
- Implement revocation list
- Add secondary/backup signing key
