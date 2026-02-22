# Release Checklist - HyperSnatch v1.0.1

## Pre-Release Checklist

### ✅ Repository Hygiene
- [ ] `.gitignore` excludes: `dist/`, `RELEASE_EVIDENCE/`, `*.exe`, `*.zip`
- [ ] No large binaries tracked in Git
- [ ] Source-only repository state verified
- [ ] Tag `v1.0.1` points to correct commit

### ✅ Version Consistency
- [ ] `package.json` version is `1.0.1`
- [ ] Tag `v1.0.1` points to HEAD commit
- [ ] All version references updated in documentation

### ✅ Testing
- [ ] `npm ci` completed successfully
- [ ] `npm test` passes (17/17 tests)
- [ ] Security validation completed
- [ ] Build process tested

### ✅ Build Artifacts
- [ ] `HyperSnatch-Setup-1.0.1.exe` generated (72.7 MB)
- [ ] `HyperSnatch-Portable-1.0.1.exe` generated (168.6 MB)
- [ ] SHA256 hashes computed and verified
- [ ] Build artifacts stored in `dist/`

### ✅ Documentation
- [ ] Release notes prepared
- [ ] Build instructions updated
- [ ] Security posture documented
- [ ] Troubleshooting guide ready

## GitHub Release Process

### 1. Create Release
```bash
# Verify tag is correct
git rev-parse v1.0.1
git rev-parse HEAD

# Push source (if not already pushed)
git push origin main
git push origin v1.0.1
```

### 2. GitHub Release Creation
1. Go to: https://github.com/Z3r0DayZion-install/hypersnatch/releases/new
2. Tag: `v1.0.1`
3. Title: `HyperSnatch v1.0.1 - Security Hardening Release`
4. Description: Use content from `RELEASE_NOTES_1.0.1.md`

### 3. Upload Release Assets

Upload these 5 files in order:

#### Primary Assets
1. **HyperSnatch-Setup-1.0.1.exe** (72.7 MB)
   - Primary installer for users
   - SHA256: `B2A93F88385F300EF971C21C91867C7EA213C13D8C7779AAD8BCB87EAAC69023`

2. **HyperSnatch-Portable-1.0.1.exe** (168.6 MB)
   - Portable version for advanced users
   - SHA256: `bcadf7bd68c74bba682f516ffba667386c125a06960652b4be11688d6e2d3e03`

#### Verification Assets
3. **SHA256SUMS.txt**
   - Contains checksums for all binaries
   - Format: `hash filename`

4. **VERIFY_SHA256.ps1**
   - PowerShell script for hash verification
   - User-friendly verification process

5. **RELEASE_NOTES_1.0.1.md**
   - Comprehensive release documentation
   - Security improvements summary

### 4. Release Verification

#### Post-Upload Checks
- [ ] All 5 files uploaded successfully
- [ ] File sizes match expected values
- [ ] Download links work correctly
- [ ] Release page displays correctly

#### Hash Verification
```powershell
# Download and verify installer
Invoke-WebRequest -Uri "https://github.com/Z3r0DayZion-install/hypersnatch/releases/download/v1.0.1/HyperSnatch-Setup-1.0.1.exe" -OutFile "HyperSnatch-Setup-1.0.1.exe"
Get-FileHash HyperSnatch-Setup-1.0.1.exe -Algorithm SHA256

# Should match: B2A93F88385F300EF971C21C91867C7EA213C13D8C7779AAD8BCB87EAAC69023
```

## Post-Release Tasks

### ✅ Communication
- [ ] Release announcement prepared
- [ ] Security update summary drafted
- [ ] User notification channels updated

### ✅ Monitoring
- [ ] Download metrics tracking enabled
- [ ] Issue monitoring set up
- [ ] User feedback collection ready

### ✅ Maintenance
- [ ] Next version planning initiated
- [ ] Security monitoring continued
- [ ] Dependency updates scheduled

## Emergency Rollback Plan

If critical issues discovered:

1. **Immediate Actions**
   - Delete release if within first hour
   - Push hotfix commit
   - Create new tag (v1.0.1-hotfix)
   - Re-release with corrected version

2. **Communication**
   - Issue security advisory if needed
   - Notify users of issues
   - Provide workaround instructions

3. **Post-Mortem**
   - Document root cause
   - Update testing procedures
   - Improve release process

## Verification Commands

```bash
# Verify tag and commit alignment
git rev-parse v1.0.1
git rev-parse HEAD

# Verify remote state
git ls-remote --heads origin
git ls-remote --tags origin

# Verify no large files tracked
git ls-files | Select-String -Pattern ".exe"
git ls-files | Select-String -Pattern "dist/"
```

## Release Assets Summary

| Asset | Size | Purpose | Hash |
|-------|------|---------|------|
| HyperSnatch-Setup-1.0.1.exe | 72.7 MB | Primary installer | B2A93F88385F300EF971C21C91867C7EA213C13D8C7779AAD8BCB87EAAC69023 |
| HyperSnatch-Portable-1.0.1.exe | 168.6 MB | Portable version | bcadf7bd68c74bba682f516ffba667386c125a06960652b4be11688d6e2d3e03 |
| SHA256SUMS.txt | <1 KB | Hash verification | N/A |
| VERIFY_SHA256.ps1 | <1 KB | Verification script | N/A |
| RELEASE_NOTES_1.0.1.md | <5 KB | Documentation | N/A |

---

## 🎯 Release Ready

When all checklist items are complete:

✅ **HyperSnatch v1.0.1 is ready for production release**

*Security-hardened, tested, and verified for enterprise deployment.*
