# Clean Worktree Release Flow

Date: March 19, 2026

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

```powershell
npm install
npm test
npm run verify:ui
npm run build:wrapper
npm run verify
npm run audit:final
npm run audit:stable
```

5. Verify release truth alignment.

```powershell
node -p "require('./package.json').version"
type VERSION.json
type docs\PROJECT_STATUS.md
git status --short
```

6. Tag only after all gates pass.

```powershell
git tag -a vX.Y.Z <release-commit-sha> -m "HyperSnatch vX.Y.Z release"
git push origin vX.Y.Z
```

7. Hash final release artifact.

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
