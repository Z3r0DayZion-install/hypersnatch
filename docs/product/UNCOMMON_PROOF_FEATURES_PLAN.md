# HyperSnatch — Uncommon Proof Features Plan

**Status:** Planning only. No code in this PR. This document defines a catalog of
rare / ownable / uncommon proof-first features and a safe, sequenced build order.

**Framing:** These are HyperSnatch-native, uncommon, ownable proof workflows. We do
**not** claim they have literally never been done — forensic and archive tools may
have pieces of any of them. The differentiator is the combination, the proof-first
honesty, and the local-first, no-network posture.

**North-star:** First Proof Rate, and now also **Re-Proof Rate** (how often a user can
independently re-verify what HyperSnatch produced).

**Lane slogan:** *Not just export. Re-prove.*

---

## 1. Feature catalog

### 1.1 Proof Passport (recommended first)
A single identity card for every active case / exported bundle.

Shown:
- in the app after sample load / export (a card)
- inside the exported bundle as `PROOF-PASSPORT.json`
- later surfaced in `VERIFY-HYPERSNATCH.html` (Offline Proof Capsule lane)

Fields:
```
Bundle ID            HS-YYYYMMDD-HHMMSS-XXXX
Case / source name
Created / exported    ISO timestamp
Artifacts            count
Hashes               count (e.g. 10)
Receipts             count
Verification         Clean / Failed / Not yet verified
Export status        Exported / Not exported
Offline verifier     Included / Planned
Cloud required       No
```

### 1.2 Prove It Again (recommended first)
After export, a button re-reads the exported bundle **from disk** and re-verifies it:
- expected files exist
- `SHA256SUMS.txt` entries match recomputed hashes
- receipts present
- no repo hygiene files present (`.git*`, `README.md`, `Thumbs.db`, `.DS_Store`)

Output:
```
Still clean.
10/10 hashes verified.
No missing files.
No unexpected repo files.
```
Psychologically huge: the user watches HyperSnatch independently re-prove its own
output, with zero trust required.

### 1.3 Proof Bundle Diff (later)
Compare two exported bundles: added / removed / changed-hash / unchanged files,
receipt diffs, manifest diffs. Evidence changes over time; this says exactly what
changed between captures. Not in the first PR unless trivially small.

### 1.4 Evidence Nutrition Label (later)
An honest proof-quality summary card: artifacts, hashes, receipts, replay available,
exportable, offline verifier included, network required, cloud upload, risk / needs-
review state. No fake scores — only facts the app can actually assert.

### 1.5 Receipt Explanation Mode (later)
Each receipt gets plain-English text: *what this receipt proves*, *what it does not
prove*, *how to verify it*. Proof-first and honest; important for non-technical users.

### 1.6 Offline Proof Capsule (later)
Exported bundles include a self-contained `VERIFY-HYPERSNATCH.html` that lets anyone
drag/drop the bundle files and confirm hashes/receipts/manifest with no HyperSnatch
install and no network. (Detailed in the earlier capsule task.)

### 1.7 Tamper Trial (later)
A "Test This Proof" button copies a bundle to a temp dir, performs safe tamper tests
(modify one byte, remove one file, alter one receipt field, alter one manifest field),
and shows that each is detected. Never touches the real bundle.

### 1.8 Vanish Watch / Source Drift (later, network-gated)
Re-check a captured public URL and write a "was vs now" drift receipt (Same / Changed
/ Gone / Redirected / Blocked / Unavailable). Honest recheck only — no login bypass, no
anti-bot bypass, no stealth scraping, no legal/court claims. This is the only lane that
introduces network behavior and must be carefully scoped and opt-in.

---

## 2. Build order

```
1. Proof Passport + Prove It Again   <- first implementation PR
2. Offline Proof Capsule
3. Tamper Trial
4. Proof Bundle Diff
5. Evidence Nutrition Label
6. Receipt Explanation Mode
7. Vanish Watch / Source Drift        (network-gated; last)
```

Rationale for #1 first: builds directly on the v1.6.15 export workflow, no network,
low risk, very strong trust payoff, easy to prove with the packaged export, and it
makes every export feel unique.

---

## 3. Recommended first PR — Proof Passport + Prove It Again

**PR title:** `Add proof passport and reverify export workflow`

### Scope
- **Proof Passport card** in the renderer, populated after sample load and after
  export (Bundle ID, counts, verification status, export status, offline-verifier
  status, cloud-required: no).
- **`PROOF-PASSPORT.json`** written into the exported bundle by the export routine.
- **Prove It Again** button that re-verifies the exported bundle from disk and reports
  hash matches, missing files, and unexpected repo files.

### Likely files
- `ui/hypersnatch-ui.html` — passport card markup + Prove It Again button + IDs.
- `ui/hypersnatch-ui.js` — populate passport, wire Prove It Again, toasts/feedback.
- `scripts/ui_smoke_check.js` — new required IDs.
- `src/main.js` + `src/preload.js` — **likely required** for two IPC channels:
  - `reverify-export-bundle` (read a bundle dir, recompute SHA256SUMS, check files)
  - extend `export-proof-bundle` to also write `PROOF-PASSPORT.json`
- `docs/release/` — short receipt/notes if useful.

> Note: unlike Lanes 1–2, this lane **will touch `main.js`/`preload.js`** (new IPC +
> passport write). That means a full packaged CDP smoke is mandatory, following the
> established IPC pattern: channel in `ALLOWED_IPC_CHANNELS`, `validateIPCChannel` +
> invoke wrapper, `ipcMain.handle`, `app.isPackaged` path base.

### Bundle ID format
`HS-YYYYMMDD-HHMMSS-XXXX` where `XXXX` is a short hash of the bundle contents (e.g.
first 4 hex of the SHA256 of the sorted `SHA256SUMS.txt`), so the ID is deterministic
and tied to the proof, not random.

### PROOF-PASSPORT.json shape (draft)
```json
{
  "schema": "hs-proof-passport/1",
  "bundleId": "HS-20260622-214830-8F3A",
  "caseName": "Example Vendor — Quarterly Report (demo)",
  "createdAt": "2026-06-22T21:48:30Z",
  "counts": { "artifacts": 5, "hashes": 10, "receipts": 3 },
  "verification": "clean",
  "exported": true,
  "offlineVerifier": "planned",
  "cloudRequired": false
}
```
The passport must be **added to `SKIP_NAMES`-aware accounting** so it is itself listed
in `SHA256SUMS.txt` (it is a proof file), keeping the existing "all bundle files hashed"
invariant intact. Decide during implementation whether the passport's own hash is
included (it should be, like other proof files).

---

## 4. Hard rules (apply to every lane here)

Do **not**:
- bump version, tag, publish, or change release artifacts
- claim court-certified or chain-of-custody
- add AI analysis
- add crawler/downloader behavior (except the explicitly scoped, opt-in Vanish Watch)
- break the sample workspace (must still load **5/5/1**)
- break the receipt viewer
- break Export Proof Bundle
- regress PR #61 toasts/recent-activity or PR #62 theme system

---

## 5. Acceptance (first PR)

Packaged proof must confirm:
```
Open app
Open Sample Proof Workspace            -> 5/5/1
Proof Passport appears (Bundle ID, counts, status)
Export Proof Bundle
Export includes PROOF-PASSPORT.json
SHA256SUMS still verifies (now includes passport)
Click Prove It Again
Result re-verifies the exported bundle from disk
N/N hashes verified
No missing files
No repo hygiene files found
Receipt viewer still works
Themes still apply (PR #62) ; toasts/recent activity still work (PR #61)
0 console errors
0 CSP violations
```

### Required gates
```
npm run verify:ui
npm test
npm run verify:asar
```
Plus **mandatory packaged CDP smoke** (because main/preload change): app opens,
sample 5/5/1, passport visible, export writes PROOF-PASSPORT.json, Prove It Again
re-verifies from disk, receipt viewer works, themes/toasts intact, 0 console errors,
0 CSP violations.

---

## 6. Risks & mitigations
- **main/preload surface area** (new IPC) — follow the existing validated IPC pattern;
  keep handlers pure (read + hash + compare), no writes outside the chosen export dir.
- **Bundle ID stability** — derive from content hash so re-export of identical content
  is reproducible; include timestamp prefix for human readability.
- **SHA256SUMS invariant** — adding `PROOF-PASSPORT.json` must update the hash manifest
  so the bundle stays fully self-consistent; verify the count math (the demo bundle
  goes from 10 hashed proof entries to 11 once the passport is included).
- **Packaged rebuild flakiness** — known locked-dist / signing issues; kill all
  HyperSnatch/electron procs and clear both userData dirs before packaged runs.

---

## 7. Out of scope for the first PR
Proof Bundle Diff, Evidence Nutrition Label, Receipt Explanation Mode, Offline Proof
Capsule, Tamper Trial, and Vanish Watch are all deferred to their own lanes per the
build order above.
