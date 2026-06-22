# HN Launch Post — HyperSnatch v1.6.11

**Title:** Show HN: HyperSnatch — offline evidence and stream intelligence workstation

---

**Body:**

HyperSnatch is a local-first Windows tool for decoding, organizing, signing, verifying, and sealing investigation artifacts. Everything hashed, nothing leaves your machine.

I've been building it for about a year. v1.6.11 is the first version I'd call genuinely launch-ready — a chain of hotfixes (v1.6.6 → v1.6.11) were all caught in pre-launch installer testing, which is the system working as intended.

**What it does:**

- Decode and capture evidence bundles from streams and URLs
- Build investigation cases: log findings, attach bundles, run infrastructure comparisons
- Sign and seal evidence packages with chain-of-custody records
- Map infrastructure graphs: hot nodes, bridge detection, cross-case correlation
- Trust registry: track and verify intelligence sources per case
- Workspace management: assign cases to analysts, manage teams
- Policy engine: enforce export/redact/seal rules at the operator level
- Everything local-first — no cloud dependency, no external calls during investigation

All investigation state is stored as a `.hsn` capsule with SHA256 hashes at every stage. The release ships with a proof record (SHA256 of installer + artifact, gate log).

**Why local-first matters for this use case:**

When you're investigating infrastructure incidents, stream captures, or sourcing questions, you don't want evidence touching a third-party cloud. HyperSnatch keeps everything on-disk in a sealed, verifiable format.

**Stack:** Electron + Node.js, Windows. 93 E2E Playwright tests.

HyperSnatch is a Proof Foundry product for local-first evidence, stream intelligence, release proof, and artifact verification.

**Download / verify:**
https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.6.11

SHA256 hashes in the release proof doc if you want to verify before running.

Happy to answer questions about the capsule format, the graph correlation approach, or the chain-of-custody model.
