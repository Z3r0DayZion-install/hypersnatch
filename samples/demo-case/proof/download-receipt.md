# Download Receipt (Demo)

Synthetic download receipt for the HyperSnatch demo case. Not real evidence.

| Field | Value |
| --- | --- |
| Case ID | DEMO-CASE-0001 |
| Receipt ID | RCPT-DEMO-0001 |
| Page URL / capture path | `samples/demo-case/captured-page/index.html` |
| Visible link text | Download sample report |
| DOM selector | `a#downloadLink` |
| Link href | `../artifacts/sample-report.txt` |
| Resolved path | `artifacts/sample-report.txt` |
| Filename | sample-report.txt |
| Content type | text/plain |
| Artifact SHA256 | `b4cdf05c36012568d5cc2353d8a8560150501776de9309a3ffdef1e238e86960` |
| Timestamp | 2026-06-22T19:30:05Z |
| Manifest SHA256 | `3c73e649c9c1264ac7b3059424511a4ce1d257ac0a89ad82795e004c450a4fea` |

A second sample artifact is also included to show multi-file hashing:

| File | SHA256 |
| --- | --- |
| `artifacts/sample-download.bin` | `f8574ce3883e96a3c78f7722fe9eea32fbcf96e979ef71363c2845e52051a2d7` |

This receipt records that a visible download link was captured with page context
and a content hash. It does not bypass logins, DRM, expiring tokens, anti-bot
challenges, private APIs, or server-side permission checks.
