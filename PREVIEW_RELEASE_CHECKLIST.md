# HyperSnatch Workstation (Phase 4 Gemini Pack) Preview Checklist

Here are the deliverables integrated into this preview release for User evaluation.

## 1. Loader & Validation Core
- **`src/bundle/validateBundle.js`**: Validates evidence schemas and outputs array configurations, dropping warnings for missing optional fields like `certaintyTier`. Hashes the whole directory against `manifest.json`.
- **`src/bundle/loadEvidenceBundle.js`**: Synchronous loader that guarantees validation before allowing data into the active store.

## 2. Parsed State Store
- **`src/state/parsedBundleStore.js`**: Singleton memory store that maps the raw valid artifacts (Player, Candidates, Manifest) into a hardened schema UI controllers can consume safely.

## 3. UI Workstation Shell
- **`ui/hypersnatch-ui.html`**: A clean CSS-grid layout defining the Left Rail, Tab Pane (Summary, Candidates, HAR, Report), Right Intelligence Panel, and Bottom Dock.

## 4. Test Matrix
- **`tests_phase4/test_phase4.js`**: A headless Node script running explicitly offline, validating the `ParsedBundleStore` loading `target_2_hls` into a unified UI mockup structure. Achieved 13/13 passing integrations.

## 5. Sample Bundle Recommendation
- **Target Folder:** `tests/evidence/target_2_hls`
- **Why:** This bundle successfully extracts an HLS candidate stream with full protocol, DRM, and Player analysis, meeting all Phase 3 strict reporting requirements.
