# HN Launch Post — HyperSnatch v1.6.6

**Title:** HyperSnatch – offline evidence workstation with cryptographic proof at every step (v1.6.6)

---

**Body:**

I've been building HyperSnatch as an offline investigation platform for about a year. v1.6.6 is the first release I'd call properly complete at the UI layer.

**What it does:**

- Decode and capture evidence bundles from streams and URLs
- Build investigation cases: log findings, attach bundles, run infrastructure comparisons
- Sign and seal evidence packages with chain-of-custody records
- Map infrastructure graphs: hot nodes, bridge detection, cross-case correlation
- Trust registry: track and verify intelligence sources per case
- Workspace management: assign cases to analysts, manage teams
- Policy engine: enforce export/redact/seal rules at the operator level
- Everything local-first — no cloud dependency, no external calls during investigation

All investigation state is stored as a `.hsn` capsule with SHA256 hashes at every stage. The release itself ships with a proof record (SHA256 of installer + zip, gate log).

**Why local-first matters for this use case:**

When you're investigating infrastructure incidents, stream captures, or sourcing questions, you don't want your evidence touching a third-party cloud. HyperSnatch keeps everything on-disk in a sealed, verifiable format. You can reproduce the hash of any artifact at any point in the chain.

**Stack:** Electron + Node.js, Windows. 93 E2E Playwright tests. MIT-adjacent (proprietary, source-available).

**Download / verify:**
https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.6.6

SHA256 hashes in the release proof doc if you want to verify before running.

Happy to answer questions about the capsule format, the graph correlation approach, or the chain-of-custody model.
