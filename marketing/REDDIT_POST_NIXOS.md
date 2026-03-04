# Reddit Post: r/NixOS Launch Thread

**Title**: Show r/NixOS: A Detached Verification Experiment — Unsigned, Reproducible, and Deterministic

**Body**:

Hey r/NixOS,

I’ve spent the last few months obsessing over a problem: How do you distribute a binary to technical users without paying the "EV Certificate Tax" to Microsoft, while providing *higher* security guarantees than a standard signed `.exe`?

The result is **HyperSnatch Vanguard (v1.2.0)**. 

### What is it?
Functional payload: A forensic-grade, offline-first media URL extractor (40+ sites, Rust core).
**The real experiment**: A zero-trust distribution model that relies on **Nix-style determinism** rather than opaque CA trust.

### The Stack
* **Bit-for-Bit Parity**: Every build is bitwise identical to the source.
* **Detached Ed25519 Verifier**: We ship a ~60 line PowerShell script (`verify.ps1`) that checks the binary against a signed manifest. No network calls.
* **Offline-First**: Zero telemetry. Even the DNS fallback uses local cached resolution or HTTPS DoH helpers (fully auditable).
* **Rust Core**: Heavy parsing moved from JS to Rust for memory safety and performance.

### Why NixOS users?
Because you actually understand what "reproducible" means. I'm looking for 5-10 people to audit the `REPRODUCIBILITY.md` and see if you can break the hash invariants on your local machines.

**Repo**: [https://github.com/Z3r0DayZion-install/hypersnatch](https://github.com/Z3r0DayZion-install/hypersnatch)
**v1.2.0 Digest**: `504d4ed8f4b11664553e88c3d85cb5c1297191a3a5aa1a8b943f29a5d24bbfd8` (Setup)

Would love your feedback on the detached verification UX. No SaaS, no cloud, just local binaries behaving as they should.

Cheers.
