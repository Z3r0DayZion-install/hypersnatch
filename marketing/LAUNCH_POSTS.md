# HyperSnatch v1.2.0 — Launch Posts

## Reddit — r/computerforensics

**Title:** I built an offline HTML artifact analyzer with ECDSA-signed license keys, 40+ deterministic decoders, and forensic-grade audit trails (Windows)

**Body:**

Hey r/computerforensics,

I've released **HyperSnatch v1.2.0** — an offline desktop tool for extracting and documenting embedded media endpoints from HTML/HAR source code. Built for independent consultants who need court-admissible evidence workflows without enterprise licensing costs.

**What it does:**
1. Paste raw HTML, page source, or HAR logs
2. SmartDecode engine scans for resource endpoints, encoded data-sources, and manifest pointers
3. Review ranked candidates with confidence scoring
4. Export forensic-grade reports (JSON, CSV, PDF)

**v1.2.0 highlights:**
- **40+ deterministic decoders** — Rapidgator, Mega, Emload, Pixeldrain, and more. Each with extract() + resurrect() methods
- **ECDSA-signed hardware-bound licensing** — no cloud validation, works air-gapped
- **Tier gating** — Community (free/unlimited analysis), Sovereign ($149, +PDF, Final Freeze, Audit Chain), Institutional ($499, +Headless CLI)
- **158 automated tests passing** — zero failures, zero eval(), zero network calls during analysis
- **Auth boundary detection** — stops at login gates, premium paywalls, signed URLs
- **SHA-256 deterministic output** — same input always gives byte-identical results

**Architecture:**
- Electron with context isolation, sandbox, disabled Node integration
- IPC allowlisting — only explicitly permitted channels are exposed
- Zero eval() in entire codebase
- ECDSA secp256k1 signatures for license verification

$149 Founders License (one-time, no subscription). Includes PDF export, Final Freeze evidence vault, and the full audit chain.

Details: https://cashdominion.gumroad.com/l/itpxg

AMA about the architecture or forensic workflow.

---

## Reddit — r/dfir

**Title:** HyperSnatch v1.2 — Offline media endpoint analyzer with 40+ deterministic decoders and ECDSA-bound licensing for DFIR consultants

**Body:**

Built this for fellow DFIR practitioners who need offline HTML artifact analysis without FTK-level costs.

**The problem:** You have seized evidence (HTML files, HAR logs) and need to extract and document all embedded media endpoints for legal proceedings. Free tools lack professional output, enterprise tools cost $2,000+/year.

**HyperSnatch solves this for $149 one-time:**
- Paste HTML source → deterministic engine identifies 40+ resource types
- Confidence-ranked candidates with host attribution
- Auth boundary detection (refuses to cross login/paywall gates)
- PDF export for court filings, JSON/CSV for your toolchain
- SHA-256 verifiable output — deterministic for the same input
- Hardware-bound licensing (ECDSA secp256k1, fully offline)

**Test results:** 158/158 automated tests passing. Zero network calls. Zero eval().

$149 one-time (Sovereign Edition). No subscription, no telemetry, no accounts.

https://cashdominion.gumroad.com/l/itpxg

---

## Reddit — r/SideProject

**Title:** I built an offline forensic HTML analyzer and just shipped v1.2 with hardware-bound ECDSA licensing — 158 tests passing, $149 one-time

**Body:**

Solo founder here. Been building **HyperSnatch** — an offline desktop tool that analyzes HTML source code to find embedded media endpoints.

**The stack:**
- Electron (context-isolated, sandboxed)
- 40+ host-specific decoders (Rapidgator, Mega, Emload, etc.)
- ECDSA secp256k1 license signing (hardware-bound, fully offline)
- Zero eval() in the entire codebase
- 158 automated tests, all passing

**What I shipped in v1.2:**
- 3-tier pricing: Community (free), Sovereign ($149), Institutional ($499)
- Hardware-bound license keys generated via CLI, imported via the app
- PDF export, Final Freeze evidence vault, audit chain for paid users
- Headless CLI for SOC/SOAR pipelines (Institutional tier)
- Upgrade prompt in the UI when free users hit gated features

**Business model:** One-time $149 payment via Gumroad. No SaaS, no subscriptions. Buyer gets a signed license.json file bound to their hardware.

**Revenue target:** 10 paying users in 90 days = $1,490.

https://cashdominion.gumroad.com/l/itpxg

Feedback on the pricing/tier structure welcome.

---

## Hacker News

**Title:** Show HN: HyperSnatch – Offline static analysis for HTML media endpoints with ECDSA-signed licensing

**Body:**

HyperSnatch is a desktop utility for technical researchers and OSINT analysts who need to identify embedded media endpoints within complex HTML artifacts — offline.

**Architecture highlights:**

SmartDecode v3.1 — the core engine has 40+ deterministic decoders, each with extract() for endpoint detection and resurrect() for DOM-level resource recovery. The ranker uses host-agnostic pattern boosts, multi-source tag multiplicity scoring, and URL deduplication.

Licensing uses ECDSA secp256k1 for offline-only hardware-bound keys. No cloud validation, no phone-home. The private key stays on the founder's machine; the public key ships in the app. License files are signed JSON blobs verified locally.

Three tiers: Community (free), Sovereign ($149 one-time), Institutional ($499 one-time, adds headless CLI for SOAR pipelines).

**Test coverage:**
- 75 SmartDecode tests (URL normalization, DOM scanning, base64, iframe recursion, M3U8 parsing, auth boundary detection, ranker logic)
- 43 license system tests (tier gating, ECDSA sign/verify, rejection cases, tampering)
- 40/40 decoder proof (extract + resurrect for all 40 decoders)
- Zero eval(), zero network I/O in core modules

Electron with context isolation, IPC allowlisting, disabled Node integration. Deterministic — same input, same output, SHA-256 verifiable.

$149 one-time. No subscription, no telemetry.

https://cashdominion.gumroad.com/l/itpxg

---

## Twitter/X Thread

**Tweet 1:**
🚀 HyperSnatch v1.2.0 just dropped.

40+ deterministic decoders. ECDSA-signed hardware-bound licensing. 158 tests passing.

Paste HTML source → identify embedded media endpoints. Offline. Zero eval(). SHA-256 deterministic.

$149 one-time → https://cashdominion.gumroad.com/l/itpxg

**Tweet 2:**
What's new in v1.2:
• ECDSA secp256k1 hardware-bound license keys
• 3-tier pricing: Community (free), Sovereign ($149), Institutional ($499)
• PDF export + Final Freeze evidence vault
• Headless CLI for SOC/SOAR pipelines
• Full tier gating with upgrade prompts in the UI

**Tweet 3:**
The test suite:
✅ 75 SmartDecode tests
✅ 43 license system tests
✅ 40/40 decoder proof
= 158 validations, 0 failures

Zero network calls. Zero eval(). ECDSA-signed. SHA-256 deterministic.

Built for forensic consultants who bill $150/hr. This tool pays for itself in the first investigation. ⚡
