# Implementation Guardrails

These rules keep the repo from drifting into garbage.

## 1. No fake completeness
Do not mark a subsystem complete unless:
- code exists
- tests exist
- artifacts are emitted

## 2. No hidden heuristics
Every score or detection must be explainable.

## 3. No architecture drift
Do not invent new top-level folders outside `REPO_FILE_TREE.md`.

## 4. No online tests
The evidence dataset is the main offline testbed.

## 5. No DRM circumvention
DRM detection is allowed.
Bypass logic is out of scope.

## 6. No UI fluff
The product is an analyst console, not a landing page.

## 7. Preserve raw evidence
Never overwrite original evidence bundles.
Derived artifacts must go to `out/` or a separate export location.

## 8. Stable serialization
All JSON outputs must be deterministically ordered where practical.
