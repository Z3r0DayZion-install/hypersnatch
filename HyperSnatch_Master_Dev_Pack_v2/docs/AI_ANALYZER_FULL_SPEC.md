# AI Analyzer Full Spec

## Goal
Automatically generate extraction logic for unknown sites.

## Inputs
- DOM snapshot
- script bundle list
- inline script text
- runtime variable dump
- network log
- player fingerprint
- MSE event log
- extracted candidate streams

## AI tasks
1. Identify the likely player framework
2. Identify likely source objects
3. Identify likely playlist / stream variables
4. Propose extraction rule
5. Propose validation method
6. Generate plugin skeleton
7. Assign confidence score

## Outputs
- generated detect.js
- generated extract.js
- generated resolve.js
- explanation.md
- confidence.json
