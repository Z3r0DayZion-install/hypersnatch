# HyperSnatch v1.6.18 — Promotion Receipt
## Reddit / r/windowsapps

**Date:** 2026-06-23  
**Time:** ~2:13 PM UTC-7

---

## Post Record

| Field | Value |
|---|---|
| **Subreddit** | r/windowsapps |
| **Flair** | Developer |
| **Title** | HyperSnatch v1.6.18 — local-first proof workstation with receipt explanations and offline verification |
| **Thread URL** | https://www.reddit.com/r/windowsapps/comments/1udtnoh/hypersnatch_v1618_localfirst_proof_workstation/ |
| **Release URL** | https://github.com/Z3r0DayZion-install/hypersnatch/releases/tag/v1.6.18 |
| **Launch receipt** | docs/release/LAUNCH_RECEIPT_v1.6.18.md |
| **Screenshot** | captured ~2:52 PM UTC-7 (see user screenshot) |

---

## Live Metrics (~39 min after post)

| Metric | Value |
|---|---|
| **Views** | ~105 |
| **Upvotes** | 1 |
| **Comments** | 0 |
| **Subreddit size** | 10K members / 491 weekly contributors |
| **Observation time** | ~2:52 PM UTC-7 (approx 39 min after post) |

Notes: 105 views in ~39 min is solid for a niche tool in a small subreddit. No comments yet. Let breathe before posting elsewhere. Check GitHub release download count tonight or tomorrow.

---

## Proof Layers at Time of Post

| Layer | Result |
|---|---|
| `npm run release:gate` (all 7 steps) | ✅ PASS |
| Public-download sanity (downloaded hash matches GitHub API digest) | ✅ PASS |
| Final wiring audit — installed public build, 46/46 checks | ✅ PASS |

---

## Installed Build Verified

| Check | Result |
|---|---|
| Downloaded installer SHA256 | `698377b36c5d09f63dbf51dd7d9eb7856f9bfd1a59307e23065a5840368ddcec` ✅ MATCH |
| Installed exe SHA256 | `af2b1ca2bcdf7a81c8a29932977c107d0355ea219f5b514727e7d361d8c7ee1a` ✅ |
| Version in asar, APP_VERSION_FALLBACK, footerVersion, uiVer, setVersion | `1.6.18` ✅ all |
| Window title | `HyperSnatch - The Proof Foundry™` ✅ |
| Receipt Explanation Mode (46 checks inc. all 10 IDs, 3 sections, vocab) | ✅ PASS |
| Forbidden overclaim language absent | ✅ |
| Security posture (contextIsolation, nodeIntegration:false, no inline scripts) | ✅ |

---

## Post Content Summary

Feature stack promoted:

- Receipt Explanation Mode
- Evidence Nutrition Label
- Proof Bundle Diff
- Proof Passport
- Prove It Again
- Offline verifier (VERIFY-HYPERSNATCH.html)
- Tamper Trial
- SHA256SUMS verification

Honest framing used: *"Not court-certified. Not tamper-proof. Just local-first, hash-verified, receipt-backed proof tooling."*

---

## Comment Policy

- Real questions: answer plainly
- Attacks on legitimacy: *"Fair. It's a local-first proof tool, not a legal evidence platform. The release page has the hashes and verifier details."*
- Do not argue
- Do not promise future features

---

## Next Promotion

Do not post to r/opensource or r/OSINT yet. Wait for r/windowsapps reaction first.
Rule: r/windowsapps allows 1 promotional post per week per Developer flair.

---

## Safe-to-Promote Verdict

**v1.6.18 is safe to promote.** Three independent proof layers passed. Post is live.
