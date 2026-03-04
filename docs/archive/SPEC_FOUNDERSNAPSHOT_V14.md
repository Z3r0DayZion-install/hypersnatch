# HyperSnatch Founder Snapshot v14 - Extracted Requirements
## Parsed from existing codebase and specifications

---

## 📋 DUAL .TEAR DEFINITIONS

### **.tear Bundle (hs-tear-bundle-1)**
- **Purpose**: Runtime cartridge (app + assets + manifest)
- **Schema**: `hs-tear-bundle-1`
- **Components**:
  - `format`: "hs-tear-bundle-1"
  - `schemaVersion`: 1
  - `app`: "HyperSnatch"
  - `appVersion`: string
  - `manifest`: Runtime manifest object
  - `assets`: Array of bundled assets
  - `digest`: SHA-256 of entire bundle
  - `signature`: Optional ECDSA signature

### **.tear Data Pack (tear-v2)**
- **Purpose**: Deterministic vault/evidence/save container
- **Schema**: `tear-v2`
- **Components**:
  - `format`: "tear-v2"
  - `schemaVersion`: 2
  - `app`: "HyperSnatch"
  - `appVersion`: string
  - `kind`: "tear" | "export" | "snapshot"
  - `createdAt`: ISO timestamp
  - `kdf`: "PBKDF2-SHA256"
  - `iterations`: 120000
  - `salt`: Base64 string
  - `iv`: Base64 string
  - `digest`: SHA-256 digest
  - `data`: Base64 encoded payload
  - `signature`: Optional ECDSA signature

---

## 🛡️ TEARRUNNER SECURITY POSTURE REQUIREMENTS

### **Network Blocking**
- **Default**: Block all outbound HTTP/HTTPS/WebSocket
- **Level**: Electron session/webRequest API
- **Override**: Explicit CLI flag only (e.g., --allow-network)

### **DevTools Control**
- **Default**: Disabled
- **Override**: --devtools CLI flag required
- **Production**: No DevTools access

### **Security Hardening**
- **contextIsolation**: true
- **nodeIntegration**: false
- **sandbox**: true
- **webSecurity**: true

### **Data Isolation**
- **Portable**: User data in `.hs_userdata` beside runtime
- **IPC**: Local file operations only
- **Channels**: Strict allowlist enforcement

---

## 📦 COLLECTOR EXTENSION (MV3 v0.1) PAYLOAD SCHEMA

### **Schema: hs-collector-1**
```json
{
  "format": "hs-collector-1",
  "schemaVersion": 1,
  "fingerprint": "browser-fingerprint-hash",
  "id": "unique-collection-id",
  "capturedAt": "ISO-8601-timestamp",
  "pageUrl": "source-page-url",
  "origin": "origin-domain",
  "items": [
    {
      "type": "url" | "media" | "text",
      "content": "extracted-content",
      "confidence": 0.0-1.0,
      "metadata": {
        "selector": "CSS-selector",
        "attribute": "attribute-name",
        "timestamp": "ISO-timestamp"
      }
    }
  ]
}
```

### **MV3 Requirements**
- **manifest.json**: Manifest V3 format
- **service_worker.js**: Background service worker
- **content_script.js**: DOM extraction
- **popup.html**: UI for collection management
- **Offline Handoff**: JSON download + clipboard copy

---

## 🎯 PLATFORM GAPS (REMAINING 20%)

### **GAP A) Formal JSON Schema Validation**
**Status**: PARTIAL
- **Missing**: Complete JSON schemas for all pack types
- **Current**: Basic validation in modular source
- **Needed**: 
  - `schemas/hs-tear-bundle-1.schema.json`
  - `schemas/tear-v2.schema.json`
  - `schemas/hs-collector-1.schema.json`
- **Implementation**: Node/CLI compiler + in-app validation

### **GAP B) Deterministic Tear Compiler v1**
**Status**: MISSING
- **Missing**: CLI tear compiler
- **Needed**: 
  - `scripts/tear-compile.js`
  - Bundle compilation (--bundle)
  - Data pack compilation (--data)
  - Canonical JSON ordering
  - Stable SHA-256 digests
  - Optional encryption
- **Output**: .tear files with proper schema

### **GAP C) Full Verify UI Panel**
**Status**: PARTIAL
- **Current**: Basic verification in fused HTML
- **Missing**: 
  - Dedicated "Verify" panel
  - Bundle vs data pack detection
  - Schema validation UI
  - Digest integrity verification
  - Trust status display
  - Manifest inspection
  - HSX code warnings
  - Doctor report export

### **GAP D) Adapter SDK Boundary**
**Status**: MISSING
- **Missing**: 
  - Data-only rulepack format
  - `adapters/README.md`
  - `adapters/schema/rulepack.schema.json`
  - UI rulepack loading
  - Apply rules to inbox/queue
  - Network access prevention

### **GAP E) Rule Test Sandbox**
**Status**: MISSING
- **Missing**: 
  - DOM snippet extraction sandbox
  - HTML snippet input
  - Extraction rule testing
  - Confidence scoring display
  - Policy outcome testing
  - Golden test vectors

### **GAP F) Indexed Search Across Vault**
**Status**: MISSING
- **Missing**: 
  - Search index over stored jobs/snapshots
  - IndexedDB implementation
  - Memory fallback
  - Search bar + filters
  - Host/type/status/HSX/date filters
  - Performance optimization

### **GAP G) Worker-Based Hashing**
**Status**: MISSING
- **Missing**: 
  - Web Worker for SHA-256 hashing
  - Progress updates for large payloads
  - Node worker_threads option
  - UI responsiveness maintenance

### **GAP H) Crash-Repair Journal Replay**
**Status**: MISSING
- **Missing**: 
  - Append-only state transition journal
  - Interrupted operation detection
  - Startup replay/repair
  - "Repair" button in Verify/Settings
  - State consistency restoration

### **GAP I) Schema Migrations Engine**
**Status**: PARTIAL
- **Current**: Basic migration in modular source
- **Missing**: 
  - `migrations/` with versioned transforms
  - Preview migration UI
  - Apply to normalized structure
  - Unit tests for migration correctness
  - v0→v1 etc. transforms

### **GAP J) Signed Release Pack Builder**
**Status**: MISSING
- **Missing**: 
  - `scripts/build_release_pack.js`
  - Signed release pack output
  - Bundle + release notes + manifest + digests
  - Deterministic digest generation
  - Allowlist/trust entry generation
  - `scripts/verify_release_pack.js`

---

## 🎯 IMPLEMENTATION PRIORITY

### **HIGH PRIORITY (Must Complete)**
1. **GAP A**: JSON Schema validation
2. **GAP B**: Deterministic tear compiler
3. **GAP C**: Full verify UI panel

### **MEDIUM PRIORITY**
4. **GAP D**: Adapter SDK boundary
5. **GAP E**: Rule test sandbox
6. **GAP F**: Indexed search

### **LOW PRIORITY**
7. **GAP G**: Worker-based hashing
8. **GAP H**: Crash-repair journal
9. **GAP I**: Schema migrations
10. **GAP J**: Signed release pack builder

---

## 📋 ACCEPTANCE CRITERIA

Each gap must achieve **OK** status with:
- ✅ **Implementation**: Code exists and functions
- ✅ **Testing**: Unit tests pass
- ✅ **UI Integration**: Accessible via UI/CLI
- ✅ **Documentation**: Usage instructions provided
- ✅ **Verification**: Automated verification passes

---

**This specification forms the complete roadmap for closing the remaining 20% platform gaps to achieve production-ready HyperSnatch v15.**
