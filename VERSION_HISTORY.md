# HyperSnatch Version History

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
