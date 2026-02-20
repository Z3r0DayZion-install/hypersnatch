# Founder Snapshot v14 - Extracted Requirements
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
  - `kind`: "tear" | "export" | "snapshot" | "vault"
  - `createdAt`: ISO timestamp
  - `kdf`: "PBKDF2-SHA256"
  - `iterations`: 120000
  - `salt`: Base64 string
  - `iv`: Base64 string
  - `digest`: SHA-256 digest
  - `data`: Base64 encoded payload
  - `signature`: Optional ECDSA signature

---

## 🎯 PLATFORM GAPS (REMAINING 20%)

### **GAP A) Formal JSON Schema validation for ALL pack types**
- Create JSON Schemas:
  - `schemas/hs-tear-bundle-1.schema.json`
  - `schemas/tear-v2.schema.json`
  - `schemas/hs-collector-1.schema.json`
- Implement validation in TWO places:
  1) Node/CLI compiler + verifier (hard fail on invalid)
  2) In-app import/ingest (soft fail → quarantine with HSX code)
- Add a schema version/migration field where appropriate.

### **GAP B) Deterministic Tear Compiler v1 (bundle + data parity)**
- Implement CLI: `scripts/tear-compile.(js|cjs|mjs)`
  Inputs:
    - `--bundle <path-to-runtime-assets>` → outputs .tear (schema: hs-tear-bundle-1)
    - `--data <path-or-state>` → outputs .tear (format: tear-v2)
    - `--profile full|lean|state-only`
    - `--deterministic true|false`
- Must produce:
  - Canonical JSON ordering
  - Stable SHA-256 digest generation
  - Optional encryption (passphrase-based) for tear-v2 packs
- Output includes manifest + digest + metadata.

### **GAP C) Full Verify UI panel (deep inspection view)**
- Add a dedicated "Verify" panel in the HTML UI:
  - Load .tear or .json
  - Detect bundle vs data pack vs collector payload
  - Validate against schema
  - Verify digest integrity
  - Verify signature/trust status (trusted/untrusted/revoked/unsigned)
  - Show manifest (for bundle) + contained objects (for data pack)
  - Show warnings + HSX codes
- Include "Export Doctor Report" / "Signed Doctor Report" stub if not complete; don't fake signing.

### **GAP D) Adapter SDK boundary (data-only rulepacks)**
- Implement a strict rulepack format: data-only JSON (NO executable code).
- Provide adapters/README.md and adapters/schema/rulepack.schema.json.
- In UI: "Load Rulepack" + apply rules to inbox/queue items.
- Enforce: rulepacks can only transform/score/label items; cannot fetch network.

### **GAP E) Rule test sandbox (DOM snippet extraction test)**
- In UI: a sandbox where user pastes HTML snippet or provides a small DOM sample.
- Run extraction rules + show extracted URLs/media, normalized items, confidence, and policy outcomes.
- Provide golden test vectors.

### **GAP F) Indexed search across vault**
- Build a search index over stored jobs/snapshots (IndexedDB if available, fallback memory).
- UI: search bar + filters (host/type/status/HSX code/date range).
- Must be fast and not freeze on large vaults.

### **GAP G) Worker-based hashing for large packs**
- Browser: move SHA-256 hashing into a Web Worker with progress updates for big payloads.
- Node: optionally use worker_threads for large pack compilation.
- UI must remain responsive.

### **GAP H) Crash-repair journal replay**
- Implement an append-only journal of state transitions (queue/decode/import/export).
- On startup: detect interrupted operations and offer replay/repair.
- Provide a "Repair" button in Verify or Settings.

### **GAP I) Schema migrations engine**
- Add migrations/ with versioned transforms (v0→v1 etc).
- On import: if older pack, preview migration, then apply to normalized structure.
- Unit tests for migration correctness.

### **GAP J) Signed release pack builder**
- Implement scripts/build_release_pack.(js)
  - Outputs a signed release pack (bundle + release notes + manifest + digests)
  - Uses deterministic digest; signing method may be non-deterministic, but verification must be correct.
  - Generates an allowlist/trust entry suitable for trustStore import.
- Add scripts/verify_release_pack.(js) that validates:
  schema, digests, trust status, manifest completeness.

---

## 🎯 MISSING (NEXT TARGETS)

### **Key rotation UX polish**
- UI to generate new keyId, mark old as "retiring", and rotate activeKeyId

### **Revocation workflow UI**
- UI to revoke a key (status=revoked) and explain impact on imports

### **Signed doctor reports**
- "Doctor Mode" should generate a signed diagnostic report pack (tear-v2 kind=doctor)
- Must exclude private keys

---

## 📋 IMPLEMENTATION NOTES

**Source**: Extracted from existing codebase analysis and fused HTML build (HyperSnatch_Final_Fused.html)

**Confirmed Features in Fused v8:**
- ✅ SmartQueue processing with clipboard integration
- ✅ tear-v2 format support with encryption/decryption
- ✅ Import/Export functionality for .tear files
- ✅ Trust management interface
- ✅ Self-test capabilities including encryption roundtrip

**Missing Features Identified:**
- ❌ Indexed search across vault
- ❌ Worker-based hashing for large packs
- ❌ Crash-repair journal replay
- ❌ Schema migrations engine
- ❌ Signed release pack builder
- ❌ Key rotation UX
- ❌ Revocation workflow UI
- ❌ Signed doctor reports

---

**This extraction forms the complete roadmap for implementing Founder Snapshot v14 requirements in the HyperSnatch platform.**
