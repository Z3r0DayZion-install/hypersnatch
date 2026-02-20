HyperSnatch E2E

Setup:
- `npm install`
- `npx playwright install chromium`

Run:
- `npx playwright test --config playwright.config.js fused.spec.js`

Coverage:
- Decode queue render path
- Trust policy toggle interactions
- Self-test panel execution smoke
- Tier gate enforcement and advanced unlock path
- Export/import guardrail errors (passphrase/file required)
- Unsigned import rejection under strict policy
- Trust rotate/revoke input validation
