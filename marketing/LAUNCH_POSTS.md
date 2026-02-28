# Reddit & Hacker News Launch Posts

## Reddit — r/DataHoarder

**Title:** I built an offline tool that extracts direct download links from HTML source code — 40 file host decoders, zero cloud dependencies

**Body:**

Hey r/DataHoarder,

I've been working on a desktop tool called **HyperSnatch** that solves a specific problem: finding the actual download/stream URLs hidden inside file hosting pages.

**How it works:**
1. You view-source on a page (or use the included bookmarklet)
2. Paste the HTML into HyperSnatch
3. It scans for download links using 40 host-specific decoders
4. Outputs the direct URLs with confidence scores

**What makes it different:**
- **Offline-first** — runs entirely on your local machine, zero network requests during analysis
- **40 host decoders** — emload, kshared, mediafire, pixeldrain, mega, doodstream, streamtape, and 33 more
- **Deterministic** — same input always gives same output, verifiable via SHA-256
- **No eval()** — the entire engine uses zero eval() or Function() calls
- **No browser automation** — pure static analysis on HTML text, nothing headless

**It does NOT:**
- Execute JavaScript on target pages
- Make any HTTP requests
- Bypass DRM or access controls
- Download anything — it just finds the URLs

It's a forensic analysis tool, not a scraper.

**Pricing:** $39 one-time (Founders License). No subscription, no telemetry.

**Links:**
- Landing page: [your-url]
- Gumroad: https://cashdominion.gumroad.com/l/itpxg

Would love to hear feedback. AMA about the architecture.

---

## Reddit — r/selfhosted

**Title:** HyperSnatch — offline static analysis tool that decodes direct download URLs from 40 file hosts (no cloud, no telemetry)

**Body:**

Built something the self-hosted crowd might appreciate: a desktop app that analyzes HTML source code to find direct download/stream URLs hidden in file hosting pages.

**Key points for this community:**
- Runs 100% offline — air-gappable
- Zero telemetry, zero cloud
- Windows desktop app (Electron with context isolation)
- Exports to JSON/CSV/PDF with SHA-256 provenance
- 40 host-specific decoders (mediafire, mega, pixeldrain, etc.)

The workflow is: view-source → paste into HyperSnatch → get decoded URLs. It's static analysis — no browser automation, no puppeteer, no network requests.

$39 one-time, no subscription.

Gumroad: https://cashdominion.gumroad.com/l/itpxg

Happy to answer questions about the architecture or security model.

---

## Hacker News

**Title:** Show HN: HyperSnatch – Offline static analysis for extracting media URLs from HTML

**Body:**

HyperSnatch is a desktop tool that parses HTML source code to find direct download and streaming URLs embedded in file hosting pages.

The core engine (SmartDecode) uses 40 host-specific decoders, each with regex patterns tuned for services like emload, mediafire, pixeldrain, doodstream, etc. It scans for download buttons, CDN links, jwplayer configs, base64-encoded URLs, and obfuscated JS variables — all through static text analysis with zero eval().

Design decisions:
- Offline-first: no network requests during analysis
- Deterministic: same input → same output, SHA-256 verifiable
- Auth boundary detection: stops at login gates and premium paywalls
- Evidence logging: immutable audit trail for forensic use cases

The test suite has 58 tests covering URL normalization, DOM scanning, base64 decoding, iframe recursion (depth-limited to 3), packer unpacking, M3U8 parsing, auth boundary detection, and a security audit confirming zero eval() across all modules.

Built on Electron with context isolation, disabled Node integration, and IPC allowlisting.

$39 one-time. No subscription, no telemetry.

Landing: [your-url]
Source: [github-url]

---

## Reddit — r/digital_forensics

**Title:** Open-source-ish forensic tool: deterministic static analysis for HTML media resource mapping

**Body:**

Built a tool for our workflow. HyperSnatch does deterministic static analysis on HTML source code to map embedded media resource URLs. Useful for:

- **Digital evidence collection** — immutable evidence logs with timestamps
- **Source tracing** — maps obfuscated download links to CDN endpoints
- **Chain of custody** — SHA-256 verified output, same input always gives same result
- **Offline analysis** — air-gap compatible, zero network during analysis

40 host-specific decoders (file hosting + streaming services). Auth boundary detection stops analysis at login gates — won't accidentally touch protected resources.

Exports to JSON/CSV with full audit trails.

$39 Founders License (one-time). Built for researchers, not casual users.

https://cashdominion.gumroad.com/l/itpxg
