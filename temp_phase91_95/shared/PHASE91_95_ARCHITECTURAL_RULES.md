# Architectural Rules for Phases 91–95

## 1. Attribution is never blind
Every attribution-like output must include:
- confidence
- reason chain
- source artifacts
- alternative hypotheses where possible

## 2. Global graph is additive, not destructive
Do not overwrite bundle/case intelligence. Add higher-level relations.

## 3. Self-healing must be traceable
Every repair, fallback, or retry path must emit:
- original failure
- repair action
- resulting state
- reviewability

## 4. Autonomous discovery is suggestion-first
Discovery jobs may queue, classify, and recommend.
They must not silently promote findings to final truth.

## 5. Offline-first remains mandatory
Even "global" intelligence features operate on local artifact corpora unless explicit signed exchange is used.
