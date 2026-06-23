# HyperSnatch — Code + UI Optimization Audit (after v1.6.15)

**Status of product:** v1.6.15 is live, proof-verified, and the public download has
been hash-checked end to end. This audit is a *focused, non-destructive* pass. The
goal is to identify what a mature Windows desktop program has that HyperSnatch still
lacks, then ship **one safe polish PR** — not a rewrite.

**North-star metric:** First Proof Rate (a new user reaches a verified receipt fast).

---

## 1. What normal polished desktop programs have that HyperSnatch lacks

Comparing the current app against the affordances mature desktop apps ship by default:

| Affordance | State in HyperSnatch | Notes |
|---|---|---|
| Open Recent / Recent Cases | **Missing** | No memory of prior sessions. |
| Export history | **Missing** | Export succeeds, then the result vanishes from the UI. |
| Toast notifications | **Missing** | Feedback is a single inline `#status` line buried in the Workbench intake area. |
| Clear loading/progress states | **Partial** | A `.panel-skeleton` shimmer exists but is unused for sample-load/export; only the decode button swaps its label. |
| More dynamic button states | **Partial** | Buttons enable/disable, but no in-flight (loading) state and disabled buttons don't explain *why*. |
| Command/search palette | **Missing** | — |
| Keyboard shortcut visibility | **Poor** | Shortcuts live in the footer at `0.55rem`, `rgba(255,255,255,0.2)` — effectively invisible. |
| Drag-and-drop evidence loading | **Missing** | The intake copy says "Drop/paste…" but there are no DnD handlers. |
| Help / quick-start guide | **Partial** | First-run onboarding modal exists and is re-openable from Settings. |
| Settings search / clearer grouping | **Partial** | Six grouped sections exist; no search. |
| Update / check-release surface | **Missing** | Intentional — see rejected ideas (network access conflicts with local-first posture). |
| Persistent preferences | **Missing** | `localStorage` is used only for `hs_legal_accepted` and `hs_onboarding_seen`. |
| Error recovery messages | **Partial** | Errors are surfaced but terse; no "what to do next" guidance. |
| Accessible font / scale controls | **Missing** | No zoom or font-scale control. |
| Cleaner responsive layout | **Partial** | Front-door has breakpoints; deeper panels are dense. |
| Cleaner first-run visual density / empty background | **Weak** | After the front-door is dismissed, the workspace reads as a large flat empty area with no branding or "what next" cue. |
| More obvious case/evidence/proof/export flow | **Partial** | The 4-step Capture→Analyze→Prove→Export strip is good, but momentum is lost after the first action because nothing celebrates or records progress. |

---

## 2. Code optimization findings (renderer / main / preload)

Observations only — most are **not** in scope for the first PR. Recorded so a future
pass can act on them safely.

1. **Duplicate / dead CSS blocks.** `ui/hypersnatch-ui.html` defines `body { … }`
   twice (≈ line 42 with a `display:grid` template, and ≈ line 992 with
   `display:block` that overrides it), plus duplicate `.center-workspace` (≈287 / ≈1074)
   and `.tab-content` (≈326 / ≈1099). The grid layout at line 42 is dead. *Risky to
   remove (layout); leave for a dedicated CSS-hygiene PR.*
2. **Two parallel feedback channels.** A local `setStatus()` (writes `#status`, only
   visible in the Workbench intake area) and a `window.setStatus` wrapper (≈4625) that
   *also* pushes to the footer. Most call sites use the bare local function, so they
   silently bypass the footer updater. Feedback is therefore inconsistent and easy to miss.
3. **Boilerplate guards.** `if (typeof setStatus === 'function') setStatus(...)` is
   repeated ~15 times even though `setStatus` is always in lexical scope. Verbose; a
   thin `notify()` helper would centralize this.
4. **Blocking dialogs in the proof flow.** The export handler uses `confirm()` /
   `alert()` for completion and error guards. These are jarring on desktop and block
   the event loop. A toast with an inline "Open folder" action is the desktop-grade
   replacement.
5. **Ad-hoc global state.** `window._sampleWorkspace`, `window._sampleVerify` are loose
   globals. Fine for now, but UI state (loaded sample, last export) should be centralized
   in one small store eventually.
6. **No persisted UX state.** Recents/preferences would be a few `localStorage` keys;
   the plumbing (`hs_*` keys) already exists for onboarding/legal.
7. **Repeated `el('x') && el('x').addEventListener(...)` double-lookups.** Minor; a
   `on(id, evt, fn)` helper would tidy this.
8. **Preload IPC contracts are clean.** `ALLOWED_IPC_CHANNELS` + `validateIPCChannel` +
   typed wrappers is consistent and safe. No duplication worth changing. Keep this pattern
   for any new channel.

---

## 3. Top 10 gaps (prioritized by First-Proof impact vs. risk)

1. **No post-action feedback (toasts).** The single biggest "feels like an internal
   tool" signal. High impact, low risk.
2. **No loading state for sample-load / export.** Long-ish operations look frozen.
3. **Export result disappears.** No "last exported bundle" the user can re-open.
4. **No memory of the last opened sample.** Returning users start from zero.
5. **Empty workspace background.** Large flat area; no branding or next-step cue.
6. **Footer/shortcuts unreadable.** `0.55–0.6rem`, near-transparent.
7. **Disabled buttons don't explain themselves.** e.g. Export disabled with no "load a
   sample first" reason surfaced as feedback.
8. **No drag-and-drop evidence loading.** Copy promises it; behavior is missing.
9. **No accessible font/scale control.** Dense small type with no zoom.
10. **No Recent Cases / Open Recent.** Standard desktop expectation.

---

## 4. Recommended first polish PR (this one)

**Title:** `Polish dynamic workbench feedback and desktop app affordances`

Scope — make the app feel *alive* after actions without touching the proof engine,
IPC contracts, version, or release artifacts:

1. **Toast notification system** — a fixed, accessible toast stack (`#toastContainer`,
   `aria-live`) with `window.showToast()/updateToast()/dismissToast()` helpers. Kinds:
   `info`, `ok`, `bad`, `loading`. Loading toasts are sticky and convert in place to
   success/error. Built with DOM APIs + `addEventListener` (no inline handlers — the
   smoke contract forbids them).
2. **Dynamic action states**
   - Sample load: `loading` toast → `ok`/`bad` on resolve.
   - Receipt copy: `ok`/`bad` toast.
   - Export: `loading` toast → success toast with an inline **Open folder** action
     button (replaces the blocking `confirm()`/`alert()`), or `bad` toast on failure.
   - IPC failures raise a `bad` toast instead of being swallowed.
3. **Recent activity card** (`#recentActivityCard`) on the Workbench — shows **last
   opened sample** and **last exported bundle** with timestamps and "Open" buttons,
   persisted to `localStorage` (`hs_last_sample`, `hs_last_export`). Renders on launch
   if history exists → returning users land on a non-empty, actionable workspace.
4. **Cleaner empty background** — a subtle, CSS-only branded backdrop on the workspace
   so the post-front-door area reads as a product surface, not a void.
5. **Footer readability** — bump footer text `0.6rem → 0.72rem`, shortcuts
   `0.55rem → 0.66rem` with stronger contrast, and a slightly taller bar.

**Hard guarantees:** no version bump, no tag/publish, no release-artifact changes, no
crawler/AI/network behavior, no proof-claim or proof-gate changes, no `style-src` work,
no renderer rewrite, and the verified v1.6.15 receipt is untouched.

---

## 5. Rejected / too risky for now

- **Command/search palette** — net-new subsystem; defer.
- **Drag-and-drop evidence loading** — needs main-process file-path handling + a
  security review of dropped paths; defer to its own PR.
- **Update/check-release surface** — requires network access, which conflicts with the
  local-first, no-network posture and the proof claims. Out of scope by policy.
- **Accessible font/scale controls** — affects global layout density; needs deliberate
  responsive testing.
- **Real Case Manager / Recent Cases flow** — larger data-model work.
- **Removing the duplicate `body`/`.center-workspace`/`.tab-content` CSS** — pure layout
  risk; belongs in a dedicated CSS-hygiene PR with before/after CDP screenshots.
- **Centralized UI state store** — desirable refactor, but a rewrite-class change.

---

## 6. Test plan

Gates (all must pass before and after):

```bash
npm run verify:ui     # smoke: external script, no inline handlers, required IDs, version contract
npm test              # unit/integration suite
npm run verify:asar   # packaged asar integrity
```

Because this PR changes only the renderer (HTML/CSS/JS) — **no `main.js`/`preload.js`
or window changes** — a packaged CDP smoke is run as an extra safety net, asserting:

- app opens
- first-run onboarding still works
- sample loads **5 / 5 / 1** (artifacts / hashes / receipt)
- receipt viewer opens
- export proof bundle still works (folder written)
- new toasts appear and auto-dismiss
- recent-activity card persists across reload
- **0 console errors**, **0 CSP violations** (CSP is response-header based; 0 console
  errors is used as the proxy)

New element IDs (`toastContainer`, `recentActivityCard`, and the recent rows/buttons)
are added to the `requiredIds` contract in `scripts/ui_smoke_check.js`.
