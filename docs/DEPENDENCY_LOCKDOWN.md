# Dependency Lockdown Protocol

> HyperSnatch relies on a strictly audited, immutable dependency graph. This document details how we mitigate the #1 supply chain attack vector: dependency substitution and post-install script execution.

## 1. Zero-Script Installation

HyperSnatch strictly enforces `ignore-scripts = true` during dependency resolution.

### Why this matters
The majority of malicious npm packages execute their payload during the `postinstall` or `preinstall` phase, before the code is even run or reviewed. By disabling install scripts universally, we neutralize remote code execution across the entire dependency tree.

### How it is enforced
- Developer environments must run `npm config set ignore-scripts true`
- The CI pipeline (`release.yml`) executes `npm ci --ignore-scripts --audit`
- Pinned toolchains: `Node 20.17.0` exactly.

## 2. Lockfile Immutability

Releases are built **exclusively** using `npm ci`.

Unlike `npm install`, which can silently resolve newer, potentially compromised transitive dependencies, `npm ci` strictly enforces the exact sub-dependency tree recorded in `package-lock.json`.

If a developer alters `package-lock.json` manually or without explicit security review, the build will branch and the SLSA provenance attestation will flag the tampered commit.

## 3. Minimal Dependency Surface

We adhere to the Absolute Minimum Dependency Principle (AMDP). Third-party code is a liability.

### Current Runtime Graph
- `ajv (6.12.6)` — Fast JSON Schema validation (local API bridge)
- `chrome-remote-interface (^0.34.0)` — Isolated DOM snapshotting

All other logic (cryptography, extraction, rendering, telemetry-blocking) is implemented cleanly in vanilla Javascript/Node using built-in modules (`crypto`, `fs`, `path`).

## 4. Auditing

Before any release is generated, the CI pipeline automatically runs `npm audit signatures` (where applicable) and standard `npm audit`.

Any dependency flag with a `moderate` or higher severity automatically fails the build, preventing a release artifact from ever being signed or published.
