# Phase 72 – Anomaly ML Scoring

## Goal
Score bundles and findings for unusual delivery or infrastructure behavior.

## Core outputs
- anomaly_scores.json
- anomaly_reasons.json
- anomaly_clusters.json

## Main module
src/ai/anomalyScorer.js

## Scoring targets
- unusual token TTL
- rare player/CDN combinations
- abnormal topology shapes
- replay mutation failure divergence
- outlier segment burst patterns

## Rule
An anomaly score must always include the features that drove it.
