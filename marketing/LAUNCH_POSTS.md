# Reddit & Hacker News Launch Posts — v1.1.0-rc.1

## Reddit — r/DataHoarder

**Title:** HyperSnatch v1.1 — 40 host decoders, DNS fallback, in-app stream preview. Offline tool that finds real download links from HTML source.

**Body:**

Hey r/DataHoarder,

Dropped a major update to **HyperSnatch** — the offline tool that extracts direct download/stream URLs from file hosting page source code.

**What's new in v1.1:**
- **40 host decoders** — emload, kshared, mediafire, pixeldrain, mega, doodstream, mixdrop, streamtape, rapidgator, and 31 more. Every single one tested with extract() + resurrect().
- **DNS Fallback** — when CDN hostnames get blocked, resolves via Cloudflare DNS-over-HTTPS. Offline cache so it works even when DoH is down.
- **Stream preview** — click any decoded candidate to preview the video directly inside the app
- **Auto-copy** — best URL automatically copied to clipboard on decode
- **127 tests passing** — zero failures, zero network calls during analysis

**How it works:**
1. View-source on any file hosting page (or use the included bookmarklet to capture the live DOM)
2. Paste the HTML into HyperSnatch
3. SmartDecode v2.4.0 scans for download links, base64-encoded URLs, jwplayer configs, iframe sources
4. Get ranked results with confidence scores. Best URL auto-copied.

**Still true:**
- 100% offline analysis — no cloud, no telemetry
- Zero eval() in the entire codebase
- Deterministic — same input, same output, SHA-256 verifiable
- Auth boundary detection — stops at login gates and premium paywalls

$39 one-time. No subscription.

Gumroad: https://cashdominion.gumroad.com/l/itpxg

AMA about the architecture.

---

## Reddit — r/selfhosted

**Title:** HyperSnatch v1.1 — 40 file host decoders, DNS-over-HTTPS fallback, stream preview. Zero cloud, zero telemetry, runs air-gapped.

**Body:**

Updated my offline HTML analysis tool. TL;DR: paste page source, get direct download URLs.

**v1.1 highlights for r/selfhosted:**
- Air-gap compatible — entire analysis engine runs locally, zero outbound requests
- DNS Fallback via Cloudflare DoH (toggle in settings, off by default)
- 40 host-specific decoders — every major filehost and streaming platform
- In-app video player — preview decoded streams without opening another app
- Settings persist to localStorage — no config files, no dotfiles
- 127 automated tests, all passing

Windows desktop app. Electron with context isolation + disabled Node integration.

$39 one-time. https://cashdominion.gumroad.com/l/itpxg

---

## Hacker News

**Title:** Show HN: HyperSnatch v1.1 – Offline static analysis for HTML media URLs, now with 40 host decoders and DNS-over-HTTPS fallback

**Body:**

HyperSnatch is a desktop tool that parses HTML source code to find direct download and streaming URLs embedded in file hosting pages.

v1.1 updates:

**SmartDecode 2.4.0** — the core engine now has 40 host-specific decoders (emload, mediafire, mega, doodstream, mixdrop, etc.), each implementing extract() for URL detection and resurrect() for DOM-level link recovery. The ranker uses host-specific URL pattern boosts, multi-source tag multiplicity scoring, and URL deduplication.

**DNS Fallback** — when CDN hostnames are DNS-blocked, resolves via Cloudflare's DNS-over-HTTPS API. Includes an offline JSON cache with TTL, exponential backoff retry, and stale cache fallback. This is the only module permitted to make network requests.

**Stream Preview** — click any decoded candidate to preview playback in an embedded `<video>` element. No external player needed.

**Test coverage:**
- 71 SmartDecode tests (URL normalization, DOM scanning, base64 decoding, iframe recursion, packer unpacking, M3U8 parsing, auth boundary detection, ranker logic)
- 16 DNS fallback tests (cache validity, resolve logic, retry, security checks)
- 40/40 host decoder proof (extract + resurrect for every decoder)
- Zero eval(), zero network I/O in core modules

Architecture: Electron with context isolation, sandboxed rendering, IPC allowlisting. The analysis pipeline is deterministic — same input produces byte-identical output, verifiable via SHA-256.

$39 one-time. No subscription, no telemetry.

Landing: [your-url]

---

## Reddit — r/digital_forensics

**Title:** HyperSnatch v1.1 — deterministic HTML media analysis with 40 host decoders, DNS-over-HTTPS fallback, and forensic audit trails

**Body:**

Updated the forensic analysis tool. v1.1 adds:

- **40 host decoders** — extract() + resurrect() for every major file hosting and streaming platform
- **DNS Fallback (DoH)** — resolves CDN hostnames via Cloudflare DNS-over-HTTPS when standard DNS fails
- **Stream preview** — in-app video playback for decoded candidates
- **Quantum Vault** — hidden forensic dashboard showing engine version, decoder count, session metrics

**Forensic capabilities:**
- Deterministic output — SHA-256 verifiable, same input always gives same result
- Auth boundary detection — stops at login gates, premium paywalls, signed URLs
- Immutable evidence logging with timestamps
- Export to JSON/CSV with full audit trails
- 127 automated tests, zero network calls during analysis

$39 Founders License (one-time). Built for investigators, not casual users.

https://cashdominion.gumroad.com/l/itpxg

---

## Twitter/X Thread

**Tweet 1:**
🚀 HyperSnatch v1.1 just dropped.

40 host decoders. DNS-over-HTTPS fallback. In-app stream preview. 127 tests passing.

Paste HTML source → get real download URLs. Offline. Deterministic. Zero eval().

$39 one-time → https://cashdominion.gumroad.com/l/itpxg

**Tweet 2:**
What's new in v1.1:
• 40 file host decoders (emload, mega, rapidgator, doodstream, mixdrop...)
• DNS fallback via Cloudflare DoH (for when CDN names get blocked)
• Click-to-preview video player
• Auto-copy best URL to clipboard
• Settings drawer with toggle persistence

**Tweet 3:**
The test suite:
✅ 71 SmartDecode tests
✅ 16 DNS fallback tests
✅ 40/40 host decoder proof
= 127 validations, 0 failures

Zero network calls. Zero eval(). SHA-256 deterministic.

Built for researchers. Maintained by engineering. ⚡
