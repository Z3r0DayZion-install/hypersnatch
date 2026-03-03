# Reddit & Hacker News Launch Posts — v1.1.0-rc.1

## Reddit — r/DataHoarder

**Title:** I built an offline HTML media endpoint analyzer for forensic exports (Windows) — 40+ deterministic analyzers, DNS fallback, SHA-256 audit trails

**Body:**

Hey r/DataHoarder,

I've released a major update to **HyperSnatch** — an offline toolkit for deterministic HTML endpoint analysis and forensics.

**What's new in v1.1:**
- **40+ deterministic analyzers** — Every single one tested with extract() + resurrect() for local-first resource identification.
- **DNS Fallback** — when CDN hostnames get blocked, resolves via Cloudflare DNS-over-HTTPS. Offline cache so it works even when DoH is down.
- **Resource preview** — click any identified candidate to preview the media directly inside the app
- **Auto-copy** — best URL automatically copied to clipboard on decode
- **127 tests passing** — zero failures, zero network calls during analysis

**How it works:**
1. Capture raw HTML or HAR source code (using the included deterministic bookmarklet)
2. Import the source into HyperSnatch for local analysis
3. SmartDecode v3.1 scans for resource endpoints, encoded data-sources, and manifest pointers
4. Review ranked candidates with confidence scoring and forensic audit trails.

**Still true:**
- 100% offline analysis — no cloud, no telemetry
- Zero eval() in the entire codebase
- Deterministic — same input, same output, SHA-256 verifiable
- Auth boundary detection — stops at login gates and premium paywalls

$149 Founders License (One-time). No subscription.

Details: https://cashdominion.gumroad.com/l/itpxg

AMA about the architecture.

---

## Reddit — r/selfhosted

**Title:** I built an offline HTML endpoint analyzer — 40+ deterministic analyzers, DNS-over-HTTPS fallback. Zero cloud, zero telemetry, runs air-gapped.

**Body:**

Updated my offline HTML analysis tool. TL;DR: paste page source, identify embedded media endpoints.

**v1.1 highlights for r/selfhosted:**
- Air-gap compatible — entire analysis engine runs locally, zero outbound requests
- DNS Fallback via Cloudflare DoH (toggle in settings, off by default)
- 40 deterministic analyzers covering common HTML resource types
- In-app media preview — preview identified resources without opening another app
- Settings persist to localStorage — no config files, no dotfiles
- 127 automated tests, all passing

Windows desktop app. Electron with context isolation + disabled Node integration.

$149 one-time. Details: https://cashdominion.gumroad.com/l/itpxg

---

## Hacker News

**Title:** Show HN: HyperSnatch – Offline static analysis for HTML media endpoints, 40+ deterministic analyzers and DNS-over-HTTPS fallback

**Body:**

HyperSnatch is a desktop utility designed for technical researchers and OSINT analysts who need to identify and analyze embedded media endpoints within complex HTML artifacts.

v1.1 updates:

**SmartDecode 3.1.0** — the core engine now has 40+ deterministic analyzers, each implementing extract() for endpoint detection and resurrect() for DOM-level resource recovery. The ranker uses host-agnostic pattern boosts, multi-source tag multiplicity scoring, and URL deduplication.

**DNS Fallback** — when CDN hostnames are DNS-blocked, resolves via Cloudflare's DNS-over-HTTPS API. Includes an offline JSON cache with TTL, exponential backoff retry, and stale cache fallback. This is the only module permitted to make network requests.

**Resource Preview** — click any identified candidate to preview playback in an embedded `<video>` element. No external player needed.

**Test coverage:**
- 71 SmartDecode tests (URL normalization, DOM scanning, base64 decoding, iframe recursion, packer unpacking, M3U8 parsing, auth boundary detection, ranker logic)
- 16 DNS fallback tests (cache validity, resolve logic, retry, security checks)
- 40/40 analyzer proof (extract + resurrect for every analyzer)
- Zero eval(), zero network I/O in core modules

Architecture: Electron with context isolation, sandboxed rendering, IPC allowlisting. The analysis pipeline is deterministic — same input produces byte-identical output, verifiable via SHA-256.

$149 one-time. No subscription, no telemetry.

Landing: [your-url]

---

## Reddit — r/digital_forensics

**Title:** HyperSnatch — deterministic HTML media analysis with 40+ analyzers, DNS-over-HTTPS fallback, and forensic-grade audit trails

**Body:**

Updated the forensic analysis tool. v1.1 adds:

- **40+ deterministic analyzers** — extract() + resurrect() for all supported resource types
- **DNS Fallback (DoH)** — resolves CDN hostnames via Cloudflare DNS-over-HTTPS when standard DNS fails
- **Resource preview** — in-app media playback for identified candidates
- **Forensic Dashboard** — live dashboard showing engine version, analyzer count, session metrics

**Forensic capabilities:**
- Deterministic output — SHA-256 verifiable, same input always gives same result
- Auth boundary detection — stops at login gates, premium paywalls, signed URLs
- Immutable evidence logging with timestamps
- Export to JSON/CSV with forensic-grade audit trails
- 127 automated tests, zero network calls during analysis

$149 Founders License (one-time). Built for engineering-grade analysis.

Details: https://cashdominion.gumroad.com/l/itpxg

---

## Twitter/X Thread

**Tweet 1:**
🚀 HyperSnatch v1.2 just dropped.

40+ deterministic analyzers. DNS-over-HTTPS fallback. In-app resource preview. 127 tests passing.

Paste HTML source → identify embedded media endpoints. Offline. Deterministic. Zero eval().

$149 one-time → https://cashdominion.gumroad.com/l/itpxg

**Tweet 2:**
What's new in v1.1:
• 40+ deterministic analyzers for HTML resource identification
• DNS fallback via Cloudflare DoH (for when CDN names get blocked)
• Click-to-preview video player
• Auto-copy best URL to clipboard
• Settings drawer with toggle persistence

**Tweet 3:**
The test suite:
✅ 71 SmartDecode tests
✅ 16 DNS fallback tests
✅ 40/40 analyzer proof
= 127 validations, 0 failures

Zero network calls. Zero eval(). SHA-256 deterministic.

Built for researchers. Maintained by engineering. ⚡
