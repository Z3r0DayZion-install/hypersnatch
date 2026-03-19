# HyperSnatch Status Summary

Current version: 1.3.1 Sovereign

Core achievements:
- offline integrity verification (verify.ps1)
- deterministic builds
- cryptographic hash anchors

Forensic capabilities:
- timeline reconstruction
- adaptive bitrate ladder extraction
- waterfall clustering
- CDN fingerprinting
- token pattern analysis

GUI:
- Electron forensic dashboard
- secure IPC bridge
- .hyper snapshot bundles

Phase status:
- Phase 6 Runtime Forensics: complete
- Phase 7 Intelligence Layer: complete

Current release blockers (release-readiness branch):
- SmartDecode multi-link compatibility drift (`batch/jobs` vs legacy `candidates/best`)
- dead npm script targets removed/replaced
- fixture drift in `tests/run_tests.js` normalized to deterministic output
- final sovereign audit now validates actual artifact roots (`dist/` or legacy release path)
