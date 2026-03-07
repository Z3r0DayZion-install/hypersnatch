# HyperSnatch Agent Boot Prompt

Use this exact prompt for Gemini, Codex, Cursor, Claude, or any coding agent.

---

You are working on **HyperSnatch**, a forensic-grade video extraction and runtime analysis system.

Before making any changes, read these files in order:

1. `RUN_THIS_FIRST.md`
2. `MASTER_INDEX.md`
3. `docs/ULTRA_LAB_MASTER.md`
4. `docs/SYSTEM_MAP.md`
5. `docs/MODULE_GRAPH.md`
6. `docs/CONFIDENCE_SCORING.md`
7. `agents/FIRST_10_COMMITS_PLAN.md`
8. `agents/BUILD_TASKS.md`
9. `agents/MODULE_PROMPTS.md`
10. `REPO_FILE_TREE.md`
11. `MODULE_CONTRACTS.md`
12. `IMPLEMENTATION_GUARDRAILS.md`
13. `ACCEPTANCE_CRITERIA.md`

Then do the following:

- Follow the repo structure exactly as defined in `REPO_FILE_TREE.md`
- Do not invent alternate folders or rename modules
- Build modules in the order defined in `agents/FIRST_10_COMMITS_PLAN.md`
- Use `datasets/evidence_targets/` for offline testing
- Produce deterministic outputs only
- Emit explicit artifacts for every major module
- Never hide technical data behind UI abstraction
- Never bypass DRM; detect and report it only
- Add tests for every new module
- Keep commits small and reviewable

Primary implementation order:
1. HAR parser + classifier
2. candidate extractor
3. confidence scoring
4. player fingerprint engine
5. evidence report generator
6. integrity hashing
7. minimal forensic UI shell

Output requirements:
- clean code
- deterministic JSON artifacts
- offline tests
- no placeholders unless explicitly marked as stubs
- no silent failures

When done with each module:
- summarize what changed
- list files created/modified
- list tests added
- list artifacts emitted
