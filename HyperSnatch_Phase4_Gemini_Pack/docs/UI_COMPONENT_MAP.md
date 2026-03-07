# UI Component Map

## Core components

- AppShell
- TopToolbar
- SessionSidebar
- EvidenceFileList
- ValidationBadge
- SummaryPanel
- CandidatesTable
- HarClassifiedTable
- PlayerProfilePanel
- MarkdownReportPanel
- IntegrityPanel
- StatusLogDock

## Data flow

LoadEvidenceAction
→ EvidenceBundleLoader
→ BundleValidator
→ ParsedStateStore
→ UI renderers

## Render contracts

### SummaryPanel consumes:
- player_profile.json
- stream_candidates.json
- validation results

### CandidatesTable consumes:
- stream_candidates.json

### HarClassifiedTable consumes:
- har_classified.json

### PlayerProfilePanel consumes:
- player_profile.json

### MarkdownReportPanel consumes:
- report.md

### IntegrityPanel consumes:
- .manifest.json
