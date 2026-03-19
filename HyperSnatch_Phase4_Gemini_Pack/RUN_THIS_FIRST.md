# RUN THIS FIRST — Phase 4

Read in this exact order:

1. docs/PHASE4_MASTER_PLAN.md
2. docs/ARTIFACT_SCHEMA.md
3. docs/UI_WORKSTATION_SPEC.md
4. docs/UI_COMPONENT_MAP.md
5. docs/VALIDATION_LOOP.md
6. agents/PHASE4_AGENT_PROMPT.md
7. agents/PHASE4_TASKLIST.md
8. agents/PHASE4_ACCEPTANCE_GATES.md

Rules:
- Do not change artifact filenames unless the schema is updated.
- UI must consume real evidence bundles, not mock data only.
- No silent failures.
- Every view must degrade gracefully if one artifact is missing.
- All tests must run offline.
