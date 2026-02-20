# HyperSnatch Platform - Electron Edition

## Overview

HyperSnatch Platform is now a **controlled offline forensic reconstruction workstation** built on Electron. This represents a complete architectural transformation from a web-based tool to a self-contained desktop application with enterprise-grade security boundaries.

## Architecture

### Platform Stack
```
┌─────────────────────────────────────────┐
│           HyperSnatch UI          │
├─────────────────────────────────────────┤
│         Secure Preload Bridge           │
├─────────────────────────────────────────┤
│        Electron Main Process           │
├─────────────────────────────────────────┤
│         Operating System               │
└─────────────────────────────────────────┘
```

### Security Boundaries
- **Context Isolation**: Enabled
- **Node Integration**: Disabled
- **Sandbox Mode**: Enabled
- **Remote Module**: Disabled
- **Web Security**: Enabled

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Windows 10+, macOS 10.14+, or Linux

### Build from Source
```bash
# Clone repository
git clone <repository-url>
cd HyperSnatch_Work

# Install dependencies
cd electron
npm install

# Build application
npm run build

# Run in development
npm run dev
```

### Platform Installers
- **Windows**: `HyperSnatch-Platform-Setup-1.0.0.exe`
- **macOS**: `HyperSnatch-Platform-1.0.0.dmg`
- **Linux**: `HyperSnatch-Platform-1.0.0.AppImage`

## Security Features

### 1. Manifest Verification
- Cryptographic verification of all components at startup
- Tamper detection with automatic lockdown
- Build ID validation: `HS-NX-PLATFORM-01`

### 2. Airgap Enforcement
- Complete network blocking when enabled
- Overrides `fetch`, `XMLHttpRequest`, `WebSocket`
- Audit logging for all blocked attempts

### 3. Secure Module Loading
- Hash verification for all modules
- Digital signature validation
- Sandboxed execution environment

### 4. Release Lock Mode
- Configuration lockdown for production
- Strict policy enforcement
- Debug console disabled
- No unsigned imports allowed

## Module System

### Core Modules
- **Resurrection Core** (`modules/resurrection_core.js`)
  - Link extraction and candidate scoring
  - HTML/HAR/URL parsing
  - Policy-aware filtering

- **Policy Guard** (`modules/policy_guard.js`)
  - Cash Policy Shield enforcement
  - Premium content detection
  - Export control validation

- **Strategy Runtime** (`modules/strategy_runtime.js`)
  - Signed strategy pack loading
  - Secure execution sandbox
  - Resource usage limits

- **Evidence Logger** (`core/evidence_logger.js`)
  - Forensic audit trails
  - Persistent logging
  - Export capabilities

### Strategy Packs
- **Email Link Extraction** (`strategy-packs/emload_v1/`)
- **Generic DOM Analysis** (`strategy-packs/generic_dom_v1/`)

## Usage

### Basic Operation
1. Launch HyperSnatch Platform
2. Verify boot sequence completes
3. Input HTML/HAR/URL data
4. Review extracted candidates
5. Export results (if policy allows)

### Extension Integration
Browser extensions can capture artifacts using the provided contract:
```javascript
// Capture HTML
const htmlData = await ExtensionCaptureContract.contract.captureHTML();

// Capture HAR
const harData = await ExtensionCaptureContract.contract.captureHAR();

// Import to HyperSnatch
await ExtensionCaptureContract.contract.importArtifact(filePath);
```

### Release Mode
Enable for production deployments:
- Locks all configuration
- Enforces strict policy
- Disables debug features
- Shows "RELEASE MODE: LOCKED" indicator

## Configuration

### Policy Modes
- **Strict**: No premium content, high confidence threshold
- **Standard**: Allows login-required content, medium confidence
- **Permissive**: Allows most content, low confidence

### Security Settings
- **Require Signed Imports**: Enforce digital signatures
- **Airgap Mode**: Block all network access
- **Evidence Logging**: Enable forensic audit trails

## Telemetry

Local-only metrics collection:
- Total inputs processed
- Average confidence scores
- Refusal rate
- Strategy pack usage
- Policy violations

Access via **System → Intelligence** panel.

## Build Identity

```
APP VERSION: 1.0.0-beta
ENGINE: RES-CORE-01
POLICY: CASH-SHIELD-01
RUNTIME: ELECTRON AIRGAPPED
BUILD: HS-NX-PLATFORM-01
```

## File Structure

```
HyperSnatch_v1.0.0.tear/
├── electron/
│   ├── main.js              # Main process
│   ├── preload.js           # Secure bridge
│   ├── secure_bridge.js     # Security layer
│   └── package.json         # Dependencies
├── modules/
│   ├── resurrection_core.js
│   ├── policy_guard.js
│   └── strategy_runtime.js
├── core/
│   ├── engine_core.js
│   └── evidence_logger.js
├── strategy-packs/
│   ├── emload_v1/
│   └── generic_dom_v1/
├── extension-interface/
│   └── capture_contract.js
├── manifest.json            # Build manifest
├── signature.sig            # Digital signature
└── hypersnatch.html   # UI layer
```

## Compliance

### Cash Policy Shield
- No premium wall bypass
- No login circumvention
- No DRM tampering
- Full audit logging

### Offline-First Operation
- No remote dependencies
- Local processing only
- Airgap ready
- Evidence preservation

## Troubleshooting

### Common Issues

**Manifest Verification Failed**
- Reinstall from trusted source
- Check file integrity
- Contact security team

**Network Access Blocked**
- Disable airgap mode if needed
- Check policy settings
- Review evidence logs

**Strategy Pack Loading Failed**
- Verify digital signature
- Check pack compatibility
- Review security logs

### Debug Information
Access debug information via:
- **System** panel in release mode (limited)
- **Console** in development mode
- **Evidence logs** for full audit trail

## Support

For security issues or platform support:
- Documentation: `docs/`
- Security: `security@hypersnatch.io`
- Issues: Via secure channel only

---

**HyperSnatch Platform** - Link Resurrection Engine  
Forensic reconstruction workstation for offline analysis.
