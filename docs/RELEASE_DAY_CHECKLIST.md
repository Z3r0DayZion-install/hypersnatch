# HyperSnatch Release Day Checklist (Security-Grade)

This is the exact sequence to execute a verifiable release. Follow this rigorously to maintain the 10/10 credibility score.

## 1. Freeze the Repository
Before tagging, make sure nothing accidental slips in. Verify the working tree is completely clean.
```bash
git status
# Must return: "nothing to commit, working tree clean"
```
Verify the commit hash and record it in `docs/PROOF.md`:
```bash
git rev-parse HEAD
```

## 2. Verify the Tag Is Signed
Create the release tag locally using GPG, not in the GitHub UI.
```bash
git tag -s v1.2.2 -m "HyperSnatch v1.2.2 – hardened release"
```
Confirm the signature:
```bash
git tag -v v1.2.2
```
This ensures the tag itself is cryptographically verified against your key.

## 3. Push the Tag (Trigger CI)
```bash
git push origin v1.2.2
```
Watch the GitHub Actions pipeline carefully. It will now verify the tag, build the artifact, generate the manifest, sign the manifest via Sigstore, produce SLSA provenance, update the transparency log, and create `verify-kit.zip`.

## 4. Confirm CI Integrity
Check the workflow output. If ANY of these fail, **DO NOT PUBLISH** the release:
- [ ] Tag signature verified
- [ ] Deterministic build completed
- [ ] Manifest signed
- [ ] Provenance generated
- [ ] Transparency log updated
- [ ] `verify-kit.zip` created

## 5. Download the CI Artifact Yourself
Download these directly from the draft GitHub release:
- `HyperSnatch-Setup-1.2.2.exe`
- `manifest.json`
- `manifest.sig`
- `verify-kit.zip`

Now test exactly like a user would.

## 6. Run the Verifiers
Run all verifiers locally against the downloaded artifact. All should report valid.
```bash
./verify.sh HyperSnatch-Setup-1.2.2.exe
node verify_node.js HyperSnatch-Setup-1.2.2.exe
```
```powershell
.\verify.ps1 -FilePath HyperSnatch-Setup-1.2.2.exe
```

## 7. Run the Reproducible Build
This is your strongest proof. Run the docker repro script to prove the CI build wasn't poisoned.
```bash
./scripts/verify_repro.sh v1.2.2
```
Confirm: `local build hash == release hash`. If they differ, abort the release.

## 8. Add Maintainer Signature (Two-Party Rule)
Sign the downloaded artifact offline to provide the Air-Gapped developer signature.
```bash
gpg --detach-sign HyperSnatch-Setup-1.2.2.exe
```
Upload the resulting `maintainer.sig` file (or `HyperSnatch-Setup-1.2.2.exe.sig` if GPG names it that) to the GitHub release draft. Users now verify two trust anchors: CI pipeline + Maintainer key.

## 9. Update Transparency Index
Update `docs/TRANSPARENCY_INDEX.md` with the new release data.
```markdown
| v1.2.2 | [SHA-256 Hash] | manifest.sig | provenance.json | Dockerfile.repro |
```
Commit and push this change to `main`.

## 10. Publish the GitHub Release
In the release description, paste your verification block prominently at the top:
> 🔒 Verify this release in 60 seconds
> ```bash
> ./verify.sh HyperSnatch-Setup-1.2.2.exe
> ```
List the root fingerprint below it. Publish the release.

## 11. Upload the Verification Video
Record yourself running through steps 6 & 7 on a clean VM. Don't use cuts. Upload the resulting 5-minute video to the `README.md` and the GitHub Release page. This proves the system works to a lazy auditor.

## 12. Post the Technical Article
Publish `docs/ARTICLE_VERIFIABLE_WINDOWS_BINARIES.md` to Dev.to or Hashnode.

## 13. Launch the Discovery Posts
Execute the staggered outreach sequence:
- **Day 1:** Hacker News (`LAUNCH_DRAFT_HN.md`)
- **Day 2:** Reddit (`LAUNCH_DRAFT_REDDIT.md`)
- **Day 3:** Share the Dev.to article on Twitter/LinkedIn.

## 14. Monitor the First 24 Hours
Watch the threads for:
- Verification issues
- Reproducibility questions
- Security critiques
Respond quickly and technically. Do not market the app; discuss the threat model.

## 15. Archive the Release Proof
Add a permanent record to `docs/PROOF.md` including the commit hash, release hash, manifest signature, and verification commands.
