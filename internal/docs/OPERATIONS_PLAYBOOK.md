# HyperSnatch: V1 Commercial Operations Manual

This document is the execution playbook for the controlled, solo-founder launch of HyperSnatch v1.0.0-rc.1. It prioritizes low-friction distribution, manual-but-scalable licensing mechanisms, and robust technical support workflows.

## PART 1 — Hosting Integrity Plan

### Architecture Recommendation
Do not host the `.exe` on your primary WordPress/ghost droplet or basic shared hosting. Bandwidth spikes will kill your site.
1. **Storage:** Cloudflare R2 (or AWS S3). R2 has zero egress fees, which is critical for distributing a 60MB+ Electron binary.
2. **CDN Delivery:** Place a custom subdomain (`releases.hypersnatch.com`) in front of the bucket, routed through Cloudflare's CDN.

### Integrity Verification Workflow
1. Upload `HyperSnatch-Setup-1.0.0-rc.1.exe` to the bucket.
2. Upload `SHA256SUMS.txt` alongside it.
3. On the download page, prominently display the expected SHA256 string for the Windows executable.
4. **Visibility:** Ensure the UI "Settings" footer explicitly reads `v1.0.0-rc.1`, matching the binary name.

## PART 2 — Payment & SKU Setup (LemonSqueezy)

### Single SKU Strategy
*   **Product Name:** HyperSnatch Founders Edition
*   **Pricing:** $39.00 USD (Single Payment). Do not enable "Pay what you want". 
*   **Variant:** None. One product, one checkout flow.

### Checkout Configuration
1. **Require minimal fields:** Email only. Disable Name/Address collection if tax laws in your country allow for digital goods, or let LemonSqueezy handle the absolute minimum compliance. Friction kills conversions.
2. **Post-Purchase Redirect:** Send them to a static `hypersnatch.com/welcome` page.
3. **Receipt Note:** *"Thank you. Your license key will be generated and emailed to the address provided within 12 hours. Download the engine here: [Link]"*

### Manual License Delivery Workflow
Do not build API webhooks on Day 1.
1. LemonSqueezy app pushes an email notification to your phone.
2. You run the local CLI generator: `node -e "console.log(require('./src/core/security/license_validator.js').generateLicense('buyer@email.com', 'Founders', '2026-02-21'))"`
3. You copy the JSON output into an email template and hit send.

### License Tracking Template (Airtable/Notion/Excel)
| Issue Date | Email | Edition | SHA256 Hash | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 2026-02-21 | user@domain.com | Founders | D66E8D1B... | Active | N/A |

### Failure Handling
*   **Refund:** Void the transaction in LemonSqueezy. Mark "Revoked" in the tracker. (The app won't phone home to check, but you will refuse support for that email).
*   **Typo in Email:** The user will email support saying they didn't get it. Update email in tracker, generate a new hash, and reply.

## PART 3 — Activation Simulation Checklist

Review the UI/UX for these states to ensure zero crash logs impact the user:
*   [ ] **Clean Install → Activate:** User drags `license.json` into the UI. Badge turns green ("Founders Edition Active").
*   [ ] **Restart Persistence:** Close the app, re-open. Ensure it reads `userData/license.json` and immediately shows the green badge.
*   [ ] **Invalid Key Format:** User drags a malformed JSON. UI must report: *"Invalid license file format."* No stack traces.
*   [ ] **Tampered Key:** User edits the email string in the JSON. UI must report: *"Checksum mismatch. License validation failed."*
*   [ ] **Deleted Key:** User deletes the JSON from `userData`. Upon restart, UI reverts gracefully to the "Standard" state without crashing.

## PART 4 — Support System Templates

You will operate out of a single `support@hypersnatch.com` inbox. SLA: 12-hour response time.

**Template 1: Manual License Delivery**
> Subject: Welcome to HyperSnatch — Your Founders License
> Hi there,
> Thanks for securing the Vanguard Founders Edition. I'm the solo developer behind the engine.
> Attached is your `license.json` file. To activate, open HyperSnatch, navigate to Settings, and drag this file into the activation zone. 
> If you encounter any unusual layout changes on target sites, just reply to this email with the URL, and I will investigate the heuristics.
> Best,
> [Name]

**Template 2: Bug Intake Response**
> Thanks for the report. I am looking into the structural changes on [Target Domain]. Because this engine relies on static AST parsing rather than headless automation, some obfuscation updates require manual heuristic tweaks. I will update the master branch and notify you when a patch is released.

**Template 3: The 14-Day Refund**
> No problem at all. I have processed a full refund to your original payment method via LemonSqueezy; it should appear in 3-5 days. If you're open to sharing why the static analysis approach didn't fit your local workflow, I'd appreciate the feedback.

## PART 5 — Launch Sequencing Plan

### The 3-Phase Gradual Rollout
**Phase 1: The Private Alpha (Days 1-3)**
*   Send the R2 download link to 3-5 trusted peers or local Discord security/hoarder groups. 
*   Goal: Uncover immediate environment-specific install crashes (e.g., Windows Defender false positives).
*   Collect 2 short, technical testimonials focusing on "It's truly offline."

**Phase 2: Niche 1 (r/DataHoarder) (Day 4)**
*   Post the primary text. Target: Hoarders tired of broken, cloud-reliant scrapers.
*   Monitor traffic and answer questions identically for 24 hours.
*   Evaluate: Did the page convert at 1% or higher? 

**Phase 3: The Big Stress Test (Hacker News) (Day 7)**
*   Post the Show HN script.
*   Prepare for aggressive architectural questioning. Defend the "Why static analysis over dynamic?" angle.
*   Risk Mitigation: If the site crashes under HN load, pivot the download link immediately to a public GitHub release page.

## PART 6 — Reddit & HN Launch Drafts

**r/DataHoarder**
> **Title:** I built an offline, deterministic static analysis engine to surface nested media resource URLs (no SaaS/cloud dependencies).
> **Body:** Like many of you building local archival pipelines, I got tired of extraction tools that rely on flaky APIs, force you into Discord servers, or eventually pivot to a monthly SaaS subscription. So, I built HyperSnatch. It’s a pure desktop utility that performs static analysis on raw HTML payloads. It deterministically unwraps script variables and JSON blobs to surface direct stream vectors (like complex m3u8s) without executing arbitrary headless JavaScript. It’s 100% offline-first. There is no telemetry, no phoning home, and no active network connection required to parse a saved HTML file. I’m doing a $39 Founders Edition release this week to fund ongoing heuristic patches. Would love feedback from the community on the static parsing approach.

**r/selfhosted**
> **Title:** HyperSnatch: A headless-capable local analysis utility for media resource mapping
> **Body:** Hey r/selfhosted. If you integrate tools like yt-dlp into larger bash/python architectures, resolving obfuscated stream URLs beforehand is often the biggest bottleneck. I built HyperSnatch to handle this locally. It’s an offline deterministic engine that analyzes target HTML and emits a clean `.manifest.json` report of the highest-confidence underlying resource vectors. It is designed specifically *not* to be a cloud API, meaning you won't hit rate limits or leak your archive queries to a third party. I’m a solo dev committed to keeping this a pure local utility. Let me know what you think of the architecture.

**Hacker News (Show HN)**
> **Title:** Show HN: HyperSnatch – A deterministic static analysis engine for HTML resource mapping
> **Body:** Locating embedded media resources inside heavily obfuscated DOM structures usually involves spinning up expensive headless browser automation or paying for opaque third-party cloud APIs. I wanted a mathematically verifiable, strictly offline approach, so I built HyperSnatch. It's a static analysis engine that takes raw source, traces script variables, unwraps packed JS, and surfaces direct media URLs by parsing the AST—without ever executing arbitrary remote code. Key choices:
> - 100% offline execution; it does not collect or transmit analytics.
> - Emits a cryptographically hashed data integrity report for archiving provenance.
> - Packaged as an Electron desktop utility with a headless CLI module.
> I understand this space is crowded with dynamic bypass tools, but I sought a pure engineering solution based on static parsing. I'd love the HN community's feedback on the heuristic confidence-scoring mechanism.

## PART 7 — Revenue Modeling (100-1,000 Visitors)

Assuming LemonSqueezy takes ~5% + $0.50 per transaction, net on $39 is roughly **$36.55**.

| Traffic | Conv. % | Paid Users | Gross Revenue | Net Revenue | Refund Impact (5%) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **100** | 1% | 1 | $39.00 | $36.55 | -$0.00 |
| **100** | 3% | 3 | $117.00 | $109.65 | -$0.00 |
| **500** | 1% | 5 | $195.00 | $182.75 | -$0.00 |
| **500** | 3% | 15 | $585.00 | $548.25 | -$36.55 (1 ref) |
| **1000** | 1% | 10 | $390.00 | $365.50 | -$36.55 (1 ref) |
| **1000** | 3% | 30 | $1,170.00 | $1,096.50 | -$73.10 (2 ref) |
| **1000** | 5% | 50 | $1,950.00 | $1,827.50 | -$109.65 (3 ref) |

**Time to 100 paid users:** At a realistic 3% niche conversion rate, you need ~3,300 highly targeted views. You will likely hit this around Month 3 as organic SEO kicks in post-launch.

## PART 8 — Founder Risk Guardrails

**5 "Do Not Touch" Rules for the First 30 Days:**
1. Do not rewrite the UI framework. The current one works.
2. Do not build an automated webhook license generator until you have 50 paid users. Use the CLI template.
3. Do not discount the $39 price point to win a single argument on Reddit.
4. Do not integrate Google Analytics or anything that betrays the "Offline-First" promise.
5. Do not add complex DRM or machine-ID locking mechanisms. Accept ~10% piracy via key sharing as a cost of friction-free UX.

**5 Metrics That Matter:**
1. Website Visitors → Installer Downloads (Is the copy working?)
2. Installer Downloads → Paid Conversions (Is the price/value aligned?)
3. Days since last bug-report resolution (Keep this under 2 days).
4. Refund rate (Keep under 10%. If higher, your landing page is over-promising).
5. Number of inbound feature requests (Validates that people are fundamentally using it).

**5 Signals to Pivot Messaging:**
1. A payment processor flags you as a "video downloader tool."
2. Reddit moderators immediately delete your posts for "piracy enablement."
3. Inbound emails constantly complain about a lack of automatic YouTube support.
4. Users ask "How do I cast this to my TV?" (Fundamental misunderstanding of the utility).
5. A high volume of users report that their headless environments reject Electron overhead (Pivot to CLI-first messaging).

**3 Signals to Upgrade Licensing:**
1. You pass 100 paid users, and manual generation is eating >2 hours a week.
2. An enterprise/corporate email requests a 50-seat volume installation.
3. You find a massive public leak of a valid `license.json` generating thousands of unauthorized hits.

## PART 9 — Immediate 14-Day Execution Plan

**Day 1-2: The Plumbing**
*   Create the Cloudflare R2 bucket and map `releases.hypersnatch.com`.
*   Upload the `v1.0.0-rc.1.exe` and `SHA256SUMS.txt`.
*   Set up LemonSqueezy product page and map the post-purchase redirect.

**Day 3: The Simulation**
*   Buy the product from yourself using a real credit card.
*   Manually generate the JSON in the CLI.
*   Email it to yourself.
*   Drag it into the downloaded installer in a VM. Validate. 

**Day 4-5: Private Alpha & Testimonials**
*   Hand 3 licenses to peers/Discord connections.
*   Ask: *"Did Windows SmartScreen flag it? Did the UI confuse you?"*
*   Extract 2 quotes and load them onto the landing page.

**Day 6: Soft Launch (Niche 1)**
*   Post the r/DataHoarder text.
*   Wait at the keyboard for 4 hours to answer the first 10 comments. Do not code.

**Day 7-9: Iteration Window**
*   Fulfill license orders manually.
*   Fix the 1-2 critical heuristics that early users immediately report broken. Do not introduce new features, just fix existing payloads.

**Day 10: Second Push**
*   Post the r/selfhosted text. Monitor metrics.

**Day 11-13: The Show HN Prep**
*   If stability is confirmed across at least 10 paid users from Reddit, prep the HN launch.
*   Ensure your domain hosting can handle a potential 2,000 visitor spike in an hour. Keep an S3 bucket link handy if WordPress/Ghost falls over.

**Day 14: Show HN**
*   Post on Hacker News at ~8:30 AM EST on a Tuesday or Wednesday.
*   Defend the architecture professionally in the comments. End of Launch window.
