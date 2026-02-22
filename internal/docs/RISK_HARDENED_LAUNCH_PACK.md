# RISK-HARDENED LAUNCH PACKAGE: HYPERSNATCH v1.0.0-rc.1

## A) PUBLIC POSITIONING PACK
**1) One-Sentence Description:** 
HyperSnatch is a deterministic, offline-first static analysis utility that parses raw HTML payloads to map structural resource references and embedded declarations.

**2) 5-Bullet Feature List:**
*   **Offline-First Execution:** Analyzes locally provided HTML strings without external telemetrics.
*   **Static AST Parsing:** Maps nested DOM structures deterministically without executing arbitrary JavaScript.
*   **Integrity Reporting:** Generates a verifiable `.manifest.json` detailing resolved resource definitions.
*   **Pipeline Seamless:** Outputs structured JSON data ready for integration into your local architectures.
*   **No Network Reliance:** Functions entirely off-grid for maximum privacy during payload analysis.

**3) 10-Word Tagline:**
Deterministic static analysis for structural HTML variable mapping and static resource resolution.

**4) Forbidden Words List + Safe Replacements:**
| 🚫 Forbidden Word / Phrase | ✅ Safe Replacement |
| :--- | :--- |
| Download / Downloader | Analyze / Analyzer |
| Video / Stream URL | Structural Resource Reference / Embedded Declaration |
| Extract / Extractor | Surface / Map / Resolve |
| Bypass / Crack | Deobfuscate / Parse / Trace |
| Scrape / Scraping | Evaluate / Static Analysis |
| yt-dlp / youtube-dl | Archival Pipeline Integration |

**5) FAQ (8 Questions):**
**Q: What exactly does HyperSnatch do?**
A: It performs deterministic static analysis on raw HTML source code to normalize encoded or minified variable structures and enumerate underlying static resource definitions.
**Q: Does this execute the target webpage?**
A: No. HyperSnatch uses purely static Abstract Syntax Tree (AST) parsing. It does not spin up headless browsers or execute dynamic JavaScript.
**Q: My manifest is completely empty when parsing a URL, why?**
A: You are likely analyzing a Single Page Application (SPA) like React or Vue. When making a basic HTTP request to an SPA, the returned HTML is usually just `<div id="root"></div>`. Because HyperSnatch does not execute JS, it cannot see the rendered DOM. You must provide the final *rendered* HTML to the engine.
**Q: How do I feed rendered HTML to the engine?**
A: Navigate to the target page in your browser, wait for the content to fully load, right-click and select "Save As..." (HTML Only), and feed that saved file into HyperSnatch.
**Q: Does this bypass DRM or access controls?**
A: Absolutely not. It is a structural text analyzer for publicly accessible HTML and cannot decode encrypted DRM streams.
**Q: Is my analysis data sent to your servers?**
A: Never. The analysis engine is 100% offline. License validation occurs locally. Optional verification is performed during activation.
**Q: What formats does the integrity report use?**
A: The engine outputs a standard `.manifest.json` file.
**Q: Is this a subscription?**
A: No, the Founders Edition is a one-time perpetual license for the v1.x lifecycle.

---

## B) PRODUCT UX HARDENING SPEC
**1) Empty-Manifest Detection Logic:**
*   *Trigger:* Engine completes parsing but returns 0 high-confidence vectors AND (the raw HTML length is under 15KB with `<script>` tags forming the bulk of the body, OR the HTML contains SPA signatures like `<div id="root">`, `<div id="app">`, `window.__INITIAL_STATE__`, `__NEXT_DATA__`, or `<script src="/static/js/`).
*   *UI Copy:* `Analysis Complete: 0 Resource Declarations Enumerated. [View SPA Formatting Guide]`
*   *Buttons:* `[ Retry with Rendered HTML ]` `[ Copy HTML from Clipboard ]`

**2) "Why empty?" Modal Text:**
`The engine received the initial source code, but it appears to be a JavaScript-rendered Single Page Application (SPA). Because HyperSnatch uses strict static analysis and does not execute remote code, the provided HTML string is fundamentally empty (e.g., <div id="root"></div>). To map this payload, you must provide the fully rendered DOM.`

**3) "SPA Guide" Micro-Wizard:**
**Step 1:** Open your target payload in Chrome, Edge, or Firefox.
**Step 2:** Wait for the page content to fully load visually.
**Step 3:** Perform one of the following:
*   *Method A (Save):* Press `Ctrl+S` (Windows) or `Cmd+S` (Mac) -> Choose "Webpage, HTML Only" -> Drag the saved file into HyperSnatch.
*   *Method B (Copy-Paste):* Press `F12` to open DevTools -> Go to the "Elements" tab -> Right-click the top `<html>` tag -> Select "Copy -> Copy outerHTML" -> Use the "Paste Raw HTML" deployment in HyperSnatch.

**4) Error Taxonomy:**
*   `ERR_NET_UNREACHABLE`: "Target host returned a network interruption. Verify the domain is publicly accessible."
*   `ERR_INVALID_HTML`: "The provided payload string is malformed or lacks a valid structural DOM tree."
*   `ERR_SPA_ROOT_ONLY`: "Static payload implies a client-side rendered application. Provide the fully rendered outerHTML."
*   `ERR_AUTH_REQUIRED`: "Target payload returned a login portal or authorization challenge. Authentication is not supported."

**5) Support Macros (Copy-Paste Responses):**
*   *Macro 1 (SPA Empty):* "Thanks for the report. The target site is a reactive SPA. Since the engine does not execute JavaScript to protect your environment, you'll need to pass the fully rendered DOM. Try copying the `outerHTML` from DevTools and pasting it directly into the engine."
*   *Macro 2 (Refund Request):* "I have processed your refund via LemonSqueezy. The funds will return to your original payment method in 3-5 business days. The license has been deactivated."
*   *Macro 3 (DRM Request):* "HyperSnatch is a structural text analyzer and does not support decrypting Widevine or FairPlay manifests. I cannot assist with circumvention."
*   *Macro 4 (Missing License):* "Attached is your Founders Edition license JSON. Please drag it into the Settings pane to activate the local engine."
*   *Macro 5 (Flagged by AV):* "As an independent executable lacking thousands of dollars in commercial code signing, Windows SmartScreen occasionally flags new releases. The SHA256 integrity hash is published on our site for manual verification against your download."
*   *Macro 6 (Feature Request):* "I've logged this structural layout for review. Since the engine relies on strict static AST parsing, some obfuscation updates require manual heuristic mapping. I will evaluate this for the next patch."

---

## C) CLOUDFLARE R2 BINARY DEPLOYMENT RUNBOOK
**1) Bucket Setup Checklist:**
*   [ ] Name: `hypersnatch-releases-v1`
*   [ ] Access: Map public custom domain (`releases.hypersnatch.com`).
*   [ ] CORS: Not strictly required for direct browser downloads, but set `AllowedOrigins: *` if querying versions via JS.
*   [ ] Caching: Set Cloudflare Edge Cache TTL to 1 month for `.exe` files.

**2) Upload Steps:**
*   *Dashboard:* Navigate to R2 -> Select Bucket -> Drag and drop `HyperSnatch-Setup-1.0.0-rc.1.exe` and `SHA256SUMS.txt`.
*   *CLI (Wrangler/AWS CLI):* `aws s3 cp dist/HyperSnatch-Setup-1.0.0-rc.1.exe s3://hypersnatch-releases-v1/ --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

**3) Cache-Control Headers:**
*   `.exe` (Immutable): `Cache-Control: public, max-age=31536000, immutable`
*   `SHA256SUMS.txt` (Mutable): `Cache-Control: public, max-age=300, must-revalidate`

**4) Integrity Strategy:**
*   The checkout page, post-purchase email, and `VERSION_HISTORY.md` must display: `SHA256: D66E8D1B...77F2`

**5) Emergency Hot-Swap Plan:**
*   Keep `https://pub-<r2-id>.r2.dev/HyperSnatch-Setup-1.0.0-rc.1.exe` saved in a secure note. 
*   If custom domain DNS fails, instantly swap the `<a>` tag `href` on the static site to the raw `r2.dev` URL.

---

## D) SMARTSCREEN / REPUTATION READINESS
**1) Pre-Launch Checklist:**
*   [ ] Ensure binary metadata (Author, Version) accurately matches the site.
*   [ ] Confirm local SHA256 hash exactly matches what is uploaded to R2.
*   [ ] Do not pack the `.exe` with aggressive UPX or node obfuscators (triggers heuristic AV alerts).

**2) Submission to Microsoft Defender:**
*   If flagged as "Windows protected your PC":
*   Go to: `https://www.microsoft.com/en-us/wdsi/filesubmission`
*   Submit as: "Software Developer"
*   File Type: Application Installer
*   Comment: "This is a benign Electron desktop utility for developers performing static DOM analysis. It is currently unsigned as it is an indie v1.0 release. It does not contain telemetry or malicious payloads."

**3) STOP-SHIP Protocol:**
*   *Blue "Unknown Publisher" Dialog:* Survivable. Educate users that unsigned indie releases rely on SHA256 verification. Do not panic.
*   *Red "Malware Detected" / Chrome "Dangerous" Block (STOP-SHIP Trigger):* A user emails a screenshot of a hard block.
*   *Action:* Immediately pause all Reddit/HN posts.
*   *Site Banner:* Add `<div class="alert">Notice: We are currently clearing a false-positive heuristic flag with Microsoft SmartScreen. Downloads are paused until resolution.</div>` to the checkout page.

**4) Post-Clear Relaunch:**
*   Verify via VirusTotal that Microsoft classification shows "Undetected".
*   Remove site banner and safely resume community posting.

---

## E) PAYMENT PROCESSOR SURVIVAL PLAN
**1) LemonSqueezy Risk Controls:**
*   *Product Category:* "Developer Tools" or "Software Utilities". NEVER "Media".
*   *Wording:* Ensure the LemonSqueezy product description exactly matches the "Public Positioning Pack" (Section A).
*   *Explicit Disavowal:* Add this exact line to the product page: "HyperSnatch does not interact with streaming services, DRM systems, or subscription platforms."
*   *Screenshots:* Upload screenshots of the UI showing JSON outputs or the `Settings` pane. Do NOT upload screenshots showing YouTube domains or embedded videos.

**2) Stripe/Gumroad Hot-Swap Checklist:**
*   [ ] Gumroad account created and verified.
*   [ ] Product draft created on Gumroad with identical $39 pricing and purely text-based copy.
*   [ ] Redirect URL configured to send buyers to the same static `/welcome` landing page.

**3) Chargeback Control:**
*   *Refund Policy Wording:* "14-Day Deterministic Guarantee: If the static analyzer fails to map your authorized structural payloads, email support within 14 days for a full refund."
*   *Triage:* If a user demands a refund aggressively or threatens a chargeback, refund them in LemonSqueezy *immediately* without arguing. 1 chargeback is infinitely worse than losing $39.
*   *Metric Reality Check:* Your true metric is the "Refund rate after SPA macro guidance", not the raw refund rate. Many users will instantly refund on their first SPA target until guided; measure satisfaction *after* the DevTools workaround is attempted.

**4) Compliance-Safe Receipt:**
*   *Descriptor:* `HYPERSNATCH V1 LIC`
*   *Product Name:* `HyperSnatch Static Analyzer - Founders License`

---

## F) LAUNCH SEQUENCE (7 DAYS)

**Day 1: Private Simulation & Deployment**
*   Upload binaries mapping to R2. Verify hashes.
*   Purchase tool from yourself in LemonSqueezy. Generate license via CLI. Test activation on a clean VM.

**Day 2: The Alpha Ring (No Public Blasts)**
*   Distribute to 3 private peers or highly technical local Discord contacts.
*   Objective: Final OS compatibility check. Secure 1 quote regarding the "pure offline" capability.

**Day 3: Landing Page Finalization**
*   Embed the SPA explanation into the FAQ. Ensure LemonSqueezy test mode is OFF.
*   Add the Alpha quotes to the site.

**Day 4: Controlled Niche Release (r/selfhosted)**
*   Post the infrastructure-focused draft. 
*   Goal: 3 sales. 
*   *Kill-Switch Check:* If refunds > 1 or SmartScreen blocks occur, STOP. Fix heuristics or submit to Microsoft. Do not proceed to Day 5.

**Day 5: Response & Patching**
*   You will receive your first support emails regarding specific target domains failing.
*   Direct them to the SPA DevTools `outerHTML` workaround. Do not write hotfixes today.

**Day 6: Second Niche Release (Private Discords & Indie Dev Slacks)**
*   *Action:* Post to controlled mailing list drops, indie dev Slack groups, or small GitHub Issues threads. Avoid r/DataHoarder completely for Phase 1 to prevent permanent domain shadowbans.
*   Goal: 5 sales. Monitor LemonSqueezy account standing carefully.

**Day 7: Evaluation & Hacker News Prep**
*   *Decision Tree:*
    *   If LemonSqueezy frozen -> Swap to Gumroad.
    *   If SPA-adjusted refund rate > 15% -> The tool's heuristics are failing on standard targets. Delay HN by 1 week to write patches.
    *   If stable -> Prepare the Show HN post for Tuesday morning rollout. Wait at the desk.

---

## G) PUBLIC DEMO SAMPLE (PERCEPTION ARMORED)

*   **Why it's necessary:** Explanations and FAQs are fragile. Users need to see it working in a controlled environment to verify it works statically and to reduce the spontaneous refund impulse.
*   **The Artifact:** Publish a static `/demo` sub-page on the landing site.
*   **Contents:** Provide a redacted `sample-payload.html` file, its corresponding `manifest.json` static output, and a before/after screenshot proving the variables were mapped cleanly without executing network requests.
