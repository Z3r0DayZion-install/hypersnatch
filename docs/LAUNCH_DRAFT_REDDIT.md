# Reddit Launch Strategy & Drafts

> Compiled from `02_REDDIT_LAUNCH_GUIDE.md`
> **Target Subreddits:** r/netsec, r/selfhosted, r/programming, r/privacy

## Title Strategy
Avoid product marketing. Focus on the architecture and ask a question.
**Example Titles:**
- *Would you actually verify a desktop binary before running it?*
- *I got tired of SmartScreen, so I built a 10/10 verifiable release pipeline instead.*
- *Can we ship offline Windows binaries without trusting the developer?*

---

## Draft Post (For r/netsec & r/programming)

**Title:** How we replaced SmartScreen trust with offline cryptographic verification for a desktop app

**Body:**
Hey everyone,

Software distribution on Windows is fundamentally broken for independent developers. If you ship an `.exe`, SmartScreen throws a terrifying red warning unless you pay hundreds of dollars for an EV Code Signing certificate and undergo enterprise KYC. 

You aren't paying for security; you're paying for reputation.

I got tired of this model, so instead of buying a certificate, I spent the last few weeks building an absolute zero-trust, offline-verifiable release pipeline for an offline Electron app I maintain. I wanted to see if I could push the supply chain credibility score to a 10/10 level.

Here is the architecture we ended up with:

1.  **Deterministic Builds:** We use a pinned `Dockerfile.repro` and strictly enforce `npm ci --ignore-scripts` to neutralize upstream post-install RCE vectors.
2.  **Two-Party Signatures:** The CI pipeline generates a manifest of the binary hashes. This manifest is signed *twice*: once by the CI (Keyless Sigstore) and once manually by an air-gapped GPG key.
3.  **Zero-Dependency Offline Verifiers:** We ship 4 distinct verifiers (`verify.ps1`, `verify.sh`, `verify_node.js`, `verify.py`) in a bundle with the release.
4.  **Verifier Hash Anchoring:** To prevent attackers from poisoning the verifier scripts on a mirror, their SHA-256 hashes are hard-anchored in the repo's `README.md` and a root fingerprint file.
5.  **Append-Only Transparency:** Every release automatically appends an immutable entry to a public transparency log and generates a CycloneDX SBOM.

**The result:** You can download the binary, run `.\verify.ps1` locally, and cryptographically verify the artifact against the manifest in 60 seconds without a network connection. Or, you can just run `verify_repro.sh` and Docker will spit out a bit-identical binary locally to prove no CI injection occurred.

I'm curious: if an independent tool provided this level of rigorous, detached verification, would that actually influence your decision to run it? Or is the friction of running a verification script simply too high for most people?

If you're interested in the pipeline implementation, the repository and architecture docs are here:
[github.com/Z3r0DayZion-install/hypersnatch](https://github.com/Z3r0DayZion-install/hypersnatch)

I'd appreciate any harsh technical critiques on the threat model or attack surface documentation.
