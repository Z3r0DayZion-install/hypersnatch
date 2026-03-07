# Phase 75 – Autonomous Research Mode

## Goal
Allow HyperSnatch to autonomously generate research suggestions and controlled experiment queues.

## Core outputs
- research_queue.json
- suggested_experiments.json
- research_briefing.md
- autonomous_review_packet.json

## Main module
src/research/autonomousResearchMode.js

## Capabilities
- suggest follow-up queries
- suggest replay mutations
- suggest cross-case comparisons
- queue low-risk research tasks
- generate analyst review packets

## Rule
Nothing executes without a review state:
- suggested
- queued
- approved
- executed
- rejected
