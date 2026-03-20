# HyperSnatch Status Summary

Current stable release: `1.4.1` (live)
Current prerelease target: `1.5.0-beta.1` (expansion workflow beta)

Core platform status:
- Phase 6 Runtime Forensics: complete
- Phase 7 Intelligence Layer: complete
- Operator UI v1.5 expansion workflow: merged to main via PR #13
- Beta identity alignment: in-progress on `release-readiness/v1.5.0-beta.1`

Release discipline status:
- `v1.3.1`, `v1.4.0`, and `v1.4.1` proof chains are immutable and preserved
- `v1.4.0-alpha.1` and `v1.4.0-beta.1` remain frozen prerelease checkpoints
- v1.5 beta/stable lines require clean-worktree proof before tagging

Current v1.5.0-beta.1 focus:
- version identity alignment across package, runtime metadata, UI fallback, and docs
- artifact naming alignment (`HyperSnatch_Vanguard_v1.5.0-beta.1.zip`)
- deterministic UI acceptance checks (`npm run verify:ui`)
- full branch gate pass before PR and clean-main proof before tag
