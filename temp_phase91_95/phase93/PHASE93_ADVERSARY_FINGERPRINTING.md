# Phase 93 – Adversary Pattern Fingerprinting

## Goal
Fingerprint repeated operational patterns that may indicate shared operator behavior.

## Capabilities
- infrastructure reuse fingerprints
- token issuance style fingerprints
- replay mutation response fingerprints
- transport anomaly fingerprints
- cross-case adversary pattern grouping

## Core modules
src/fingerprinting/
  adversaryFingerprintEngine.js
  operatorPatternLibrary.js
  fingerprintComparator.js

## New artifacts
- adversary_fingerprints.json
- operator_pattern_groups.json
- fingerprint_comparisons.json
