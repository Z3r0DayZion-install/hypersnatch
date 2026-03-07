# First 10 Commits Plan (HyperSnatch)

This is the minimum sequence to turn specs + evidence into a working, testable product core.
Each commit should be small, atomic, and include tests.

---

## Commit 1 — Repo scaffolding + contracts
**Add**
- `src/contracts/ArtifactSchema.md` (names + required fields)
- `src/contracts/ModuleOutputs.md` (what each module emits)
- `src/utils/fs_determinism.js` (stable JSON stringify, sorted keys, LF endings)
**Tests**
- snapshot tests proving stable JSON output

---

## Commit 2 — Evidence bundle loader
**Add**
- `src/evidence/loadEvidenceBundle.js`
- parses a target folder and returns a typed object:
  - dom_snapshot_path
  - har_path
  - config_path
  - trace_path
**Tests**
- loads at least 2 targets from `datasets/evidence_targets/`

---

## Commit 3 — HAR parser + request normalizer
**Add**
- `src/har/parseHar.js`
- `src/har/normalizeRequest.js` (URL, method, status, mime, headers presence)
**Tests**
- parse deterministic fields from HAR in evidence dataset

---

## Commit 4 — HAR classifier (manifest/segment/key/license/etc.)
**Add**
- `src/har/classifyRequest.js`
- output: `har_classified.json`
**Tests**
- confirm .m3u8/.mpd detected as manifest/playlist
- confirm segment extensions detected as segment

---

## Commit 5 — Candidate URL extractor (HAR + trace + config)
**Add**
- `src/detect/extractCandidateUrls.js`
- dedupe + stable sort
**Tests**
- ensure stable ordering and repeatable output

---

## Commit 6 — Confidence scoring engine
**Add**
- `src/detect/scoreCandidates.js` implementing `docs/CONFIDENCE_SCORING.md`
- output: `stream_candidates.json` with `score` + `explanation[]`
**Tests**
- score bands + penalties behave as specified

---

## Commit 7 — Player fingerprint matcher v1
**Add**
- `src/fingerprint/loadFingerprints.js`
- `src/fingerprint/matchPlayer.js` using DOM text scan + script signatures
- output: `player_profile.json`
**Tests**
- detect at least one framework from evidence dataset

---

## Commit 8 — Evidence report generator (MD)
**Add**
- `src/report/generateReport.js`
- output: `report.md` summarizing:
  - player, protocol, candidates, DRM/MSE status, notable requests
**Tests**
- deterministic report (stable ordering)

---

## Commit 9 — Evidence integrity hash pack
**Add**
- `src/report/integrity.js` produces `integrity.json` (sha256 per artifact)
**Tests**
- hashes stable; missing file causes explicit error

---

## Commit 10 — Minimal UI shell wiring
**Add**
- simple panel UI that can open an evidence bundle and display:
  - candidates table + score
  - player profile
  - network request list (classified)
**Tests**
- smoke test build + render (no network)

---

## Exit criteria after 10 commits
You can:
- load evidence bundles
- classify requests
- extract and score stream candidates
- fingerprint players
- generate deterministic forensic reports
- view the results in a minimal forensic UI
