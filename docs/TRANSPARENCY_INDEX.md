# Transparency Index

> Public, immutable projection of the `release/transparency.log`.

This document tracks every authenticated release of HyperSnatch, providing an unbroken cryptographic chain of custody. By comparing this index against the repository's `transparency.log` and the GitHub Release tags, auditors can verify that no silent or substituted releases have occurred.

---

## 📜 Releases

| Version | SHA-256 | Manifest Sig | Provenance | Build Container |
|---|---|---|---|---|
| `v1.2.2` | *[Pending]* | `manifest.sig` | `provenance.json` | `Dockerfile.repro` |
| `v1.2.1` | *[See SHA256SUMS.txt]* | `manifest.sig` | `provenance.json` | `Dockerfile.repro` |

*Note: For the exact immutable timestamps and commits, run `git log -- release/transparency.log`.*

## 🔒 Verification

To verify the integrity of the Transparency Log itself:

```powershell
# Validate the commit history of the transparency log
git log -- release/transparency.log
```

If a release is missing from this page but exists elsewhere, or if a hash differs from this index, **the release is likely compromised**.

## 🛑 Incident Response
No key compromise or silent release incidents recorded. See [KEY_COMPROMISE.md](KEY_COMPROMISE.md).
