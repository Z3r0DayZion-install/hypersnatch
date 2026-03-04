# HyperSnatch Performance Envelope (v1.2)

This document defines the operational boundaries and resource constraints for the HyperSnatch Vanguard engine. Investigators and consultants should use these metrics to assess workstation compatibility and expected processing times.

## 🛡️ Resource Constraints

| Metric | Guaranteed Boundary | Peak Observed (Stress) |
| :--- | :--- | :--- |
| **Max Artifact Size** | 200 MB | 250 MB |
| **Heap Usage (V8)** | < 512 MB | ~248 MB (120MB Artifact) |
| **Processing Time** | < 1s per 10MB | ~13.8s (120MB Hostile) |
| **Recursion Depth** | Hard Cap: 3 | 10 (pre-cap test) |
| **Concurrency** | Single-threaded Static | N/A |

## 💻 Hardware Recommendations

### Minimum (Field Laptop)
*   **CPU:** 2 Cores (e.g., Intel i3 / Apple M1)
*   **RAM:** 4 GB (App footprint ~300MB)
*   **Storage:** 500 MB free space (Portable Mode)

### Recommended (Forensic Workstation)
*   **CPU:** 4+ Cores (e.g., AMD Ryzen 5 / Intel i7)
*   **RAM:** 8 GB+
*   **Storage:** High-speed NVMe for large HAR log analysis

## 🧪 Scalability Proof
HyperSnatch utilizes a **2MB Dynamic Chunking** strategy. Instead of loading massive documents into a single regex buffer (which causes V8 heap exhaustion), the engine segments the payload, processes forensic layers independently, and re-assembles the audit chain.

*   **10MB Baseline:** 211ms execution.
*   **100MB Baseline:** 1.5s execution.
*   **120MB Hostile:** 13.8s (including de-obfuscation and recursion recovery).

## ⚠️ Degradation Behavior
*   **Memory Pressure:** If the system RAM is critical, the engine will prioritize the `Rust Engine` fallback, which operates outside the V8 heap for better memory efficiency on massive HAR files.
*   **Timeout:** Large base64 blobs (>16MB) are processed in background workers to prevent UI freezing during analysis.

---
*Verified on Windows 10 (x64) - March 2026*
