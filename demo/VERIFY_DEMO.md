# Determinism Verification Demo

## Overview

HyperSnatch guarantees **deterministic static analysis**: the same input HTML always produces the exact same output manifest. This demo allows you to independently verify this claim.

## Files

| File | Description |
|------|-------------|
| `sample-payload.html` | A safe, static HTML sample containing embedded resource declarations |
| `EXPECTED_OUTPUT.json` | The exact manifest output HyperSnatch produces for this input |
| `manifest.json` | Pre-generated manifest with resource inventory |

## Verification Steps

### Step 1 — Download the Sample Payload

Download `sample-payload.html` from this directory.

### Step 2 — Run HyperSnatch Analysis

**GUI Method:**
1. Open HyperSnatch
2. Drag-and-drop `sample-payload.html` into the interface
3. Click **Export → JSON Manifest**
4. Save the output file

**CLI Method:**
```bash
hypersnatch analyze demo/sample-payload.html --output manifest_output.json
```

### Step 3 — Compute the SHA-256 Hash

**Windows PowerShell:**
```powershell
Get-FileHash -Algorithm SHA256 .\manifest_output.json | Select-Object Hash
```

**macOS / Linux:**
```bash
sha256sum manifest_output.json
```

### Step 4 — Compare Against Expected Output

Compare your computed hash against the hash of `EXPECTED_OUTPUT.json`:

```powershell
Get-FileHash -Algorithm SHA256 .\EXPECTED_OUTPUT.json | Select-Object Hash
```

If both hashes are identical, the determinism claim is verified: **same input → same output → same cryptographic hash**.

## Expected Resources Found

The sample payload contains the following detectable resources:

| Type | Resource | Location |
|------|----------|----------|
| CSS  | `/assets/app.min.css` | `<link>` preload + inline manifest |
| JS   | `/assets/runtime.min.js` | `<link>` preload + `<script>` tag |
| IMG  | `/assets/img/logo.svg` | `<img>` element |
| DOC  | `/docs/spec` | `<a>` hyperlink |
| API  | `/api/demo/status` | Inline script variable |
| API  | `/api/demo/config?mode=static` | Inline script variable |
| Data | Base64 encoded JSON blob | `window.__HS_DEMO__` config |

## Purpose

This demo exists to prove that HyperSnatch is a **mathematical analysis engine**, not a random or heuristic-based scraper. The deterministic guarantee is foundational to its use in professional forensic and compliance workflows where reproducibility is non-negotiable.
