# Phase 71 – AI Pattern Classification

## Goal
Automatically classify recurring infrastructure and delivery patterns using artifact evidence.

## Core outputs
- pattern_classifications.json
- classification_reasons.json
- classification_confidence.json

## Main module
src/ai/patternClassifier.js

## Inputs
- site/profile artifacts
- player fingerprints
- CDN topology
- token rules
- graph clusters
- replay observations

## Example classifications
- SHAKA_CLOUDFRONT_DASH
- VIDEOJS_AKAMAI_HLS
- JWT_SHORT_TTL_PATTERN
- MSE_BLOB_DELIVERY_CHAIN
