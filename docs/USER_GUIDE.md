# HyperSnatch v1.5.0 // Professional User Guide
## Security-First Evidence Analyzer for Digital Forensics

---

## 1. Introduction
HyperSnatch is a high-performance, airgapped forensic tool designed to extract, validate, and document digital evidence from HTML, HAR, and manual URL inputs. It prioritizes evidence integrity through the **Sovereign Audit Chain**.

## 2. Core Workflows

### Ingesting Artifacts
1. **URL Mode**: Paste a list of URLs directly into the input area.
2. **HTML Mode**: Paste raw HTML source code. HyperSnatch will scan for embedded links and hidden resources.
3. **HAR Mode**: Paste HTTP Archive (HAR) JSON data for deep traffic analysis.
4. **Drag & Drop**: Simply drop `.html` or `.har` files into the application.

### Resurrecting Links
Click **"Resurrect Links"** to initiate the SmartDecode 2.0 engine. The engine will:
- Parse the input for candidates.
- Apply security policy checks (Shield/Airgap).
- Score candidates based on confidence.
- Log all actions in the immutable Evidence Log.

### Batch Processing
For large datasets, use **"Decode All"**. This utilizes multi-threaded workers to process hundreds of items simultaneously while maintaining a stable UI.

## 3. Evidence & Reporting

### Inspecting Evidence
Open the **Evidence Inspection Drawer** (bottom right) to view a real-time log of all detections, validations, and policy refusals.

### Professional Exports
HyperSnatch supports multiple professional export formats for legal proceedings:
- **CSV**: Best for spreadsheet analysis and data ingestion.
- **JSON**: Complete evidence bundle including audit metadata.
- **TXT Report**: A structured, human-readable summary of the investigation.
- **PDF Report**: A professional, formatted report with headers and investigator attribution.

### Sovereign Audit Chain
Before concluding an investigation, use **"LOCK & SIGN INVESTIGATION"**. This generates a `.tear` bundle that is cryptographically signed, proving the evidence has not been tampered with since extraction.

## 4. Security Modes
- **Strict Mode**: Default. Enforces absolute compliance and blocks all premium/risky markers.
- **Audit Mode**: Logs policy violations but allows the operation to proceed.
- **Lab Mode**: For deep analysis in controlled environments.

## 5. Troubleshooting & FAQ

**Q: Why are some links showing 0% confidence?**
A: These are typically "detected" but not "validated". Check the Refusal Log to see if a policy shield blocked the validation.

**Q: Can I use HyperSnatch while connected to the internet?**
A: HyperSnatch is designed for airgapped use. While it can run online, **Airgap Mode** will actively block network requests to prevent evidence leaking or remote triggering.

**Q: How do I update the Security Policy?**
A: Strategy Packs can be imported via the settings menu, provided they are signed by a trusted authority.

---
*HyperSnatch v1.5.0 // Sovereign Authority Verified*
