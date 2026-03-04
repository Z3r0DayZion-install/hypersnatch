# Hacker News Launch - Prep & Playbook

## Post Data
**URL:** https://news.ycombinator.com/item?id=47227335
**Posted:** ~6:46 PM PST (2026-03-02)

## Original Body Text (Backup)
I've been building a Windows desktop tool that parses raw HTML locally and extracts embedded media endpoints.

It runs fully offline (no telemetry, no accounts) and can export structured results as CSV, JSON, or PDF with integrity hashes (SHA-256).

It was originally built for repeatable QA validation and archival workflows where deterministic results matter more than headless automation.

Architecture notes (for those interested):
- Electron (sandboxed, context-isolated)
- No use of eval()
- Deterministic scoring of candidate endpoints
- Optional CLI mode for batch processing

I'm mainly looking for feedback on:
- Whether this is useful outside of QA / archival contexts
- Expectations around cross-platform support
- One-time license vs SaaS for a desktop utility

## Response Playbook (HN Tone: Calm, Technical, Factual)

**Q: Why Windows only?**
> Built v1 on Electron for fastest desktop iteration. Cross-platform support depends on demand.

**Q: Why not open source?**
> The core engine is commercial, but the offline-first and no-telemetry design principles are non-negotiable. Evaluating what components could be open in the future.

**Q: Why not just use X open source parser/scraper?**
> Fair question. This focuses on deterministic scoring + structured export workflows rather than general web scraping.

**Q: This sounds like just a scraping tool. / What's the real use case?**
> It's designed for QA validation, compliance auditing, and offline archival where you need to prove exactly what endpoints were embedded in the source at a specific time (hence the offline operation and hashing), rather than just bulk-downloading files.
