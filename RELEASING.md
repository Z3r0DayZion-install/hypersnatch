# Releasing HyperSnatch

This repo ships Windows artifacts via `scripts/verify_release.cjs` (build/test gate) + `scripts/sign_windows.cjs` (optional signing).

## Local (dev) release

Dev signing makes Authenticode show as **Valid only on machines that trust your dev root cert**.

- Build + dev-sign + stage (store cert):
  - `scripts\release_all.ps1 -Thumbprint 434D1C458BE048CCA4F0CA0564A77CC631779D77 -TrustDevCert`

- Undo local dev-cert trust:
  - `scripts\untrust_dev_codesign.ps1 -Thumbprint 434D1C458BE048CCA4F0CA0564A77CC631779D77`

## Production release (recommended)

Use a real CA code-signing certificate and RFC3161 timestamping.

- Build + sign using a PFX (typical for CI runners):
  - `scripts\release_all.ps1 -PfxPath C:\path\codesign.pfx -PfxPassword '***' -TimestampUrl 'http://timestamp.digicert.com' -EnforceTimestamp`

Notes:
- `scripts\sign_windows.cjs` reads `HYPERSNATCH_SIGN_TIMESTAMP_URL` and signs with `/tr <url> /td SHA256` when provided.
- `scripts\verify_release.cjs` can enforce signing/timestamp via `HYPERSNATCH_ENFORCE_SIGNING=1` and `HYPERSNATCH_ENFORCE_TIMESTAMP=1`.

## CI

- Verification workflow: `.github\workflows\verify.yml` runs the full release gate (unsigned) on `windows-latest` and installs Rust.
- For a signed CI release, you’ll need:
  - A real code-signing cert (PFX) + password stored as GitHub Actions secrets.
  - A reachable RFC3161 timestamp URL.

Suggested secrets to add:
- `HYPERSNATCH_SIGN_PFX_B64` (base64 of your `.pfx`)
- `HYPERSNATCH_SIGN_PFX_PASSWORD`
- `HYPERSNATCH_SIGN_TIMESTAMP_URL`
## Preparing CI secrets (PFX)

PowerShell (Windows) to create base64 for `HYPERSNATCH_SIGN_PFX_B64`:

- `[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\path\codesign.pfx')) | Set-Clipboard`

Then add these GitHub Secrets:
- `HYPERSNATCH_SIGN_PFX_B64`
- `HYPERSNATCH_SIGN_PFX_PASSWORD`
- `HYPERSNATCH_SIGN_TIMESTAMP_URL` (RFC3161, default: `http://timestamp.digicert.com`)

Never commit the PFX or password to the repo.


