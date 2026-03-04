# HyperSnatch

> HyperSnatch is a Windows desktop payload used to validate a detached verification distribution model: reproducible builds + signed manifests + offline verification.

![CI Status](https://img.shields.io/badge/CI-Passing-success)
![SLSA](https://img.shields.io/badge/SLSA-Level%202-blue)
![Sigstore](https://img.shields.io/badge/Signed-Sigstore-orange)
![Reproducible](https://img.shields.io/badge/Build-Reproducible-green)
![Integrity](https://img.shields.io/badge/Verification-Detached-blue)
![Architecture](https://img.shields.io/badge/Architecture-Zero%20Trust-purple)
![License](https://img.shields.io/badge/License-Proprietary-red)

## The Thesis

Software distribution architectures rely too heavily on trusted CDNs and OS-level reputation systems (SmartScreen, Gatekeeper) that act as opaque gatekeepers. 

This repository demonstrates a **sovereign distribution model** designed to shift trust from the distributor to mathematics.

Instead of trusting the download link, engineers can independently verify the payload using:
1. **[Deterministic Builds](docs/REPRODUCIBILITY.md)**: `npm run build:repro` yields bit-identical artifacts.
2. **[Signed Manifests](docs/VERIFICATION.md)**: Artifact hashes are auto-committed by CI.
3. **[Offline Verification](docs/VERIFICATION.md)**: A detached PowerShell script verifies the binary against the manifest entirely offline.

## Repository Structure

- `/src`, `/core`, `/modules` — The desktop payload (an offline forensic media URL extractor)
- `/dist` — Deterministic build outputs (when run locally)
- `/release/verify` — The verification kit (manifest, root key fingerprint, verifier scripts)
- `/docs` — Architecture proofs, threat model, and reproduction steps
- `/scripts` — Build, sign, and reproduction helper scripts

## Proof Architecture

Every claim in this repository is indexed and backed by evidence. If you are auditing this project, start here:

- **[Proof Index](docs/PROOF.md)** — The central directory of all claims and their evidence.
- **[Threat Model](docs/THREAT_MODEL.md)** — What we protect against (and what we explicitly don't).
- **[Reproducibility Guide](docs/REPRODUCIBILITY.md)** — How to trigger a bit-identical build.
- **[Verification Chain](docs/VERIFICATION.md)** — How trust flows from source to the user's machine.

## Quick Verify

To experience the verified distribution UX yourself:

1. Download an artifact and the verify kit from the latest GitHub Release.
2. Run the offline verifier:

```powershell
.\verify.ps1 -FilePath .\HyperSnatch-Setup-1.2.1.exe
```

Expected output: `✅ VERIFICATION SUCCESSFUL ... Status: AUTHENTIC`

For the full 8-step drill, see **[docs/VERIFY_10_MINUTE_DRILL.md](docs/VERIFY_10_MINUTE_DRILL.md)**.

## Trust Anchor

All release manifests are signed with Ed25519. The root public key fingerprint is:

```
B90B E0DB 35A2 8123 318E 9BCB FF0D ECB3 10B7 906B D538 C8F5 0541 3C8D 67E3 6CDC
```

Verify against: [`release/verify/ROOT_FINGERPRINT.txt`](release/verify/ROOT_FINGERPRINT.txt)

Key management policy: [docs/KEY_MANAGEMENT.md](docs/KEY_MANAGEMENT.md)

## The Payload (Forensic Media Extractor)

The application payload bundled in this distribution experiment is an offshore-grade, offline-first forensic media URL extractor built on Electron. 

It is designed for strict zero-telemetry environments and utilizes an internal "SmartDecode" engine to reconstruct media links from DOM snapshots without network calls. 

> **Note:** The payload requires a proprietary hardware-bound license to execute fully. This repository focuses on the *distribution* of that payload securely.

## Contributing

We welcome PRs that harden the deterministic build pipeline or improve the verification scripts. See our [Threat Model](docs/THREAT_MODEL.md) before submitting security-related changes.

## Security

Please report vulnerabilities directly via the process outlined in [SECURITY.md](SECURITY.md).

## License

PROPRIETARY. See [LICENSE](LICENSE) for details.