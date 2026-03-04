# Shipping Verifiable Windows Binaries Without Trusting the Developer

> An experiment in distributing verifiable desktop binaries using reproducible builds and detached verification.

## The Problem

Desktop software distribution on Windows fundamentally relies on trust and reputation, not security. 

If you compile a piece of software and distribute the `.exe`, modern operating systems treat it as actively malicious. Windows SmartScreen throws a terrifying red warning. Chrome blocks the download. Anti-virus engines flag it via heuristics. 

The industry's solution to this is **Extensive Validation (EV) Code Signing**. To get rid of the red screen, you must rent a hardware token from a centralized certificate authority, undergo enterprise KYC validation, and pay hundreds of dollars a year. Even if you do this, code signing only proves *who* signed the binary—it assumes the signing process or the developer's machine hasn't been compromised.

## The Goal

Allow users to mathematically verify a desktop binary offline in 60 seconds, without needing to trust the developer, the mirror, or the CI pipeline.

## Architecture Overview

We replaced reputation with rigorous cryptography to achieve a 10/10 supply-chain credibility score. If you don't trust us, you don't have to. The pipeline is built on five pillars:

1. **Deterministic Docker Build:** We strictly enforce toolchain versions (`Node 20.17.0`) and timestamps (`SOURCE_DATE_EPOCH`) inside a pinned `Dockerfile.repro`. We also enforce exact dependency lockfiles with `npm ci --ignore-scripts` to neutralize upstream RCE.
2. **Signed Manifests (Ed25519):** Instead of signing the `.exe` with Microsoft Certificates, we generate a manifest of SHA-256 hashes and sign it with an offline, air-gapped Ed25519 key (`maintainer.sig`), plus an automated Keyless Sigstore signature attached to our CI identity (`manifest.sig`).
3. **Reproducibility Script:** A single-command `verify_repro.sh` script rebuilds the binary locally to prove it matches the distributed hash.
4. **Offline Verification Tools:** We ship zero-dependency verification scripts (`verify.sh`, `verify.ps1`, `verify.py`, `verify_node.js`) bundled with the release.
5. **Transparency Index:** An append-only public ledger tracking the cryptographic provenance of every historical release.

## Verification Drill

Telling users to "just check the PGP signature" is a UX failure. We ship the verifiers next to the binary. From a fresh download, you only need to run one command:

```bash
./verify.sh HyperSnatch-Setup-1.2.2.exe
```

The script independently hashes the binary, verifies the Ed25519 signature of the manifest, and validates the match. It takes seconds and requires zero network calls. By doing this, you instantly defeat mirror tampering and silent substitution attacks.

## Reproducibility

Proving that a developer *signed* a binary doesn't prove the CI pipeline wasn't poisoned. To defeat CI-level injection attacks, anyone can clone the repository and run:

```bash
./verify_repro.sh v1.2.2
```

Docker will pull the exact toolchain, rebuild the source code from that tag, and output a binary whose SHA-256 hash matches the canonical signature perfectly.

## Threat Model

We believe in honest security engineering. Our architecture mitigates tampered downloads, forged manifests, CI pipeline injection, and dependency poisoning. 

**What it does NOT mitigate:**
- A compromised developer machine committing backdoored source code prior to a tagged release.
- Compromised user endpoints (if you run the verified binary on an already-infected machine, it's game over).
- SmartScreen false positives (you must trust the offline hash verification over Microsoft's reputation heuristics).

## Conclusion

We built this pipeline for HyperSnatch, an offline media forensic tool, but the distribution architecture itself is entirely agnostic and open-source.

We invite engineering critique and feedback. If you can break the trust model, we want to know. 

**Read the architecture docs and verify the latest release:** 
[github.com/Z3r0DayZion-install/hypersnatch](https://github.com/Z3r0DayZion-install/hypersnatch)
