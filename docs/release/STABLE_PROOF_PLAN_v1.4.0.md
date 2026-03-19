# Stable Proof Plan v1.4.0

Date: 2026-03-19
Target tag: `v1.4.0`

## Branch Gate Requirements

Run on `release-readiness/v1.4.0-stable`:

```bash
npm test
npm run verify:ui
npm run verify
npm run build:wrapper
npm run audit:final
```

Note: `verify` checks `dist/` artifacts. In a clean worktree, run `build:wrapper` before the final `verify` assertion so artifact checks are meaningful.

## PR Rule

- PR title: `Release readiness: HyperSnatch v1.4.0 stable alignment and proof prep`
- merge strategy: merge commit only (no squash)

## Clean Merged-Main Proof

```bash
git fetch origin
git worktree add ../HyperSnatch_v1_4_0_stable_proof origin/main
cd ../HyperSnatch_v1_4_0_stable_proof

git status
npm test
npm run verify:ui
npm run verify
npm run build:wrapper
npm run audit:final
```

## Truth Checks

```bash
node -p "require('./package.json').version"
type VERSION.json
git status --short
```

Expected:
- `package.json` version = `1.4.0`
- `VERSION.json` version = `1.4.0`
- artifact exists: `dist/HyperSnatch_Vanguard_v1.4.0.zip`

## Stable Tagging

Tag only after clean merged-main proof is green:

```bash
git tag -a v1.4.0 <MERGED_MAIN_COMMIT_SHA> -m "HyperSnatch v1.4.0 release"
git push origin v1.4.0
```

## Hash Recording

```powershell
certutil -hashfile dist\HyperSnatch_Vanguard_v1.4.0.zip SHA256
```

## Release Notes Must Include

- merge commit SHA
- tag object SHA
- peeled tag commit SHA
- artifact filename
- artifact SHA256
- full clean-worktree gate results
- confirmation that proof ran from clean merged `origin/main`
