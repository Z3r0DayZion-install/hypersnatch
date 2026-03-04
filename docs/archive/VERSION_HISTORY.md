# HyperSnatch Version History

## [v1.1.0-Elite] - 2026-02-28

**The Sovereign Intelligence Upgrade**

This milestone transforms HyperSnatch from a static analyzer into a genre-creating **Airgapped Intelligence Console**, introducing local AI synthesis and machine-bound cryptographic integrity.

### Sovereign Intelligence Stack
*   **AI Witness (SLM Scaffolding):** Integrated a local intelligence engine capable of synthesizing human-readable forensic affidavits based on Merkle-root evidence.
*   **Sovereign Audit Chain (v3.2.0):** Implemented machine-bound HMAC session signing using hardware fingerprinting (CPU/MAC) and Perfect Forward Secrecy (PFS).
*   **Animated Sovereign Exfil:** Introduced a high-speed, chunked QR streaming protocol for physical data exfiltration over airgaps (screen-to-mobile).

### Security & Hardening
*   **Elite Sandboxing:** Full architectural refactor to eliminate direct Node.js access from the renderer. All core modules (SmartDecode, Vault, Journal) are isolated in the main process.
*   **ECDSA Trust Verification:** Real-time Elliptic Curve signature validation for release packs against the HyperSnatch Security Team master key.
*   **Truly Offline QR:** Replaced external API-based QR generation with a local, hardened generation engine in the main process.

### UI/UX Refinement
*   **Forensic Console 1.1:** Updated UI with real-time "SOVEREIGN TRUST" indicators and integrated AI Assistant/Airgap Exfil controls.
*   **Build Metadata:** Implemented a new production build tracking system (e.g., HS-PROD-2026-02-28).

## [v1.0.0-rc.1] - 2026-02-21

**The Founders Release Candidate**

This marks the first stable release candidate for the HyperSnatch commercial launch. It introduces the core offline-first static analysis engine and the SmartDecode 2.0 framework.

### Engine & Extraction
*   **SmartDecode 2.0:** Implemented deterministic, offline-first HTML static analysis engine.
*   **Heuristics:** Resolves M3U8 vectors and direct media resources via AST graph parsing.
*   **Integrity Reports:** Automatically generates cryptographically hashed `.manifest.json` reports alongside every payload for verifiable data provenance.
*   **No Execution Policy:** All extraction is performed purely via static traversal; no arbitrary JavaScript is executed during analysis.

### Desktop App (Electron)
*   **Zero-Telemetry:** Stripped all electron default network chatter. The app operates 100% off-grid.
*   **UI Parity:** The desktop app UI now matches all capabilities of the headless CLI.
*   **Frictionless Installer:** NSIS configured for `perMachine: false` to allow non-admin user installation without UAC prompts.
*   **Error Handling:** Scrubbed all stack traces from the UI for failed extractions, replacing them with clean "Extraction Engine Encountered Layout Change" messaging.

### Licensing & Commercialization
*   **Founders Edition Activation:** Integrated offline JSON license key validation for early adopters.

### Known Limitations (v1.x)
*   The NSIS executable hashes vary between builds due to Windows `makensis` timestamp embedding, though the application logic remains strictly deterministic.
*   Requires valid JSON config strings within payloads (will not guess broken JSON).

---

*Note: For the security policy and bug bounty guidelines relative to each version, refer to `POLICY.md`.*
