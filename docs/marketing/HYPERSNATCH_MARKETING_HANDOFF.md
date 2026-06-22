# HyperSnatch Marketing Handoff

## Purpose

This document gives the code agent the current marketing, positioning, and launch context for HyperSnatch.

HyperSnatch is not just an Electron app with many tabs. It should be presented as a focused product:

> **HyperSnatch is a local-first evidence workstation for capturing, organizing, verifying, and exporting digital artifacts with receipts.**

Core line:

> **Capture the artifact. Keep the proof.**

## Current Release Truth

* Current live release: **v1.6.12**
* v1.6.11 is superseded
* v1.6.12 fixed packaged UI interaction issues
* GitHub Release is live:
  `https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.6.12`
* `main` is synced and clean
* Brand kit PR is merged
* Factory artwork is removed from source
* Stock Electron icon is fixed for future builds
* Do not create v1.6.13 unless explicitly approved

## Parent Brand

Parent brand:

> **The Proof Foundry™**

Short form:

> **Proof Foundry**

Product:

> **HyperSnatch**

Correct lockups:

* `HyperSnatch`
* `HyperSnatch — A Proof Foundry product`
* `Built by The Proof Foundry`
* `Capture the artifact. Keep the proof.`

Do not use:

* `The Proof Factory`
* `Proof Factory`
* factory-building artwork
* cartoon anvil
* generic shield
* AI brain
* crypto-style badge

## HyperSnatch Product Definition

Plain-language definition:

> HyperSnatch turns messy digital evidence into a proof-backed case package.

Long definition:

> HyperSnatch is a local-first Windows workstation for capturing, organizing, verifying, and exporting digital artifacts. It helps preserve page context, download evidence, hashes, manifests, timestamps, reports, and receipts so users can keep a verifiable record of what they collected.

Short definition:

> A local-first evidence workstation for digital artifacts.

## Core Use Case

The main user story:

> I found something important online or on my machine. I need to save it, understand it, prove what it was, and keep a receipt.

HyperSnatch should support this workflow:

1. Load evidence
2. Decode / analyze it
3. Preserve page or artifact context
4. Capture visible links or download targets
5. Hash the files
6. Create a manifest
7. Export a proof package
8. Keep a receipt

## Strongest Feature Angle

The strongest marketable idea is **Page Receipt / Download Receipt**.

### Page Receipt

Claim carefully:

> HyperSnatch can preserve and reconstruct a captured page state from DOM, assets, network records, screenshots, and proof receipts.

Do not claim:

> HyperSnatch perfectly recreates every website.

Correct wording:

> HyperSnatch preserves a verifiable static reconstruction of the captured page state.

A Page Receipt should ideally include:

* final rendered DOM
* original page HTML where available
* screenshots
* CSS/assets where safe and available
* network HAR
* URL
* timestamp
* viewport
* user agent
* hashes
* manifest
* receipt

### Download Receipt

Claim carefully:

> If a page exposes a download link in the rendered DOM or network trace, HyperSnatch can capture the link, preserve the page context, and create a receipt-backed record of the downloadable artifact.

A Download Receipt should ideally include:

* page URL
* visible link text / button label
* link URL
* DOM selector
* screenshot proof
* timestamp
* HAR/network context
* resolved final URL if downloaded
* filename
* content type
* file size
* SHA256 hash
* receipt entry

Do not claim it bypasses:

* logins
* DRM
* expiring tokens
* anti-bot challenges
* private APIs
* server-side permission checks

## Who It Is For

Best target users:

* OSINT researchers
* independent investigators
* security researchers
* builders documenting releases
* journalists / researchers
* creators preserving proof of work
* people collecting online artifacts before they disappear
* technical users who need local proof trails

Avoid positioning it as:

* court-certified forensic software
* law enforcement software
* a universal downloader
* a media player
* an AI chatbot
* a cloud evidence platform

Use "proof trail," "artifact record," "case package," and "verified export."

## Current Product Weakness

The product works, but the UI currently feels too much like a feature inventory.

Current issue:

> The UI is functional but not coherent enough for a first-time user.

Known UX problems:

* too many visible top-level tabs
* advanced panels appear before evidence is loaded
* empty states look like failure states
* the right rail is too noisy
* first-time user path is unclear
* some surfaces sound hype-heavy or internal

The product should be reorganized around this path:

> Load evidence → analyze/decode → seal/export proof

## Current UX Direction

Active/next UX lane:

> `ux/workbench-first-ia-lite`

Goal:

> Make HyperSnatch coherent for a first-time user without risky heavy DOM surgery.

Recommended lighter-touch IA:

* Rename `Summary` → `Workbench`
* Rename `Investigation Cases` → `Cases`
* Rename `SmartSnatch Queue` → `Queue`
* Rename `Network HAR` → `Network`
* Keep `Queue` top-level for now
* Add or clarify `Advanced`
* Keep gated tabs visible
* Show calm placeholders inside gated panels

Placeholder copy:

* General: `Load evidence to unlock analysis tools.`
* Queue: `Load evidence to populate the queue.`
* Cases: `Create or load a case to begin.`
* Network: `Load evidence with network data to view captured requests.`

Do not hard-hide tabs yet. Keep the product map visible.

## Ideal Future IA

Later, after the lighter pass is proven, consolidate to:

* Workbench
* Cases
* Evidence
* Analysis
* Proof
* Advanced

Analysis can hold:

* Timeline
* Streams
* Candidates
* Network
* Intelligence
* Patterns

Do not do this full consolidation until navigation has better tests. The UI file is large, so heavy DOM re-parenting is risky.

## Messaging Pillars

### 1. Local-first

Use:

> Your machine. Your files. Your proof trail.

Avoid:

> Cloud-powered evidence intelligence platform.

### 2. Proof-backed

Use:

> Hashes, manifests, timestamps, receipts, and exportable proof packs.

Avoid:

> Trust us.

### 3. Artifact-focused

Use:

> Capture pages, files, links, network traces, downloads, and research material.

Avoid:

> Everything app.

### 4. Honest limitations

Use:

> HyperSnatch preserves captured state and proof context. Some live pages, DRM content, expiring URLs, or login-only resources may not replay perfectly.

Avoid:

> Perfectly recreates any website.

## Primary Copy

### One-liner

> HyperSnatch is a local-first evidence workstation for capturing, organizing, verifying, and exporting digital artifacts with receipts.

### Tagline

> Capture the artifact. Keep the proof.

### Short pitch

> HyperSnatch helps technical users preserve digital artifacts with page context, hashes, manifests, timestamps, and proof receipts — locally, without handing the evidence to a cloud platform.

### Strong feature pitch

> If a page exposes a download link in the rendered DOM or network trace, HyperSnatch can capture the link, preserve the page context, and create a receipt-backed record of the downloadable artifact.

### README hero copy

> Capture pages, files, links, and research artifacts. Keep the DOM, screenshots, hashes, manifests, and receipts that prove what you collected.

## HN / Technical Audience Angle

HN likes technical honesty. Use:

> HyperSnatch is rough around the edges, but the thesis is simple: digital work needs receipts. If software claims something happened, it should leave hashes, manifests, timestamps, logs, exports, or proof files behind.

Avoid:

* revolutionary
* AI-powered evidence magic
* military-grade
* court-ready
* best-in-class
* unstoppable
* perfect recreation

## Landing Page Structure

Recommended landing page sections:

1. Hero

   * HyperSnatch
   * Capture the artifact. Keep the proof.
   * Download latest release
   * View release proof

2. What it does

   * capture artifacts
   * preserve page context
   * record download links
   * hash files
   * export proof packs

3. Page Receipt

   * DOM
   * screenshot
   * network context
   * manifest
   * receipt

4. Download Receipt

   * visible link
   * resolved target
   * file hash
   * timestamp
   * proof bundle

5. Local-first

   * no account required
   * evidence stays on the machine
   * proof exports are user-owned

6. Proof standard

   * hashes
   * manifests
   * timestamps
   * release receipts
   * download verification

7. Known limits

   * DRM
   * login-only resources
   * expiring links
   * anti-bot systems
   * dynamic live APIs

8. Download

   * GitHub Release v1.6.12 or newer
   * SHA256 hashes
   * proof doc

## Marketing Assets Already Added

Brand kit merged into `main`:

* `assets/brand/hypersnatch-mark.svg`
* `assets/brand/hypersnatch-wordmark.svg`
* `assets/brand/hypersnatch-lockup.svg`
* `assets/brand/hypersnatch-hero.svg`
* `assets/brand/hypersnatch-hero.png`
* `assets/icons/icon-source.svg`
* `assets/icons/icon-256.png`
* `assets/icons/icon-512.png`
* `assets/icons/icon.ico`
* `assets/social/hypersnatch-og-1200x630.png`

Script:

* `npm run brand:assets`

Palette:

* Foundry Black: `#0A0D12`
* Iron: `#263242`
* Proof Cyan: `#20C7FF`
* Proof Green: `#23D18B`
* Receipt White: `#EAF2FF`
* Stamp Gold: `#E6B450`

## Code Agent Rules

Do not:

* create a new release unless approved
* bump version unless approved
* create v1.6.13 unless approved
* run `dist` casually after a published release if it would overwrite proven artifacts
* overclaim legal/forensic certification
* add more AI panels
* add more top-level tabs
* reintroduce factory branding
* use Proof Factory
* use stock Electron icon fallback

Do:

* keep the UI focused on the evidence workflow
* preserve proof-first language
* keep claims honest
* keep local-first positioning
* keep brand assets consistent with the app palette
* run `npm run verify:ui`
* run `npm test`
* run packaged proof when packaging changes
* keep `verify:asar` and installed interaction proof in release gates

## Suggested Next Marketing/UX Tasks

### Task 1 — Workbench-first UI copy

Branch:

> `ux/workbench-first-ia-lite`

Goal:

> Make the first screen explain what HyperSnatch is for.

Add/correct copy:

* `Load Evidence`
* `Decode / Analyze`
* `Export Proof`
* `Load evidence to unlock analysis tools.`
* `Capture the artifact. Keep the proof.`

### Task 2 — Demo workspace

Branch:

> `demo/sample-proof-workspace`

Goal:

> Give a first-time user a safe sample case so they immediately understand the app.

Sample should include:

* one fake page snapshot
* one visible download link
* one downloaded sample artifact
* hashes
* manifest
* receipt
* export proof pack

No real third-party copyrighted content.

### Task 3 — README marketing polish

Branch:

> `docs/hypersnatch-readme-positioning`

Goal:

> Make the README sell the product clearly without hype.

README should answer:

* What is HyperSnatch?
* What do I put into it?
* What proof does it create?
* What can I export?
* What are the limitations?
* Where is the latest release?

### Task 4 — CSP hardening

Branch:

> `postlaunch/csp-hardening-inline-renderer-extract`

Goal:

> Move inline renderer JS into a packaged local JS file and restore strict CSP without `unsafe-inline`.

This is security/product trust work, not marketing, but it supports the proof-first brand.

## Correct Final Positioning

Use this everywhere:

> HyperSnatch is a local-first evidence workstation for capturing, organizing, verifying, and exporting digital artifacts with receipts.

And the short product promise:

> Capture the artifact. Keep the proof.
