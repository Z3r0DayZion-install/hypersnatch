# Validation Loop

## Purpose

Ensure every evidence bundle is usable before UI render and before packaging.

## Validation stages

1. Folder exists
2. Required files present
3. JSON parses correctly
4. Required fields present
5. Manifest references all emitted artifacts
6. SHA-256 hashes match

## Outputs

Validator should emit:
- validation_result.json
- validation_errors.json (if needed)

## Result states

- PASS
- PASS_WITH_WARNINGS
- FAIL

## Warnings example
- report.md missing section heading
- one candidate missing quality_hint

## Fail example
- har_classified.json missing `requests`
- manifest hash mismatch
