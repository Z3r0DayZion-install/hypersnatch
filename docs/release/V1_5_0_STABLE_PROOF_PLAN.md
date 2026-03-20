# v1.5.0 Stable Proof Plan

Date: 2026-03-19
Target tag: `v1.5.0`

## Stable Gate Rule

Stable is allowed only if:

- `v1.5.0-beta.1` completed with truthful identity and clean proof
- no real blockers remain in queue/case/report/export truth surfaces
- merged-main proof is green from a clean throwaway worktree

## Real Blockers for Stable

- queue lifecycle transition regressions
- case/report/export truth mismatch
- stale or false trust/readability state
- incomplete timeline/lineage rendering
- verify/build flakiness
- version/artifact identity mismatch
- broken keyboard/focus behavior in new workflow

## Branch and PR Discipline

- use merge commit only (no squash)
- no unrelated feature families in stable-readiness pass
- no premature version bump claims without proof

## Clean Merged-Main Proof (Stable)

```bash
git fetch origin
git worktree add ../HyperSnatch_v1_5_0_stable_proof origin/main
cd ../HyperSnatch_v1_5_0_stable_proof

git status
npm install
npm test
npm run verify:ui
npm run build:wrapper
npm run verify
npm run audit:final
```

## Stable Truth Checks

```bash
node -p "require('./package.json').version"
type VERSION.json
git status --short
```

Expected:

- `package.json` version: `1.5.0`
- `VERSION.json` version: `1.5.0`
- clean working tree
- artifact: `dist/HyperSnatch_Vanguard_v1.5.0.zip`

## Stable Tagging Sequence

```bash
git tag -a v1.5.0 -m "HyperSnatch v1.5.0"
git push origin v1.5.0
```

## Artifact Hash Capture

```powershell
certutil -hashfile dist\HyperSnatch_Vanguard_v1.5.0.zip SHA256
```

## Stable Release Record

Record and publish:

- merge commit SHA
- tag object SHA
- peeled tag commit SHA
- full merged-main gate results
- artifact filename + SHA256
- release URL
- lawful positioning/boundary statement retained
