HyperSnatch v1.6.11 is the public launch build for the Proof Foundry-branded release line.

HyperSnatch is a local-first Windows tool for decoding, organizing, signing, verifying, and sealing investigation artifacts.

## Fixed

* Fixed packaged Windows launch by including the full `src/**/*` tree in the Electron build.
* Fixed missing packaged modules such as `src/automation/clipboardWatcher.js`, which caused the packaged app to crash before `app.whenReady()`.
* Preserved the earlier launch fixes:
  * Added missing `IntelligenceGraph` import.
  * Switched signing key generation from `secp256k1` to `prime256v1` for Electron/BoringSSL compatibility.
  * Removed unsafe pre-load `executeJavaScript` timing.
  * Added explicit visible-window launch handling.
  * Adjusted packaged renderer sandbox behavior for Windows compatibility.

## Brand

* Correct parent brand: The Proof Foundry™
* Short form: Proof Foundry
* Removed stale "Proof Factory" references.

## Verification

* E2E: 93/93 PASS
* release:gate PASS
* Packaged `app.asar` now includes required source modules
* Installer launch proof: PASS

## Artifacts

* `HyperSnatch-Setup-1.6.11.exe`
  SHA256: `7757217586fa23612e6cabb17940079b43a19009c5146b30944f7b950112da7b`

* `HyperSnatch_Vanguard_v1.6.11.zip`
  SHA256: `78f4aadf6fd58763f6e81b93848212adfb7b1558099b250e4a9672e8d0ca43cc`

v1.6.6, v1.6.7, v1.6.8, v1.6.9, and v1.6.10 are superseded. Use v1.6.11 or newer.
