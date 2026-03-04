# Key Management

> Ed25519 signing key lifecycle for HyperSnatch release manifests.

## Root Key

| Property | Value |
|---|---|
| **Algorithm** | Ed25519 |
| **Fingerprint** | `B90B E0DB 35A2 8123 318E 9BCB FF0D ECB3 10B7 906B D538 C8F5 0541 3C8D 67E3 6CDC` |
| **Public key** | `release/verify/root_public_key.pem` |
| **Fingerprint file** | `release/verify/ROOT_FINGERPRINT.txt` |
| **Generated** | 2026-03-04 |

## Key Storage

| Location | Contains | Access |
|---|---|---|
| `release/keys/signing_key.pem` | Private key (local only) | Developer machine — **NEVER committed** |
| GitHub Secret `SIGNING_KEY_PEM` | Private key (CI only) | GitHub Actions — encrypted at rest |
| Encrypted offline backup (USB) | Private key backup | Physical — stored separately from dev machine |
| `release/verify/root_public_key.pem` | Public key | Public — committed to repository |

## What Is Authoritative

The **only** authoritative fingerprint is the one published in:

1. `release/verify/ROOT_FINGERPRINT.txt` (in the repository)
2. `README.md` → "Trust Anchor" section
3. `docs/PROOF.md` → Key Files table

If any source disagrees, the repository copy (`ROOT_FINGERPRINT.txt`) is canonical.

## CI Secret Configuration

The `release.yml` workflow reads the signing key from the GitHub Actions secret `SIGNING_KEY_PEM`.

**Security guarantees:**
- The key is never printed to logs (no `echo`, no `set -x`)
- The key is written to a temporary file during the signing step only
- The temporary file is not included in release assets
- Workflow permissions are read-only by default (`contents: read`)

### How to set the secret

```bash
# 1. Copy the PEM file content
cat release/keys/signing_key.pem | pbcopy   # macOS
# or
Get-Content release/keys/signing_key.pem | Set-Clipboard   # PowerShell

# 2. Go to GitHub → Settings → Secrets → Actions → New repository secret
# Name: SIGNING_KEY_PEM
# Value: (paste the PEM content)
```

## Rotation Procedure

**Schedule:** Every 12 months, or immediately on compromise.

### Planned Rotation

1. Generate new keypair: `node scripts/sign_manifest.cjs --generate-keys`
2. Archive the old public key: `mv release/verify/root_public_key.pem release/verify/root_public_key.2026.pem`
3. Copy new public key to `release/verify/root_public_key.pem`
4. Update `ROOT_FINGERPRINT.txt` with new fingerprint
5. Update `README.md` trust anchor section
6. Update `SIGNING_KEY_PEM` GitHub secret
7. Store old private key in archive (may be needed to verify old releases)
8. Commit and tag: `git tag -s key-rotation-YYYY-MM-DD`

### Emergency Rotation (Compromise)

1. **Immediately** revoke the GitHub secret
2. Generate new keypair
3. Create `release/verify/REVOKED_KEYS.txt` with the compromised fingerprint
4. Publish advisory: which releases are affected
5. Re-sign all affected manifests with new key
6. Follow planned rotation steps 3–8

## Compromise Procedure

If you suspect the signing key has been compromised:

1. **Revoke** the `SIGNING_KEY_PEM` GitHub secret immediately
2. **Generate** a new keypair offline
3. **Audit** recent releases — verify transparency log for unexpected entries
4. **Re-sign** legitimate manifests with the new key
5. **Notify** users via GitHub Security Advisory
6. **Update** all fingerprint anchors (README, PROOF.md, ROOT_FINGERPRINT.txt)
7. **Document** the incident in `release/verify/REVOKED_KEYS.txt`
