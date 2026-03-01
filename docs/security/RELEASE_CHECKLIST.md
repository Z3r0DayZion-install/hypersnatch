# HyperSnatch v1.2 Vanguard Institutional Release Checklist

This checklist must be completed before any distribution marked as "Sovereign" or "v1.2+".

## 1. Trust & Authenticity
- [ ] **Code Signing:** Binary and Installer must be signed with a valid Authenticode certificate.
- [ ] **Timestamping:** Signatures must be timestamped against a trusted RFC 3161 server.
- [ ] **Audit Chain Verifier:** Standalone `verify_audit_chain.js` must be tested against a real signed report.

## 2. Security Hardening (Zero-Trust)
- [ ] **Sandbox Check:** Confirm Chromium sandbox is active in all processes.
- [ ] **Isolation Check:** Confirm `contextIsolation` is enabled and `nodeIntegration` is disabled.
- [ ] **Network Lockdown:** Verify `onBeforeRequest` and `onHeadersReceived` both block non-whitelisted traffic.
- [ ] **Disclaimer:** First-run legal disclaimer modal must be triggered and persist acknowledgement.

## 3. Resilience & Resource Envelope
- [ ] **Memory Benchmark:** Run `scripts/profile_memory.js` and ensure results align with `PERFORMANCE_ENVELOPE.md`.
- [ ] **Hostile Input:** Process a 100MB+ malformed artifact and confirm no V8 heap crashes.
- [ ] **Hardware Class Check:** Verify stable execution on a low-power workstation (2 cores, 4GB RAM).

## 4. Distribution Integrity
- [ ] **Deterministic Build:** Run `npm run build:repro` on two independent machines and compare SHA-256 hashes.
- [ ] **Source Manifest:** Confirm `VANGUARD_SOURCE_MANIFEST.json` matches the current source state.
- [ ] **Defender Scan:** Upload final installer to VirusTotal and confirm 0/XX detections.

## 5. Metadata & Documentation
- [ ] **Version Bump:** Confirm `package.json` and `VERSION.json` reflect `1.2.0`.
- [ ] **Governance:** Ensure `GOVERNANCE.md` is updated with latest forensic standards.
- [ ] **Hashes:** Publish final installer hash in `VANGUARD_RELEASE_HASHES.txt`.

---
*HyperSnatch Security Council - Vanguard Edition*
