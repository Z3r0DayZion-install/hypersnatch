# Post-v1.5.0 Reality Audit

Date: 2026-03-19
Branch: `post-release/v1.5.0-reality-audit`
Baseline: `origin/main` at `v1.5.0` line

## Evidence Run

Stable-order gate run in clean worktree:

- `npm install` PASS
- `npm test` PASS
- `npm run verify:ui` PASS
- `npm run build:wrapper` PASS
- `npm run verify` PASS
- `npm run audit:final` PASS

Targeted reproducibility check:

- `npm run verify` with `dist` removed: FAIL with explicit instruction to run `npm run build:wrapper` first (expected and truthful behavior).

## Triage (P0 / P1 / P2)

### P0

No confirmed P0 defects from current post-release audit evidence.

### P1

#### P1-1 Final audit hash verification is skipped without `SHA256SUMS.txt`

- Symptom: `npm run audit:final` reports `Hash verification: SKIPPED (SHA256SUMS.txt missing)`.
- Repro steps:
1. Run `npm run build:wrapper`
2. Run `npm run audit:final`
3. Observe hash verification skip line.
- User/operator impact: weakens proof depth; audit result can pass without checksum-file validation coverage.
- Likely fix: generate `SHA256SUMS.txt` during packaging or have audit compute and assert expected artifact hash directly.
- Belongs to: `v1.5.1`

#### P1-2 Final audit CLI check is skipped by current build profile

- Symptom: `npm run audit:final` reports `CLI: SKIPPED (artifact not present in current build profile)`.
- Repro steps:
1. Run `npm run build:wrapper`
2. Run `npm run audit:final`
3. Observe CLI skip line.
- User/operator impact: audit scope ambiguity; unclear whether CLI absence is expected policy or missing coverage.
- Likely fix: make audit profile explicit: either require CLI artifact or codify and assert "CLI intentionally excluded".
- Belongs to: `v1.5.1`

#### P1-3 Dependency hygiene warnings during clean setup

- Symptom: `npm install` emits deprecation/security-support warnings for transitive packages (`tar`, `glob`, `whatwg-encoding`).
- Repro steps:
1. Run `npm install` in clean worktree
2. Observe warnings in install output.
- User/operator impact: trust/reviewer confidence and enterprise posture friction; may become future compatibility/security debt.
- Likely fix: dependency tree refresh/pinning strategy and repeat full proof gates on updated lockfile.
- Belongs to: `v1.5.1`

### P2

#### P2-1 Rust build warning noise

- Symptom: `cargo` build emits `dead_code` warning for `infer_type`.
- Repro steps:
1. Run `npm run build:wrapper`
2. Observe Rust warning in build output.
- User/operator impact: low; does not break release behavior.
- Likely fix: remove unused function or annotate intentionally unused code.
- Belongs to: `v1.6.0` or opportunistic in `v1.5.1` if touched.

#### P2-2 Verify missing-`dist` check is truthful but not earliest-exit

- Symptom: `verify` fails correctly when `dist` is missing, but only after prerequisite file/dir checks.
- Repro steps:
1. Remove/rename `dist`
2. Run `npm run verify`
3. Observe late-stage failure message.
- User/operator impact: low; contract is truthful now.
- Likely fix: optional optimization to short-circuit build-output check earlier.
- Belongs to: `v1.6.0` unless hardening bandwidth allows.

## Audit Conclusion

Stable line is healthy for core execution, but there are real P1 proof/reproducibility issues worth a narrow hardening pass before new expansion scope.
