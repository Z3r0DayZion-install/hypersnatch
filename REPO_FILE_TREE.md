# HyperSnatch Repo File Tree

This is the canonical repository layout. Agents should not improvise folder structure.

```text
HyperSnatch/
├─ README.md
├─ RUN_THIS_FIRST.md
├─ MASTER_INDEX.md
├─ AGENT_BOOT_PROMPT.md
├─ REPO_FILE_TREE.md
├─ MODULE_CONTRACTS.md
├─ IMPLEMENTATION_GUARDRAILS.md
├─ ACCEPTANCE_CRITERIA.md
│
├─ docs/
│  ├─ ULTRA_LAB_MASTER.md
│  ├─ SYSTEM_MAP.md
│  ├─ MODULE_GRAPH.md
│  ├─ CONFIDENCE_SCORING.md
│  ├─ UI_VISUAL_SYSTEM.md
│  ├─ DESKTOP_UI_WIREFRAME.md
│  ├─ EXTENSION_UI_SPEC.md
│  ├─ UI_COMPONENT_BREAKDOWN.md
│  ├─ UX_BEHAVIOR.md
│  ├─ AI_ANALYZER_FULL_SPEC.md
│  ├─ BROWSER_MEMORY_FORENSICS_FULL_SPEC.md
│  ├─ PLAYER_FINGERPRINT_DATABASE.md
│  ├─ SITE_FINGERPRINT_DATABASE.md
│  └─ TEST_HARNESS_SPEC.md
│
├─ agents/
│  ├─ BUILD_TASKS.md
│  ├─ MODULE_PROMPTS.md
│  └─ FIRST_10_COMMITS_PLAN.md
│
├─ datasets/
│  └─ evidence_targets/
│     ├─ target_0_html5/
│     ├─ target_2_hls/
│     ├─ target_4_dash/
│     ├─ target_6_videojs/
│     ├─ target_8_jwplayer/
│     ├─ target_10_shaka/
│     ├─ target_11_blob/
│     ├─ target_12_tokenized_hls/
│     └─ ...
│
├─ schemas/
│  ├─ player_fingerprint.example.json
│  └─ site_fingerprint.example.json
│
├─ training/
│  ├─ pattern_extractor.py
│  └─ rule_generator.py
│
├─ tests/
│  ├─ target_lists/
│  ├─ unit/
│  ├─ integration/
│  └─ fixtures/
│
├─ src/
│  ├─ contracts/
│  │  ├─ artifactSchema.js
│  │  ├─ moduleOutputs.js
│  │  └─ uiDataContracts.js
│  │
│  ├─ utils/
│  │  ├─ stableJson.js
│  │  ├─ hashing.js
│  │  └─ paths.js
│  │
│  ├─ evidence/
│  │  ├─ loadEvidenceBundle.js
│  │  ├─ normalizeEvidence.js
│  │  └─ exportEvidenceBundle.js
│  │
│  ├─ har/
│  │  ├─ parseHar.js
│  │  ├─ normalizeRequest.js
│  │  └─ classifyRequest.js
│  │
│  ├─ detect/
│  │  ├─ extractCandidateUrls.js
│  │  ├─ scoreCandidates.js
│  │  ├─ detectProtocol.js
│  │  └─ detectCDN.js
│  │
│  ├─ fingerprint/
│  │  ├─ loadFingerprints.js
│  │  ├─ matchPlayer.js
│  │  ├─ matchSite.js
│  │  └─ fingerprintSignals.js
│  │
│  ├─ mse/
│  │  ├─ parseMSEEvents.js
│  │  ├─ mapBlobUrls.js
│  │  └─ reconstructionPlan.js
│  │
│  ├─ report/
│  │  ├─ generateReport.js
│  │  ├─ integrity.js
│  │  └─ exportMarkdown.js
│  │
│  ├─ ai/
│  │  ├─ buildAnalyzerInput.js
│  │  ├─ generateRuleDraft.js
│  │  └─ validateGeneratedRule.js
│  │
│  └─ ui/
│     ├─ shell/
│     ├─ panels/
│     ├─ tables/
│     ├─ timeline/
│     └─ exports/
│
├─ out/
├─ ops/
│  └─ RELEASE_NOTES_TEMPLATE.md
└─ scripts/
   ├─ dev.js
   ├─ test-offline.js
   └─ build-ui.js
```
