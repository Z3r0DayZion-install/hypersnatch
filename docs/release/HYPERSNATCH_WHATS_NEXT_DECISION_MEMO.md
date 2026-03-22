# HyperSnatch - Whats Next Decision Memo

Date: 2026-03-22

## Current truth state

1. Runtime/product line: `v1.5.9`
2. Hardening checkpoint: `v1.5.10-hardening`
3. Main status: merged, proven, clean
4. Expansion status: `feat/v1.6.0-expansion` remains blocked

This means HyperSnatch is in a stable, honest, release-controlled checkpoint. The current issue is not release chaos. The issue is whether deferred runtime-proof limits should be closed before any expansion line is reopened.

## Path 1 - Freeze

### What it means

Do nothing except maintenance, archival hygiene, and issue monitoring.

### Use this path if

1. There is no urgent product or customer pressure.
2. PDG-01 and PDG-02 are acceptable as bounded-deferred.
3. The goal is to protect the newly hardened truth state.
4. There is more downside than upside in reopening work right now.

### Allowed work

1. README or navigation cleanup
2. Doc indexing
3. Repo hygiene that does not alter truth state
4. Maintenance-only dependency observation
5. No feature branches
6. No version bump
7. No runtime claims expansion

### Trigger to reopen work

Reopen only if one of these happens:

1. A real operator/user need depends on closing PDG-01 or PDG-02.
2. A release-readiness consumer asks for stronger direct runtime proof.
3. Dependency/toolchain drift materially weakens the current checkpoint.
4. A new expansion proposal requires proof depth stronger than current bounds.

### Recommendation

If there is no immediate business reason to move, this is the safest path.

## Path 2 - Proof Upgrade

### What it means

Open a narrow branch only to close or materially reduce PDG-01 and PDG-02.

### Branch shape

Use:

`proof-upgrade/pdg-runtime-closure`

### Scope

Only:

1. Packaged runtime interaction proof
2. Direct click-path/runtime evidence
3. Wrapper/runtime observation depth
4. Minimal harness or proof-support script work if absolutely necessary

Not allowed:

1. Feature work
2. UX work
3. Capability expansion
4. Opportunistic refactors
5. Version bump just because proof got better

### Success condition

This path succeeds only if at least one of these happens:

1. PDG-01 closed directly
2. PDG-02 closed directly
3. Both gaps materially narrowed with direct evidence
4. Remaining limits become smaller, sharper, and easier to explain

### Required proof order on merge candidate

1. `npm install`
2. `npm test`
3. `npm run verify:ui`
4. `npm run build:wrapper`
5. `npm run verify`
6. `npm run audit:final`
7. `npm run audit:stable`

### Use this path if

1. You want stronger proof without widening product scope.
2. Someone may challenge the current bounded-deferred proof gaps.
3. You want the cleanest possible setup before any future expansion discussion.

### Recommendation

This is the best path if you want more certainty without lying to yourself about readiness.

## Path 3 - Expansion-Gate Revisit

### What it means

Do not open `feat/v1.6.0-expansion` yet. First run a fresh decision gate later.

### Revisit only when all are true

1. Current checkpoint on main is still clean and undisputed.
2. PDG-01 and PDG-02 are either closed or explicitly accepted by decision-makers as non-blocking.
3. Dependency/toolchain posture has not degraded.
4. Expansion scope is written narrowly enough to avoid mixing proof debt closure with features.
5. New runtime or operator claims required by v1.6.0 are actually supportable.

### Gate questions

Before unblocking v1.6.0, answer these directly:

1. What user/operator value does v1.6.0 add?
2. Does that value require stronger runtime proof than current state?
3. Would expansion make current proof debt harder to reason about?
4. Can expansion start without reintroducing truth lag?
5. Are we adding product scope because it is needed, or because the repo finally feels calmer?

If any answer is weak, expansion stays blocked.

### Recommendation

Only use this path after either Freeze has held steady for a while or Proof Upgrade has improved the runtime-proof position.

## My call

Best default:

`Freeze`

Best active path:

`Proof Upgrade`, but only if there is a real reason to tighten PDG-01 and PDG-02.

Wrong move:

Opening `feat/v1.6.0-expansion` now.

## Bottom line

HyperSnatch is not stalled. HyperSnatch is disciplined.

Right now the smartest move is:

1. Freeze if stability is the priority.
2. Proof Upgrade if you want to earn a stronger future gate.
3. Do not unblock expansion yet.

That is the honest play.
