# HyperSnatch Demo Case

This guide explains the sample proof workspace at
[`samples/demo-case/`](../../samples/demo-case/README.md).

Purpose:

> A first-time user should understand HyperSnatch in under 60 seconds without
> needing real evidence.

## What it demonstrates

HyperSnatch turns a captured page and its download into a proof-backed record:

1. A fake captured web page (`captured-page/index.html`)
2. A visible download link on that page (`a#downloadLink`)
3. A fake downloaded artifact (`artifacts/sample-report.txt`)
4. SHA256 hashes of every file (`proof/SHA256SUMS.txt`)
5. A manifest (`proof/manifest.json`)
6. A receipt anchored to the manifest hash (`proof/receipt.json`)
7. A small proof pack (`proof/` folder, incl. page/download receipts)
8. Short docs explaining what the user is looking at (this file + the README)

## Suggested 60-second walkthrough

1. Open `samples/demo-case/captured-page/index.html` and note the visible
   **Download sample report** link.
2. Open `samples/demo-case/proof/page-receipt.md` to see the preserved page
   context and file hashes.
3. Open `samples/demo-case/proof/download-receipt.md` to see the link captured
   with its resolved path, filename, and content hash.
4. Optionally run the verification snippet in the README to confirm the hashes.

## Content rules

Synthetic and copyright-safe only. No real news/media pages, no third-party
copyrighted HTML, no private or legal data, and no live external dependencies.

## Honest claims

The demo preserves a verifiable static reconstruction of a captured page and a
receipt-backed record of a download link. It does not perfectly recreate live
websites and does not bypass logins, DRM, expiring tokens, anti-bot challenges,
private APIs, or server-side permission checks.

## Follow-up: optional in-app "Open Demo Case" hook

A Workbench "Open Demo Case" button was intentionally **not** added in this lane.

Reasoning: the renderer loads real evidence through Electron IPC
(`electronAPI.getForensicSnapshot`), and there is no clean, low-risk path today
to load a bundled local sample workspace into that flow from the browser-only
renderer. Adding a half-wired button would either mislead users or require a
non-trivial main-process/IPC refactor, which is out of scope for a demo lane.

Proposed follow-up (separate branch) if/when desired:

- Add a `getDemoSnapshot()` (or a `loadDemoCase()`) path in the Electron main
  process that reads `samples/demo-case/` and returns the same shape as
  `getForensicSnapshot()`.
- Expose it via `preload.js` and wire a small Workbench "Open Demo Case" button
  to it, gated behind the existing evidence-loaded flow.
- Cover it with a focused test and keep `verify:ui` green.

Until then, this docs/sample workspace stands on its own and is fully
reviewable.
