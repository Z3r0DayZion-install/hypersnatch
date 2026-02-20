# HyperSnatch Phases 53-69 Implementation Plan

**Mission**: OFFLINE DOM LINK RESURRECTION + Platform hardening + ship-ready bundle  
**Timeline**: Phase 53 → Phase 69  
**Status**: Implementation in Progress

---

## Phase 53 — Multi-link Input Engine (batch decode)

### Objectives
- Add support for multi-line paste (one per line)
- Auto-detect pasted "blocks" (HTML/HAR/text)
- Implement "Decode All" pipeline with progress tracking
- Add per-item status reporting
- Normalization: trim, de-dupe, canonicalize (remove tracking params optionally)

### Implementation Requirements
- **Input Parser**: Detect and separate different input types
- **Batch Processor**: Handle multiple URLs/HTML/HAR blocks
- **Progress UI**: Show real-time progress for batch operations
- **Normalization Engine**: Clean and standardize inputs
- **Deduplication**: Remove duplicate entries

### Files to Create/Modify
- `core/batch-processor.js` - New batch processing engine
- `core/input-detector.js` - New input type detection
- `hypersnatch.html` - Update UI for batch support
- `src/helpers.js` - Add batch processing helpers

---

## Phase 54 — Folder/Collection Detection (multi-result pages)

### Objectives
- Detect collection-type inputs (folders, list pages, etc.)
- Output MULTIPLE candidates from single input
- Parse DOM for anchors, iframes, embedded JSON
- Extract URL candidates from HAR requests/responses
- Show selectable list of candidates

### Implementation Requirements
- **DOM Parser**: Extract links from HTML content
- **HAR Parser**: Extract URLs from HAR data
- **Collection Detector**: Identify multi-result content
- **Candidate Selector**: UI for choosing from multiple results
- **Link Extractor**: Find various link types and attributes

### Files to Create/Modify
- `core/collection-detector.js` - New collection detection
- `core/link-extractor.js` - New link extraction engine
- `modules/dom-parser.js` - Enhanced DOM parsing
- `modules/har-parser.js` - HAR processing module
- `hypersnatch.html` - Update UI for candidate selection

---

## Phase 55 — Host Registry (pluggable strategies)

### Objectives
- Create `/modules/host_registry.js` with host → strategy mapping
- Each host strategy receives (input, context) and returns candidates[]
- Add SAFE "extractors" only (no bypass code)
- Implement strategies for: emload, kshared, rapidgator
- Add generic DOM/HAR extractor fallback

### Implementation Requirements
- **Host Registry**: Central strategy mapping system
- **Strategy Interface**: Standardized strategy API
- **Host Strategies**: Specific extractors for each host
- **Generic Fallback**: Default extraction logic
- **Strategy Loader**: Dynamic strategy loading

### Files to Create/Modify
- `modules/host_registry.js` - New host registry system
- `strategies/emload-v1.js` - Enhanced emload strategy
- `strategies/emload-v2.js` - Enhanced emload v2 strategy
- `strategies/kshared.js` - New kshared strategy
- `strategies/rapidgator.js` - New rapidgator strategy
- `strategies/generic.js` - Generic fallback strategy

---

## Phase 56 — Retry Queue + Evidence Log Upgrade

### Objectives
- Maintain retry queue for failed items with reason codes
- Enhanced evidence log with per-item tracking
- Store: raw input hash, normalization result, candidate list, chosen candidate, timestamps
- Export evidence as JSON and CSV

### Implementation Requirements
- **Retry Queue**: Failed item management with retry logic
- **Evidence Logger**: Enhanced logging system
- **Evidence Storage**: Structured evidence storage
- **Export System**: JSON/CSV evidence export
- **Reason Codes**: Standardized failure categorization

### Files to Create/Modify
- `core/retry-queue.js` - New retry queue system
- `core/evidence-logger.js` - Enhanced evidence logging
- `src/export-helpers.js` - Enhanced export functionality
- `hypersnatch.html` - Update UI for retry management

---

## Phase 57 — Candidate Decision UI (human choice + auto-pick)

### Objectives
- Results table/list per input with candidate details
- Show: candidate URL, confidence, method, host, type (direct/stream/unknown)
- Toggle "Auto choose best" (default ON)
- "Why this?" detail view linking to Phase 58 tracer

### Implementation Requirements
- **Candidate Table**: Sortable, filterable results table
- **Confidence Display**: Visual confidence indicators
- **Auto-pick Logic**: Intelligent candidate selection
- **Detail View**: Detailed candidate information
- **Choice Interface**: Human override capabilities

### Files to Create/Modify
- `src/candidate-table.js` - New candidate table component
- `src/confidence-display.js` - Confidence visualization
- `core/auto-picker.js` - Auto-selection logic
- `hypersnatch.html` - Update UI for candidate decision

---

## Phase 58 — Signal Tracer (explain confidence)

### Objectives
- Show signals hit for each candidate
- Display: pattern, source (DOM/HAR/header/json), heuristics
- Confidence components (score breakdown)
- Red flags (shorteners, missing scheme, suspicious params)
- Export tracer report with evidence

### Implementation Requirements
- **Signal Detector**: Identify confidence signals
- **Signal Analyzer**: Analyze and categorize signals
- **Confidence Calculator**: Score breakdown system
- **Red Flag Detector**: Suspicious pattern identification
- **Tracer Export**: Detailed tracer report generation

### Files to Create/Modify
- `core/signal-tracer.js` - New signal tracing system
- `core/confidence-analyzer.js` - Confidence analysis
- `src/signal-display.js` - Signal visualization
- `hypersnatch.html` - Update UI for signal tracing

---

## Phase 59 — Export Bundle v1

### Objectives
- "Export Session" button with comprehensive export
- Output: session.json (inputs, outputs, logs, settings)
- Include: results.csv, evidence.json
- Optional: .tear encrypted session pack using WebCrypto AES-GCM
- All exports work under file:// (use Blob + download)

### Implementation Requirements
- **Session Exporter**: Complete session export system
- **Bundle Creator**: Multi-file bundle generation
- **Encryption System**: WebCrypto AES-GCM encryption
- **File Download**: Blob-based file downloads
- **Export Manager**: Centralized export management

### Files to Create/Modify
- `core/session-exporter.js` - New session export system
- `core/bundle-creator.js` - Bundle generation
- `src/encryption.js` - WebCrypto encryption utilities
- `hypersnatch.html` - Update UI for export functionality

---

## Phase 60 — Host Status Panel (AllDebrid/Cocoleech-inspired, local)

### Objectives
- Add "Hosts" tab with local host management
- Local host list config: `/config/hosts.json` (user editable)
- Host info: name, status (up/down/maintenance/unknown), daily limits, notes
- UI: sortable list + quick search + status chips
- Import/Export hosts list functionality

### Implementation Requirements
- **Host Manager**: Local host configuration system
- **Status Tracker**: Host status monitoring
- **Host Config**: JSON-based host configuration
- **Status UI**: Host status display interface
- **Import/Export**: Host list management

### Files to Create/Modify
- `core/host-manager.js` - New host management system
- `config/hosts.json` - Host configuration file
- `src/host-status-panel.js` - Host status UI
- `hypersnatch.html` - Add hosts tab

---

## Phase 61 — UX Polish (Terminal Elite)

### Objectives
- Bring main UI to "Terminal Elite" feel
- Layout: left settings panel, top action bar, input editor, output console
- Action buttons: Decode, Decode All, Clear, Export
- Keyboard shortcuts: Ctrl+Enter decode, Ctrl+Shift+Enter decode all, Ctrl+K clear, Ctrl+S export
- Persist theme + preferences

### Implementation Requirements
- **Terminal UI**: Terminal-style interface design
- **Layout Manager**: Responsive layout system
- **Keyboard Handler**: Global keyboard shortcuts
- **Theme System**: Theme management and persistence
- **Preference Manager**: Settings persistence

### Files to Create/Modify
- `src/terminal-ui.js` - Terminal UI components
- `src/keyboard-shortcuts.js` - Keyboard shortcut system
- `src/theme-manager.js` - Theme management
- `hypersnatch.html` - Complete UI overhaul
- `css/terminal.css` - Terminal styling

---

## Phase 62 — Persistence v2 (history + settings)

### Objectives
- localStorage: last N sessions
- "History" view with re-open + re-export
- "Import Session" to restore prior exports
- Enhanced settings persistence
- Session management with metadata

### Implementation Requirements
- **Session Storage**: Enhanced localStorage management
- **History Manager**: Session history tracking
- **Session Importer**: Session restoration functionality
- **Settings Manager**: Enhanced settings persistence
- **Metadata Storage**: Session metadata handling

### Files to Create/Modify
- `core/session-storage.js` - Enhanced session storage
- `core/history-manager.js` - History management
- `src/session-importer.js` - Session import functionality
- `hypersnatch.html` - Add history view

---

## Phase 63 — Local Test Harness

### Objectives
- Create `/tests/test_runner.html` for comprehensive testing
- Test parsing (HTML, HAR, plain URLs)
- Test host strategies
- Test candidate scoring
- No external libraries required

### Implementation Requirements
- **Test Runner**: HTML-based test interface
- **Parsing Tests**: HTML/HAR/URL parsing tests
- **Strategy Tests**: Host strategy validation
- **Scoring Tests**: Candidate scoring verification
- **Test Reporter**: Test result reporting

### Files to Create/Modify
- `tests/test_runner.html` - Main test interface
- `tests/parsing-tests.js` - Parsing test suite
- `tests/strategy-tests.js` - Strategy test suite
- `tests/scoring-tests.js` - Scoring test suite

---

## Phase 64 — Docs + Troubleshooting

### Objectives
- Write comprehensive documentation
- `/README.md` (what it is, what it is NOT, offline workflow)
- `/docs/QUICKSTART.md` - Getting started guide
- `/docs/TROUBLESHOOTING.md` - Common issues and solutions
- `/docs/SECURITY_PRIVACY.md` - Privacy and security details

### Implementation Requirements
- **README**: Main project documentation
- **Quickstart**: Getting started guide
- **Troubleshooting**: Issue resolution guide
- **Security Docs**: Security and privacy documentation
- **API Docs**: Technical API documentation

### Files to Create/Modify
- `README.md` - Main project README
- `docs/QUICKSTART.md` - Quick start guide
- `docs/TROUBLESHOOTING.md` - Troubleshooting guide
- `docs/SECURITY_PRIVACY.md` - Security documentation
- `docs/API.md` - API documentation

---

## Phase 65 — Distribution Bundle

### Objectives
- Create clean `/dist/` folder for distribution
- Include: hypersnatch.html, modules/, config/, docs/, tests/
- Single ZIP build script: `/scripts/build_dist_zip.js`
- Output: `HyperSnatch_Nexus_RC.zip` in project root
- Clean, production-ready bundle

### Implementation Requirements
- **Dist Builder**: Clean distribution build
- **Bundle Creator**: ZIP file generation
- **File Organizer**: Proper directory structure
- **Version Manager**: Version tracking in builds
- **Clean Build**: Production-optimized bundle

### Files to Create/Modify
- `scripts/build_dist_zip.js` - Distribution build script
- `dist/` - Clean distribution directory
- `HyperSnatch_Nexus_RC.zip` - Final distribution bundle

---

## Phase 66 — Electron Wrapper (optional)

### Objectives
- Ensure Electron loads same dist entrypoint
- Fix file paths for Electron environment
- Provide `/electron/README.md` for building
- Do NOT block core static build if Electron fails
- Optional Electron integration

### Implementation Requirements
- **Electron Integration**: Electron app configuration
- **Path Fixing**: File path corrections for Electron
- **Build Docs**: Electron build documentation
- **Fallback Handling**: Graceful Electron failure handling

### Files to Create/Modify
- `electron/main.js` - Electron main process
- `electron/README.md` - Electron build guide
- `package.json` - Electron build configuration

---

## Phase 67 — Telemetry OFF + License Terms

### Objectives
- Ensure no external calls or telemetry
- Add licensing notes in `/docs/LICENSE_TERMS.md`
- Verify offline-only operation
- Document usage terms and conditions
- Ensure privacy compliance

### Implementation Requirements
- **Telemetry Audit**: Verify no external calls
- **License Documentation**: Clear licensing terms
- **Privacy Verification**: Ensure privacy compliance
- **Usage Terms**: Document acceptable use

### Files to Create/Modify
- `docs/LICENSE_TERMS.md` - License and terms documentation
- Code audit for external calls
- Privacy policy documentation

---

## Phase 68 — "IP + Tech" dossier for any LLM/reader

### Objectives
- Generate `/docs/IP_OVERVIEW.md` (what makes it unique, modules, moat)
- Create `/docs/TECH_STACK.md` (how it works end-to-end)
- Document parsing, scoring, export, persistence, safety guardrails
- Comprehensive technical documentation
- IP protection and technical overview

### Implementation Requirements
- **IP Overview**: Unique value proposition documentation
- **Tech Stack**: Complete technical architecture
- **Process Documentation**: End-to-end process documentation
- **Safety Documentation**: Security and safety measures

### Files to Create/Modify
- `docs/IP_OVERVIEW.md` - IP and competitive overview
- `docs/TECH_STACK.md` - Technical stack documentation
- `docs/PROCESS_FLOW.md` - Process flow documentation

---

## Phase 69 — Release Candidate checklist

### Objectives
- Create `/docs/RC_CHECKLIST.md` with pass/fail criteria
- Verify: file:// works, batch decode works, export works
- Verify: host panel works, tests run, docs complete
- Final release validation
- Release readiness assessment

### Implementation Requirements
- **Release Checklist**: Comprehensive release validation
- **Functional Testing**: All features working verification
- **Documentation Review**: Complete documentation check
- **Release Validation**: Final release readiness

### Files to Create/Modify
- `docs/RC_CHECKLIST.md` - Release checklist
- Final testing and validation
- Release preparation

---

## Implementation Priority

### Phase 1: Core Functionality (53-59)
1. Phase 53 - Multi-link Input Engine
2. Phase 54 - Folder/Collection Detection
3. Phase 55 - Host Registry
4. Phase 56 - Retry Queue + Evidence Log
5. Phase 57 - Candidate Decision UI
6. Phase 58 - Signal Tracer
7. Phase 59 - Export Bundle v1

### Phase 2: UX Enhancement (60-62)
8. Phase 60 - Host Status Panel
9. Phase 61 - UX Polish (Terminal Elite)
10. Phase 62 - Persistence v2

### Phase 3: Quality & Distribution (63-69)
11. Phase 63 - Local Test Harness
12. Phase 64 - Docs + Troubleshooting
13. Phase 65 - Distribution Bundle
14. Phase 66 - Electron Wrapper (optional)
15. Phase 67 - Telemetry OFF + License
16. Phase 68 - IP + Tech dossier
17. Phase 69 - Release Candidate checklist

---

**Status**: Ready for implementation  
**Next Step**: Begin Phase 53 implementation
