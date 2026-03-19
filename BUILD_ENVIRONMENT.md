# Build and Runtime Environment

This document defines the verified environment required for the operation and reproduction of HyperSnatch v1.3.1-sovereign.

## Core Requirements

- **Runtime**: Node.js v20.x or higher.
- **Operating System**: Windows 10/11 (Optimized for PowerShell and `certutil` availability).
- **Hard Drive Space**: ~500MB (for archive extraction and temporary registry generation).

## Dependencies

- **External Packages**: Zero. The core intelligence and extraction engines use native Node.js and OS-level primitives to ensure long-term stability without dependency rot (Sovereign Mode).
- **Core Modules**: `fs`, `path`, `crypto`, `child_process`.

## Verification Command

To verify the platform in any new environment:
```bash
node scripts/verify_system.js
```

## State Constraints

- **Offline Only**: HyperSnatch is designed for air-gapped forensic environments.
- **Stateless Intelligence**: The intelligence engine generates insights from the `.hsn` capsule registry but does not require a persistent external database.
