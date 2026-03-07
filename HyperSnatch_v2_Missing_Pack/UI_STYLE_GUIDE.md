# HyperSnatch UI Style Guide

This is the missing strict visual guidance for the forensic GUI.

## Design target

The GUI should feel like a hybrid of:
- Wireshark
- Burp Suite
- Chrome DevTools
- VS Code
- professional SOC / analyst consoles

It should **not** feel like:
- a marketing site
- a consumer downloader
- a toy hacker theme
- a rounded mobile app clone

## Core visual identity

### Mood
- forensic
- precise
- dense but readable
- dark
- high signal-to-noise
- fast to scan

### Colors
- Background: `#0A0D12`
- Primary Panel: `#121821`
- Secondary Panel: `#171F2B`
- Divider / Border: `#263242`
- Primary Accent: `#20C7FF`
- Success: `#23D18B`
- Warning: `#F5B83D`
- Danger: `#FF5C7A`
- Text Primary: `#EAF2FF`
- Text Secondary: `#9FB0C7`
- Muted Labels: `#607089`

## Typography

Use:
- Sans: Inter / system-ui
- Mono: JetBrains Mono / ui-monospace

### Font sizing
- App title: 18–22
- Panel title: 13–15
- Table/body: 12–14
- Dense logs: 11–12 mono

## Component rules

### Panels
- rectangular, slightly softened corners only
- crisp separators
- subtle shadow only
- no giant glow effects

### Tables
- row striping optional but subtle
- sortable columns
- monospace for URLs, hashes, headers
- fixed-width numeric columns where possible

### Logs
- bottom dock
- color-coded by severity
- searchable
- copyable raw lines

### Stream candidates table
Columns:
- rank
- score
- protocol
- candidate URL
- source module
- tokenized Y/N
- MSE Y/N
- DRM Y/N
- status

### Right-hand intelligence panel
Widgets:
- player fingerprint
- protocol
- CDN guess
- DRM status
- MSE status
- service worker status
- best stream candidate
- quality ladder

## Motion rules
Motion is only allowed for:
- scan in progress
- request arrival
- candidate score update
- segment reconstruction progress

No decorative animation.

## UX posture
Always favor:
- raw data visibility
- explainability
- confidence display
- explicit failure states
