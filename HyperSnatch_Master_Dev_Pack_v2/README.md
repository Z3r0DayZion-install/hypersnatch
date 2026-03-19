# HyperSnatch Master Dev Pack

**Build date:** 2026-03-05

This is the single consolidated pack intended for coding agents (Gemini/Codex/etc.) and human operators.

## Included
- `/docs` — Ultra Lab + God Architecture + UI specs + test harness spec
- `/schemas` — example fingerprint schemas
- `/datasets/evidence_targets` — real capture artifacts (DOM snapshot, HAR, player config, runtime trace) organized by target
- `/training` — scripts to extract fingerprints and generate starter rules from evidence artifacts
- `/tests` — target list seeds + harness conventions
- `/agents` — task system + prompts + execution rules
- `/ops` — release + verification notes (placeholders for your repo’s real files if desired)

## How to use this pack
1) Start with `docs/ULTRA_LAB_MASTER.md` and `docs/DESKTOP_UI_WIREFRAME.md`.
2) Inspect real datasets under `datasets/evidence_targets/`.
3) Run training scripts:
   - `python training/pattern_extractor.py datasets/evidence_targets out/patterns`
   - `python training/rule_generator.py out/patterns out/rules`
4) Use `agents/BUILD_TASKS.md` to assign workstreams to coding agents.

## Non-goals
This pack does **not** include DRM circumvention. If DRM/EME is detected, the expected output is **forensic detection + reporting**.
