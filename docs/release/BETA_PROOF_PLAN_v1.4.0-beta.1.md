# Beta Proof Plan v1.4.0-beta.1

Date: 2026-03-19
Target tag: `v1.4.0-beta.1`

## Policy

- Do not tag from a dirty worktree.
- Do not use branch-only gates as release proof.
- Run proof only from a clean throwaway worktree on merged `origin/main`.

## Pre-PR Branch Gates

Run on `release-readiness/v1.4.0-beta.1`:

```bash
npm test
npm run verify:ui
npm run verify
npm run build:wrapper
```

## Merge Rule

- PR title: `Beta readiness: align v1.4.0-beta.1 version identity, packaging, and UI acceptance`
- Merge strategy: merge commit only (no squash)

## Clean-Worktree Proof (Post-Merge)

```bash
git fetch origin
git worktree add ../HyperSnatch_v1_4_0_beta_proof origin/main
cd ../HyperSnatch_v1_4_0_beta_proof

git status
npm test
npm run verify:ui
npm run verify
npm run build:wrapper
```

## Truth Checks

```bash
node -p "require('./package.json').version"
type VERSION.json
git status --short
```

Expected:
- `package.json` version: `1.4.0-beta.1`
- `VERSION.json` version: `1.4.0-beta.1`
- built artifact name: `HyperSnatch_Vanguard_v1.4.0-beta.1.zip`

## Tag Sequence

Tag only after clean-main proof stays green.

```bash
git tag -a v1.4.0-beta.1 -m "HyperSnatch v1.4.0-beta.1"
git push origin v1.4.0-beta.1
```

## Artifact Hash Capture

```powershell
certutil -hashfile dist\HyperSnatch_Vanguard_v1.4.0-beta.1.zip SHA256
```

## Release Sequence

1. Create GitHub prerelease for `v1.4.0-beta.1`.
2. Upload the exact artifact built from tagged commit.
3. Publish SHA256 in release notes.
4. Record final proof with:
   - merge commit SHA
   - tag object SHA
   - peeled tag commit SHA
   - full gate results on clean merged main
   - artifact filename + SHA256
   - release URL
