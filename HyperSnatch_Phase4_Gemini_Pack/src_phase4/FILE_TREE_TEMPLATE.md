# Suggested Phase 4 Source Tree

src/
  bundle/
    loadEvidenceBundle.js
    validateBundle.js
    verifyManifestHashes.js
  state/
    parsedBundleStore.js
  ui/
    shell/
      AppShell.jsx
      TopToolbar.jsx
      SessionSidebar.jsx
      StatusLogDock.jsx
    panels/
      SummaryPanel.jsx
      PlayerProfilePanel.jsx
      MarkdownReportPanel.jsx
      IntegrityPanel.jsx
    tables/
      CandidatesTable.jsx
      HarClassifiedTable.jsx
    actions/
      loadEvidenceAction.js
      validateBundleAction.js
      exportSummaryAction.js
      verifyIntegrityAction.js
