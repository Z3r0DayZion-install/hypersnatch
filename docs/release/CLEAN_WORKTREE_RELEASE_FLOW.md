# Clean Worktree Release Flow

Date: March 19, 2026

Current stable release context: `v1.5.9`  
Current hardening context: `release-readiness/v1.5.10-hardening`

## When To Use This

Use this flow whenever local `main` is dirty, untrusted, or ahead/behind in a way that can contaminate release proof.

## Preconditions

- PR to `main` is merged
- intended release commit SHA is known
- required release gates are defined

## Safe Flow

1. Fetch remote truth.

```powershell
git fetch origin
```

2. Confirm merged head contains the intended release commit.

```powershell
git rev-parse origin/main
git merge-base --is-ancestor <release-commit-sha> origin/main
```

3. Create clean throwaway worktree from `origin/main`.

```powershell
git worktree add ..\HyperSnatch_release_proof origin/main
cd ..\HyperSnatch_release_proof
git status --short --branch
```

4. Run release gates in clean worktree.

**Option A — single command (recommended):**
```powershell
npm install
npm run release:gate
```
`release:gate` runs: `preflight → test → verify:ui → build:wrapper → verify → audit:stable` in sequence, stops on first failure, and prints a clear PASS/FAIL summary.

**Option B — manual sequence:**
```powershell
npm install
npm run preflight
npm test
npm run verify:ui
npm run build:wrapper
npm run verify
npm run audit:stable
```

5. Verify release truth alignment.

```powershell
node -p "require('./package.json').version"
type VERSION.json
type docs\PROJECT_STATUS.md
git status --short
```

6. Confirm setup/assumption truth packet is aligned before tagging.

```powershell
type docs\release\V1_5_10_SETUP_TRUTH_MATRIX.md
type docs\release\V1_5_10_ENVIRONMENT_ASSUMPTIONS.md
type docs\release\V1_5_10_CLAIM_TO_PROOF_MAP.md
```

7. Tag only after all gates pass.

```powershell
git tag -a vX.Y.Z <release-commit-sha> -m "HyperSnatch vX.Y.Z release"
git push origin vX.Y.Z
```

8. Hash final release artifact.

```powershell
certutil -hashfile <artifact-path> SHA256
```

## Required Proof Record

Capture all of the following in `docs/release/RELEASE_PROOF_vX.Y.Z.md` and release notes:

- merge/release commit SHA
- tag object SHA
- artifact name
- artifact SHA256
- gate command results
- release URL
- forensic snapshot tag reference
