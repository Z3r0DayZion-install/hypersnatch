# HyperSnatch Distribution & Niche Seeding Strategy

## The Goal
Acquire 20 highly-engaged, serious users within 30 days. Do not target the mainstream piracy or broad consumer markets yet. Go dense, not wide.

## 1. Niche Communities (The Target 5)

### A. Digital Archivists & Data Hoarders
- **Where:** `r/DataHoarder`, Archive Team IRC, specialized Discord servers.
- **Messaging Setup:** Focus on "Preservation without cloud dependencies." Archivists hate tools that die when the developer's server goes offline. HyperSnatch's 100% offline static analysis guarantees long-term utility.

### B. OSINT Hobbyists & Researchers
- **Where:** `r/OSINT`, select infosec forums.
- **Messaging Setup:** Focus on "Zero-footprint extraction." Explain how running live headless browsers leaves network artifacts and triggers WAFs. HyperSnatch analyzes dead HTML dumps, ensuring complete operational privacy.

### C. Self-Hosted / Homelab Enthusiasts
- **Where:** `r/selfhosted`, `r/homelab`.
- **Messaging Setup:** Focus on the "BYO Downloader" architecture. Homelabbers love tools that give them the raw URL to feed into their own heavily-customized `yt-dlp` or `aria2` pipelines, rather than black-box downloaders.

### D. Privacy-First Audiences
- **Where:** Privacy-focused Mastodon instances, Hacker News (Show HN).
- **Messaging Setup:** Emphasize the lack of telemetry, the deterministic extraction, and the exportable native Security Report that proves the binary hasn't been tampered with.

### E. Private Indexer Forums (Highly Curated)
- **Where:** Tech-focused sub-forums on private trackers.
- **Messaging Setup:** Pure utility. "When JDownloader fails on a new host obfuscation, throw the page source into HyperSnatch and get the direct link."

## 2. Fulfillment Mechanics (Gumroad / LemonSqueezy)

To minimize engineering overhead during the 30-Day launch:

1. **Storefront:** Set up a simple Gumroad or LemonSqueezy product page utilizing the `FOUNDERS_LANDING_COPY.md` text.
2. **Product Delivery:** 
   - Upload the `HyperSnatch-Setup-1.0.1.exe` as the downloadable asset.
3. **Manual License Fulfillment:**
   - When a purchase notification comes in, the founder manually runs the `generateLicense()` JS script locally.
   - Example command: `node -e "console.log(require('./src/core/security/license_validator.js').generateLicense('user@email.com', 'Founders', '2026-02-21'))"`
   - Output the JSON block into a file named `hypersnatch_license.json`.
   - Email the user the JSON file with a welcome template: *"Welcome to Vanguard. Drag and drop this file into the Settings UI to activate the Founders Edition."*

## 3. The Feedback Loop
- **Immediate Patching:** For the first 20 users, if they report a host heuristic is failing, it is patched within 48 hours. 
- **The Tradeoff:** They get a $39 perpetual license; you get free QA and product-market fit validation. 
