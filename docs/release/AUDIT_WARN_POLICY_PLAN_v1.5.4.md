# Audit WARN Policy Plan v1.5.4

Date: 2026-03-20  
Branch: `release-readiness/v1.5.4-hardening`

## Goal

Make WARN-profile outcomes harder to misread as strict stable signoff.

## Focus Areas

1. Strengthen `audit:final` PASS-with-WARN messaging boundaries.
2. Make stable signoff requirements explicit in success output.
3. Provide clear rerun guidance for strict profile and release type.
4. Keep WARN mode available for non-signoff maintenance checks, with explicit caveat text.

## Planned Work Items

1. Tighten WARN-mode messaging in `tests/final_sovereign_audit.js`.
2. Ensure script output labels warn-profile runs as non-signoff evidence for stable release decisions.
3. Align release proof-plan text with exact strict rerun guidance.
4. Record progress and gate impact in `docs/release/V1_5_4_HARDENING_PROGRESS.md`.

## Execution Status

1. Completed in slice 1:
   - Added explicit audit interpretation banner (`STRICT STABLE SIGNOFF` vs `NON-SIGNOFF`) in `tests/final_sovereign_audit.js`.
   - PASS-with-WARN output now states it is **not valid** for strict stable signoff.
   - Added explicit strict stable signoff contract block with copy/paste rerun command.
   - Non-warning PASS in non-strict/non-stable profiles now still prints non-signoff interpretation guidance.
2. Gate result after slice 1:
   - PASS (`npm install`, `npm test`, `npm run verify:ui`, `npm run build:wrapper`, `npm run verify`, `npm run audit:final`).

## Exit Criteria

1. PASS-with-WARN output states it is not strict stable signoff proof.
2. Strict rerun path is explicit and copy/paste ready.
3. No ambiguous wording remains around WARN vs strict release proof value.
