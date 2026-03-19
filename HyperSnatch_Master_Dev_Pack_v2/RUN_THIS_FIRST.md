# RUN THIS FIRST (HyperSnatch Master Dev Pack)

**Build date:** 2026-03-05

This file is the shortest path to productive work. Follow it exactly.

## 0) What this pack is
You have:
- **Design specs** (`docs/`)
- **Real capture evidence** (`datasets/evidence_targets/`)
- **Agent task system** (`agents/`)
- **Offline training scripts** (`training/`)
- **Seed test targets** (`tests/`)

Goal: implement modules in a way that is **testable, explainable, deterministic**, and produces **forensic artifacts**.

---

## 1) Read order (do not skip)
1. `docs/ULTRA_LAB_MASTER.md` (mission + success criteria)
2. `docs/SYSTEM_MAP.md` (module boundaries + outputs)
3. `docs/MODULE_GRAPH.md` (dataflow)
4. `docs/CONFIDENCE_SCORING.md` (candidate ranking contract)
5. `docs/DESKTOP_UI_WIREFRAME.md` + `docs/UI_VISUAL_SYSTEM.md` (UI target)

Then:
6. Browse `datasets/evidence_targets/` to understand the artifact schema **in the wild**.
7. Read `agents/BUILD_TASKS.md` to see priority sequencing.

---

## 2) Golden rules (non-negotiable)
- **No silent behavior.** Every decision must produce an artifact + be explainable.
- **No network in tests.** Tests must run offline.
- **Deterministic outputs.** Same inputs → same outputs.
- **DRM is a STOP condition.** If EME/DRM is detected, output is *forensic report*, not bypass.
- **Small commits.** Each commit must be reviewable and pass tests.

---

## 3) Fast validation loop (offline)
### Step A: Extract patterns from evidence
```bash
python training/pattern_extractor.py datasets/evidence_targets out/patterns
python training/rule_generator.py out/patterns out/rules
```

### Step B: Inspect outputs
- `out/patterns/patterns.json`
- `out/rules/player_rules.json`
- `out/rules/site_rules.json`

These outputs define what the engine must learn to detect and classify.

---

## 4) What to build first (if you only do one thing today)
Build **HAR classifier** + **confidence scoring**.

Why:
- They unlock *everything else* (UI, stream candidate ranking, evidence reports, AI analyzer).

---

## 5) Definition of “done”
A task is done only when:
- unit tests exist and pass offline
- artifacts are emitted (JSON/MD)
- docs mention the new artifact schema
- a regression target in `datasets/evidence_targets/` is used in tests
