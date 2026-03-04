# Hacker News Launch Strategy & Drafts

## Selected Title:
*Show HN: Deterministic Electron release pipeline with verifiable builds*

---

## Draft Post

**Title:** Show HN: Deterministic Electron release pipeline with verifiable builds

**Link:** `https://github.com/Z3r0DayZion-install/hypersnatch`

**Comment Body (First Comment):**

I built a release pipeline for an Electron desktop app that avoids the usual "just trust this binary" model.

Every release artifact is reproducible, signed, and independently verifiable. 

The goal was to make it possible for anyone to confirm that the downloaded installer matches the exact source code used to build it, without relying on opaque CDNs or SmartScreen reputation heuristics.

The pipeline currently includes:
- Deterministic Docker build environment
- Signed Git tags
- SHA-256 artifact manifest (Double-Signed)
- SBOM generation
- Detached verification scripts

Verification only requires running a single command locally from the release directory:
```bash
./verify.sh HyperSnatch-Setup.exe
```

The hardest part of this was removing timestamp and metadata drift in the `electron-builder` packing phase. The packaging tools embed OS-dependent metadata and execution timestamps natively, so the Docker pipeline had to aggressively normalize the environment (`SOURCE_DATE_EPOCH`) to ensure the artifacts remain bit-for-bit deterministic across rebuilds.

I've linked to our Architecture overview and our Threat Model document in the repository.

I'm curious if anyone else here has experimented with reproducible desktop release pipelines or alternative verification approaches. Any feedback from people working on secure supply chains would be highly appreciated.
