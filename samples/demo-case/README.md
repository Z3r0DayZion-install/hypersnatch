# HyperSnatch Sample Proof Workspace

A small, synthetic demo case so a first-time user can understand HyperSnatch in
under a minute without needing real evidence.

> Capture the artifact. Keep the proof.

Everything here is fictional and copyright-safe. "Example Vendor" is not a real
entity, and no real, private, or third-party content is included.

## The story

A user found a page with a visible download link. HyperSnatch preserved the page
context, recorded the link, captured the downloadable artifact, hashed the files,
and created a receipt-backed proof package.

## What is in this folder

```text
samples/demo-case/
  README.md                 this file
  captured-page/
    index.html              the synthetic captured page (has the download link)
    dom-snapshot.html       final rendered DOM snapshot
    screenshot-placeholder.svg  stand-in screenshot
  artifacts/
    sample-report.txt       the downloadable artifact referenced by the page
    sample-download.bin     a second artifact, to show multi-file hashing
  proof/
    manifest.json           files, roles, hashes, capture + download metadata
    receipt.json            machine-readable receipt anchored to the manifest hash
    SHA256SUMS.txt          sha256 of every captured/artifact file
    page-receipt.md         human-readable page receipt
    download-receipt.md     human-readable download receipt
```

## How the pieces connect

- `captured-page/index.html` exposes a visible link: **Download sample report**
  (`a#downloadLink` -> `../artifacts/sample-report.txt`).
- `proof/manifest.json` lists every file with its SHA256 and the download metadata.
- `proof/SHA256SUMS.txt` lets you re-verify those hashes.
- `proof/receipt.json` references the manifest by its own SHA256
  (`3c73e649...a4fea`), tying the receipt to an exact manifest state.
- `proof/page-receipt.md` and `proof/download-receipt.md` are the readable views.

## Verify the hashes yourself

From this folder:

```bash
# Linux/macOS
sha256sum -c proof/SHA256SUMS.txt
```

```powershell
# Windows PowerShell
Get-Content proof/SHA256SUMS.txt | ForEach-Object {
  $parts = $_ -split '\s+', 2
  $actual = (Get-FileHash $parts[1] -Algorithm SHA256).Hash.ToLower()
  "{0}  {1}" -f ($(if ($actual -eq $parts[0]) {'OK'} else {'FAIL'})), $parts[1]
}
```

Hashes are computed over the committed sample files.

## Honest limits

This demo shows the proof workflow on synthetic content. Real captures of live
pages, DRM content, expiring URLs, login-only resources, or anti-bot-protected
sites may not replay perfectly.
