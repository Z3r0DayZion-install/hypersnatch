# HyperSnatch Security Hardening (v1.2)

Institutional-grade forensic analysis requires a zero-trust architecture. This document outlines the defensive posture of the Vanguard release.

## 🧱 Process Isolation & Sandboxing
HyperSnatch operates with multi-layer sandboxing enforced via Electron's security API:

*   **Chromium Sandbox:** Enabled globally for all renderer processes.
*   **Context Isolation:** Strictly enforced (`contextIsolation: true`). The UI has zero access to Node.js internals or the host filesystem.
*   **Node Integration:** Disabled in all renderers (`nodeIntegration: false`). 
*   **Headless Isolation:** The PDF reporting window (`pdfWindow`) is stripped of all preloads and inter-process communication, preventing it from being used as a lateral movement vector.

## 🛡️ Network Lockdown (Firewall)
HyperSnatch is an **Offline-First** application. The following rules are enforced at the network request level:

*   **Global Block:** ALL external `http:`, `https:`, and `ws:` requests are intercepted and cancelled.
*   **Whitelist:** Only `file://` (internal UI components) and `127.0.0.1` / `localhost` (Internal IPC) are permitted.
*   **Telemetry:** Zero. No "phone home" checks, no usage tracking, and no cloud-based updates.

## 🔍 Forensic Extraction Guards
To prevent the analyst from accidentally weaponizing the workstation, the `SmartDecode` engine applies strict filtering post-extraction:

*   **Scheme Validation:** Post-normalization, artifacts are discarded unless they use `http:` or `https:`. This blocks `javascript:`, `data:`, `file:`, and UNC path injection attacks.
*   **Recursion Control:** A hard cap of **3 levels** is enforced for `srcdoc` iframe analysis. Depth management is internalized and cannot be influenced by the input artifact.
*   **Obfuscation Purge:** All self-modifying code, `eval()`, and dynamic `Function()` constructor calls have been removed from the extraction modules.

## 📜 Audit & Accountability
*   **Sovereign Audit Chain:** Every case report is cryptographically signed with a hardware-bound HMAC-SHA256 session key.
*   **Digital Signatures:** The production binaries are prepared for Authenticode signing, ensuring publisher legitimacy and reduced SmartScreen friction.

---
*Verified Security Posture - Vanguard v1.2*
