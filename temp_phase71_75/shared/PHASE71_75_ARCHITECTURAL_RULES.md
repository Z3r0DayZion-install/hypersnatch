# Architectural Rules for Phases 71–75

## 1. Explainability first
Every classifier or scorer must emit:
- score
- confidence
- reason list
- source artifacts used

## 2. Models consume artifacts, not raw UI state
AI and ML modules should read:
- bundle artifacts
- intelligence graph outputs
- replay results
- case findings
- dataset exports

## 3. Keep training / inference separated
Do not mix:
- library building
- scoring
- query UI
- autonomous execution

## 4. Research suggestions are not auto-truth
All autonomous outputs should produce:
- recommendation
- confidence
- evidence
- analyst review status

## 5. Everything stays deterministic where possible
If stochastic models are used, persist the exact configuration and seed metadata.
