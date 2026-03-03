# Detached Verification on Windows: An Experiment

*Can unsigned, offline-verifiable binaries compete with EV-signing + SmartScreen as a trust model?*

---

## The Problem

If you ship a Windows binary today, you have two options:

1. **Pay for an EV code-signing certificate** ($300–$500/year), accumulate SmartScreen reputation over months of telemetry, and hope Microsoft's opaque algorithms eventually stop flagging your installer.

2. **Ship unsigned**, eat the "Windows protected your PC" warning, and pray your users are brave enough to click "More info" → "Run anyway."

Neither option is about *trust*. The first is about *payment*. The second is about *friction tolerance*. A user who clicks through a SmartScreen warning has no more reason to trust your binary than before — they've just been trained to ignore security prompts.

## The Thesis

For a technical user base, **a transparent, offline-verifiable binary is actually higher trust** than either option above. Here's why:

- **EV signatures prove payment, not integrity.** A signed binary tells you the developer paid for a certificate. It tells you nothing about what the code does or whether the binary matches the published source.

- **SmartScreen is telemetry, not verification.** SmartScreen reputation is built by sending data about every download to Microsoft. An offline tool — by definition — can't participate in this system without betraying its own value proposition.

- **Hash verification is deterministic.** If I give you a SHA-256 hash and a script to check it, the outcome is binary and reproducible. Either the hash matches or it doesn't. No reputation scores, no telemetry, no certificate authorities.

## The Experiment

[HyperSnatch](https://github.com/Z3r0DayZion-install/hypersnatch) is a fully offline desktop tool that extracts direct download URLs from raw HTML. No browser automation, no API keys, no network calls during operation.

For the v1.2.0 release, we're shipping with a **detached verification model**:

### The UX

```
1. Download HyperSnatch-Setup-1.2.0.exe
2. Download verify.ps1 (from the same repo)
3. Run: .\verify.ps1 .\HyperSnatch-Setup-1.2.0.exe
```

The verifier is a ~60-line PowerShell script with zero dependencies. It computes the SHA-256 hash of the binary and compares it against a hardcoded manifest. No network calls. No certificate chains. No trust anchors beyond the script itself.

### What the output looks like

```
  ================================================
  HyperSnatch -- Binary Integrity Verification
  ================================================

  File: HyperSnatch-Setup-1.2.0.exe
  Size: 82451392 bytes
  Computing SHA-256...
  Hash: 504d4ed8f4b11664553e88c3...

  VERIFIED -- Hash matches official manifest
  Artifact: HyperSnatch-Setup-1.2.0.exe (Installer)
  Status:   AUTHENTIC

  This binary is safe to run.
```

If the hash doesn't match:

```
  FAILED -- Hash does NOT match any known build
  DO NOT RUN THIS FILE.
```

## The Open Questions

This model works. The script is tested and the hashes are real. But is it *viable as a primary distribution model*? Some friction points:

1. **SmartScreen still fires.** The user still sees "Windows protected your PC" on the unsigned installer. The verification step doesn't suppress this — it just gives the user a reason to trust the binary *before* they encounter the warning.

2. **PowerShell execution policy.** Many Windows machines have restrictive execution policies. Users may need to run `Set-ExecutionPolicy -Scope Process Bypass` before the verifier works. This is one more friction step.

3. **Trust anchor bootstrap.** Where does the user get `verify.ps1` from? If it's the same GitHub repo, what prevents an attacker from replacing both the binary and the verifier? The answer is that the verifier has hardcoded hashes — replacing it would change *its* hash, which can be checked by the repo's commit history. But this requires the user to understand git's content-addressed storage model.

4. **Audience mismatch.** This model is excellent for users who understand cryptographic hashes. It's useless for a general audience. Is this a feature or a limitation?

## What I Want to Know

I'm specifically interested in feedback from people working on Nix, Guix, or other reproducible-build ecosystems:

- Does the Nix ecosystem have a standardized way of thinking about detached signatures on platforms hostile to unsigned code?
- Is there precedent for this kind of "verification-first" distribution in practice?
- What's the minimum viable UX for hash-based verification to be acceptable?

The full source, verifier script, and release are at:
**[github.com/Z3r0DayZion-install/hypersnatch](https://github.com/Z3r0DayZion-install/hypersnatch)**

---

*This is an experiment, not a manifesto. If it turns out that SmartScreen friction is simply too high, that's useful data. The point is to test the thesis with real users and real feedback.*
