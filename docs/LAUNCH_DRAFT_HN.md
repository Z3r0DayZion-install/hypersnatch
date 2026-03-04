# Hacker News Launch Strategy & Drafts

> Compiled from `01_HACKER_NEWS_PLAYBOOK.md`
> **Target Timeline:** Day 1 Launch (14:00–16:00 UTC Tuesday-Thursday)

## Title Strategy
Use curiosity. Avoid the product name. Lead with the technical thesis.

**Selected Title:**
*Show HN: Reproducible desktop builds with offline cryptographic verification*

**Alternative Titles:**
- *Ask HN: Would you verify a desktop binary offline before running it?*
- *Show HN: Shipping Verifiable Windows Binaries Without Trusting the Developer*

---

## Draft Post

**Title:** Show HN: Reproducible desktop builds with offline cryptographic verification

**Link:** `https://github.com/Z3r0DayZion-install/hypersnatch`

**Comment Body (First Comment):**
Hi HN,

I build an offline forensic media extraction tool for Windows (built on Electron). Unsigned `.exe` files trigger massive SmartScreen warnings, and paying hundreds of dollars for an EV Code Signing certificate feels like paying an extortion fee for "reputation" rather than actual security. 

Instead of buying a certificate, I wanted to see if I could build a mathematically verifiable, zero-trust distribution pipeline that eliminates the need to trust me entirely.

The pipeline achieves a fully reproducible deterministic build. Here's how the verification works:

1. **Deterministic Builds:** The CI environment uses pinned toolchains and strictly enforces `npm ci --ignore-scripts` to neutralize dependency post-install RCE vectors.
2. **Double-Signature Verification:** The release hashes are collected in a manifest, which requires a **Two-Party Signature**: one from the CI environment (keyless), and one from an air-gapped developer GPG key.
3. **Zero-Dependency Verification:** We ship a bundle of zero-dependency verifiers (`verify.ps1`, `verify.sh`, `verify.py`) alongside the binary. You run one locally, and it verifies the signature and hash offline in about 2 seconds.
4. **Verifier Tampering Protection:** To prevent the verifier scripts themselves from being compromised on the mirror, their canonical hashes are hard-anchored in the repo's README.

If you don't want to run the verifier, you can run the `verify_repro.sh` script, and Docker will build the exact bit-for-bit binary locally to prove the CI wasn't poisoned. We also implemented an append-only transparency log.

I've written a detailed Threat Model and Attack Surface document explicitly detailing the vectors this *doesn't* protect against (e.g. compromised build hosts). 

I'd love feedback on the pipeline architecture. Is the friction of running an offline verification script too high for the average technical user, or does the architectural rigor provide enough trust to bridge that gap?
