# HyperSnatch

**Link Resurrection Engine operating inside an Offline DOM Workbench**

HyperSnatch is **not** a scraper, bypass tool, or circumvention system. It brings buried links back into visibility by analyzing static HTML snapshots and HAR captures that users legitimately provide.

## 🎯 **What HyperSnatch Does**

### **Link Resurrection**
Modern links decay over time. HyperSnatch resurrects them by:
- Parsing what users legitimately provide
- Analyzing static HTML snapshots  
- Processing HAR captures
- Extracting media candidates already present in captured artifacts
- Surfacing buried but existing endpoints

### **Offline DOM Workbench Principle**
- Nothing is fetched unless policy allows it
- Nothing is bypassed
- Only what exists in captured DOM is analyzed
- Airgapped policy mode for complete isolation

### **Cash Policy Shield Compliance**
- No premium wall bypass
- No login circumvention
- No DRM tampering  
- No hidden network activity in airgapped mode
- Every action logged
- Every refusal documented

## Deliverables
- `HyperSnatch_Final_Fused.html`: standalone production artifact.
- `HyperSnatch_Modular_Source/`: modular source of the fused build.
- `HyperSnatch_Modular_Source.zip`: packaged modular source.
- `HyperSnatch_Architecture_Documentation.txt`: module architecture.
- `HyperSnatch_Phase_Completion_Report.txt`: reconstruction and phase status.

## Current Host Support
- `emload.com` (basic tier)
- `kshared.com` (advanced tier)
- `rapidgator.net` (advanced tier)

## Run Verification

### Modular tests
```bash
cd HyperSnatch_Modular_Source
node --test
```

### Browser E2E (fused file)
```bash
cd e2e
npm test
```

### Release integrity gate
```bash
cd HyperSnatch_Modular_Source
node ../scripts/release_gate.mjs
```

## Security Notes
- `.tear` / `.vault` exports use local cryptography (PBKDF2 + AES-GCM).
- Trust policy can require signed imports.
- Trust store supports export/import, key rotation, and revocation.
- Release artifacts are checksum audited and signature verified.

