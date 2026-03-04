# HyperSnatch Vanguard (v1.2) - Operator's Manual

Welcome to the Sovereign-Tier Forensic Environment. HyperSnatch is designed for low-friction, high-fidelity static analysis of complex HTML and HAR artifacts. 

This guide outlines the standard operating procedures for field agents and forensic consultants.

---

## 1. System Initialization & Licensing
HyperSnatch uses a decentralized, offline Key Management System (KMS). Your license is tied strictly to your physical workstation.

### Step 1.1: Retrieve Hardware Node ID
1. Launch HyperSnatch.
2. In the top-left header, locate the **ID** pill (e.g., `ID a1b2c3d4e5f6...`).
3. Click the pill. Your full Hardware Fingerprint will be copied to your clipboard.
4. Securely transmit this ID to your authorizing commander/founder.

### Step 1.2: Activate License
1. Once you receive your `license_<name>_<id>.json` file, place it securely on your workstation.
2. Click the **Activate Edition** pill in the top-right header.
3. Select your `.json` license file.
4. The system will cryptographically verify the signature and bind the Elite/Sovereign features to your instance.

---

## 2. The Legal Shield & Disclaimer
Upon first launch, you will be confronted with the **Forensic Analysis Terms** modal. 

**CRITICAL:** HyperSnatch is a static analysis tool, *not* a downloader. You must legally certify that you have the authority to analyze the target artifacts. By clicking "I Acknowledge & Agree to Terms," you cryptographically sign your intent into the `policy.json` configuration.

---

## 3. Core Operations: Artifact Ingestion

### Mode A: Raw HTML Paste (Targeted Extraction)
1. In your browser (or analysis VM), inspect the source code of the target page.
2. Copy the entire DOM or the specific suspicious `<script>` block.
3. Paste the raw text into the primary HyperSnatch input window.
4. Click **Decode Evidence**.
5. The `SmartDecode` engine will traverse up to 3 layers of obfuscation (Base64, iframes) to present the buried artifacts.

### Mode B: HAR File Ingestion (Network Analysis)
1. Export a `.har` (HTTP Archive) file from your browser's network tab while navigating the target environment.
2. Open the `.har` file in a raw text editor and paste the JSON blob into HyperSnatch.
3. The engine will automatically identify it as a network archive, extracting not only requested URLs but also **buried links inside JSON/HTML response payloads**.

---

## 4. Understanding The Extraction Grid

Once processed, artifacts are displayed in the main grid. 

*   **Type Badges:** Quickly identify if a link is a `VIDEO` (mp4/hls), `DOCUMENT` (pdf), or a generic `LINK`.
*   **Certainty Tiers:**
    *   <span style="color: #16a34a; font-weight: bold;">High (85%+)</span>: Deterministic match. Highly likely to be the core artifact.
    *   <span style="color: #ca8a04; font-weight: bold;">Moderate (50-84%)</span>: Buried or heuristically reconstructed link.
    *   <span style="color: #dc2626; font-weight: bold;">Low (<50%)</span>: Generic links found in the DOM; requires manual review.

### The Cash Policy Shield (Refusals)
At the bottom of the screen, you will see the **Refusals** log. The engine proactively blocks extraction from recognized boundaries (e.g., Paywalls, Age Verifications, Login screens). This protects your operational legal standing. 

---

## 5. Enterprise Safe-Mode
When operating in high-stress environments, click the **Safe Mode: OFF** button to toggle it to **ON**. This instantly strips the UI of all branding, status pills, and padding, leaving only a high-density data grid.

---

## 6. The Sovereign Audit Chain (Exporting)

When the analysis is complete, you must secure the evidence.

1. Click **Export Security Report**.
2. Save the resulting PDF or HTML file to your designated case folder.

### What Happens During Export?
1. The engine calculates a **Merkle Root (Fingerprint)** of all extracted URLs.
2. It signs this fingerprint using an **HMAC-SHA256** key derived from your specific Hardware ID.
3. The resulting signature is printed on the report, proving that *this specific machine* generated the report at *that specific time* without tampering.

### Final Freeze (Data-at-Rest Vault)
If you utilize the `final-freeze` command via the IPC Bridge or Headless CLI, HyperSnatch will encrypt the raw artifacts using **AES-256-GCM** tied to your hardware key, creating a `.vault` file. 

To decrypt this evidence later on the same machine, use the included Node utility:
```bash
node scripts/vault_unlock.js <path_to_freeze_folder> <Your_Hardware_ID>
```

---
*End of Operator's Manual*