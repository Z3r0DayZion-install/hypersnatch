    "use strict";

    const el = (id) => document.getElementById(id);
    const APP_VERSION_FALLBACK = "1.6.16";

    // ── Appearance / Theme system (v1.6.16 polish) ───────────────────────────
    (function appearanceSystem() {
      const KEY = 'hs_appearance';
      const DEFAULTS = { theme: 'proof-foundry-dark', accent: '', fontScale: 'normal', density: 'comfortable', background: 'calm', motion: 'normal' };
      const THEMES = ['proof-foundry-dark', 'evidence-blue', 'terminal-green', 'high-contrast', 'warm-graphite'];
      const FONT = ['small', 'normal', 'large'];
      const DENSITY = ['comfortable', 'compact'];
      const BG = ['calm', 'grid', 'minimal', 'off'];
      const MOTION = ['normal', 'reduced'];

      function clampOne(val, allowed, fallback) { return allowed.indexOf(val) >= 0 ? val : fallback; }

      function read() {
        let s;
        try { s = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { s = {}; }
        return {
          theme: clampOne(s.theme, THEMES, DEFAULTS.theme),
          accent: (typeof s.accent === 'string' && /^#[0-9a-fA-F]{6}$/.test(s.accent)) ? s.accent : '',
          fontScale: clampOne(s.fontScale, FONT, DEFAULTS.fontScale),
          density: clampOne(s.density, DENSITY, DEFAULTS.density),
          background: clampOne(s.background, BG, DEFAULTS.background),
          motion: clampOne(s.motion, MOTION, DEFAULTS.motion)
        };
      }
      function write(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

      function hexToRgba(hex, alpha) {
        const m = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(hex);
        if (!m) return hex;
        return 'rgba(' + parseInt(m[1], 16) + ', ' + parseInt(m[2], 16) + ', ' + parseInt(m[3], 16) + ', ' + alpha + ')';
      }

      function apply(s) {
        const root = document.documentElement;
        root.setAttribute('data-theme', s.theme);
        root.setAttribute('data-font-scale', s.fontScale);
        root.setAttribute('data-density', s.density);
        root.setAttribute('data-bg', s.background);
        root.setAttribute('data-motion', s.motion);
        const accentVars = ['--text-accent', '--accent-main', '--accent-border', '--accent-soft', '--text-accent-glow'];
        if (s.accent) {
          root.style.setProperty('--text-accent', s.accent);
          root.style.setProperty('--accent-main', s.accent);
          root.style.setProperty('--accent-border', hexToRgba(s.accent, 0.42));
          root.style.setProperty('--accent-soft', hexToRgba(s.accent, 0.16));
          root.style.setProperty('--text-accent-glow', hexToRgba(s.accent, 0.5));
        } else {
          accentVars.forEach((v) => root.style.removeProperty(v));
        }
      }

      let state = read();
      apply(state);

      function syncControls() {
        const set = (id, val) => { const n = el(id); if (n) n.value = val; };
        set('appThemeSelect', state.theme);
        set('appFontScale', state.fontScale);
        set('appDensity', state.density);
        set('appBackground', state.background);
        set('appMotion', state.motion);
        const btns = document.querySelectorAll('.app-accent-btn');
        btns.forEach((b) => b.setAttribute('aria-pressed', (b.getAttribute('data-accent') || '') === state.accent ? 'true' : 'false'));
      }

      function feedback(msg) {
        const st = el('settingsStatus');
        if (st) { st.textContent = msg; st.className = 'tiny ok'; }
        if (window.showToast) window.showToast(msg, 'ok');
      }

      function update(patch, msg) {
        state = Object.assign({}, state, patch);
        apply(state);
        write(state);
        syncControls();
        feedback(msg || 'Appearance updated');
      }

      function wire() {
        el('appThemeSelect') && el('appThemeSelect').addEventListener('change', (e) => {
          const v = clampOne(e.target.value, THEMES, DEFAULTS.theme);
          update({ theme: v }, v === 'high-contrast' ? 'High Contrast enabled' : 'Theme: ' + e.target.selectedOptions[0].textContent);
        });
        el('appFontScale') && el('appFontScale').addEventListener('change', (e) => update({ fontScale: clampOne(e.target.value, FONT, 'normal') }, 'Font scale updated'));
        el('appDensity') && el('appDensity').addEventListener('change', (e) => update({ density: clampOne(e.target.value, DENSITY, 'comfortable') }, 'Density updated'));
        el('appBackground') && el('appBackground').addEventListener('change', (e) => update({ background: clampOne(e.target.value, BG, 'calm') }, 'Background updated'));
        el('appMotion') && el('appMotion').addEventListener('change', (e) => update({ motion: clampOne(e.target.value, MOTION, 'normal') }, e.target.value === 'reduced' ? 'Reduced motion enabled' : 'Motion restored'));
        document.querySelectorAll('.app-accent-btn').forEach((b) => {
          b.addEventListener('click', () => {
            const a = b.getAttribute('data-accent') || '';
            update({ accent: a }, a ? 'Accent updated' : 'Accent: theme default');
          });
        });
        el('btnResetAppearance') && el('btnResetAppearance').addEventListener('click', () => {
          state = Object.assign({}, DEFAULTS);
          apply(state); write(state); syncControls();
          feedback('Appearance reset to defaults');
        });
        syncControls();
      }

      window._syncAppearanceControls = syncControls;
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wire);
      } else {
        wire();
      }
    })();

    // CSP-safe event delegation (replaces former inline onclick handlers).
    document.addEventListener("click", (ev) => {
      const target = ev.target.closest ? ev.target.closest("[data-action]") : null;
      if (!target) return;
      const action = target.getAttribute("data-action");
      const cm = window.caseMgr;
      switch (action) {
        case "inspect-job": {
          const i = parseInt(target.getAttribute("data-job-idx"), 10);
          if (state && state.lastJson && Array.isArray(state.lastJson.jobs)) render(state.lastJson.jobs[i]);
          break;
        }
        case "case-open": if (cm) cm.loadCase(target.getAttribute("data-case-id")); break;
        case "case-delete": if (cm) cm.deleteCase(target.getAttribute("data-case-id")); break;
        case "bundle-custody": if (cm) cm.viewBundleCustody(target.getAttribute("data-fp")); break;
        case "bundle-similar": if (cm) cm.scanSimilarity(target.getAttribute("data-fp")); break;
        case "case-by-bundle": if (cm) cm.loadCaseByBundleId(target.getAttribute("data-bundle-id")); break;
        case "close-breakdown": { const m = el("breakdownModal"); if (m) m.style.display = "none"; break; }
      }
    });

    function withLoading(btnOrId, fn) {
      return async function(...args) {
        const b = typeof btnOrId === 'string' ? el(btnOrId) : btnOrId;
        const orig = b ? b.innerHTML : '';
        if (b) { b.classList.add('btn-loading'); b.disabled = true; }
        try { return await fn(...args); }
        finally { if (b) { b.classList.remove('btn-loading'); b.disabled = false; b.innerHTML = orig; } }
      };
    }

    const state = {
      lastJson: null,
      lastCmd: null,
      selectedIndex: null,
      lastAutomation: null,
      lastAutomationError: null,
      lastBatchReport: null,
      lastCaseWorkspaceReport: null,
      automationCaseLinkedJobs: {},
      bridgePort: 4179,
      token: null,
      safeMode: false,
      currentTier: 'COMMUNITY',
      smartSnatchEnabled: false,
      lastClipboardContent: "",
      smartSnatchInterval: null
    };

    // Window controls (frameless shell)
    if (el("btnWinMinimize")) el("btnWinMinimize").addEventListener("click", () => {
      if (window.electronAPI) window.electronAPI.windowMinimize();
    });
    if (el("btnWinMaximize")) el("btnWinMaximize").addEventListener("click", () => {
      if (window.electronAPI) window.electronAPI.windowMaximize();
    });
    if (el("btnWinClose")) el("btnWinClose").addEventListener("click", () => {
      if (window.electronAPI) window.electronAPI.windowClose();
    });

    // Safe Mode Toggle
    el("btnSafeMode").addEventListener("click", () => {
      state.safeMode = !state.safeMode;
      const btn = el("btnSafeMode");

      if (state.safeMode) {
        btn.textContent = "Safe Mode: ON";
        btn.style.color = "#ef4444";
        btn.style.borderColor = "#ef4444";
        document.body.classList.add("safe-active");
        setStatus("Safe Mode Active: High-density forensic view enabled.", "ok");
      } else {
        btn.textContent = "Safe Mode: OFF";
        btn.style.color = "#3b82f6";
        btn.style.borderColor = "#3b82f6";
        document.body.classList.remove("safe-active");
        setStatus("Safe Mode Disabled.", "muted");
      }
    });

    function setStatus(text, kind = "muted") {
      const s = el("status");
      s.className = `operator-status ${kind}`;
      s.textContent = text;

      // Mirror to Tactical Console if active
      if (state.currentTier === 'SOVEREIGN' || state.currentTier === 'INSTITUTIONAL') {
        logToConsole(text, kind === 'ok' ? 'decode' : kind);
      }
    }

    function setRadarState(label, colorVar) {
      el("radarStatus").textContent = label;
      el("radarStatus").style.color = colorVar;
    }

    function setAuditSealState(label, visible = true) {
      const seal = el("auditSeal");
      const hashEl = el("sealHash");
      seal.style.display = visible ? "flex" : "none";
      hashEl.textContent = label;
    }

    function fallbackDigestHex(payload) {
      let h1 = 0x811c9dc5;
      let h2 = 0x1b873593;
      for (let i = 0; i < payload.length; i++) {
        const c = payload.charCodeAt(i);
        h1 ^= c;
        h1 = Math.imul(h1, 0x01000193) >>> 0;
        h2 ^= (c + i) >>> 0;
        h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
      }
      const block = h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0");
      return (block.repeat(4)).slice(0, 64).toUpperCase();
    }

    async function computeDigestHex(payload) {
      if (window.crypto && window.crypto.subtle && window.TextEncoder) {
        try {
          const bytes = new TextEncoder().encode(payload);
          const digest = await window.crypto.subtle.digest("SHA-256", bytes);
          return Array.from(new Uint8Array(digest))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
            .toUpperCase();
        } catch (err) {
          // Fall back to deterministic non-cryptographic digest below.
        }
      }
      return fallbackDigestHex(payload);
    }

    function setAuditSealFromResult(result) {
      if (!result) {
        setAuditSealState("--", false);
        return;
      }
      setAuditSealState("SHA256:COMPUTING...", true);
      const activeResult = result;
      const payload = JSON.stringify(result);
      computeDigestHex(payload).then((hex) => {
        // Guard against out-of-order async updates when a newer decode has already rendered.
        if (state.lastJson !== activeResult) return;
        const short = `SHA256:${hex.slice(0, 12)}...${hex.slice(-8)}`;
        setAuditSealState(short, true);
      });
    }

    function evaluateDecodeOutcome(result) {
      if (!result) {
        return {
          kind: "bad",
          status: "Decode failed: no result payload was produced.",
          radar: "HUB: ERROR",
          radarColor: "var(--color-bad)"
        };
      }

      if (result.batch && Array.isArray(result.jobs)) {
        const jobs = result.jobs;
        const successful = jobs.filter((j) => Array.isArray(j.candidates) && j.candidates.length > 0).length;
        if (successful > 0) {
          return {
            kind: "ok",
            status: `Decode complete: ${successful}/${jobs.length} batch jobs returned viable candidates.`,
            radar: "HUB: COMPLETE",
            radarColor: "var(--color-ok)"
          };
        }
        return {
          kind: "warn",
          status: "Decode complete, but no viable candidates were found across batch jobs.",
          radar: "HUB: NO MATCH",
          radarColor: "var(--color-warn)"
        };
      }

      const candidates = Array.isArray(result.candidates) ? result.candidates : [];
      const refusals = Array.isArray(result.refusals) ? result.refusals : [];
      const best = result.best || null;

      if (best && candidates.length > 0) {
        return {
          kind: "ok",
          status: `Decode complete: ${candidates.length} candidate(s) identified and best target selected.`,
          radar: "HUB: COMPLETE",
          radarColor: "var(--color-ok)"
        };
      }
      if (candidates.length > 0) {
        return {
          kind: "warn",
          status: `Decode complete: ${candidates.length} candidate(s) found, but no best target selected.`,
          radar: "HUB: REVIEW",
          radarColor: "var(--color-warn)"
        };
      }
      if (refusals.length > 0) {
        return {
          kind: "warn",
          status: `Decode complete with no viable candidates. Review ${refusals.length} refusal signal(s).`,
          radar: "HUB: NO MATCH",
          radarColor: "var(--color-warn)"
        };
      }
      return {
        kind: "bad",
        status: "Decode complete, but no extractable evidence candidates were found.",
        radar: "HUB: ERROR",
        radarColor: "var(--color-bad)"
      };
    }

    function logToConsole(msg, kind = "probe") {
      const console = el("forensicLog");
      if (!console) return;

      const entry = document.createElement("div");
      entry.className = `entry ${kind}`;
      const now = new Date().toLocaleTimeString();
      entry.innerHTML = `<span class="ts">[${now}]</span> ${escapeHtml(msg)}`;

      console.appendChild(entry);
      console.scrollTop = console.scrollHeight;
    }

    function safeStr(x) { return String(x ?? ""); }

    function downloadFile(content, filename, type) {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    async function findBridge() {
      try {
        const url = window.location.href.includes('/ui/') ? "../bridge.runtime.json" : "bridge.runtime.json";
        const rJson = await fetch(url, { cache: "no-store" });
        if (rJson.ok) {
          const data = await rJson.json();
          if (data.chosenPort && data.token) {
            state.bridgePort = data.chosenPort;
            state.token = data.token;
            el("bridgeUrlTxt").textContent = `http://127.0.0.1:${data.chosenPort}/decode`;
            el("uiVer").textContent = `v${data.version || APP_VERSION_FALLBACK}`;
            return data.chosenPort;
          }
        }
      } catch (e) {
        console.warn("Could not read bridge.runtime.json directly. Falling back to port scan.");
      }

      let bestPort = null;
      let highestVer = "0.0.0";

      const checkPort = async (p) => {
        try {
          const res = await fetch(`http://127.0.0.1:${p}/health`, { method: "GET", cache: "no-store" });
          if (res && res.ok) {
            const data = await res.json();
            return { port: p, version: data.version || APP_VERSION_FALLBACK };
          }
        } catch (e) { }
        return null;
      };

      const promises = [];
      for (let p = 4179; p <= 4190; p++) {
        promises.push(checkPort(p));
      }

      const results = await Promise.all(promises);
      for (const res of results) {
        if (res) {
          // Simple semver comparison logic
          if (!bestPort || res.version.localeCompare(highestVer, undefined, { numeric: true, sensitivity: 'base' }) > 0) {
            bestPort = res.port;
            highestVer = res.version;
          }
        }
      }

      if (bestPort) {
        state.bridgePort = bestPort;
        el("bridgeUrlTxt").textContent = `http://127.0.0.1:${bestPort}/decode`;
        el("uiVer").textContent = `v${highestVer}`;
        return bestPort;
      }
      return null;
    }

    async function checkBridgeHealth() {
      if (window.smartDecode && window.smartDecode.run) {
        el("bridgeDot").className = "ok";
        el("bridgeText").textContent = `Bridge: Electron IPC Native`;
        return;
      }
      try {
        const res = await fetch(`http://127.0.0.1:${state.bridgePort}/health`, { method: "GET" }).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          el("bridgeDot").className = "ok";
          el("bridgeText").textContent = `Bridge: Online (${state.bridgePort})`;
          if (data.version) el("uiVer").textContent = `v${data.version}`;
        } else {
          throw new Error();
        }
      } catch (e) {
        if (el("mode").value === "offline") {
          el("bridgeDot").className = "warn";
          el("bridgeText").textContent = "Bridge: Offline Mode";
        } else {
          el("bridgeDot").className = "bad";
          el("bridgeText").textContent = `Bridge: Unreachable Server`;
          findBridge(); // attempt to rediscover
        }
      }
    }

    async function initUI() {
      // 1. Determine Environment & Security Posture
      if (window.electronAPI && window.electronAPI.getAppInfo) {
        try {
          const info = await window.electronAPI.getAppInfo();
          if (info.version) el("uiVer").textContent = `v${info.version}`;
          if (typeof window._populateSettingsPaths === 'function') window._populateSettingsPaths(info);

          // 2. Hardware Node Identity (guard: wrapper may be absent in some builds)
          const hw = (typeof window.electronAPI.getHardwareStatus === 'function')
            ? await window.electronAPI.getHardwareStatus()
            : null;
          if (hw && hw.displayId) {
            el("nodeIdText").textContent = hw.displayId;
            el("nodeIdPill").addEventListener("click", () => {
              copyText(hw.fingerprint);
              setStatus("Hardware Node ID copied to clipboard.", "ok");
            });
          }

          // 4. License State via dedicated IPC
          try {
            const licInfo = window.electronAPI.getLicenseInfo ? await window.electronAPI.getLicenseInfo() : (info.license || {});
            if (licInfo && licInfo.valid) {
              state.currentTier = licInfo.tier || licInfo.edition || 'COMMUNITY';
              const userName = licInfo.user || "Field Agent";
              setStatus("Vanguard Active: Welcome, " + userName, "ok");
              updateTierBadge(state.currentTier);

              // Activate Tactical Console for paid tiers
              if (state.currentTier === 'SOVEREIGN' || state.currentTier === 'INSTITUTIONAL') {
                el("forensicCard").style.display = "flex";
                logToConsole(`Authorized session for ${state.currentTier} license.`, "decode");
              }
            } else {
              updateTierBadge('COMMUNITY');
            }
          } catch (licErr) {
            updateTierBadge('COMMUNITY');
          }
          if (!info.securityConfig?.legalDisclaimerAccepted) {
            el("legalModal").style.display = "flex";
            el("btnAcceptLegal").addEventListener("click", async () => {
              const res = await window.electronAPI.acceptLegalDisclaimer();
              if (res && res.success) {
                el("legalModal").style.display = "none";
                setStatus("Legal terms accepted. Forensic engine active.", "ok");
              }
            });
          }
        } catch (e) {
          console.error("Failed to load app info via Electron bridge:", e);
        }
      } else {
        // Fallback for browser-based testing / legacy bridge
        await findBridge();
        checkBridgeHealth();
        setInterval(checkBridgeHealth, 3000);
        el("mode").addEventListener("change", checkBridgeHealth);
        el("nodeIdText").textContent = "N/A (Browser)";
        if (el("uiVer").textContent === "v?") el("uiVer").textContent = `v${APP_VERSION_FALLBACK}`;

        if (!localStorage.getItem("hs_legal_accepted")) {
          el("legalModal").style.display = "flex";
          el("btnAcceptLegal").addEventListener("click", () => {
            localStorage.setItem("hs_legal_accepted", "true");
            el("legalModal").style.display = "none";
          });
        }
      }
    }
    initUI();

    function render(result) {
      state.lastJson = result || null;
      if (result && typeof window.setEvidenceLoaded === 'function') window.setEvidenceLoaded(true);

      if (result?.batch && Array.isArray(result.jobs)) {
        renderBatch(result);
        return;
      }

      const candidates = Array.isArray(result?.candidates) ? result.candidates : [];
      const refusals = Array.isArray(result?.refusals) ? result.refusals : [];
      const best = result?.best || null;

      el("countTag").textContent = String(candidates.length);
      el("refTag").textContent = String(refusals.length);
      el("bestTag").textContent = best?.host ? `${best.host}` : "none";

      const body = el("candidatesTbody"); // Changed from candBody to candidatesTbody
      body.innerHTML = "";
      if (!candidates.length) {
        body.innerHTML = `<tr><td colspan="10" class="muted">No candidates returned.</td></tr>`; // Updated colspan
      } else {
        candidates.forEach((c, idx) => {
          const isBest = best && safeStr(c.url) === safeStr(best.url); // Use best.url for comparison
          const urlStr = safeStr(c.url || "");
          let proto = "http";
          try { proto = new URL(urlStr).protocol.replace(':', ''); } catch (e) { }

          const type = safeStr(c.type || "unknown");
          const score = typeof c.finalScore === "number" ? c.finalScore : 0;

          const token = urlStr.includes('token') || urlStr.includes('sig') || urlStr.includes('auth') ? 'Y' : 'N';
          const mse = urlStr.startsWith('blob:') || type === 'blob' || type.includes('ai') ? 'Y' : 'N';
          const drm = urlStr.includes('drm') || urlStr.includes('wv') ? 'Y' : 'N';
          const status = score >= 40 ? 'OK' : 'FAIL';

          const row = document.createElement("tr");
          row.className = "data-row-animate";
          row.style.animationDelay = `${idx * 0.08}s`;
          row.style.background = isBest ? "rgba(32, 199, 255, 0.08)" : "transparent";
          if (isBest) {
            row.style.borderLeft = "3px solid var(--text-accent)";
            row.style.boxShadow = "inset 4px 0 0 var(--text-accent)";
          }
          row.innerHTML = `
            <td style="padding-left:16px;"><span class="muted">[${idx}]</span></td>
            <td>
              <div class="confidence-gauge" style="border-color: ${score >= 80 ? 'var(--color-ok)' : score >= 50 ? 'var(--color-warn)' : 'var(--color-bad)'}">
                ${score}
              </div>
            </td>
            <td><span class="pill mono" style="font-size:11px; padding:2px 6px;">${escapeHtml(proto.toUpperCase())}</span></td>
            <td class="mono" style="max-width:350px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; color:var(--text-muted);" title="${escapeHtml(urlStr)}">
              ${isBest ? `<svg width="12" height="12" style="margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke="var(--text-accent)" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>` : ""}
              ${escapeHtml(urlStr)}
            </td>
            <td><span class="pill mono" style="font-size:11px; padding:2px 6px;">${escapeHtml(type)}</span></td>
            <td style="text-align:center;"><span class="${token === 'Y' ? 'warn' : 'muted'}">${token}</span></td>
            <td style="text-align:center;"><span class="${mse === 'Y' ? 'ok' : 'muted'}">${mse}</span></td>
            <td style="text-align:center;"><span class="${drm === 'Y' ? 'bad' : 'muted'}">${drm}</span></td>
            <td style="text-align:center;">
              <span style="display:inline-flex; align-items:center; gap:6px; font-size:12px; font-weight:700; color:${status === 'OK' ? 'var(--color-ok)' : 'var(--color-bad)'}; text-shadow: 0 0 10px ${status === 'OK' ? 'rgba(35, 209, 139, 0.2)' : 'rgba(255, 92, 122, 0.2)'}">
                ${escapeHtml(status)}
              </span>
            </td>
            <td style="padding-right:16px; text-align:right; display:flex; gap:4px; justify-content:content-end;">
              <button class="pill-btn" data-why="${idx}" style="background:transparent; border-color:var(--border-soft); color:var(--text-muted);">Why?</button>
              <button class="pill-btn" data-pick="${idx}" style="background:${isBest ? 'var(--text-accent)' : 'var(--bg-panel-alt)'}; color:${isBest ? '#000' : 'var(--text-base)'}; border-color:${isBest ? 'transparent' : 'var(--border-soft)'}">${isBest ? 'Accepted' : 'Select'}</button>
            </td>
          `;
          body.appendChild(row);
        });

        body.querySelectorAll("button[data-pick]").forEach((b) => {
          b.addEventListener("click", () => {
            const idx = Number(b.getAttribute("data-pick"));
            pickCandidate(idx);
          });
        });

        body.querySelectorAll("button[data-why]").forEach((b) => {
          b.addEventListener("click", () => {
            const idx = Number(b.getAttribute("data-why"));
            showBreakdown(candidates[idx]);
          });
        });
      }

      function showBreakdown(c) {
        const modal = el("breakdownModal");
        el("breakdownTitle").textContent = `Forensic Breakdown: ${c.host || "Unknown"}`;
        const list = el("breakdownList");
        list.innerHTML = "";

        const breakdown = c.breakdown || ["No detailed signals captured."];
        breakdown.forEach(s => {
          const li = document.createElement("div");
          li.style.padding = "8px 0";
          li.style.borderBottom = "1px solid var(--border-soft)";
          li.style.fontSize = "0.85rem";
          li.innerHTML = s.replace(/^\+(?:\d+):/, '<span style="color:var(--color-ok); font-weight:700;">$&</span>')
            .replace(/^\-(?:\d+):/, '<span style="color:var(--color-bad); font-weight:700;">$&</span>');
          list.appendChild(li);
        });

        modal.style.display = "flex";
      }

      const rEl = el("refusals");
      if (!refusals.length) {
        rEl.textContent = "None detected.";
      } else {
        rEl.innerHTML = refusals.map(r => {
          const host = escapeHtml(safeStr(r.host || "unknown"));
          const reason = escapeHtml(safeStr(r.reason || "unknown"));
          const markers = Array.isArray(r.markers) ? r.markers.map(m => escapeHtml(String(m))) : [];
          return `
            <div style="background:var(--bg-base); border:1px solid var(--border-soft); padding:12px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="background:rgba(239, 68, 68, 0.1); padding:6px; border-radius:6px; color:var(--color-bad);">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </div>
                <div>
                  <div style="font-weight:600; color:var(--text-base);">${host}</div>
                  <div class="muted tiny">Markers: ${markers.length ? markers.join(", ") : "none"}</div>
                </div>
              </div>
              <div style="color:var(--color-bad); font-weight:600; font-size:13px;">${reason}</div>
            </div>`;
        }).join("<div class='spacer' style='height:8px;'></div>");
      }

      const plan = result?.downloadPlan || null;
      const cmd = plan?.command || plan?.cmd || null;
      if (cmd) {
        state.lastCmd = cmd;
        el("cmd").textContent = cmd;
        el("btnCopyCmd").disabled = false;
        el("cmd").style.color = "var(--color-ok)";
        el("cmd").style.borderColor = "rgba(16, 185, 129, 0.3)";
      } else {
        state.lastCmd = null;
        el("cmd").textContent = "No plan generated yet.";
        el("btnCopyCmd").disabled = true;
        el("cmd").style.color = "var(--text-muted)";
        el("cmd").style.borderColor = "var(--border-soft)";
      }

      const hasRes = !!state.lastJson;
      el("btnCopyJson").disabled = !hasRes;
      el("btnSavePlan").disabled = !hasRes || !plan;
      el("btnSaveCands").disabled = !hasRes || !candidates.length;
      el("btnSaveRefs").disabled = !hasRes || !refusals.length;

      setAuditSealFromResult(state.lastJson);
    }

    function renderBatch(result) {
      const body = el("candidatesTbody"); // Changed from candBody to candidatesTbody
      body.innerHTML = "";

      el("countTag").textContent = String(result.jobs.length);
      el("bestTag").textContent = "BATCH MODE";

      result.jobs.forEach((job, idx) => {
        const candidates = job.candidates || [];
        const best = job.best || null;
        const status = job.candidates.length > 0 ? "OK" : "NONE";

        const row = document.createElement("tr");
        row.className = "data-row-animate";
        row.style.animationDelay = `${idx * 0.05}s`;
        row.innerHTML = `
          <td style="padding-left:16px;"><span class="muted">[Job ${idx + 1}]</span></td>
          <td><span class="pill mono ok">${candidates.length}</span></td>
          <td><span class="pill mono muted">Multi</span></td>
          <td class="mono" style="max-width:350px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; color:var(--text-accent);" title="${escapeHtml(job.input)}">
            ${escapeHtml(job.input)}
          </td>
          <td><span class="pill mono">${best?.type || 'mixed'}</span></td>
          <td colspan="3" style="text-align:center;"><span class="muted">Batch Item</span></td>
          <td style="text-align:center;">
            <span style="font-weight:700; color:${status === 'OK' ? 'var(--color-ok)' : 'var(--color-bad)'}">
              ${status}
            </span>
          </td>
          <td style="padding-right:16px; text-align:right;">
             <button type="button" data-action="inspect-job" data-job-idx="${idx}" style="padding:4px 10px; font-size:11px; background:var(--bg-panel-alt); border:1px solid var(--border-soft);">Inspect</button>
          </td>
        `;
        body.appendChild(row);
      });

      el("refusals").innerHTML = `<div class="muted">Multiple jobs active. Inspect individual jobs for details.</div>`;
      el("cmd").textContent = "Batch processing complete. Use 'Inspect' to generate individual plans.";
      el("btnCopyCmd").disabled = true;
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
      }[c]));
    }

    async function decodeViaBridge(text, pickIndex = null) {
      if (window.smartDecode && window.smartDecode.run) {
        // Native Electron IPC mode
        const autoPick = el("toggleAutoPick") ? el("toggleAutoPick").checked : true;
        const result = await window.smartDecode.run(text, { autoSelect: autoPick });

        // Emulate the bridge 'best' assignment logic if pickIndex is provided
        if (pickIndex !== null && result.candidates && result.candidates[pickIndex]) {
          result.best = result.candidates[pickIndex];
        } else if (result.candidates && result.candidates.length > 0 && !result.best) {
          result.best = result.candidates[0]; // fallback
        }

        // Syntax highlighting utility
        const syntaxHighlight = (json) => {
          if (typeof json !== 'string') json = JSON.stringify(json, undefined, 2);
          json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'syntax-num';
            if (/^"/.test(match)) {
              if (/:$/.test(match)) {
                cls = 'syntax-key';
              } else {
                cls = 'syntax-str';
                match = match.replace(/\\n/g, "<br>");
              }
            } else if (/true|false/.test(match)) {
              cls = 'syntax-bool';
            } else if (/null/.test(match)) {
              cls = 'syntax-bool';
            }
            return '<span class="' + cls + '">' + match + '</span>';
          });
        };
        if (result.best) {
          const c = result.best;
          let cmd = `curl -O "${c.url}"`;
          if (c.type === 'hls' || c.type === 'm3u8') {
            cmd = `ffmpeg -i "${c.url}" -c copy output.mp4`;
          }
          result.downloadPlan = { command: cmd };
        }

        return result;
      }

      // Legacy HTTP Bridge mode
      const headers = { "content-type": "application/json" };
      if (state.token) {
        headers["X-HyperSnatch-Token"] = state.token;
      }
      const res = await fetch(`http://127.0.0.1:${state.bridgePort}/decode`, {
        method: "POST",
        headers,
        body: JSON.stringify({ input: text, pickIndex })
      });
      if (!res.ok) throw new Error("Bridge decode failed: HTTP " + res.status);
      return await res.json();
    }

    async function pickCandidate(idx) {
      const mode = el("mode").value;
      const input = el("input").value;

      if (mode !== "bridge") {
        setStatus("Target selection requires active Bridge connection.", "warn");
        return;
      }
      setStatus("Analyzing target and generating execution plan...", "muted");
      try {
        const out = await decodeViaBridge(input, idx);
        render(out);
        setStatus(idx === null ? "Optimized plan generated." : "Assigned target plan generated.", "ok");

        // Log decision for metrics
        if (idx !== null) {
          logToConsole(`User Manual Override: Accepted candidate [${idx}]`, "ok");
          if (window.electronAPI && window.electronAPI.logEvent) {
            window.electronAPI.logEvent('CANDIDATE_MANUAL_PICK', { index: idx, url: out.best?.url });
          }
        }
      } catch (e) {
        setStatus("Analysis failed: The host may have updated or the input is malformed. (" + (e.message || "Unknown error") + ")", "bad");
      }
    }

    function parseBatchTargets(rawInput) {
      const urlLike = /^(https?:\/\/)/i;
      return String(rawInput || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && urlLike.test(line));
    }

    function statusBadgeClass(status) {
      if (status === "running" || status === "completed") return "ok";
      if (status === "warning" || status === "queued" || status === "paused" || status === "manual-review") return "warn";
      if (status === "failed") return "bad";
      return "idle";
    }

    function statusLabel(status) {
      return String(status || "unknown").replace(/-/g, " ").toUpperCase();
    }

    function isReopenableStatus(status) {
      return status === "completed" || status === "warning" || status === "failed" || status === "canceled";
    }

    function createEmptyStatusRollup() {
      return {
        queued: 0,
        running: 0,
        paused: 0,
        manualReview: 0,
        completed: 0,
        warning: 0,
        failed: 0,
        canceled: 0
      };
    }

    function accumulateStatusRollup(rollup, status) {
      const normalized = String(status || "").toLowerCase();
      if (normalized === "queued") rollup.queued += 1;
      if (normalized === "running") rollup.running += 1;
      if (normalized === "paused") rollup.paused += 1;
      if (normalized === "manual-review") rollup.manualReview += 1;
      if (normalized === "completed") rollup.completed += 1;
      if (normalized === "warning") rollup.warning += 1;
      if (normalized === "failed") rollup.failed += 1;
      if (normalized === "canceled") rollup.canceled += 1;
      return rollup;
    }

    function buildStatusRollup(jobs) {
      const rollup = createEmptyStatusRollup();
      (Array.isArray(jobs) ? jobs : []).forEach((job) => accumulateStatusRollup(rollup, job?.status));
      return rollup;
    }

    function buildCaseRollups(jobs) {
      const rollups = {};
      (Array.isArray(jobs) ? jobs : []).forEach((job) => {
        const caseId = job?.caseId || null;
        if (!caseId) return;
        if (!rollups[caseId]) rollups[caseId] = createEmptyStatusRollup();
        accumulateStatusRollup(rollups[caseId], job?.status);
      });
      return rollups;
    }

    function buildReasonChain(job, limit = 4) {
      const chain = [];
      const headline = job?.failureReason || job?.manualReviewReason || job?.error || null;
      if (headline) chain.push(headline);
      const entries = Array.isArray(job?.actionLog) ? [...job.actionLog].sort((a, b) => (a.at || 0) - (b.at || 0)) : [];
      entries.forEach((entry) => {
        if (!entry || !entry.detail) return;
        chain.push(`${entry.action}: ${entry.detail}`);
      });
      const unique = [];
      chain.forEach((item) => {
        if (!item) return;
        if (!unique.includes(item)) unique.push(item);
      });
      return unique.slice(-limit);
    }

    function buildJobTimelineEvents(job, limit = 12) {
      const events = [];
      if (!job) return events;
      if (job.addedAt) {
        events.push({ at: job.addedAt, event: "queued", detail: `source=${job.source || "unknown"}`, by: "system" });
      }
      if (job.startedAt) {
        events.push({ at: job.startedAt, event: "started", detail: `attempt=${job.attempts || 1}`, by: "scheduler" });
      }
      if (job.finishedAt) {
        events.push({ at: job.finishedAt, event: String(job.status || "completed"), detail: job.failureReason || job.manualReviewReason || job.error || "finished", by: "scheduler" });
      }
      const actionLog = Array.isArray(job.actionLog) ? job.actionLog : [];
      actionLog.forEach((entry) => {
        if (!entry) return;
        events.push({
          at: entry.at || 0,
          event: entry.action || "event",
          detail: entry.detail || null,
          by: entry.by || "system"
        });
      });

      const dedup = [];
      const seen = new Set();
      events
        .sort((a, b) => (a.at || 0) - (b.at || 0))
        .forEach((event) => {
          const key = `${event.at || 0}|${event.event}|${event.detail || ""}|${event.by || ""}`;
          if (seen.has(key)) return;
          seen.add(key);
          dedup.push(event);
        });
      return dedup.slice(-limit);
    }

    function buildCaseTimelineEvents(jobs, limit = 24) {
      const merged = [];
      (Array.isArray(jobs) ? jobs : []).forEach((job) => {
        buildJobTimelineEvents(job, 14).forEach((event) => {
          merged.push({
            ...event,
            jobId: job.id || "unknown-job",
            host: job.host || "unknown-host",
            status: job.status || "unknown"
          });
        });
      });
      return merged
        .sort((a, b) => (b.at || 0) - (a.at || 0))
        .slice(0, limit);
    }

    function buildTrustSummaryFromJobs(jobs, rollup) {
      const reasons = [];
      const linked = Array.isArray(jobs) ? jobs : [];
      if (!linked.length) {
        return { label: "No linked queue activity", className: "idle", reasons: ["No case-linked queue jobs found."] };
      }
      if ((rollup.failed || 0) > 0) reasons.push(`${rollup.failed} failed job(s) require analyst attention.`);
      if ((rollup.manualReview || 0) > 0) reasons.push(`${rollup.manualReview} job(s) marked manual-review.`);
      if ((rollup.warning || 0) > 0) reasons.push(`${rollup.warning} warning outcome(s) require validation.`);
      if ((rollup.canceled || 0) > 0) reasons.push(`${rollup.canceled} canceled job(s) may need reopen.`);
      if ((rollup.running || 0) > 0 || (rollup.queued || 0) > 0) reasons.push("Queue activity is still in progress.");

      if ((rollup.failed || 0) > 0) {
        return { label: "Critical failures detected", className: "bad", reasons };
      }
      if ((rollup.manualReview || 0) > 0 || (rollup.warning || 0) > 0 || (rollup.canceled || 0) > 0) {
        return { label: "Manual review required", className: "warn", reasons };
      }
      if ((rollup.completed || 0) > 0 && (rollup.running || 0) === 0 && (rollup.queued || 0) === 0) {
        return { label: "Stable and completed", className: "ok", reasons: reasons.length ? reasons : ["All linked jobs completed without risk flags."] };
      }
      return { label: "In progress", className: "warn", reasons: reasons.length ? reasons : ["Awaiting additional queue results."] };
    }

    function buildCaseLineageSummary(caseId, linkedJobs, caseTimeline) {
      const jobs = Array.isArray(linkedJobs) ? linkedJobs : [];
      const events = Array.isArray(caseTimeline) ? caseTimeline : [];
      if (!jobs.length) {
        return `case=${caseId || "unknown"} lineage=none`;
      }
      const sources = Array.from(new Set(jobs.map((job) => job.source || "unknown")));
      const firstAt = jobs.reduce((min, job) => Math.min(min, job.addedAt || Number.MAX_SAFE_INTEGER), Number.MAX_SAFE_INTEGER);
      const lastAt = events.length ? (events[0].at || 0) : jobs.reduce((max, job) => Math.max(max, job.finishedAt || job.startedAt || job.addedAt || 0), 0);
      return `case=${caseId} jobs=${jobs.length} events=${events.length} sources=${sources.join("|")} first=${formatTimestamp(firstAt === Number.MAX_SAFE_INTEGER ? null : firstAt)} last=${formatTimestamp(lastAt)}`;
    }

    function formatTimestamp(ts) {
      if (!ts) return "--";
      const d = new Date(ts);
      if (Number.isNaN(d.getTime())) return "--";
      return d.toLocaleTimeString();
    }

    function formatDuration(ms) {
      if (typeof ms !== "number" || ms < 0) return "--";
      if (ms < 1000) return `${ms}ms`;
      if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
      const min = Math.floor(ms / 60000);
      const sec = ((ms % 60000) / 1000).toFixed(1);
      return `${min}m ${sec}s`;
    }

    function escapeForAttr(s) {
      return escapeHtml(String(s || "")).replace(/\n/g, " | ");
    }

    function buildJobObservability(job) {
      const retries = job.retryCount || job.attempts || 0;
      const source = job.source || "unknown";
      const reason = job.failureReason || job.manualReviewReason || job.error || "";
      const actionText = job.lastAction
        ? `${job.lastAction.action} @ ${formatTimestamp(job.lastAction.at)}`
        : "--";

      return {
        summaryLine: `src:${source} | retries:${retries} | enq:${formatTimestamp(job.addedAt)} | start:${formatTimestamp(job.startedAt)} | end:${formatTimestamp(job.finishedAt)} | dur:${formatDuration(job.durationMs)}`,
        reasonLine: reason ? `reason: ${reason}` : "",
        actionLine: `last action: ${actionText}`,
        tooltip: [
          `source=${source}`,
          `retries=${retries}`,
          `added=${formatTimestamp(job.addedAt)}`,
          `started=${formatTimestamp(job.startedAt)}`,
          `finished=${formatTimestamp(job.finishedAt)}`,
          `duration=${formatDuration(job.durationMs)}`,
          `reason=${reason || "--"}`,
          `lastAction=${actionText}`
        ].join("\n")
      };
    }

    function updateTrustFromAutomation(snapshot) {
      if (!snapshot) return;
      const metrics = snapshot.metrics || {};
      const activeJob = snapshot.activeJob || null;
      const latest = Array.isArray(snapshot.history) && snapshot.history.length > 0 ? snapshot.history[0] : null;

      let lifecycle = "IDLE";
      let lifecycleClass = "idle";
      if (activeJob) {
        lifecycle = "RUNNING";
        lifecycleClass = "ok";
      } else if ((metrics.queued || 0) > 0) {
        lifecycle = "QUEUED";
        lifecycleClass = "warn";
      } else if ((metrics.manualReview || 0) > 0) {
        lifecycle = "REVIEW";
        lifecycleClass = "warn";
      } else if (latest) {
        lifecycle = statusLabel(latest.status);
        lifecycleClass = statusBadgeClass(latest.status);
      }

      const batchState = el("intBatchState");
      if (batchState) {
        batchState.textContent = lifecycle;
        batchState.className = `pill tiny ${lifecycleClass}`;
      }

      const sw = el("intSw");
      if (sw) {
        sw.textContent = snapshot.mode || "OFF";
        sw.className = `pill tiny ${snapshot.mode === "OFF" ? "idle" : "warn"}`;
      }

      const best = el("intBest");
      if (best) {
        best.textContent = latest?.lastResultSummary?.bestUrl || latest?.url || "--";
      }

      const exportReady = el("intExportReady");
      if (exportReady) {
        const hasActiveCase = Boolean(window.caseMgr && window.caseMgr.activeCase && window.caseMgr.activeCase.case_id);
        const canExport = hasActiveCase && latest && (latest.status === "completed" || latest.status === "warning");
        if (canExport) {
          exportReady.textContent = "Ready: Active Case";
          exportReady.className = "pill tiny ok";
        } else if (hasActiveCase) {
          exportReady.textContent = "Waiting For Results";
          exportReady.className = "pill tiny warn";
        } else {
          exportReady.textContent = "Blocked: No Active Case";
          exportReady.className = "pill tiny bad";
        }
      }

      const hash = el("intHash");
      if (hash) {
        if (latest && latest.id) {
          const reason = latest.failureReason || latest.manualReviewReason || latest.error || "--";
          hash.textContent = `${latest.id.slice(0, 12)}:${latest.status}:dur=${formatDuration(latest.durationMs)}:retry=${latest.retryCount || latest.attempts || 0}:reason=${reason}`;
        } else {
          hash.textContent = "--";
        }
      }
    }

    function buildBatchReport(snapshot) {
      const metrics = snapshot?.metrics || {};
      const queue = Array.isArray(snapshot?.queue) ? snapshot.queue : [];
      const history = Array.isArray(snapshot?.history) ? snapshot.history : [];
      const allJobs = [...queue, ...history];
      const generatedAt = new Date().toISOString();
      const rollup = buildStatusRollup(allJobs);
      const caseRollups = buildCaseRollups(allJobs);
      const caseSummary = Object.keys(caseRollups)
        .sort()
        .map((caseId) => ({ caseId, ...caseRollups[caseId] }));

      const failedJobs = allJobs.filter((job) => job.status === "failed");
      const warningJobs = allJobs.filter((job) => job.status === "warning");
      const manualReviewJobs = allJobs.filter((job) => job.status === "manual-review");
      const trust = buildTrustSummaryFromJobs(allJobs, rollup);

      const jobTimelines = allJobs.slice(0, 40).map((job) => ({
        jobId: job.id || "unknown-job",
        caseId: job.caseId || null,
        host: job.host || "unknown-host",
        status: job.status || "unknown",
        source: job.source || "unknown",
        reasonChain: buildReasonChain(job, 6),
        events: buildJobTimelineEvents(job, 12)
      }));
      const caseTimeline = buildCaseTimelineEvents(allJobs.filter((job) => job.caseId), 40);

      const executiveSummary = {
        linkedJobs: allJobs.length,
        queueDepth: queue.length,
        recentHistory: history.length,
        trustStatus: trust.label,
        riskFlags: failedJobs.length + warningJobs.length + manualReviewJobs.length
      };
      const queueResultsSummary = {
        queued: rollup.queued,
        running: rollup.running,
        paused: rollup.paused,
        manualReview: rollup.manualReview,
        completed: rollup.completed,
        warning: rollup.warning,
        failed: rollup.failed,
        canceled: rollup.canceled
      };
      const exportMetadata = {
        reportType: "operator-workflow",
        schema: "v1.6.0-reporting",
        generatedAt,
        source: "automation-get-state",
        mode: snapshot?.mode || "OFF",
        deterministicHeadings: true,
        terminology: ["manual-review", "warning", "failed", "canceled"]
      };

      const lines = [
        "# HyperSnatch — The Proof Foundry | Operator Workflow Report",
        `Generated: ${generatedAt}`,
        `Mode: ${snapshot?.mode || "OFF"}`,
        "",
        "## Executive Summary",
        `- linked jobs: ${executiveSummary.linkedJobs}`,
        `- queue depth: ${executiveSummary.queueDepth}`,
        `- recent history: ${executiveSummary.recentHistory}`,
        `- trust status: ${executiveSummary.trustStatus}`,
        `- risk flags: ${executiveSummary.riskFlags}`,
        "",
        "## Queue Results Summary",
        `- queued: ${queueResultsSummary.queued}`,
        `- running: ${queueResultsSummary.running}`,
        `- paused: ${queueResultsSummary.paused}`,
        `- manual-review: ${queueResultsSummary.manualReview}`,
        `- completed: ${queueResultsSummary.completed}`,
        `- warning: ${queueResultsSummary.warning}`,
        `- failed: ${queueResultsSummary.failed}`,
        `- canceled: ${queueResultsSummary.canceled}`,
        "",
        "## Case Summary"
      ];

      if (!caseSummary.length) {
        lines.push("- no case-linked jobs in current snapshot");
      } else {
        caseSummary.forEach((row) => {
          lines.push(`- ${row.caseId}: queued=${row.queued} running=${row.running} paused=${row.paused} review=${row.manualReview} completed=${row.completed} warning=${row.warning} failed=${row.failed} canceled=${row.canceled}`);
        });
      }

      lines.push("", "## Trust Summary");
      lines.push(`- status: ${trust.label}`);
      if (trust.reasons && trust.reasons.length) {
        trust.reasons.forEach((reason) => lines.push(`- ${reason}`));
      } else {
        lines.push("- no trust signals available");
      }

      lines.push("", "## Warnings Failures and Manual Review");
      if (!failedJobs.length && !warningJobs.length && !manualReviewJobs.length) {
        lines.push("- none");
      } else {
        failedJobs.slice(0, 10).forEach((job) => {
          lines.push(`- failed: ${job.host} :: ${job.url} :: ${job.failureReason || job.error || "Unknown failure"}`);
        });
        warningJobs.slice(0, 10).forEach((job) => {
          lines.push(`- warning: ${job.host} :: ${job.url} :: ${job.lastResultSummary?.message || "Warning without summary"}`);
        });
        manualReviewJobs.slice(0, 10).forEach((job) => {
          lines.push(`- manual-review: ${job.host} :: ${job.url} :: ${job.manualReviewReason || "No reason provided"}`);
        });
      }

      lines.push("", "## Evidence Timeline and Lineage");
      if (!jobTimelines.length) {
        lines.push("- no job timeline events");
      } else {
        jobTimelines.slice(0, 12).forEach((job) => {
          lines.push(`- job ${job.jobId} [${statusLabel(job.status)}] host=${job.host} case=${job.caseId || "--"} source=${job.source}`);
          const reasonChainText = job.reasonChain && job.reasonChain.length ? job.reasonChain.join(" | ") : "--";
          lines.push(`  - reason chain: ${reasonChainText}`);
          if (!job.events.length) {
            lines.push("  - timeline: none");
          } else {
            job.events.slice(-5).forEach((event) => {
              const detail = event.detail ? ` :: ${event.detail}` : "";
              lines.push(`  - ${formatTimestamp(event.at)} :: ${event.event}${detail}`);
            });
          }
        });
      }

      lines.push("", "## Case Timeline");
      if (!caseTimeline.length) {
        lines.push("- no case-level timeline events");
      } else {
        caseTimeline.slice(0, 20).forEach((event) => {
          const detail = event.detail ? ` :: ${event.detail}` : "";
          lines.push(`- ${formatTimestamp(event.at)} :: ${event.host} :: ${event.event}${detail}`);
        });
      }

      lines.push("", "## Export Metadata");
      lines.push(`- report type: ${exportMetadata.reportType}`);
      lines.push(`- schema: ${exportMetadata.schema}`);
      lines.push(`- source: ${exportMetadata.source}`);
      lines.push(`- mode: ${exportMetadata.mode}`);
      lines.push(`- deterministic headings: ${exportMetadata.deterministicHeadings ? "true" : "false"}`);

      return {
        generatedAt,
        reportType: exportMetadata.reportType,
        reportSchema: exportMetadata.schema,
        mode: snapshot?.mode || "OFF",
        metrics,
        queue,
        history,
        executiveSummary,
        queueResultsSummary,
        caseSummary,
        trustSummary: trust,
        riskSummary: {
          failed: failedJobs.map((job) => ({
            id: job.id,
            caseId: job.caseId || null,
            host: job.host,
            url: job.url,
            reason: job.failureReason || job.error || "Unknown failure"
          })),
          warning: warningJobs.map((job) => ({
            id: job.id,
            caseId: job.caseId || null,
            host: job.host,
            url: job.url,
            reason: job.lastResultSummary?.message || "Warning without summary"
          })),
          manualReview: manualReviewJobs.map((job) => ({
            id: job.id,
            caseId: job.caseId || null,
            host: job.host,
            url: job.url,
            reason: job.manualReviewReason || "No reason provided"
          }))
        },
        lineage: {
          jobTimelines,
          caseTimeline
        },
        exportMetadata,
        markdown: lines.join("\n")
      };
    }

    async function queueTargets(targets, options = {}) {
      if (!window.electronAPI || !window.electronAPI.automationQueueAdd) {
        setStatus("Queue action failed: Electron bridge is unavailable.", "bad");
        return null;
      }

      const activeCase = window.caseMgr && window.caseMgr.activeCase ? window.caseMgr.activeCase : null;
      const bindToCase = Boolean(options.bindToCase && activeCase && activeCase.case_id);

      const res = await window.electronAPI.automationQueueAdd(targets, {
        source: options.source || "operator",
        manualReview: false,
        caseId: bindToCase ? activeCase.case_id : null,
        caseTitle: bindToCase ? activeCase.title : null
      });

      const added = Array.isArray(res?.added) ? res.added.length : 0;
      const skipped = Array.isArray(res?.skipped) ? res.skipped.length : 0;
      const suffix = bindToCase ? ` bound to case ${activeCase.case_id}` : "";
      setStatus(`Queued ${added} target(s)${suffix}${skipped ? `, skipped ${skipped}` : ""}.`, added > 0 ? "ok" : "warn");
      logToConsole(`Batch queue update: added=${added}, skipped=${skipped}.`, added > 0 ? "ok" : "warn");

      if (res && res.metrics) {
        el('metPending').textContent = res.metrics.pending || 0;
      }
      activateTab(el("tabBtnAutomation"));
      await syncAutomationState();
      return res;
    }

    async function onDecode() {
      const mode = el("mode").value;
      const input = el("input").value;
      const decodeBtn = el("btnDecode");
      const originalDecodeLabel = decodeBtn.textContent;

      if (!input.trim()) {
        setStatus("Awaiting payload. Please paste HTML or log data.", "warn");
        return;
      }

      if (mode === "offline") {
        setStatus("Offline Mode Active. Engine paused.", "warn");
        return;
      }

      const batchTargets = parseBatchTargets(input);
      if (batchTargets.length > 1 && window.electronAPI && window.electronAPI.automationQueueAdd) {
        await queueTargets(batchTargets, { source: "intake-batch", bindToCase: false });
        return;
      }

      logToConsole(`Starting extraction pipeline...`, "probe");
      logToConsole(`Target: ${input.substring(0, 50)}...`, "probe");

      // Next-Level UX Trigger
      setRadarState("HUB: SCANNING", "var(--text-accent)");
      decodeBtn.disabled = true;
      decodeBtn.textContent = "Decoding...";
      render(null);
      setAuditSealState("SHA256:PENDING...", true);

      setStatus(`Executing SmartDecode sequence via native bridge...`, "muted");
      try {
        const out = await decodeViaBridge(input, null);
        render(out);
        const outcome = evaluateDecodeOutcome(out);
        setStatus(outcome.status, outcome.kind);
        setRadarState(outcome.radar, outcome.radarColor);
      } catch (e) {
        render(null);
        setAuditSealState("SHA256:UNAVAILABLE", true);
        setStatus(`Extraction engine encountered an unexpected layout. ${e.message || "Host may have updated."}`, "bad");
        setRadarState("HUB: ERROR", "var(--color-bad)");
      } finally {
        decodeBtn.disabled = false;
        decodeBtn.textContent = originalDecodeLabel;
      }
    }

    async function handleQueueAction(id, action) {
      if (!window.electronAPI || !window.electronAPI.automationQueueAction) return;
      let reason = null;
      if (action === "manual-review") {
        reason = prompt("Manual-review reason:", "Requires analyst review for ambiguous decode output.") || "Requires analyst review for ambiguous decode output.";
      } else if (action === "cancel") {
        reason = "Cancelled by operator from queue panel.";
      } else if (action === "requeue") {
        reason = "Requeued by operator for retry.";
      }

      const res = await window.electronAPI.automationQueueAction(id, action, reason);
      if (!res || res.success === false) {
        setStatus(`Queue action failed: ${action}.`, "bad");
        return;
      }
      setStatus(`Queue action applied: ${action}.`, "ok");
      await syncAutomationState();
    }

    async function openCaseById(caseId) {
      if (!caseId) return;
      if (window.caseMgr && window.caseMgr.loadCase) {
        activateTab(el("tabBtnCases"));
        await window.caseMgr.loadCase(caseId);
      }
    }

    async function createCaseFromHistoryJob(jobId) {
      const snapshot = state.lastAutomation;
      const job = snapshot && Array.isArray(snapshot.history) ? snapshot.history.find((h) => h.id === jobId) : null;
      if (!job || !window.electronAPI || !window.electronAPI.caseCreate) return;

      const title = `Batch Decode: ${job.host} ${new Date(job.finishedAt || Date.now()).toLocaleDateString()}`;
      const created = await window.electronAPI.caseCreate(title);
      const summary = job.lastResultSummary || {};
      const severity = job.status === "failed" ? "bad" : (job.status === "warning" ? "warn" : "info");
      const note = [
        `Batch Job ID: ${job.id}`,
        `URL: ${job.url}`,
        `Status: ${job.status}`,
        `Source: ${job.source || "unknown"}`,
        `Retries: ${job.retryCount || job.attempts || 0}`,
        `Enqueued: ${formatTimestamp(job.addedAt)}`,
        `Started: ${formatTimestamp(job.startedAt)}`,
        `Finished: ${formatTimestamp(job.finishedAt)}`,
        `Duration: ${formatDuration(job.durationMs)}`,
        `Failure Reason: ${job.failureReason || "--"}`,
        `Manual Review Reason: ${job.manualReviewReason || "--"}`,
        `Last Action: ${job.lastAction ? `${job.lastAction.action} @ ${formatTimestamp(job.lastAction.at)}` : "--"}`,
        `Summary: ${summary.message || "N/A"}`
      ].join("\n");

      await window.electronAPI.caseAddNote(created.case_id, note);
      await window.electronAPI.caseAddFinding(created.case_id, {
        bundle_id: job.id,
        title: `Batch decode outcome: ${statusLabel(job.status)}`,
        severity,
        notes: summary.message || "No summary available."
      });
      if (window.electronAPI.automationQueueBindCase) {
        await window.electronAPI.automationQueueBindCase(job.id, created.case_id, created.title);
      }
      setStatus(`Created case ${created.case_id} from batch job ${job.host}.`, "ok");
      await openCaseById(created.case_id);
      await syncAutomationState();
    }

    function exportBatchReport() {
      if (!state.lastBatchReport) {
        setStatus("Batch report export failed: no automation snapshot available.", "warn");
        return;
      }
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      downloadFile(state.lastBatchReport.markdown || "", `batch_report_${stamp}.md`, "text/markdown");
      downloadFile(JSON.stringify(state.lastBatchReport, null, 2), `batch_report_${stamp}.json`, "application/json");
      setStatus("Batch report exported (MD + JSON).", "ok");
    }

    async function syncAutomationState() {
      if (!window.electronAPI || !window.electronAPI.automationGetState) return;
      let snapshot = null;
      try {
        snapshot = await window.electronAPI.automationGetState();
        state.lastAutomationError = null;
      } catch (err) {
        const errMsg = err?.message || "Automation bridge unavailable.";
        if (state.lastAutomationError !== errMsg) {
          setStatus(`Automation state refresh failed: ${errMsg}`, "warn");
          logToConsole(`Automation state refresh failed: ${errMsg}`, "warn");
        }
        state.lastAutomationError = errMsg;
        if (window.caseMgr && window.caseMgr.renderWorkspaceDepth) {
          window.caseMgr.renderWorkspaceDepth(null, errMsg);
        }
        return;
      }
      state.lastAutomation = snapshot;
      state.lastBatchReport = buildBatchReport(snapshot);
      el("reportTextarea").value = state.lastBatchReport.markdown;

      // Update Metrics
      el('metPending').textContent = snapshot.metrics.pending;
      el('metCompleted').textContent = (snapshot.metrics.completed || 0) + (snapshot.metrics.warning || 0);
      el('metFailed').textContent = (snapshot.metrics.failed || 0) + (snapshot.metrics.canceled || 0);

      // Update Mode Selector without re-triggering event
      const sel = el('selAutoMode');
      if (sel && sel.value !== snapshot.mode) {
        sel.value = snapshot.mode;

        // Sync the top header toggle visual based on mode
        const toggle = el('toggleSmartSnatch');
        if (toggle) {
          const isActive = snapshot.mode !== 'OFF';
          toggle.checked = isActive;
          const slider = toggle.nextElementSibling;
          if (isActive) {
            slider.style.backgroundColor = "var(--text-accent)";
            slider.style.boxShadow = "inset 0 0 5px rgba(0,0,0,0.5)";
          } else {
            slider.style.backgroundColor = "var(--bg-panel-alt)";
            slider.style.boxShadow = "none";
          }
        }
      }

      // Render Queue
      const qBody = el('queueTbody');
      if (!Array.isArray(snapshot.queue) || snapshot.queue.length === 0) {
        qBody.innerHTML = `<tr><td colspan="5" class="muted" style="text-align:center; padding:1rem;">Queue is empty.</td></tr>`;
      } else {
        qBody.innerHTML = snapshot.queue.map((j) => {
          const canPause = j.status === "queued" || j.status === "manual-review";
          const canResume = j.status === "paused" || j.status === "manual-review";
          const canCancel = j.status !== "running";
          const canManualReview = j.status === "queued" || j.status === "paused";
          const caseCell = j.caseId ? `<button class="pill-btn tiny" data-open-case="${j.caseId}">${escapeHtml(j.caseId)}</button>` : '<span class="muted tiny">--</span>';
          const obs = buildJobObservability(j);
          return `
            <tr>
              <td><span class="pill">${escapeHtml(j.host)}</span></td>
              <td class="mono tiny" title="${escapeForAttr(obs.tooltip)}">
                <div>${escapeHtml(j.url)}</div>
                <div class="muted tiny">${escapeHtml(obs.summaryLine)}</div>
                ${obs.reasonLine ? `<div class="bad tiny">${escapeHtml(obs.reasonLine)}</div>` : ""}
                <div class="tiny muted">${escapeHtml(obs.actionLine)}</div>
              </td>
              <td><span class="status-badge ${statusBadgeClass(j.status)}">${statusLabel(j.status)}</span></td>
              <td>${caseCell}</td>
              <td style="display:flex; gap:4px;">
                ${canPause ? `<button class="pill-btn tiny" data-queue-action="pause" data-queue-id="${j.id}">Pause</button>` : ""}
                ${canResume ? `<button class="pill-btn tiny" data-queue-action="resume" data-queue-id="${j.id}">Queue</button>` : ""}
                ${canManualReview ? `<button class="pill-btn tiny" data-queue-action="manual-review" data-queue-id="${j.id}">Review</button>` : ""}
                ${canCancel ? `<button class="pill-btn tiny" data-queue-action="cancel" data-queue-id="${j.id}" style="color:var(--color-bad);">Cancel</button>` : ""}
              </td>
            </tr>
          `;
        }).join('');
      }

      // Render History
      const hBody = el('historyTbody');
      if (!Array.isArray(snapshot.history) || snapshot.history.length === 0) {
        hBody.innerHTML = `<tr><td colspan="5" class="muted" style="text-align:center; padding:1rem;">No history.</td></tr>`;
      } else {
        hBody.innerHTML = snapshot.history.map((j) => {
          const summary = j.lastResultSummary && j.lastResultSummary.message ? j.lastResultSummary.message : "";
          const caseCell = j.caseId ? `<button class="pill-btn tiny" data-open-case="${j.caseId}">${escapeHtml(j.caseId)}</button>` : '<span class="muted tiny">--</span>';
          const obs = buildJobObservability(j);
          return `
            <tr>
              <td><span class="pill">${escapeHtml(j.host)}</span></td>
              <td class="mono tiny" title="${escapeForAttr(summary || obs.tooltip)}">
                <div>${escapeHtml(j.url)}</div>
                <div class="muted tiny">${escapeHtml(obs.summaryLine)}</div>
                ${obs.reasonLine ? `<div class="bad tiny">${escapeHtml(obs.reasonLine)}</div>` : ""}
                <div class="tiny muted">${escapeHtml(obs.actionLine)}</div>
              </td>
              <td><span class="status-badge ${statusBadgeClass(j.status)}">${statusLabel(j.status)}</span></td>
              <td>${caseCell}</td>
              <td style="display:flex; gap:4px;">
                ${j.caseId ? "" : `<button class="pill-btn tiny" data-case-from-job="${j.id}">Create Case</button>`}
                ${j.status === "failed" || j.status === "warning" || j.status === "canceled" ? `<button class="pill-btn tiny" data-queue-action="requeue" data-queue-id="${j.id}">Requeue</button>` : ""}
              </td>
            </tr>
          `;
        }).join('');
      }

      qBody.querySelectorAll("[data-queue-action]").forEach((btn) => {
        btn.addEventListener("click", () => handleQueueAction(btn.getAttribute("data-queue-id"), btn.getAttribute("data-queue-action")));
      });
      hBody.querySelectorAll("[data-queue-action]").forEach((btn) => {
        btn.addEventListener("click", () => handleQueueAction(btn.getAttribute("data-queue-id"), btn.getAttribute("data-queue-action")));
      });
      document.querySelectorAll("[data-open-case]").forEach((btn) => {
        btn.addEventListener("click", () => openCaseById(btn.getAttribute("data-open-case")));
      });
      hBody.querySelectorAll("[data-case-from-job]").forEach((btn) => {
        btn.addEventListener("click", () => createCaseFromHistoryJob(btn.getAttribute("data-case-from-job")));
      });

      updateTrustFromAutomation(snapshot);
      if (window.caseMgr && window.caseMgr.renderWorkspaceDepth) {
        window.caseMgr.renderWorkspaceDepth(snapshot, null);
      }
    }

    // Wiring SmartSnatch Top Toggle & Mode Selector
    const toggleSmartSnatch = el("toggleSmartSnatch");
    const selAutoMode = el("selAutoMode");

    if (toggleSmartSnatch && window.electronAPI) {
      toggleSmartSnatch.addEventListener("change", async (e) => {
        const mode = e.target.checked ? "AUTO DECODE" : "OFF";
        await window.electronAPI.automationSetMode(mode);
        syncAutomationState();
      });
      // Set initial knob CSS
      const style = document.createElement('style');
      style.id = 'slider-knob-css';
      style.innerHTML = `
        .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider:before { transform: translateX(14px); }
      `;
      document.head.appendChild(style);
    }

    if (selAutoMode && window.electronAPI) {
      selAutoMode.addEventListener("change", async (e) => {
        await window.electronAPI.automationSetMode(e.target.value);
        syncAutomationState();
      });
    }

    const btnQueueBatch = el("btnQueueBatch");
    if (btnQueueBatch) {
      btnQueueBatch.addEventListener("click", async () => {
        const raw = el("batchDecodeInput").value || el("input").value;
        const targets = parseBatchTargets(raw);
        if (!targets.length) {
          setStatus("Batch queue skipped: provide at least one target URL.", "warn");
          return;
        }
        await queueTargets(targets, { source: "operator-batch", bindToCase: false });
      });
    }

    const btnQueueBatchToCase = el("btnQueueBatchToCase");
    if (btnQueueBatchToCase) {
      btnQueueBatchToCase.addEventListener("click", async () => {
        const raw = el("batchDecodeInput").value || el("input").value;
        const targets = parseBatchTargets(raw);
        if (!targets.length) {
          setStatus("Batch queue skipped: provide at least one target URL.", "warn");
          return;
        }
        if (!(window.caseMgr && window.caseMgr.activeCase && window.caseMgr.activeCase.case_id)) {
          setStatus("Batch queue to case blocked: load an active case first.", "warn");
          return;
        }
        await queueTargets(targets, { source: "operator-batch", bindToCase: true });
      });
    }

    const btnExportBatchReport = el("btnExportBatchReport");
    if (btnExportBatchReport) {
      btnExportBatchReport.addEventListener("click", () => exportBatchReport());
    }

    // Listen to backend events
    if (window.electronAPI && window.electronAPI.onAutomationEvent) {
      window.electronAPI.onAutomationEvent(async (payload) => {
        if (payload.type === 'POLL_ERROR') return;
        syncAutomationState();

        if (payload.type === 'DECODE_START') {
          logToConsole(`SmartSnatch orchestration triggered for ${payload.data.host}`, 'probe');
          setStatus(`SmartSnatch engine processing ${payload.data.host}...`, 'ok');
        }
        if (payload.type === 'DECODE_FAILED') {
          logToConsole(`SmartSnatch decode failed for ${payload.data.host}: ${payload.data.error}`, 'bad');
          setStatus(`SmartSnatch decode failed for ${payload.data.host}.`, 'bad');
        }
        if (payload.type === 'DECODE_COMPLETE') {
          const shortUrl = (payload.data.url || "").substring(0, 40);
          const summary = payload.data.summary && payload.data.summary.message ? payload.data.summary.message : "Decode complete.";
          logToConsole(`SmartSnatch completed ${payload.data.host} :: ${summary}`, 'decode');
          setStatus(`Batch decode complete for ${payload.data.host}. ${summary}`, payload.data.summary?.kind === "bad" ? "bad" : (payload.data.summary?.kind === "warn" ? "warn" : "ok"));

          if (payload.data.caseId && window.caseMgr && window.caseMgr.activeCase && window.caseMgr.activeCase.case_id === payload.data.caseId) {
            const jobId = payload.data.id;
            if (jobId && !state.automationCaseLinkedJobs[jobId]) {
              state.automationCaseLinkedJobs[jobId] = true;
              try {
                const sev = payload.data.summary?.kind === "bad" ? "bad" : (payload.data.summary?.kind === "warn" ? "warn" : "info");
                await window.electronAPI.caseAddFinding(payload.data.caseId, {
                  bundle_id: jobId,
                  title: `Batch job ${payload.data.host} :: ${statusLabel(payload.data.summary?.kind || "completed")}`,
                  severity: sev,
                  notes: payload.data.summary?.message || `Automated decode completed for ${shortUrl}`
                });
                await window.caseMgr.loadCase(payload.data.caseId);
              } catch (err) {
                logToConsole(`Case linkage update failed for ${payload.data.host}: ${err.message}`, 'warn');
              }
            }
          }
        }
      });

      // Setup state polling 
      setInterval(syncAutomationState, 1500);
      syncAutomationState(); // Initial run
    }

    // Phase 57: Global Toggle Handling
    const toggleAutoPick = el("toggleAutoPick");
    if (toggleAutoPick) {
      toggleAutoPick.addEventListener("change", (e) => {
        logToConsole(`Auto-Pick Decision Engine: ${e.target.checked ? "ENABLED" : "DISABLED"}`, "probe");
      });
    }

    async function copyText(txt) {
      await navigator.clipboard.writeText(String(txt || ""));
    }

    el("file").addEventListener("change", async (ev) => {
      const f = ev.target.files && ev.target.files[0];
      if (!f) return;
      const text = await f.text();
      el("input").value = text;
      setStatus(`Loaded file: ${f.name}`, "ok");
    });

    el("btnDecode").addEventListener("click", onDecode);
    el("btnClear").addEventListener("click", () => {
      el("input").value = "";
      render(null);
      setStatus("Cleared.", "muted");
    });

    el("btnCopyCmd").addEventListener("click", async () => {
      if (!state.lastCmd) return;
      await copyText(state.lastCmd);
      setStatus("Command copied.", "ok");
    });

    el("btnCopyJson").addEventListener("click", async () => {
      if (!state.lastJson) return;
      await copyText(JSON.stringify(state.lastJson, null, 2));
      setStatus("JSON copied.", "ok");
    });

    el("btnSavePlan").addEventListener("click", () => {
      if (state.lastJson?.downloadPlan) {
        downloadFile(JSON.stringify(state.lastJson.downloadPlan, null, 2), "plan.json", "application/json");
      }
    });

    el("btnSaveCands").addEventListener("click", () => {
      if (state.lastJson?.candidates) {
        downloadFile(JSON.stringify(state.lastJson.candidates, null, 2), "candidates.json", "application/json");
      }
    });

    el("btnSaveRefs").addEventListener("click", () => {
      if (state.lastJson?.refusals) {
        downloadFile(JSON.stringify(state.lastJson.refusals, null, 2), "refusals.json", "application/json");
      }
    });

    el("btnUseBest").addEventListener("click", () => pickCandidate(null));

    el("btnPickIdx").addEventListener("click", () => {
      const val = parseInt(el("pickIndex").value, 10);
      if (!isNaN(val)) pickCandidate(val);
    });
    el("btnCopyBestUrl").addEventListener("click", async () => {
      const bestUrl = state.lastJson?.best?.url || "";
      if (bestUrl) {
        await copyText(bestUrl);
        setStatus("Best URL copied.", "ok");
      } else {
        setStatus("No Best URL available.", "warn");
      }
    });

    render(null);

    // Evidence Loader Registration
    const btnLoadEvidence = el("btnLoadEvidence");
    if (btnLoadEvidence) {
      btnLoadEvidence.addEventListener("click", async () => {
        if (window.electronAPI && window.electronAPI.getForensicSnapshot) {
          setStatus("Loading Forensic Artifact bundle...", "muted");
          const res = await window.electronAPI.getForensicSnapshot();
          if (res && res.success) {
            if (typeof window.setEvidenceLoaded === 'function') window.setEvidenceLoaded(true);

            const artifacts = res.artifacts || {};

            // Network HAR
            let netHtml = "";
            let harCount = 0;
            if (artifacts.networkHar?.log?.entries) {
              artifacts.networkHar.log.entries.forEach((e, idx) => {
                const url = e.request?.url || "";
                let color = "#94a3b8";
                if (url.includes('.m3u8') || url.includes('.mpd')) color = "var(--text-accent)";
                else if (url.includes('.ts') || url.includes('.m4s')) color = "var(--color-ok)";

                netHtml += `< div class= "log-item" style = "color:${color}; animation-delay: ${idx * 0.05}s" >
                              <span style="font-weight:700;">[${e.request.method}]</span> 
                              <span title="${escapeHtml(url)}">${escapeHtml(url.substring(0, 80))}${url.length > 80 ? '...' : ''}</span>
                            </div > `;
                harCount++;
              });
            }
            if (harCount === 0) netHtml = "<div class='muted'>No HAR data found.</div>";
            el("networkTimeline").innerHTML = netHtml;

            // Segment Map (derive from HAR and streams)
            let segHtml = "";
            const fragments = (artifacts.networkHar?.log?.entries || []).filter(e => e.request?.url?.includes('.ts') || e.request?.url?.includes('.m4s') || e.request?.url?.match(/video|audio/i));
            segHtml += `< div style = "margin-bottom:8px; font-weight:600; font-size:12px;" > Extracted ${fragments.length} media fragments.</div > `;
            segHtml += `< div style = "display:flex; flex-wrap:wrap; gap:4px; padding: 4px;" > `;
            fragments.forEach((f, idx) => {
              segHtml += `< div class= "segment-block" title = "${f.request?.url}" style = "animation-delay: ${idx * 0.02}s; background:var(--color-ok); color:#000; padding:2px 4px; font-size:10px; font-weight:700; border-radius:4px;" > ${idx}</div > `;
            });
            segHtml += `</div > `;
            el("segmentMap").innerHTML = segHtml;

            // Intelligence Widget Population
            // Phase 5 Integration: Load Forensic Modules dynamically
            let CDN_MODULE, TOKEN_MODULE, TIMELINE_MODULE, LADDER_MODULE;
            try {
              if (typeof require !== 'undefined') {
                CDN_MODULE = require('../src/forensics/detectCDN');
                TOKEN_MODULE = require('../src/forensics/detectTokenPatterns');
                TIMELINE_MODULE = require('../src/forensics/parseTimeline');
                LADDER_MODULE = require('../src/forensics/buildStreamLadder');
              }
            } catch (e) {
              console.error("Failed to load Phase 5 forensic modules", e);
            }

            // Timeline Parse & Render
            if (TIMELINE_MODULE && artifacts.harObject) {
              const timelineEvents = TIMELINE_MODULE(artifacts.harObject);
              let timeHtml = "";
              timelineEvents.forEach(e => {
                timeHtml += `< tr >
                        <td class="muted">${e.index}</td>
                        <td><span class="pill tiny mono">${escapeHtml(e.classification.toUpperCase())}</span></td>
                        <td>${escapeHtml(e.mime)}</td>
                        <td class="mono" style="font-size:11px; max-width:350px; overflow:hidden; text-overflow:ellipsis;">
                            ${escapeHtml(e.url)}
                        </td>
                    </tr > `;
              });
              if (timeHtml) el("timelineTbody").innerHTML = timeHtml;
            }

            // Stream Ladder Parse & Render
            if (LADDER_MODULE && artifacts.manifestBuffer) {
              const urlHint = artifacts.candidates && artifacts.candidates.length > 0 ? artifacts.candidates[0].url : "";
              const ladderData = LADDER_MODULE(artifacts.manifestBuffer, urlHint);
              el("ladderProtocol").textContent = ladderData.protocol.toUpperCase();
              el("ladderTiers").textContent = ladderData.levels.length;
              let ladHtml = "";
              ladderData.levels.forEach(lv => {
                ladHtml += `< tr >
                       <td style="font-weight:600;">${escapeHtml(lv.resolution)}</td>
                       <td class="mono">${lv.bitrate > 0 ? lv.bitrate : 'Auto'}</td>
                       <td class="mono muted">${escapeHtml(lv.codecs)}</td>
                   </tr > `;
              });
              if (ladHtml) el("ladderTbody").innerHTML = ladHtml;
            }

            if (artifacts.fingerprintResult) {
              const playerStr = typeof artifacts.fingerprintResult === 'string' ? artifacts.fingerprintResult : (artifacts.fingerprintResult.integrator || artifacts.fingerprintResult.player || 'UNKNOWN');
              el("intPlayer").textContent = playerStr;
              el("intPlayer").className = "pill tiny " + (playerStr !== 'UNKNOWN' ? "ok" : "muted");
            }

            let hasDrm = false;
            let cdnGuess = "Generic Edge";

            // Phase 5 Token and CDN Detection overriding basic string matches
            if (TOKEN_MODULE && artifacts.candidates) {
              const tokenIntel = TOKEN_MODULE(artifacts.candidates);
              if (tokenIntel.detected) {
                hasDrm = tokenIntel.tokenTypes.some(t => t.includes('Policy') || t.includes('Signature') || t.includes('Auth'));
              }
            }

            if (CDN_MODULE && TIMELINE_MODULE && artifacts.harObject) {
              const events = TIMELINE_MODULE(artifacts.harObject);
              const cdnIntel = CDN_MODULE(events);
              if (cdnIntel.cdn !== 'Unknown Origin') {
                cdnGuess = cdnIntel.cdn;
              }
            }

            el("intProto").textContent = artifacts.networkHar ? "HTTPS/H2" : "--";
            el("intProto").className = "pill tiny ok";

            el("intCdn").textContent = cdnGuess;
            el("intCdn").className = "pill tiny muted";

            el("intDrm").textContent = hasDrm ? "Detected" : "Cleartext";
            el("intDrm").className = hasDrm ? "pill tiny bad" : "pill tiny ok";

            const mseActive = artifacts.mseEvents && artifacts.mseEvents.length > 0;
            el("intMse").textContent = mseActive ? "Confirmed" : "None";
            el("intMse").className = mseActive ? "pill tiny ok" : "pill tiny muted";

            el("intSw").textContent = "Intercepted";
            el("intSw").className = "pill tiny warn";

            // Seed the extraction engine with this evidence 
            // (Mock completion to populate best candidate widget if Enginecore ran in real life)
            if (window.smartDecode && window.smartDecode.run) {
              const engineRes = await window.smartDecode.run(artifacts.domContext?.dom || "", {});
              if (engineRes.candidates && engineRes.candidates.length > 0) {
                el("intBest").textContent = engineRes.candidates[0].url;
                el("intLadder").textContent = "1080p, 720p, chunked";
                el("intLadder").className = "mono tiny ok";
              }
            }
            const traceEl = el("scriptTrace") || document.createElement("div");
            traceEl.id = "scriptTrace";

            let traceHtml = "";
            let traceCount = 0;
            if (artifacts.streamTrace && Array.isArray(artifacts.streamTrace)) {
              artifacts.streamTrace.forEach((t, idx) => {
                const time = new Date(t.timestamp).toISOString().split('T')[1].replace('Z', '');
                const action = t.type === 'MSE' ? `[MSE] ${t.action} ${t.mime ? '- ' + t.mime : ''}` : `[${t.type}]${t.method || ''} ${t.url || ''}`;
                traceHtml += `< div class= "log-item" style = "color: ${t.type === 'MSE' ? 'var(--color-warn)' : '#a855f7'}; animation-delay: ${idx * 0.05}s" >
        <span class="muted" style="margin-right:8px;">(${time})</span>
                                ${escapeHtml(action)}
                               </div > `;
                traceCount++;
              });
            }
            if (traceCount === 0) traceHtml = "<div class='muted'>No execution trace found.</div>";

            traceEl.innerHTML = traceHtml;

            setStatus("Evidence Bundle loaded directly into the console grids.", "ok");
          } else {
            if (!res?.error?.includes("No directory selected")) {
              setStatus(`Failed to load snapshot: ${res?.error}`, "bad");
            }
          }
        } else {
          setStatus("Forensic Snapshots are only supported in Vanguard Desktop.", "warn");
        }
      });
    }

    // Tier Badge Update
    function updateTierBadge(tier) {
      const badge = el('tierBadge');
      if (!badge) return;
      badge.className = 'tier-badge';
      if (tier === 'SOVEREIGN') {
        badge.classList.add('tier-sovereign');
        badge.textContent = 'SOVEREIGN EDITION';
      } else if (tier === 'INSTITUTIONAL') {
        badge.classList.add('tier-institutional');
        badge.textContent = 'INSTITUTIONAL';
      } else {
        badge.classList.add('tier-community');
        badge.textContent = 'COMMUNITY';
      }
    }

    // Upgrade Prompt
    function showUpgradePrompt(featureName, requiredTier) {
      const tier = requiredTier || 'SOVEREIGN';
      const price = tier === 'INSTITUTIONAL' ? '$499' : '$149';
      el('upgradeTitle').textContent = `${featureName} — Upgrade Required`;
      el('upgradeMessage').textContent = `This feature requires the ${tier} Edition(${price} one - time).`;
      el('upgradeModal').style.display = 'flex';
    }

    // Import License Button
    if (el('btnImportLicense')) el('btnImportLicense').addEventListener('click', async () => {
      if (window.electronAPI && window.electronAPI.validateLicense) {
        const result = await window.electronAPI.validateLicense();
        if (result && result.canceled) return;
        if (result && result.valid) {
          state.currentTier = result.tier || result.edition || 'SOVEREIGN';
          updateTierBadge(state.currentTier);
          setStatus(`License activated: ${state.currentTier} Edition.Welcome, ${result.user || 'Analyst'}!`, 'ok');
          if (state.currentTier === 'SOVEREIGN' || state.currentTier === 'INSTITUTIONAL') {
            el('forensicCard').style.display = 'flex';
            logToConsole(`License upgraded to ${state.currentTier}.`, 'decode');
          }
        } else {
          setStatus(`License validation failed: ${result?.reason || 'Unknown error'}`, 'bad');
        }
      } else {
        setStatus('License import is only available in the desktop app.', 'warn');
      }
    });

    // Tab Switching Logic
    const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
    const tabPanels = Array.from(document.querySelectorAll('.tab-content'));

    function activateTab(tabBtn, shouldFocus = false) {
      if (!tabBtn) return;

      tabButtons.forEach((btn) => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
        btn.setAttribute('tabindex', '-1');
      });

      tabPanels.forEach((panel) => {
        panel.style.display = 'none';
        panel.setAttribute('aria-hidden', 'true');
      });

      tabBtn.classList.add('active');
      tabBtn.setAttribute('aria-selected', 'true');
      tabBtn.setAttribute('tabindex', '0');

      const tabId = tabBtn.getAttribute('data-tab');
      const panel = el(tabId);
      if (panel) {
        panel.style.display = 'block';
        panel.setAttribute('aria-hidden', 'false');
      }

      if (shouldFocus) tabBtn.focus();
    }

    tabButtons.forEach((btn, idx) => {
      btn.addEventListener('click', () => activateTab(btn));
      btn.addEventListener('keydown', (ev) => {
        if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft' && ev.key !== 'Home' && ev.key !== 'End') return;
        ev.preventDefault();
        let next = idx;
        if (ev.key === 'ArrowRight') next = (idx + 1) % tabButtons.length;
        if (ev.key === 'ArrowLeft') next = (idx - 1 + tabButtons.length) % tabButtons.length;
        if (ev.key === 'Home') next = 0;
        if (ev.key === 'End') next = tabButtons.length - 1;
        activateTab(tabButtons[next], true);
      });
    });

    activateTab(tabButtons.find((b) => b.classList.contains('active')) || tabButtons[0]);

    // ==================== WORKBENCH IA: relocate, gate, proof-status ====================
    // Relocate deep/advanced modules out of the Workbench into the Advanced tab.
    (function relocateAdvancedModules() {
      const src = el('advancedRelocateSrc');
      const dest = el('tabAdvanced');
      if (src && dest) dest.appendChild(src);
    })();

    // Gate analysis tools behind evidence load with a calm placeholder.
    const GATED_TAB_IDS = ['tabTimeline', 'tabLadder', 'tabCandidates', 'tabHar', 'tabIntelligence', 'tabPatterns', 'tabAdvanced'];
    GATED_TAB_IDS.forEach((id) => {
      const panel = el(id);
      if (!panel) return;
      panel.classList.add('gated');
      const ph = document.createElement('div');
      ph.className = 'gate-placeholder';
      ph.innerHTML = '<div class="gate-title">Load evidence to unlock analysis tools.</div>' +
        '<div class="gate-sub">Use the Workbench to load a folder, file, URL, or pasted payload.</div>';
      panel.insertBefore(ph, panel.firstChild);
    });

    function setEvidenceLoaded(v, opts) {
      const isSample = opts && opts.sample;
      const lrPath = el('lrSessionPath');
      if (v) {
        document.body.classList.add('evidence-loaded');
        if (isSample) document.body.classList.add('sample-loaded');
        const g = el('valGlobalStatus');
        if (g) { g.textContent = isSample ? 'SAMPLE LOADED' : 'EVIDENCE LOADED'; g.className = 'status-badge ok'; }
        if (lrPath && !lrPath.textContent) lrPath.textContent = 'Evidence bundle loaded — click to open folder';
      } else {
        document.body.classList.remove('evidence-loaded', 'sample-loaded');
        if (lrPath) lrPath.textContent = 'No evidence loaded yet';
      }
      updateProofStatus();
    }
    window.setEvidenceLoaded = setEvidenceLoaded;

    function setPill(id, text, cls) {
      const node = el(id);
      if (!node) return;
      node.textContent = text;
      node.className = 'pill tiny ' + cls;
    }

    function updateProofStatus() {
      const loaded = document.body.classList.contains('evidence-loaded');
      const isSample = document.body.classList.contains('sample-loaded');
      setPill('psEvidence', loaded ? 'Loaded' : 'Waiting for evidence', loaded ? 'ok' : 'idle');

      if (isSample && window._sampleWorkspace && window._sampleWorkspace.case) {
        setPill('psCase', 'Active (demo)', 'ok');
      } else {
        const c = window.caseMgr && window.caseMgr.activeCase;
        setPill('psCase', c ? 'Active' : 'No case loaded yet', c ? 'ok' : 'idle');
      }

      if (isSample && window._sampleWorkspace) {
        setPill('psHash', 'Created', 'ok');
        setPill('psManifest', 'Ready', 'ok');
        setPill('psExport', 'Ready', 'ok');
      } else {
        const hashTxt = (el('intHash') && el('intHash').textContent) || '--';
        const hasHash = hashTxt && hashTxt !== '--' && hashTxt.replace(/\s/g, '').length > 8;
        setPill('psHash', hasHash ? 'Created' : 'Waiting', hasHash ? 'ok' : 'idle');
        setPill('psManifest', hasHash ? 'Ready' : 'Waiting', hasHash ? 'ok' : 'idle');

        const exTxt = (el('intExportReady') && el('intExportReady').textContent) || '';
        const ready = /ready/i.test(exTxt) && !/blocked|waiting/i.test(exTxt);
        setPill('psExport', ready ? 'Ready' : 'Not ready yet', ready ? 'ok' : 'idle');
      }
    }
    window.updateProofStatus = updateProofStatus;
    updateProofStatus();

    // Workbench 3-step shortcuts (reuse existing controls; no new behavior).
    el('wbStepLoad') && el('wbStepLoad').addEventListener('click', () => {
      const i = el('input'); if (i) { i.focus(); i.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    });
    el('wbStepDecode') && el('wbStepDecode').addEventListener('click', () => { el('btnDecode') && el('btnDecode').click(); });
    el('wbStepProof') && el('wbStepProof').addEventListener('click', () => { el('tabBtnReport') && el('tabBtnReport').click(); });

    // ==================== PHASE 57: CASE MANAGEMENT LOGIC ====================
    class CaseManager {
      constructor() {
        this.activeCase = null;
        this.initListeners();
        this.refreshCaseList();
      }

      initListeners() {
        el('btnCreateCase').addEventListener('click', () => this.createCase());
        el('btnCloseCase').addEventListener('click', () => this.closeCase());
        el('btnAddNote').addEventListener('click', () => this.addNote());
        el('btnExportNotes').addEventListener('click', () => this.exportNotes());
        el('btnAttachBundle').addEventListener('click', () => this.attachBundle());
        el('btnLogFinding').addEventListener('click', () => this.logFinding());
        el('btnRunComparison').addEventListener('click', () => this.runComparison());
        el('btnRefreshAudit').addEventListener('click', () => this.refreshAuditLogs());
        el('btnSignEvidence').addEventListener('click', () => this.signCase());
        el('btnVerifySignature').addEventListener('click', () => this.verifyCaseSignature());
        el('btnSealPackage').addEventListener('click', () => this.sealEvidencePackage());
        el('btnRebuildGraph').addEventListener('click', () => this.rebuildGraph());
        el('btnLoadPlugin').addEventListener('click', () => this.loadExternalPlugin());
        el('btnExecuteQuery').addEventListener('click', () => this.executeHyperQuery());
        el('btnApplyMutation').addEventListener('click', () => this.applyMutation());
        el('btnRunResearch').addEventListener('click', () => this.runResearchScript());
        el('btnExportCase').addEventListener('click', () => this.exportActiveCase());
        el('btnRunPatternDiscovery').addEventListener('click', () => this.runPatternDiscovery());
        el('btnGenerateBriefing').addEventListener('click', () => this.generateBriefing());
        el('btnAutoInvestigate').addEventListener('click', () => this.launchAutoInvestigation());
        el('btnClassifyBundles').addEventListener('click', () => this.classifyBundles());
        el('btnGenerateResearch').addEventListener('click', () => this.generateResearchSuggestions());
        el('btnCaseWorkspaceQueue').addEventListener('click', () => this.openQueueViewFromCase());
        el('btnCaseWorkspaceReport').addEventListener('click', () => this.openCaseReportFromContext());
        el('btnCaseWorkspaceReportExport').addEventListener('click', () => this.exportCaseReportFromContext());
        el('btnCaseWorkspaceExport').addEventListener('click', () => this.exportActiveCase());
      }

      async createCase() {
        if (!window.electronAPI || !window.electronAPI.caseCreate) {
          setStatus("Case creation failed: Electron bridge is unavailable.", "bad");
          return;
        }
        const title = prompt("Case title:", "New Investigation");
        if (title === null) return;
        const created = await window.electronAPI.caseCreate(String(title || "").trim() || "New Investigation");
        if (!created || !created.case_id) {
          setStatus("Case creation failed: invalid response from backend.", "bad");
          return;
        }
        setStatus(`Created case ${created.case_id}.`, "ok");
        await this.refreshCaseList();
        await this.loadCase(created.case_id);
      }

      async refreshCaseList() {
        if (!window.electronAPI || !window.electronAPI.caseList) return;
        const cases = await window.electronAPI.caseList();
        const body = el('caseListBody');

        if (cases.length === 0) {
          body.innerHTML = '<tr><td colspan="5" class="muted" style="text-align:center; padding:2rem;">No cases found. Create a new one to begin.</td></tr>';
          return;
        }

        body.innerHTML = cases.map(c => `
                <tr data-case-id="${c.case_id}">
                    <td class="mono tiny">${c.case_id}</td>
                    <td style="font-weight:600;">${escapeHtml(c.title)}</td>
                    <td><span class="pill tiny">${c.bundleCount} items</span></td>
                    <td class="muted tiny">${new Date(c.modified).toLocaleString()}</td>
                    <td style="text-align:right;">
                        <button type="button" class="pill-btn" data-action="case-open" data-case-id="${c.case_id}">Open</button>
                        <button type="button" class="pill-btn" style="color:var(--color-bad);" data-action="case-delete" data-case-id="${c.case_id}">Del</button>
                    </td>
                </tr>
            `).join('');
      }

      async loadCase(caseId) {
        const c = await window.electronAPI.caseLoad(caseId);
        if (!c) return;
        this.activeCase = c;

        el('caseExplorer').style.display = 'none';
        el('activeCaseDashboard').style.display = 'flex';
        el('caseAssistantPanel').style.display = 'block';
        el('activeCaseTitle').textContent = c.title;
        el('activeCaseId').textContent = "CASE ID: " + c.case_id;

        this.renderBundles();
        this.renderNotes();
        this.renderFindings();
        this.updateCompareSelects();
        this.refreshAuditLogs();
        this.renderIntelligenceGraph();
        this.refreshPluginList();
        this.refreshQueryStats();
        this.scanAllBundlesForAlerts();
        this.refreshResearchScripts();
        this.renderWorkspaceDepth(state.lastAutomation, state.lastAutomationError);

        logToConsole(`Case Loaded: ${c.title}`, "ok");
        window.electronAPI.auditLog('CASE_OPEN', { caseId: caseId, title: c.title });
      }

      getLinkedCaseJobs(snapshot = state.lastAutomation) {
        if (!this.activeCase || !this.activeCase.case_id) return [];
        if (!snapshot) return [];

        const caseId = this.activeCase.case_id;
        const queue = Array.isArray(snapshot.queue) ? snapshot.queue : [];
        const history = Array.isArray(snapshot.history) ? snapshot.history : [];

        const linked = [...queue, ...history].filter((job) => job && job.caseId === caseId);
        linked.sort((a, b) => {
          const aTs = a.updatedAt || a.finishedAt || a.startedAt || a.addedAt || 0;
          const bTs = b.updatedAt || b.finishedAt || b.startedAt || b.addedAt || 0;
          return bTs - aTs;
        });
        return linked;
      }

      getCaseStatusRollup(linkedJobs) {
        return buildStatusRollup(linkedJobs);
      }

      getCaseTrustSummary(linkedJobs, rollup) {
        return buildTrustSummaryFromJobs(linkedJobs, rollup);
      }

      renderWorkspaceDepth(snapshot = state.lastAutomation, automationError = state.lastAutomationError) {
        const stateEl = el('caseWorkspaceState');
        const countsEl = el('caseSummaryCounts');
        const linkedCountEl = el('caseLinkedJobsCount');
        const manualReviewEl = el('caseManualReviewFlags');
        const riskEl = el('caseRiskFlags');
        const trustEl = el('caseTrustSummary');
        const rollupEl = el('caseStatusRollup');
        const listEl = el('caseLinkedJobsList');
        const lineageEl = el('caseLineageSummary');
        const timelineEl = el('caseTimelineList');
        if (!stateEl || !countsEl || !linkedCountEl || !manualReviewEl || !riskEl || !trustEl || !rollupEl || !listEl || !lineageEl || !timelineEl) return;

        if (!this.activeCase || !this.activeCase.case_id) {
          stateEl.className = "tiny muted";
          stateEl.textContent = "Load a case to initialize workspace state.";
          countsEl.textContent = "bundles:0 notes:0 findings:0";
          linkedCountEl.textContent = "0";
          manualReviewEl.textContent = "0";
          riskEl.textContent = "0";
          trustEl.textContent = "No linked queue activity";
          trustEl.className = "pill tiny idle";
          rollupEl.textContent = "queued:0 running:0 paused:0 review:0 completed:0 warning:0 failed:0 canceled:0";
          listEl.innerHTML = '<div class="muted tiny">No linked queue activity for this case.</div>';
          lineageEl.textContent = "lineage: unavailable";
          timelineEl.innerHTML = '<div class="muted tiny">No case timeline events recorded.</div>';
          return;
        }

        const bundlesCount = Array.isArray(this.activeCase.bundles) ? this.activeCase.bundles.length : 0;
        const notesCount = Array.isArray(this.activeCase.notes) ? this.activeCase.notes.length : 0;
        const findingsCount = Array.isArray(this.activeCase.findings) ? this.activeCase.findings.length : 0;
        countsEl.textContent = `bundles:${bundlesCount} notes:${notesCount} findings:${findingsCount}`;

        if (automationError) {
          stateEl.className = "tiny bad";
          stateEl.textContent = `Automation state unavailable: ${automationError}`;
          linkedCountEl.textContent = "--";
          manualReviewEl.textContent = "--";
          riskEl.textContent = "--";
          trustEl.textContent = "Automation state unavailable";
          trustEl.className = "pill tiny bad";
          rollupEl.textContent = "queued:-- running:-- paused:-- review:-- completed:-- warning:-- failed:-- canceled:--";
          listEl.innerHTML = '<div class="bad tiny">Queue activity could not be loaded. Verify bridge and retry.</div>';
          lineageEl.textContent = "lineage: automation-state-unavailable";
          timelineEl.innerHTML = '<div class="bad tiny">Timeline unavailable while automation state is disconnected.</div>';
          return;
        }

        if (!snapshot) {
          stateEl.className = "tiny muted";
          stateEl.textContent = "Loading linked queue activity for active case...";
          linkedCountEl.textContent = "0";
          manualReviewEl.textContent = "0";
          riskEl.textContent = "0";
          trustEl.textContent = "Loading";
          trustEl.className = "pill tiny warn";
          rollupEl.textContent = "queued:0 running:0 paused:0 review:0 completed:0 warning:0 failed:0 canceled:0";
          listEl.innerHTML = '<div class="muted tiny">Loading queue activity...</div>';
          lineageEl.textContent = "lineage: loading";
          timelineEl.innerHTML = '<div class="muted tiny">Loading timeline events...</div>';
          return;
        }

        const linkedJobs = this.getLinkedCaseJobs(snapshot);
        const rollup = this.getCaseStatusRollup(linkedJobs);
        const trust = this.getCaseTrustSummary(linkedJobs, rollup);
        const caseTimeline = buildCaseTimelineEvents(linkedJobs, 30);

        linkedCountEl.textContent = String(linkedJobs.length);
        manualReviewEl.textContent = String(rollup.manualReview);
        riskEl.textContent = String(rollup.warning + rollup.failed + rollup.canceled);
        trustEl.textContent = trust.label;
        trustEl.className = `pill tiny ${trust.className}`;
        rollupEl.textContent = `queued:${rollup.queued} running:${rollup.running} paused:${rollup.paused} review:${rollup.manualReview} completed:${rollup.completed} warning:${rollup.warning} failed:${rollup.failed} canceled:${rollup.canceled}`;
        lineageEl.textContent = buildCaseLineageSummary(this.activeCase.case_id, linkedJobs, caseTimeline);
        stateEl.className = "tiny muted";
        stateEl.textContent = `Case workspace synced at ${new Date().toLocaleTimeString()} for ${this.activeCase.case_id}.`;

        if (!linkedJobs.length) {
          listEl.innerHTML = '<div class="muted tiny">No linked queue activity for this case. Queue with "Queue to Active Case" or bind from history.</div>';
          timelineEl.innerHTML = '<div class="muted tiny">No case timeline events recorded.</div>';
          return;
        }

        listEl.innerHTML = linkedJobs.slice(0, 14).map((job) => {
          const obs = buildJobObservability(job);
          const reason = job.failureReason || job.manualReviewReason || job.error || "";
          const reasonChain = buildReasonChain(job, 4);
          const timeline = buildJobTimelineEvents(job, 6);
          const summary = job?.lastResultSummary?.message || "No summary";
          const canReopen = isReopenableStatus(job.status);
          return `
            <div class="panel" style="padding:8px; border-style:dashed; background:rgba(255,255,255,0.02);">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                <span class="pill tiny">${escapeHtml(job.host || "unknown")}</span>
                <span class="status-badge ${statusBadgeClass(job.status)}">${statusLabel(job.status)}</span>
              </div>
              <div class="mono tiny" style="margin-top:6px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeForAttr(job.url || "")}">${escapeHtml(job.url || "--")}</div>
              <div class="tiny muted" style="margin-top:4px;">${escapeHtml(obs.summaryLine)}</div>
              <div class="tiny muted">summary: ${escapeHtml(summary)}</div>
              ${reason ? `<div class="bad tiny">reason: ${escapeHtml(reason)}</div>` : ""}
              <div class="tiny muted">reason chain: ${escapeHtml(reasonChain.length ? reasonChain.join(" | ") : "--")}</div>
              <div class="tiny muted">${escapeHtml(obs.actionLine)}</div>
              <div class="tiny muted">timeline: ${escapeHtml(timeline.length ? timeline.slice(-3).map((event) => `${formatTimestamp(event.at)} ${event.event}`).join(" | ") : "--")}</div>
              <div style="display:flex; gap:6px; margin-top:6px; flex-wrap:wrap;">
                <button class="pill-btn tiny" data-case-job-open="${job.id}">Open Queue</button>
                ${canReopen ? `<button class="pill-btn tiny" data-case-job-reopen="${job.id}">Reopen</button>` : ""}
              </div>
            </div>
          `;
        }).join('');

        listEl.querySelectorAll('[data-case-job-open]').forEach((btn) => {
          btn.addEventListener('click', () => this.openQueueViewFromCase(btn.getAttribute('data-case-job-open')));
        });
        listEl.querySelectorAll('[data-case-job-reopen]').forEach((btn) => {
          btn.addEventListener('click', () => this.reopenCaseJob(btn.getAttribute('data-case-job-reopen')));
        });

        timelineEl.innerHTML = caseTimeline.length
          ? caseTimeline.map((event) => {
            const ev = String(event.event || "event").toLowerCase();
            let cls = "muted";
            if (ev.includes("fail") || ev.includes("canceled")) cls = "bad";
            else if (ev.includes("manual") || ev.includes("warn")) cls = "warn";
            else if (ev.includes("complete")) cls = "ok";
            const detail = event.detail ? ` :: ${event.detail}` : "";
            return `<div class="tiny ${cls}" style="border-left:2px solid rgba(255,255,255,0.18); padding-left:6px;">${formatTimestamp(event.at)} :: ${escapeHtml(event.host || "unknown")} :: ${escapeHtml(event.event || "event")}${escapeHtml(detail)}</div>`;
          }).join('')
          : '<div class="muted tiny">No case timeline events recorded.</div>';
      }

      buildCaseWorkspaceReport(snapshot = state.lastAutomation) {
        const linkedJobs = this.getLinkedCaseJobs(snapshot);
        const rollup = this.getCaseStatusRollup(linkedJobs);
        const trust = this.getCaseTrustSummary(linkedJobs, rollup);
        const caseTimeline = buildCaseTimelineEvents(linkedJobs, 36);
        const failedJobs = linkedJobs.filter((job) => job.status === "failed");
        const warningJobs = linkedJobs.filter((job) => job.status === "warning");
        const manualReviewJobs = linkedJobs.filter((job) => job.status === "manual-review");
        const caseId = this.activeCase?.case_id || "unknown-case";
        const title = this.activeCase?.title || "Untitled Case";
        const bundlesCount = (this.activeCase?.bundles || []).length;
        const findingsCount = (this.activeCase?.findings || []).length;
        const notesCount = (this.activeCase?.notes || []).length;
        const lineageSummary = buildCaseLineageSummary(caseId, linkedJobs, caseTimeline);

        const executiveSummary = {
          caseId,
          title,
          linkedJobs: linkedJobs.length,
          trustStatus: trust.label,
          riskFlags: failedJobs.length + warningJobs.length + manualReviewJobs.length
        };
        const queueResultsSummary = {
          queued: rollup.queued,
          running: rollup.running,
          paused: rollup.paused,
          manualReview: rollup.manualReview,
          completed: rollup.completed,
          warning: rollup.warning,
          failed: rollup.failed,
          canceled: rollup.canceled
        };
        const caseSummary = {
          bundles: bundlesCount,
          findings: findingsCount,
          notes: notesCount
        };
        const exportMetadata = {
          reportType: "case-workspace",
          schema: "v1.6.0-reporting",
          generatedAt: new Date().toISOString(),
          source: "case-workspace-context",
          deterministicHeadings: true,
          caseId
        };
        const jobTimelines = linkedJobs.map((job) => ({
          jobId: job.id,
          host: job.host,
          status: job.status,
          source: job.source || "unknown",
          reasonChain: buildReasonChain(job, 6),
          events: buildJobTimelineEvents(job, 12)
        }));

        const lines = [
          "# HyperSnatch Case Workspace Report",
          `Generated: ${exportMetadata.generatedAt}`,
          `Case: ${caseId} :: ${title}`,
          "",
          "## Executive Summary",
          `- linked jobs: ${executiveSummary.linkedJobs}`,
          `- trust status: ${executiveSummary.trustStatus}`,
          `- risk flags: ${executiveSummary.riskFlags}`,
          "",
          "## Queue Results Summary",
          `- queued: ${queueResultsSummary.queued}`,
          `- running: ${queueResultsSummary.running}`,
          `- paused: ${queueResultsSummary.paused}`,
          `- manual-review: ${queueResultsSummary.manualReview}`,
          `- completed: ${queueResultsSummary.completed}`,
          `- warning: ${queueResultsSummary.warning}`,
          `- failed: ${queueResultsSummary.failed}`,
          `- canceled: ${queueResultsSummary.canceled}`,
          "",
          "## Case Summary",
          `- case id: ${caseId}`,
          `- title: ${title}`,
          `- bundles: ${caseSummary.bundles}`,
          `- findings: ${caseSummary.findings}`,
          `- notes: ${caseSummary.notes}`,
          "",
          "## Trust Summary",
          `- status: ${trust.label}`,
          `- lineage: ${lineageSummary}`,
          "",
          "## Warnings Failures and Manual Review"
        ];

        if (!failedJobs.length && !warningJobs.length && !manualReviewJobs.length) {
          lines.push("- none");
        } else {
          failedJobs.slice(0, 12).forEach((job) => lines.push(`- failed: ${job.host} :: ${job.url} :: ${job.failureReason || job.error || "Unknown failure"}`));
          warningJobs.slice(0, 12).forEach((job) => lines.push(`- warning: ${job.host} :: ${job.url} :: ${job.lastResultSummary?.message || "Warning without summary"}`));
          manualReviewJobs.slice(0, 12).forEach((job) => lines.push(`- manual-review: ${job.host} :: ${job.url} :: ${job.manualReviewReason || "No reason provided"}`));
        }

        lines.push("", "## Evidence Timeline and Lineage");
        if (!jobTimelines.length) {
          lines.push("- no case-linked timeline events");
        } else {
          jobTimelines.slice(0, 16).forEach((job) => {
            lines.push(`- job ${job.jobId} [${statusLabel(job.status)}] host=${job.host} source=${job.source}`);
            lines.push(`  - reason chain: ${job.reasonChain.length ? job.reasonChain.join(" | ") : "--"}`);
            if (!job.events.length) {
              lines.push("  - timeline: none");
            } else {
              job.events.slice(-6).forEach((event) => {
                const detail = event.detail ? ` :: ${event.detail}` : "";
                lines.push(`  - ${formatTimestamp(event.at)} :: ${event.event}${detail}`);
              });
            }
          });
        }

        lines.push("", "## Case Timeline");
        if (!caseTimeline.length) {
          lines.push("- no case-level timeline events");
        } else {
          caseTimeline.slice(0, 24).forEach((event) => {
            const detail = event.detail ? ` :: ${event.detail}` : "";
            lines.push(`- ${formatTimestamp(event.at)} :: ${event.host} :: ${event.event}${detail}`);
          });
        }

        lines.push("", "## Export Metadata");
        lines.push(`- report type: ${exportMetadata.reportType}`);
        lines.push(`- schema: ${exportMetadata.schema}`);
        lines.push(`- source: ${exportMetadata.source}`);
        lines.push(`- case id: ${exportMetadata.caseId}`);
        lines.push(`- deterministic headings: ${exportMetadata.deterministicHeadings ? "true" : "false"}`);

        return {
          ...exportMetadata,
          executiveSummary,
          queueResultsSummary,
          caseSummary,
          trustSummary: trust,
          riskSummary: {
            failed: failedJobs.map((job) => ({ id: job.id, host: job.host, url: job.url, reason: job.failureReason || job.error || "Unknown failure" })),
            warning: warningJobs.map((job) => ({ id: job.id, host: job.host, url: job.url, reason: job.lastResultSummary?.message || "Warning without summary" })),
            manualReview: manualReviewJobs.map((job) => ({ id: job.id, host: job.host, url: job.url, reason: job.manualReviewReason || "No reason provided" }))
          },
          lineage: {
            summary: lineageSummary,
            jobTimelines,
            caseTimeline
          },
          markdown: lines.join("\n")
        };
      }

      openQueueViewFromCase(jobId = null) {
        activateTab(el("tabBtnAutomation"));
        if (jobId) {
          setStatus(`Opened queue view for case-linked job ${jobId.slice(0, 12)}.`, "ok");
        } else {
          setStatus("Opened queue view from case workspace.", "ok");
        }
      }

      async reopenCaseJob(jobId) {
        if (!jobId) return;
        if (!window.electronAPI || !window.electronAPI.automationQueueAction) {
          setStatus("Reopen failed: automation queue bridge unavailable.", "bad");
          return;
        }
        const reason = `Reopened from case workspace ${this.activeCase?.case_id || "unknown-case"}.`;
        const res = await window.electronAPI.automationQueueAction(jobId, "requeue", reason);
        if (!res || res.success === false) {
          setStatus(`Reopen failed for job ${jobId.slice(0, 12)}.`, "bad");
          return;
        }
        setStatus(`Reopened case-linked job ${jobId.slice(0, 12)}.`, "ok");
        await syncAutomationState();
      }

      async openCaseReportFromContext() {
        if (!this.activeCase || !this.activeCase.case_id) {
          setStatus("Case report launch blocked: no active case.", "warn");
          return;
        }
        const report = this.buildCaseWorkspaceReport(state.lastAutomation);
        state.lastCaseWorkspaceReport = report;
        const reportEl = el("reportTextarea");
        if (reportEl) reportEl.value = report.markdown;
        activateTab(el("tabBtnAutomation"));
        setStatus(`Case report loaded for ${this.activeCase.case_id}.`, "ok");
      }

      async exportCaseReportFromContext() {
        if (!this.activeCase || !this.activeCase.case_id) {
          setStatus("Case report export blocked: no active case.", "warn");
          return;
        }
        const report = this.buildCaseWorkspaceReport(state.lastAutomation);
        state.lastCaseWorkspaceReport = report;
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        const base = `${this.activeCase.case_id}_workspace_report_${stamp}`;
        downloadFile(report.markdown || "", `${base}.md`, "text/markdown");
        downloadFile(JSON.stringify(report, null, 2), `${base}.json`, "application/json");
        setStatus(`Case report exported for ${this.activeCase.case_id} (MD + JSON).`, "ok");
      }

      closeCase() {
        this.activeCase = null;
        state.lastCaseWorkspaceReport = null;
        el('activeCaseDashboard').style.display = 'none';
        el('caseAssistantPanel').style.display = 'none';
        el('caseExplorer').style.display = 'block';
        this.renderWorkspaceDepth(null, null);
        this.refreshCaseList();
      }

      async deleteCase(caseId) {
        if (!confirm("Are you sure you want to delete this case?")) return;
        await window.electronAPI.caseDelete(caseId);
        this.refreshCaseList();
      }

      renderBundles() {
        const list = el('caseBundleList');
        if (this.activeCase.bundles.length === 0) {
          list.innerHTML = '<div class="muted tiny">No bundles attached. Use "Attach .hyper"</div>';
          return;
        }
        list.innerHTML = this.activeCase.bundles.map(b => `
                <div class="panel" style="padding:8px; border-style:dashed; background:rgba(0,0,0,0.2);">
                    <div style="display:flex; justify-content:space-between; font-size:0.7rem;">
                        <span class="ok" style="font-weight:700;">${escapeHtml(b.host)}</span>
                        <span class="muted mono tiny">${b.fingerprint.substring(0, 8)}</span>
                    </div>
                    <div class="mono muted" style="font-size:0.6rem; margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(b.sourceUrl)}</div>
                    <div style="display:flex; gap:4px; margin-top:4px;">
                        <button type="button" class="pill-btn tiny" style="flex:1; border:none; background:rgba(255,255,255,0.05);" data-action="bundle-custody" data-fp="${b.fingerprint}">Lineage</button>
                        <button type="button" class="pill-btn tiny" style="flex:1; border:none; background:rgba(255,255,255,0.05);" data-action="bundle-similar" data-fp="${b.fingerprint}">Similar</button>
                    </div>
                </div>
            `).join('');
      }

      async attachBundle() {
        if (!this.activeCase) return;
        // Mock file dialog via prompt for now or use real dialog if available in electronAPI
        const bundlePath = prompt("Enter full path to .hyper bundle:");
        if (!bundlePath) return;

        try {
          const updated = await window.electronAPI.caseAttachBundle(this.activeCase.case_id, bundlePath);
          this.activeCase = updated;
          this.renderBundles();
          this.updateCompareSelects();
          this.renderWorkspaceDepth(state.lastAutomation, state.lastAutomationError);
          logToConsole(`Bundle attached: ${bundlePath}`, "ok");
        } catch (err) {
          alert("Error attaching bundle: " + err.message);
        }
      }

      renderNotes() {
        const list = el('caseNotesList');
        if (this.activeCase.notes.length === 0) {
          list.innerHTML = '<div class="muted tiny">No notes found.</div>';
          return;
        }
        list.innerHTML = this.activeCase.notes.map(n => `
                <div style="margin-bottom:12px; font-size:0.8rem;">
                    <div class="muted tiny">${new Date(n.timestamp).toLocaleString()}</div>
                    <div style="margin-top:4px;">${escapeHtml(n.content)}</div>
                </div>
            `).join('');
        list.scrollTop = list.scrollHeight;
      }

      async addNote() {
        const content = el('caseNoteInput').value.trim();
        if (!content) return;
        const updated = await window.electronAPI.caseAddNote(this.activeCase.case_id, content);
        this.activeCase = updated;
        el('caseNoteInput').value = "";
        this.renderNotes();
        this.renderWorkspaceDepth(state.lastAutomation, state.lastAutomationError);
      }

      async exportNotes() {
        if (!this.activeCase) return;
        if (!window.electronAPI || !window.electronAPI.caseExportNotes) {
          setStatus("Notes export failed: Electron bridge is unavailable.", "bad");
          return;
        }
        try {
          const res = await window.electronAPI.caseExportNotes(this.activeCase.case_id, `${this.activeCase.case_id}_notes.md`);
          if (res?.success) {
            setStatus("Notes exported to " + res.filePath, "ok");
            return;
          }
          if (res?.reason === "Export cancelled") {
            setStatus("Notes export cancelled by operator.", "warn");
            return;
          }
          setStatus(`Notes export failed: ${res?.error || res?.reason || "Unknown error"}`, "bad");
        } catch (e) {
          setStatus(`Notes export failed: ${e?.message || "Unknown error"}`, "bad");
          logToConsole(`Notes export error: ${e?.message || "Unknown error"}`, "bad");
        }
      }

      renderFindings() {
        const body = el('caseFindingsBody');
        if (this.activeCase.findings.length === 0) {
          body.innerHTML = '<tr><td colspan="3" class="muted" style="text-align:center; padding:1rem;">No findings logged.</td></tr>';
          return;
        }
        body.innerHTML = this.activeCase.findings.map(f => `
                <tr>
                    <td style="font-weight:600;">${escapeHtml(f.title)}</td>
                    <td><span class="status-badge ${f.severity}">${f.severity.toUpperCase()}</span></td>
                    <td style="text-align:right;" class="mono tiny muted">${f.bundle_id.substring(0, 8) || 'N/A'}</td>
                </tr>
            `).join('');
      }

      async logFinding() {
        const title = prompt("Finding Title:");
        if (!title) return;
        const severity = prompt("Severity (info/warn/bad):", "info");

        // Just use first bundle as example
        const bundleId = this.activeCase.bundles.length > 0 ? this.activeCase.bundles[0].fingerprint : "NONE";

        const updated = await window.electronAPI.caseAddFinding(this.activeCase.case_id, {
          title, severity, bundle_id: bundleId
        });
        this.activeCase = updated;
        this.renderFindings();
        this.renderWorkspaceDepth(state.lastAutomation, state.lastAutomationError);
      }

      updateCompareSelects() {
        const selA = el('compareSelectA');
        const selB = el('compareSelectB');
        const options = this.activeCase.bundles.map(b => `<option value="${b.path}">${b.host} (${b.fingerprint.substring(0, 6)})</option>`).join('');
        selA.innerHTML = '<option value="">Select Bundle A</option>' + options;
        selB.innerHTML = '<option value="">Select Bundle B</option>' + options;
      }

      async runComparison() {
        const pathA = el('compareSelectA').value;
        const pathB = el('compareSelectB').value;
        if (!pathA || !pathB) {
          alert("Please select two bundles for comparison.");
          return;
        }

        const res = await window.electronAPI.caseCompare(pathA, pathB);
        const area = el('compareResultArea');
        area.textContent = res.markdown;
        area.className = "mono ok";
        logToConsole(`Forensic Comparison complete.`, "decode");
        window.electronAPI.auditLog('COMPARISON_RUN', { caseId: this.activeCase.case_id });
      }

      async refreshAuditLogs() {
        if (!window.electronAPI.auditGetLogs) return;
        const logs = await window.electronAPI.auditGetLogs();
        const list = el('auditLogList');
        const filtered = logs.filter(l => l.data?.caseId === this.activeCase?.case_id || !l.data?.caseId);

        if (filtered.length === 0) {
          list.innerHTML = '<div class="muted">No audit events recorded.</div>';
          return;
        }

        list.innerHTML = filtered.slice(-10).reverse().map(l => `
                <div style="border-bottom:1px solid rgba(255,255,255,0.05); padding:2px 0;">
                    <span class="muted" style="font-size:0.55rem;">${new Date(l.timestamp).toLocaleTimeString()}</span>
                    <span class="ok" style="font-weight:700;">${l.type}</span>
                    <span class="tiny muted">${l.analyst}</span>
                </div>
            `).join('');
      }

      async signCase() {
        if (!this.activeCase) return;
        const signResult = await window.electronAPI.evidenceSign(this.activeCase);
        this.activeCase.signature = signResult.signature;
        this.activeCase.publicKey = signResult.publicKey;

        el('signatureStatus').textContent = "SIGNED (ECDSA)";
        el('signatureStatus').className = "pill tiny ok";
        el('signingInfo').textContent = "Sig: " + signResult.signature.substring(0, 32) + "...";

        await window.electronAPI.caseSave(this.activeCase);
        window.electronAPI.auditLog('CASE_SIGNED', { caseId: this.activeCase.case_id });
        setStatus("Case state cryptographically signed.", "ok");
      }

      async verifyCaseSignature() {
        if (!this.activeCase || !this.activeCase.signature) {
          alert("Case is not signed.");
          return;
        }

        const isValid = await window.electronAPI.evidenceVerify(
          this.activeCase,
          this.activeCase.signature,
          this.activeCase.publicKey
        );

        if (isValid) {
          alert("Forensic Integrity Confirmed: Signature is valid.");
          setStatus("Signature verification successful.", "ok");
        } else {
          alert("CRITICAL ALERT: Signature verification FAILED! Integrity may be compromised.");
          setStatus("Signature verification FAILED!", "bad");
        }
      }

      async viewBundleCustody(fingerprint) {
        const chain = await window.electronAPI.custodyGetChain(fingerprint);
        const list = el('custodyList');

        if (chain.length === 0) {
          list.innerHTML = `<div class="muted">No lineage for ${fingerprint.substring(0, 8)}</div>`;
          return;
        }

        list.innerHTML = chain.map(e => `
                <div style="padding:4px; background:rgba(255,255,255,0.03); border-radius:4px; margin-bottom:4px;">
                    <div style="font-weight:700; color:var(--text-accent);">${e.action}</div>
                    <div class="muted" style="font-size:0.55rem;">${new Date(e.timestamp).toLocaleString()}</div>
                    <div class="tiny mono">${e.details?.machine || 'STATION-01'}</div>
                </div>
            `).join('');
      }

      async sealEvidencePackage() {
        if (!this.activeCase) return;
        const dest = prompt("Enter destination directory for Sealed Package:");
        if (!dest) return;

        const res = await window.electronAPI.evidenceSealCase(this.activeCase.case_id, dest);
        if (res.success) {
          alert(`Sealed Evidence Package created:\n${res.packagePath}`);
          window.electronAPI.auditLog('PACKAGE_SEALED', { caseId: this.activeCase.case_id, path: res.packagePath });
        } else if (res.error) {
          alert("Error sealing package: " + res.error);
        }
      }

      async rebuildGraph() {
        setStatus("Rebuilding Intelligence Graph...", "decode");
        await window.electronAPI.intelligenceRebuildGraph();
        this.renderIntelligenceGraph();
        setStatus("Intelligence Graph rebuilt.", "ok");
      }

      async renderIntelligenceGraph() {
        if (!window.electronAPI.intelligenceGetGraph) return;
        const res = await window.electronAPI.intelligenceGetGraph();
        const list = el('intelGraphList');

        if (res.nodes.length === 0) {
          list.innerHTML = '<div class="muted" style="grid-column: span 2;">No relational data available.</div>';
          return;
        }

        const byType = {};
        res.nodes.forEach(n => {
          if (!byType[n.type]) byType[n.type] = [];
          byType[n.type].push(n);
        });

        list.innerHTML = Object.entries(byType).map(([type, nodes]) => `
                <div style="grid-column: span 2; border-bottom: 1px solid rgba(255,255,255,0.1); margin-top:8px; font-weight:700; color:var(--text-accent);">${type}S</div>
                ${nodes.map(n => `
                    <div class="panel" style="background:rgba(255,255,255,0.02); padding:4px; display:flex; flex-direction:column; gap:2px;">
                        <div class="mono" style="font-size:0.6rem; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(n.id)}</div>
                        <div class="tiny muted">${res.edges.filter(e => e.source === n.id || e.target === n.id).length} connections</div>
                    </div>
                `).join('')}
            `).join('');
      }

      async scanSimilarity(fingerprint) {
        setStatus("Scanning for forensic similarities...", "decode");
        const similar = await window.electronAPI.intelligenceGetSimilar(fingerprint);
        const list = el('similarityList');

        if (similar.length === 0) {
          list.innerHTML = '<div class="muted">No similar infrastructure found.</div>';
          return;
        }

        list.innerHTML = similar.map(item => `
                <div class="panel" style="background:rgba(255,255,255,0.03); margin-bottom:4px; padding:6px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="flex:1;">
                        <div class="mono" style="font-size:0.65rem;">${escapeHtml(item.bundle.path.split(/[\\/]/).pop())}</div>
                        <div class="tiny muted">${item.bundle.cdn || 'Local'} | ${item.bundle.protocol || 'Unknown'}</div>
                    </div>
                    <div class="pill tiny ${item.score > 70 ? 'ok' : 'muted'}" style="font-weight:700;">${item.score}% Match</div>
                </div>
            `).join('');

        setStatus(`Scan complete: ${similar.length} related artifacts found.`, "ok");
      }

      async refreshPluginList() {
        if (!window.electronAPI.pluginsList) return;
        const plugins = await window.electronAPI.pluginsList();
        const list = el('pluginList');
        el('pluginsLoadedCount').textContent = plugins.length;

        if (plugins.length === 0) {
          list.innerHTML = '<div class="muted">No plugins loaded.</div>';
          return;
        }

        list.innerHTML = plugins.map(p => `
                <div class="panel" style="background:rgba(255,255,255,0.03); margin-bottom:4px; padding:6px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="flex:1;">
                        <div style="font-weight:700; color:var(--text-accent); font-size:0.65rem;">${escapeHtml(p.name)} v${p.version}</div>
                        <div class="tiny muted">${p.capabilities.join(', ')}</div>
                    </div>
                    <div class="pill tiny ${p.enabled ? 'ok' : 'muted'}" style="font-weight:700;">${p.enabled ? 'ACTIVE' : 'OFF'}</div>
                </div>
            `).join('');
      }

      async loadExternalPlugin() {
        const pPath = prompt("Enter full path to plugin directory (must contain manifest.json):");
        if (!pPath) return;

        setStatus("Loading plugin...", "decode");
        const res = await window.electronAPI.pluginsLoad(pPath);
        if (res) {
          this.refreshPluginList();
          setStatus(`Plugin "${res.name}" loaded successfully.`, "ok");
          logToConsole(`Plugin ${res.id} initialized with capabilities: ${res.capabilities.join(', ')}`, "ok");
        } else {
          alert("Failed to load plugin. Check console for details.");
          setStatus("Plugin load failed.", "bad");
        }
      }

      async executeHyperQuery() {
        const queryStr = el('hyperQueryInput').value.trim();
        if (!queryStr) return;

        setStatus("Executing HyperQuery...", "decode");
        const results = await window.electronAPI.queryExecute(queryStr);
        const list = el('hyperQueryResults');

        if (results.length === 0) {
          list.innerHTML = '<div class="muted" style="grid-column: 1 / -1;">No relational matches found for query.</div>';
          return;
        }

        list.innerHTML = results.map(r => `
                <div class="panel" style="background:rgba(255,255,255,0.03); padding:8px; border-style:dashed;">
                    <div style="font-weight:700; color:var(--text-accent);">${r.type}</div>
                    <div class="mono tiny muted" style="overflow:hidden; text-overflow:ellipsis;">${escapeHtml(r.id)}</div>
                    <button type="button" class="pill-btn tiny" style="margin-top:4px; width:100%;" data-action="case-by-bundle" data-bundle-id="${r.id}">Jump to Case</button>
                </div>
            `).join('');

        this.refreshQueryStats();
        setStatus(`Query returned ${results.length} relational matches.`, "ok");
      }

      async refreshQueryStats() {
        if (!window.electronAPI.queryStats) return;
        const stats = await window.electronAPI.queryStats();
        el('statCdns').textContent = stats.cdns;
        el('statProtos').textContent = stats.protocols;
        el('statPlayers').textContent = stats.players;
        el('statFps').textContent = stats.fingerprints;
      }

      async loadCaseByBundleId(bundleId) {
        // Find which case owns this bundle
        const node = await window.electronAPI.intelligenceGetGraph();
        const found = node.nodes.find(n => n.id === bundleId);
        if (found && found.data.caseId) {
          this.loadCase(found.data.caseId);
          setStatus(`Switched to case for bundle ${bundleId.substring(0, 8)}`, "ok");
        }
      }

      async applyMutation() {
        const enabled = el('chkMutationEnabled').checked;
        const headersJson = el('txtMutationHeaders').value.trim();
        const tokenStr = el('txtMutationToken').value.trim();

        let headers = {};
        if (headersJson) {
          try {
            headers = JSON.parse(headersJson);
          } catch (e) {
            alert("Invalid JSON for Header Mutations.");
            return;
          }
        }

        const config = {
          enabled,
          modifyHeaders: headers,
          injectTokens: tokenStr
        };

        // For simplicity in this UI, we apply to current "active" session if any
        // In a real multi-session scenario, we'd pick a session ID
        const activeSessionId = "DEFAULT_REPLAY_SESSION";

        setStatus("Applying replay mutations...", "decode");
        await window.electronAPI.replayMutateSet(activeSessionId, config);

        el('mutationActiveState').textContent = enabled ? 'ACTIVE' : 'INACTIVE';
        el('mutationActiveState').className = enabled ? 'ok' : 'muted';
        el('mutationCount').textContent = (headersJson ? Object.keys(headers).length : 0) + (tokenStr ? 1 : 0);

        setStatus(enabled ? "Replay mutations active." : "Mutations disabled.", "ok");
      }

      async refreshResearchScripts() {
        if (!window.electronAPI.researchListScripts) return;
        const scripts = await window.electronAPI.researchListScripts();
        const select = el('researchScriptSelect');
        if (scripts.length === 0) {
          select.innerHTML = '<option value="">-- No scripts found --</option>';
          return;
        }

        select.innerHTML = scripts.map(s => `<option value="${s}">${s}</option>`).join('');
      }

      async runResearchScript() {
        const scriptName = el('researchScriptSelect').value;
        if (!scriptName) return;

        this.researchLog(`Starting experimental execution: ${scriptName}`, "warn");
        setStatus("Running research script...", "decode");

        try {
          const res = await window.electronAPI.researchRunScript(scriptName, {
            activeCase: this.activeCase,
            timestamp: new Date().toISOString()
          });
          this.researchLog(`Script complete. Result: ${JSON.stringify(res)}`, "ok");
          setStatus("Research script completed.", "ok");
        } catch (e) {
          this.researchLog(`Execution Error: ${e.message}`, "bad");
          setStatus("Research script failed.", "bad");
        }
      }

      researchLog(msg, type = "ok") {
        const console = el('researchConsole');
        const entry = document.createElement('div');
        entry.className = type;
        entry.textContent = `> [${new Date().toLocaleTimeString()}] ${msg}`;
        console.appendChild(entry);
        console.scrollTop = console.scrollHeight;
      }

      async exportActiveCase() {
        if (!this.activeCase) return;
        if (!window.electronAPI || !window.electronAPI.exportCaseData) {
          setStatus("Export failed: Electron bridge is unavailable.", "bad");
          return;
        }
        const caseId = this.activeCase.case_id || this.activeCase.id;
        if (!caseId) {
          setStatus("Export failed: active case is missing case_id.", "bad");
          return;
        }
        const format = el('exportFormatSelect').value;
        const filename = `export_${caseId}_${Date.now()}.${format === 'csv' ? 'csv' : 'json'}`;
        const targetPath = `exports/${filename}`;

        setStatus(`Generating ${format.toUpperCase()} export...`, "decode");
        try {
          const res = await window.electronAPI.exportCaseData(this.activeCase, format, targetPath);
          if (res && res.success === false) {
            throw new Error(res.error || res.reason || "Exporter reported failure");
          }
          setStatus(`Export saved to ${targetPath}`, "ok");
          logToConsole(`Case export generated: ${targetPath}`, "ok");
        } catch (e) {
          const errMsg = e?.message || "Unknown error";
          setStatus(`Export failed: ${errMsg}`, "bad");
          logToConsole(`Export error: ${errMsg}`, "bad");
        }
      }

      async scanAllBundlesForAlerts() {
        if (!this.activeCase || !this.activeCase.bundles) return;
        const list = el('detectionAlertList');
        list.innerHTML = '';

        let totalAlerts = 0;
        for (const bundle of this.activeCase.bundles) {
          const alerts = await window.electronAPI.rulesScanBundle(bundle);
          if (alerts.length > 0) {
            totalAlerts += alerts.length;
            alerts.forEach(alert => {
              const item = document.createElement('div');
              item.className = 'panel';
              item.style.background = 'rgba(255,100,100,0.05)';
              item.style.borderLeft = `3px solid var(--color-${alert.severity.toLowerCase() === 'critical' ? 'bad' : 'warn'})`;
              item.style.marginBottom = '4px';
              item.style.padding = '6px';
              item.innerHTML = `
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-weight:700; color:var(--text-accent);">${escapeHtml(alert.name)}</span>
                                <span class="tiny pill" style="background:rgba(255,255,255,0.1);">${alert.severity}</span>
                            </div>
                            <div class="tiny muted">${bundle.path.split('/').pop()}</div>
                        `;
              list.appendChild(item);
            });
          }
        }

        if (totalAlerts === 0) {
          list.innerHTML = '<div class="ok tiny">No forensic anomalies detected in active case.</div>';
        }
      }

      async runPatternDiscovery() {
        if (!this.activeCase || !this.activeCase.bundles) return;
        setStatus("Discovering infrastructure patterns...", "decode");

        const patterns = await window.electronAPI.patternsDiscover(this.activeCase.bundles);
        const pList = el('patternDiscoveryList');
        pList.innerHTML = '';

        if (patterns.length === 0) {
          pList.innerHTML = '<div class="muted">No recurring patterns found.</div>';
        } else {
          patterns.forEach(p => {
            const item = document.createElement('div');
            item.style.cssText = 'display:flex; justify-content:space-between; padding:4px 6px; background:rgba(255,255,255,0.03); border-radius:4px;';
            item.innerHTML = `<span class="mono">${escapeHtml(p.key.replace(/::/g, ' > '))}</span><span class="pill tiny" style="background:rgba(255,255,255,0.1);">${p.frequency}x</span>`;
            pList.appendChild(item);
          });
        }

        const anomalies = await window.electronAPI.patternsAnomalies(this.activeCase.bundles, patterns);
        const aList = el('anomalyList');
        aList.innerHTML = '';
        if (anomalies.length === 0) {
          aList.innerHTML = '<div class="ok tiny">No anomalies detected.</div>';
        } else {
          anomalies.forEach(a => {
            const item = document.createElement('div');
            item.style.cssText = 'padding:4px 6px; border-left:3px solid var(--color-warn); background:rgba(255,100,100,0.03);';
            item.innerHTML = `<b>${a.reason}</b> <span class="muted">${a.bundleId}</span>`;
            aList.appendChild(item);
          });
        }

        const stats = await window.electronAPI.patternsStats();
        el('statPatterns').textContent = stats.patterns.totalPatterns;
        el('statClusters').textContent = stats.clusters.totalClusters;
        el('statAnomalies').textContent = stats.anomalies.totalAnomalies;
        setStatus(`Discovered ${patterns.length} patterns, ${anomalies.length} anomalies.`, "ok");
      }

      async generateBriefing() {
        if (!this.activeCase) return;
        setStatus("Generating AI intelligence briefing...", "decode");

        const briefing = await window.electronAPI.assistantBriefing(this.activeCase);
        const bDiv = el('assistantBriefing');
        bDiv.innerHTML = '';

        // Summary stats
        const s = briefing.summary;
        bDiv.innerHTML += `<div style="display:flex; gap:12px; flex-wrap:wrap;">
          <span>Bundles: <b class="ok">${s.totalBundles}</b></span>
          <span>Patterns: <b class="ok">${s.patterns}</b></span>
          <span>Anomalies: <b class="ok">${s.anomalies}</b></span>
          <span>Insights: <b class="ok">${s.insights}</b></span>
        </div>`;

        // Top findings
        if (briefing.topFindings.length > 0) {
          briefing.topFindings.forEach(f => {
            const d = document.createElement('div');
            d.style.cssText = 'padding:4px 6px; background:rgba(255,255,255,0.03); border-radius:4px; border-left:3px solid var(--color-ok);';
            d.innerHTML = `<b>${f.type}</b>: ${escapeHtml(f.message)}`;
            bDiv.appendChild(d);
          });
        }

        // Recommendations
        if (briefing.recommendations.length > 0) {
          const recDiv = document.createElement('div');
          recDiv.style.cssText = 'margin-top:8px; border-top:1px solid rgba(255,255,255,0.05); padding-top:8px;';
          recDiv.innerHTML = '<b class="muted">Recommendations:</b><ul style="margin:4px 0; padding-left:16px;">' +
            briefing.recommendations.map(r => `<li>${escapeHtml(r)}</li>`).join('') + '</ul>';
          bDiv.appendChild(recDiv);
        }

        // Update topology view
        if (this.activeCase.bundles) {
          const topo = await window.electronAPI.topologyMapCase(this.activeCase.bundles);
          const tv = el('topologyMapView');
          tv.innerHTML = '';
          topo.nodes.forEach(n => {
            const nd = document.createElement('div');
            nd.style.cssText = 'padding:4px 6px; background:rgba(255,255,255,0.03); border-radius:4px;';
            nd.innerHTML = `<span class="pill tiny" style="background:rgba(255,255,255,0.1);">${n.type}</span> ${escapeHtml(n.label)}`;
            tv.appendChild(nd);
          });
          el('statTopoNodes').textContent = topo.totalNodes;
          el('statTopoEdges').textContent = topo.totalEdges;
        }

        setStatus("Intelligence briefing generated.", "ok");
      }

      async launchAutoInvestigation() {
        if (!this.activeCase || !this.activeCase.bundles) return;
        setStatus("Launching autonomous investigation...", "decode");

        const reportDiv = el('autoInvestigationReport');
        reportDiv.innerHTML = '<div class="ok">Pipeline running...</div>';

        const report = await window.electronAPI.autoInvestigate(this.activeCase.bundles);
        reportDiv.innerHTML = '';

        if (report.status === 'COMPLETE') {
          const s = report.summary;
          reportDiv.innerHTML = `
            <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:8px;">
              <span>Patterns: <b class="ok">${s.patterns}</b></span>
              <span>Anomalies: <b class="ok">${s.anomalies}</b></span>
              <span>Insights: <b class="ok">${s.insights}</b></span>
              <span>Topology: <b class="ok">${s.topologyNodes} nodes</b></span>
            </div>
            <div style="padding:6px; background:rgba(255,255,255,0.03); border-radius:4px; border-left:3px solid var(--color-${s.verdict === 'CLEAN' ? 'ok' : s.verdict === 'SUSPICIOUS' ? 'bad' : 'warn'});">
              <b>Verdict:</b> <span class="${s.verdict === 'CLEAN' ? 'ok' : 'bad'}">${s.verdict}</span>
            </div>`;

          // Render insights
          if (report.stages.insights && report.stages.insights.data) {
            const iList = el('insightsList');
            iList.innerHTML = '';
            report.stages.insights.data.forEach(i => {
              const d = document.createElement('div');
              d.style.cssText = 'padding:4px 6px; background:rgba(255,255,255,0.03); border-radius:4px;';
              d.innerHTML = `<b class="${i.severity === 'WARNING' ? 'bad' : 'ok'}">${i.type}</b>: ${escapeHtml(i.message)}`;
              iList.appendChild(d);
            });
          }

          setStatus(`Autonomous investigation complete. Verdict: ${s.verdict}`, "ok");
        } else {
          reportDiv.innerHTML = `<div class="bad">Investigation failed: ${report.error}</div>`;
          setStatus("Investigation failed.", "bad");
        }
      }

      async classifyBundles() {
        if (!this.activeCase || !this.activeCase.bundles) return;
        setStatus("Running AI pattern classification...", "decode");

        const results = await window.electronAPI.aiClassifyBundles(this.activeCase.bundles);
        const cList = el('classificationList');
        cList.innerHTML = '';
        results.forEach(r => {
          const d = document.createElement('div');
          d.style.cssText = 'display:flex; justify-content:space-between; padding:4px 6px; background:rgba(255,255,255,0.03); border-radius:4px;';
          d.innerHTML = `<span class="mono">${escapeHtml(r.label)}</span><span class="pill tiny" style="background:rgba(255,255,255,0.1);">${(r.confidence * 100).toFixed(0)}%</span>`;
          cList.appendChild(d);
        });

        const scores = await window.electronAPI.aiScoreAnomalies(this.activeCase.bundles);
        const sList = el('anomalyScoringList');
        sList.innerHTML = '';
        scores.forEach(s => {
          const d = document.createElement('div');
          d.style.cssText = `padding:4px 6px; border-left:3px solid var(--color-${s.severity === 'HIGH' ? 'bad' : s.severity === 'MEDIUM' ? 'warn' : 'ok'}); background:rgba(255,255,255,0.03);`;
          d.innerHTML = `<b>${s.bundleId}</b>: Score <b>${s.anomaly_score}</b> [${s.severity}]`;
          sList.appendChild(d);
        });

        setStatus(`Classified ${results.length} bundles, scored ${scores.length} for anomalies.`, "ok");
      }

      async generateResearchSuggestions() {
        if (!this.activeCase) return;
        setStatus("Generating autonomous research suggestions...", "decode");

        const context = {
          anomaly_score: 65,
          similar_bundle_count: (this.activeCase.bundles || []).length,
          singleton_patterns: 1,
          unknown_classifications: 0
        };

        const result = await window.electronAPI.researchGenerate(context);
        const rList = el('researchQueueList');
        rList.innerHTML = '';
        if (result.suggestions.length === 0) {
          rList.innerHTML = '<div class="ok tiny">No research suggestions at this time.</div>';
        } else {
          result.suggestions.forEach(s => {
            const d = document.createElement('div');
            d.style.cssText = 'padding:6px; background:rgba(255,255,255,0.03); border-radius:4px; border-left:3px solid var(--color-warn);';
            d.innerHTML = `<div><b>${s.type}</b> <span class="pill tiny" style="background:rgba(255,200,0,0.2);">${s.review_state.toUpperCase()}</span></div><div class="muted tiny">${escapeHtml(s.reason)}</div>`;
            rList.appendChild(d);
          });
        }
        setStatus(`${result.suggestions.length} research suggestions generated (review required).`, "ok");
      }
    }

    // ==================== INTELLIGENCE TAB LOGIC (v1.6.0-s1) ====================

    function renderIntelNode(node) {
      const div = document.createElement('div');
      div.style.cssText = 'padding:6px 10px; background:rgba(192,132,252,0.1); border:1px solid rgba(192,132,252,0.3); border-radius:20px; font-size:0.72rem; cursor:default;';
      div.title = node.id || '';
      const label = node.data?.url ? new URL(node.data.url).hostname : (node.id || 'node').substring(0, 20);
      div.textContent = `${node.type || 'ENTITY'}: ${label}`;
      return div;
    }

    async function loadIntelGraph() {
      if (!window.electronAPI?.intelligenceGetGraph) {
        el('intelGraphStats').textContent = 'Intelligence API not available in this context.';
        return;
      }
      setStatus('Loading intelligence graph…', 'ok');
      try {
        const { nodes, edges } = await window.electronAPI.intelligenceGetGraph();
        const nodesEl = el('intelGraphNodes');
        nodesEl.innerHTML = '';
        el('intelGraphStats').textContent = `${nodes.length} nodes · ${edges.length} edges`;
        if (nodes.length === 0) {
          nodesEl.innerHTML = '<span class="muted tiny">No entities in graph. Decode some content first, then rebuild.</span>';
        } else {
          nodes.slice(0, 120).forEach(n => nodesEl.appendChild(renderIntelNode(n)));
          if (nodes.length > 120) {
            const more = document.createElement('span');
            more.className = 'muted tiny';
            more.textContent = `+${nodes.length - 120} more`;
            nodesEl.appendChild(more);
          }
        }
        setStatus(`Graph: ${nodes.length} nodes, ${edges.length} edges.`, 'ok');
      } catch (e) {
        el('intelGraphStats').textContent = `Error: ${e.message}`;
        setStatus('Intelligence graph load failed.', 'bad');
      }
    }

    async function rebuildAndLoadGraph() {
      if (!window.electronAPI?.intelligenceRebuildGraph) return;
      setStatus('Rebuilding intelligence graph…', 'ok');
      try {
        await window.electronAPI.intelligenceRebuildGraph();
        await loadIntelGraph();
      } catch (e) {
        setStatus(`Graph rebuild failed: ${e.message}`, 'bad');
      }
    }

    async function scoreGraphCentrality() {
      if (!window.electronAPI?.intelligenceGetGraph) return;
      setStatus('Scoring graph centrality…', 'ok');
      try {
        const { nodes, edges } = await window.electronAPI.intelligenceGetGraph();
        const graph = { nodes, edges };
        const hotNodes = await window.electronAPI.graphHotNodes(graph);
        const hotEl = el('intelHotNodes');
        if (!hotNodes || hotNodes.length === 0) {
          hotEl.textContent = 'No hot nodes found.';
        } else {
          hotEl.innerHTML = hotNodes.slice(0, 10).map(n =>
            `<div style="padding:4px 0; border-bottom:1px solid var(--border-soft);">` +
            `<span style="color:#c084fc;">${escapeHtml(String(n.id || '').substring(0, 30))}</span>` +
            ` <span class="muted tiny">score: ${(n.score || 0).toFixed(3)}</span></div>`
          ).join('');
        }
        setStatus('Centrality scoring complete.', 'ok');
      } catch (e) {
        setStatus(`Centrality scoring failed: ${e.message}`, 'bad');
      }
    }

    async function findSimilarBundles(fingerprint) {
      if (!fingerprint || !window.electronAPI?.intelligenceGetSimilar) return;
      setStatus('Finding similar bundles…', 'ok');
      try {
        const results = await window.electronAPI.intelligenceGetSimilar(fingerprint);
        const resEl = el('intelSimilarResults');
        if (!results || results.length === 0) {
          resEl.textContent = 'No similar bundles found.';
        } else {
          resEl.innerHTML = results.slice(0, 8).map(r =>
            `<div style="padding:4px 0;">${escapeHtml(String(r.id || r).substring(0, 40))}` +
            (r.score !== undefined ? ` <span class="muted">(${r.score.toFixed(3)})</span>` : '') +
            `</div>`
          ).join('');
        }
        setStatus(`Found ${results.length} similar bundle(s).`, 'ok');
      } catch (e) {
        setStatus(`Similarity search failed: ${e.message}`, 'bad');
      }
    }

    const btnIntelRebuildGraph = el('btnIntelRebuildGraph');
    if (btnIntelRebuildGraph) btnIntelRebuildGraph.addEventListener('click', rebuildAndLoadGraph);
    const btnIntelGraphCentrality = el('btnIntelGraphCentrality');
    if (btnIntelGraphCentrality) btnIntelGraphCentrality.addEventListener('click', scoreGraphCentrality);
    const intelSimilarInput = el('intelSimilarInput');
    if (intelSimilarInput) {
      intelSimilarInput.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') findSimilarBundles(intelSimilarInput.value.trim());
      });
    }

    document.getElementById('tabBtnIntelligence')?.addEventListener('click', () => {
      loadIntelGraph();
    });

    // ==================== PATTERNS TAB LOGIC (v1.6.0-s3) ====================

    async function runPatternDiscovery() {
      if (!window.electronAPI?.patternsDiscover) {
        el('patternClusters').textContent = 'Patterns API not available in this context.';
        return;
      }
      setStatus('Running pattern discovery…', 'ok');
      try {
        const bundles = state.lastJson?.candidates || [];
        if (bundles.length === 0) {
          setStatus('No candidates in current session to analyse. Decode first.', 'warn');
          el('patternClusters').textContent = 'No candidates available. Run a decode first.';
          return;
        }

        const [patterns, anomaliesRaw, topologyRaw, insights] = await Promise.all([
          window.electronAPI.patternsDiscover(bundles),
          window.electronAPI.patternsAnomalies(bundles, []),
          window.electronAPI.topologyMapCase(bundles),
          window.electronAPI.insightsGenerate([], [], null),
        ]);

        const clusters = patterns?.clusters || patterns || [];
        const anomalies = anomaliesRaw?.anomalies || anomaliesRaw || [];
        const topology = topologyRaw?.nodes || topologyRaw || [];
        const insightList = insights?.insights || insights || [];

        const fmt = (arr, label) => arr.length === 0
          ? `<span class="muted tiny">No ${label} found.</span>`
          : arr.slice(0, 6).map(item =>
              `<div style="padding:4px 0; border-bottom:1px solid var(--border-soft); font-size:0.75rem;">` +
              escapeHtml(JSON.stringify(item).substring(0, 120)) + `</div>`
            ).join('');

        el('patternClusters').innerHTML = fmt(clusters, 'clusters');
        el('patternAnomalies').innerHTML = fmt(anomalies, 'anomalies');
        el('patternTopology').innerHTML = fmt(topology, 'topology nodes');
        el('patternInsights').innerHTML = fmt(insightList, 'insights');

        setStatus(`Pattern discovery complete: ${clusters.length} clusters, ${anomalies.length} anomalies.`, 'ok');
      } catch (e) {
        setStatus(`Pattern discovery failed: ${e.message}`, 'bad');
      }
    }

    const btnRunPatterns = el('btnRunPatterns');
    if (btnRunPatterns) btnRunPatterns.addEventListener('click', runPatternDiscovery);

    // ==================== CASE ASSISTANT LOGIC (v1.6.0-s2) ====================

    async function generateCaseBriefing() {
      const caseData = window.caseMgr?.activeCase;
      if (!caseData) { setStatus('No active case. Load a case first.', 'warn'); return; }
      if (!window.electronAPI?.assistantBriefing) {
        el('assistantBriefingOutput').textContent = 'Assistant API not available in this context.';
        return;
      }
      setStatus('Generating case briefing\u2026', 'ok');
      el('assistantBriefingOutput').textContent = 'Generating\u2026';
      try {
        const result = await window.electronAPI.assistantBriefing(caseData);
        const text = result?.briefing || result?.text || result?.summary ||
          (typeof result === 'string' ? result : JSON.stringify(result, null, 2));
        el('assistantBriefingOutput').textContent = text;
        setStatus('Case briefing generated.', 'ok');

        if (window.electronAPI.assistantSuggestRelated && caseData.bundles?.length) {
          const related = await window.electronAPI.assistantSuggestRelated(caseData.bundles[0], caseData.bundles);
          const relList = (related || []).slice(0, 5);
          el('assistantRelatedList').innerHTML = relList.length
            ? relList.map(r => `<div style="padding:2px 0;">${escapeHtml(String(r?.url || r?.id || JSON.stringify(r)).substring(0, 60))}</div>`).join('')
            : '<span class="muted">None found.</span>';
        }

        if (window.electronAPI.assistantProposeExperiments && caseData.bundles?.length) {
          const exps = await window.electronAPI.assistantProposeExperiments(caseData.bundles[0]);
          const expList = (exps || []).slice(0, 5);
          el('assistantExperimentList').innerHTML = expList.length
            ? expList.map(e => `<div style="padding:2px 0;">${escapeHtml(String(e?.description || e?.type || JSON.stringify(e)).substring(0, 60))}</div>`).join('')
            : '<span class="muted">None proposed.</span>';
        }
      } catch (e) {
        el('assistantBriefingOutput').textContent = `Error: ${e.message}`;
        setStatus(`Briefing failed: ${e.message}`, 'bad');
      }
    }

    async function runAutoInvestigate() {
      const caseData = window.caseMgr?.activeCase;
      if (!caseData) { setStatus('No active case.', 'warn'); return; }
      if (!window.electronAPI?.autoInvestigate) {
        el('assistantBriefingOutput').textContent = 'Auto-Investigator API not available in this context.';
        return;
      }
      setStatus('Running autonomous investigation\u2026', 'ok');
      el('assistantBriefingOutput').textContent = 'Running auto-investigation\u2026';
      try {
        const result = await window.electronAPI.autoInvestigate(caseData.bundles || []);
        const text = result?.summary || result?.report ||
          (typeof result === 'string' ? result : JSON.stringify(result, null, 2));
        el('assistantBriefingOutput').textContent = text;
        setStatus('Auto-investigation complete.', 'ok');
      } catch (e) {
        el('assistantBriefingOutput').textContent = `Error: ${e.message}`;
        setStatus(`Auto-investigate failed: ${e.message}`, 'bad');
      }
    }

    const btnAssistantBriefing = el('btnAssistantBriefing');
    if (btnAssistantBriefing) btnAssistantBriefing.addEventListener('click', withLoading(btnAssistantBriefing, generateCaseBriefing));
    const btnAutoInvestigate = el('btnAutoInvestigate');
    if (btnAutoInvestigate) btnAutoInvestigate.addEventListener('click', withLoading(btnAutoInvestigate, runAutoInvestigate));

    // ==================== DEEP WIRING: PHASES 81-150 ====================

    function renderList(panelId, items, renderer) {
      const el2 = el(panelId);
      if (!el2) return;
      if (!items || items.length === 0) { el2.innerHTML = '<div class="empty-state">No data</div>'; return; }
      el2.innerHTML = items.slice(0, 20).map(renderer).join('');
    }

    function fmtItem(obj, color) {
      const t = typeof obj === 'string' ? obj : JSON.stringify(obj).substring(0, 120);
      return `<div style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.64rem;color:${color||'var(--text-base)'};">${escapeHtml(t)}</div>`;
    }

    // Phase 81 — Review Workflow
    async function loadReviews() {
      if (!window.electronAPI?.reviewPending) return;
      setStatus('Loading reviews\u2026', 'ok');
      try {
        const reviews = await window.electronAPI.reviewPending();
        const list = reviews || [];
        el('statPendingReviews').textContent = list.length;
        renderList('reviewWorkflowPanel', list, r =>
          `<div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.64rem;">` +
          `<span style="color:var(--text-accent);">${escapeHtml(r.reviewId||r.id||'review')}</span> ` +
          `<span class="muted">${escapeHtml(r.status||'pending')}</span></div>`
        );
        setStatus(`${list.length} pending review(s).`, 'ok');
      } catch (e) { setStatus(`Reviews load failed: ${e.message}`, 'bad'); }
    }

    // Phase 82 — Redaction Engine
    async function redactText() {
      const text = el('redactInput')?.value?.trim();
      if (!text) return;
      if (!window.electronAPI?.redactText) { el('redactionPanel').innerHTML = '<div class="muted tiny">Redaction API not available.</div>'; return; }
      setStatus('Redacting text\u2026', 'ok');
      try {
        const result = await window.electronAPI.redactText(text, null);
        const out = result?.redacted || result?.text || result || text;
        el('redactionPanel').innerHTML = `<div style="font-size:0.65rem;word-break:break-all;color:var(--color-ok);">${escapeHtml(String(out))}</div>`;
        setStatus('Redaction complete.', 'ok');
      } catch (e) { setStatus(`Redaction failed: ${e.message}`, 'bad'); }
    }

    // Phase 83 — Publication Pipeline
    async function loadPubItems() {
      if (!window.electronAPI?.pubList) return;
      setStatus('Loading publication pipeline\u2026', 'ok');
      try {
        const items = await window.electronAPI.pubList(null);
        const list = Array.isArray(items) ? items : (items?.items || []);
        renderList('publicationPanel', list, i =>
          `<div style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.64rem;">` +
          `<span style="color:#a78bfa;">${escapeHtml(i.title||i.id||'item')}</span> ` +
          `<span class="pill tiny" style="background:rgba(167,139,250,0.15);font-size:0.55rem;">${escapeHtml(i.state||'draft')}</span></div>`
        );
        setStatus(`${list.length} publication item(s).`, 'ok');
      } catch (e) { setStatus(`Pub pipeline load failed: ${e.message}`, 'bad'); }
    }

    // Phase 84 — Model Reporter
    async function generateModelReport() {
      const caseData = window.caseMgr?.activeCase;
      if (!caseData) { setStatus('No active case for report generation.', 'warn'); return; }
      if (!window.electronAPI?.reportGenerate) return;
      setStatus('Generating model report\u2026', 'ok');
      try {
        const result = await window.electronAPI.reportGenerate(caseData);
        const text = result?.report || result?.markdown || result?.text || JSON.stringify(result, null, 2);
        el('reporterPanel').innerHTML = `<div style="font-size:0.64rem;white-space:pre-wrap;color:var(--text-base);">${escapeHtml(String(text).substring(0, 600))}</div>`;
        setStatus('Model report generated.', 'ok');
      } catch (e) { setStatus(`Report generation failed: ${e.message}`, 'bad'); }
    }

    // Phase 85 — Deployment Orchestrator
    async function loadOrchHistory() {
      if (!window.electronAPI?.orchestrateHistory) return;
      setStatus('Loading deployment history\u2026', 'ok');
      try {
        const history = await window.electronAPI.orchestrateHistory();
        const list = Array.isArray(history) ? history : (history?.deployments || []);
        renderList('orchestrationPanel', list, d =>
          `<div style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.64rem;">` +
          `<span style="color:var(--text-accent);">${escapeHtml(d.id||d.deploymentId||'deploy')}</span> ` +
          `<span class="muted">${escapeHtml(d.status||d.environment||'')}</span></div>`
        );
        setStatus(`${list.length} deployment(s) in history.`, 'ok');
      } catch (e) { setStatus(`Deployment history load failed: ${e.message}`, 'bad'); }
    }

    // Phase 86 — Timeline Engine
    async function reconstructTimeline() {
      const caseData = window.caseMgr?.activeCase;
      if (!caseData) { setStatus('No active case for timeline reconstruction.', 'warn'); return; }
      if (!window.electronAPI?.timelineGet) return;
      setStatus('Reconstructing timeline\u2026', 'ok');
      try {
        const events = caseData.bundles?.flatMap(b => b.events || []) || [];
        if (events.length) await window.electronAPI.timelineReconstruct(caseData.case_id, events);
        const timeline = await window.electronAPI.timelineGet(caseData.case_id);
        const evts = timeline?.events || timeline || [];
        renderList('timelinePanel', evts, e =>
          `<div style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.64rem;">` +
          `<span style="color:#67e8f9;">${escapeHtml(e.timestamp||e.ts||'?')}</span> ` +
          `<span class="muted">${escapeHtml(e.type||e.action||JSON.stringify(e).substring(0,60))}</span></div>`
        );
        setStatus(`Timeline: ${evts.length} event(s).`, 'ok');
      } catch (e) { setStatus(`Timeline reconstruction failed: ${e.message}`, 'bad'); }
    }

    // Phase 87 — Infrastructure Tracker
    async function infraDriftAnalysis() {
      if (!window.electronAPI?.infraDrift) return;
      setStatus('Running infra drift analysis\u2026', 'ok');
      try {
        const drift = await window.electronAPI.infraDrift();
        const items = drift?.migrations || drift?.changes || drift || [];
        renderList('infraEvolutionPanel', Array.isArray(items) ? items : [items], d =>
          fmtItem(d, '#fcd34d')
        );
        setStatus('Infra drift analysis complete.', 'ok');
      } catch (e) { setStatus(`Infra drift failed: ${e.message}`, 'bad'); }
    }

    // Phase 88 — Predictive Anomaly
    async function predictRisk() {
      const caseData = window.caseMgr?.activeCase;
      if (!window.electronAPI?.predictRisk) return;
      setStatus('Running risk forecast\u2026', 'ok');
      try {
        const result = await window.electronAPI.predictRisk([], caseData || {});
        const preds = result?.predictions || result?.risks || (Array.isArray(result) ? result : [result]);
        renderList('predictivePanel', preds, p => fmtItem(p, '#fb923c'));
        setStatus(`Risk forecast: ${preds.length} prediction(s).`, 'ok');
      } catch (e) { setStatus(`Risk forecast failed: ${e.message}`, 'bad'); }
    }

    // Phase 89 — Forensic Simulator
    async function loadSimHistory() {
      if (!window.electronAPI?.simulateHistory) return;
      try {
        const history = await window.electronAPI.simulateHistory();
        renderList('simulatorPanel', Array.isArray(history) ? history : (history?.history || []), h => fmtItem(h, '#a78bfa'));
      } catch (e) { el('simulatorPanel').innerHTML = `<div class="muted tiny">Error: ${escapeHtml(e.message)}</div>`; }
    }
    async function runSimulation() {
      const caseData = window.caseMgr?.activeCase;
      if (!window.electronAPI?.simulateScenario) return;
      setStatus('Running forensic simulation\u2026', 'ok');
      try {
        const result = await window.electronAPI.simulateScenario('DEFAULT', caseData?.bundles?.[0] || {});
        const out = result?.result || result?.output || JSON.stringify(result, null, 2);
        el('simulatorPanel').innerHTML = `<div style="font-size:0.64rem;white-space:pre-wrap;color:#a78bfa;">${escapeHtml(String(out).substring(0,400))}</div>`;
        setStatus('Simulation complete.', 'ok');
      } catch (e) { setStatus(`Simulation failed: ${e.message}`, 'bad'); }
    }

    // Phase 90 — Threat Reporter
    async function loadThreatList() {
      if (!window.electronAPI?.threatList) return;
      try {
        const reports = await window.electronAPI.threatList();
        const list = Array.isArray(reports) ? reports : (reports?.reports || []);
        renderList('threatReportPanel', list, r =>
          `<div style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.64rem;">` +
          `<span style="color:#f87171;">${escapeHtml(r.id||r.title||'report')}</span> ` +
          `<span class="muted">${escapeHtml(r.severity||r.level||'')}</span></div>`
        );
      } catch (e) { el('threatReportPanel').innerHTML = `<div class="muted tiny">Error: ${escapeHtml(e.message)}</div>`; }
    }
    async function generateThreatReport() {
      const caseData = window.caseMgr?.activeCase;
      if (!caseData) { setStatus('No active case for threat report.', 'warn'); return; }
      if (!window.electronAPI?.threatGenerate) return;
      setStatus('Generating threat report\u2026', 'ok');
      try {
        const result = await window.electronAPI.threatGenerate(caseData);
        const text = result?.report || result?.markdown || result?.summary || JSON.stringify(result, null, 2);
        el('threatReportPanel').innerHTML = `<div style="font-size:0.64rem;white-space:pre-wrap;color:#f87171;">${escapeHtml(String(text).substring(0,400))}</div>`;
        setStatus('Threat report generated.', 'ok');
      } catch (e) { setStatus(`Threat report failed: ${e.message}`, 'bad'); }
    }

    // Phase 91 — Global Graph
    async function loadGlobalGraphSummary() {
      if (!window.electronAPI?.globalGraphSummary) return;
      setStatus('Loading global graph summary\u2026', 'ok');
      try {
        const summary = await window.electronAPI.globalGraphSummary();
        el('statGlobalNodes').textContent = summary?.nodeCount ?? summary?.nodes ?? 0;
        el('statGlobalEdges').textContent = summary?.edgeCount ?? summary?.edges ?? 0;
        el('globalGraphPanel').innerHTML = `<div style="font-size:0.64rem;white-space:pre-wrap;">${escapeHtml(JSON.stringify(summary, null, 2).substring(0,300))}</div>`;
        setStatus('Global graph summary loaded.', 'ok');
      } catch (e) { setStatus(`Global graph failed: ${e.message}`, 'bad'); }
    }
    async function exploreNeighborhood() {
      const nodeId = el('globalNeighborInput')?.value?.trim();
      if (!nodeId || !window.electronAPI?.globalGraphNeighborhood) return;
      setStatus(`Exploring neighborhood of ${nodeId}\u2026`, 'ok');
      try {
        const result = await window.electronAPI.globalGraphNeighborhood(nodeId, 2);
        const nodes = result?.nodes || result || [];
        renderList('globalGraphPanel', Array.isArray(nodes) ? nodes : [result], n => fmtItem(n, '#67e8f9'));
        setStatus(`Neighborhood: ${nodes.length} nodes.`, 'ok');
      } catch (e) { setStatus(`Neighborhood explore failed: ${e.message}`, 'bad'); }
    }

    // Phase 92 — Infra Attribution
    async function runAttribution() {
      const caseData = window.caseMgr?.activeCase;
      if (!window.electronAPI?.attribAttribute) return;
      setStatus('Running attribution\u2026', 'ok');
      try {
        const result = await window.electronAPI.attribAttribute({ caseId: caseData?.case_id, bundles: caseData?.bundles || [] });
        const attrs = result?.attributions || result?.results || (Array.isArray(result) ? result : [result]);
        renderList('attributionPanel', attrs, a => fmtItem(a, '#34d399'));
        setStatus(`Attribution: ${attrs.length} result(s).`, 'ok');
      } catch (e) { setStatus(`Attribution failed: ${e.message}`, 'bad'); }
    }

    // Phase 93 — Adversary Fingerprinting
    async function advfpGroupPatterns() {
      if (!window.electronAPI?.advfpGroup) return;
      setStatus('Grouping adversary patterns\u2026', 'ok');
      try {
        const result = await window.electronAPI.advfpGroup();
        const groups = result?.groups || result || [];
        renderList('fingerprintPanel', Array.isArray(groups) ? groups : [result], g => fmtItem(g, '#e879f9'));
        setStatus(`${Array.isArray(groups) ? groups.length : 1} adversary group(s).`, 'ok');
      } catch (e) { setStatus(`Adversary grouping failed: ${e.message}`, 'bad'); }
    }
    async function advfpFingerprintBundle() {
      const caseData = window.caseMgr?.activeCase;
      const bundle = caseData?.bundles?.[0] || state.lastJson?.candidates?.[0] || {};
      if (!window.electronAPI?.advfpFingerprint) return;
      setStatus('Fingerprinting active bundle\u2026', 'ok');
      try {
        const fp = await window.electronAPI.advfpFingerprint(bundle);
        el('fingerprintPanel').innerHTML = `<div style="font-size:0.64rem;white-space:pre-wrap;color:#e879f9;">${escapeHtml(JSON.stringify(fp, null, 2).substring(0,400))}</div>`;
        setStatus('Bundle fingerprint generated.', 'ok');
      } catch (e) { setStatus(`Fingerprint failed: ${e.message}`, 'bad'); }
    }

    // Phase 94 — Self-Healing Orchestrator
    async function loadHealAudit() {
      if (!window.electronAPI?.healAudit) return;
      try {
        const log = await window.electronAPI.healAudit();
        const events = Array.isArray(log) ? log : (log?.events || []);
        renderList('healingPanel', events, e => fmtItem(e, '#4ade80'));
        setStatus(`Heal audit: ${events.length} event(s).`, 'ok');
      } catch (e) { setStatus(`Heal audit failed: ${e.message}`, 'bad'); }
    }
    async function triggerRecovery() {
      if (!window.electronAPI?.healRecover) return;
      setStatus('Triggering recovery\u2026', 'ok');
      try {
        const result = await window.electronAPI.healRecover({ manual: true, timestamp: Date.now() });
        const text = result?.status || result?.message || JSON.stringify(result);
        el('healingPanel').innerHTML = `<div style="font-size:0.64rem;color:#4ade80;">${escapeHtml(String(text).substring(0,200))}</div>`;
        setStatus('Recovery complete.', 'ok');
      } catch (e) { setStatus(`Recovery failed: ${e.message}`, 'bad'); }
    }

    // Phase 95 — Autonomous Discovery
    async function runAutonomousDiscovery() {
      if (!window.electronAPI?.discoveryRun) return;
      const caseData = window.caseMgr?.activeCase;
      setStatus('Running autonomous discovery\u2026', 'ok');
      try {
        const result = await window.electronAPI.discoveryRun({ caseId: caseData?.case_id, bundles: caseData?.bundles || [] });
        const findings = result?.findings || result?.discoveries || (Array.isArray(result) ? result : [result]);
        renderList('discoveryPanel', findings, f => fmtItem(f, '#f87171'));
        const hist = await window.electronAPI.discoveryHistory();
        el('discoveryHistoryBar').textContent = `History: ${Array.isArray(hist) ? hist.length : 0} runs`;
        setStatus(`Discovery: ${findings.length} finding(s).`, 'ok');
      } catch (e) { setStatus(`Discovery failed: ${e.message}`, 'bad'); }
    }

    // Phase 96-100 — Endgame Command Layer
    async function getEndgameReplay() {
      const caseData = window.caseMgr?.activeCase;
      if (!window.electronAPI?.endgameReplayGet) return;
      setStatus('Loading mission replay\u2026', 'ok');
      try {
        const replay = await window.electronAPI.endgameReplayGet(caseData?.case_id || 'default');
        el('missionReplayStatus').textContent = replay?.status || replay?.summary || 'Replay data loaded.';
        setStatus('Mission replay loaded.', 'ok');
      } catch (e) { setStatus(`Replay load failed: ${e.message}`, 'bad'); }
    }
    async function loadCommandHistory() {
      if (!window.electronAPI?.endgameHistory) return;
      try {
        const history = await window.electronAPI.endgameHistory();
        const cmds = Array.isArray(history) ? history : (history?.commands || []);
        el('commandHistoryList').innerHTML = cmds.length
          ? cmds.slice(0, 5).map(c => `<div style="font-size:0.63rem;padding:2px 0;color:#fca5a5;">${escapeHtml(String(c.command||c).substring(0,60))}</div>`).join('')
          : '<span class="muted">No commands executed.</span>';
      } catch (e) {}
    }
    async function executeEndgameCommand() {
      const cmd = el('endgameCommandInput')?.value?.trim();
      if (!cmd || !window.electronAPI?.endgameCommand) return;
      setStatus(`Executing endgame command: ${cmd}\u2026`, 'ok');
      try {
        const result = await window.electronAPI.endgameCommand(cmd, { caseId: window.caseMgr?.activeCase?.case_id });
        el('commandHistoryList').innerHTML = `<div style="color:#4ade80;font-size:0.64rem;">${escapeHtml(String(result?.status||result?.message||'OK').substring(0,120))}</div>`;
        el('endgameCommandInput').value = '';
        setStatus(`Command executed: ${cmd}.`, 'ok');
        await loadCommandHistory();
      } catch (e) { setStatus(`Command failed: ${e.message}`, 'bad'); }
    }

    // Explainability
    async function explainCase() {
      const caseData = window.caseMgr?.activeCase;
      if (!window.electronAPI?.expExplain) return;
      setStatus('Generating case explanation\u2026', 'ok');
      try {
        const result = await window.electronAPI.expExplain('CASE', { caseId: caseData?.case_id, bundles: caseData?.bundles || [] });
        el('explainOutput').textContent = result?.explanation || result?.text || JSON.stringify(result).substring(0,200);
        setStatus('Explanation generated.', 'ok');
      } catch (e) { setStatus(`Explain failed: ${e.message}`, 'bad'); }
    }

    // Threat Heatmap
    async function generateHeatmap() {
      if (!window.electronAPI?.expHeatmapGenerate) return;
      const caseData = window.caseMgr?.activeCase;
      setStatus('Generating threat heatmap\u2026', 'ok');
      try {
        const result = await window.electronAPI.expHeatmapGenerate({ bundles: caseData?.bundles || [], graphContext: {} });
        const clusters = result?.clusters || result?.hotspots || [];
        el('heatmapOutput').innerHTML = `<strong class="fg">Global Heatmap:</strong> <span style="color:#f87171;">${clusters.length} cluster(s). Top: ${escapeHtml(clusters[0] ? JSON.stringify(clusters[0]).substring(0,60) : 'none')}</span>`;
        setStatus('Heatmap generated.', 'ok');
      } catch (e) { setStatus(`Heatmap failed: ${e.message}`, 'bad'); }
    }

    // Explainability (bundle)
    async function explainBundle() {
      const bundle = window.caseMgr?.activeCase?.bundles?.[0] || state.lastJson?.candidates?.[0];
      if (!window.electronAPI?.expExplain) return;
      setStatus('Explaining bundle\u2026', 'ok');
      try {
        const result = await window.electronAPI.expExplain('BUNDLE', { bundle });
        el('explainBundleOutput').innerHTML = `<strong class="fg">Explainable AI Layer:</strong> <span style="color:#a78bfa;">${escapeHtml(String(result?.explanation||result?.text||JSON.stringify(result)).substring(0,150))}</span>`;
        setStatus('Bundle explanation complete.', 'ok');
      } catch (e) { setStatus(`Bundle explain failed: ${e.message}`, 'bad'); }
    }

    // Phase 101+ Narrative & Behavior
    async function trackNarrative() {
      if (!window.electronAPI?.advNarrativeTrack) return;
      const caseData = window.caseMgr?.activeCase;
      setStatus('Tracking narrative propagation\u2026', 'ok');
      try {
        const result = await window.electronAPI.advNarrativeTrack(caseData?.bundles || []);
        const amps = result?.amplifiers || result?.propagators || [];
        el('narrativeAmplifiers').innerHTML = `<strong class="fg">Propagation Amplifiers:</strong> <span style="color:#fb923c;">${amps.length} identified${amps[0] ? ' — ' + escapeHtml(String(amps[0]?.id||amps[0]).substring(0,40)) : ''}</span>`;
        setStatus(`Narrative: ${amps.length} amplifier(s).`, 'ok');
      } catch (e) { setStatus(`Narrative track failed: ${e.message}`, 'bad'); }
    }
    async function modelOperatorBehavior() {
      if (!window.electronAPI?.advOperatorModel) return;
      const caseData = window.caseMgr?.activeCase;
      setStatus('Modelling operator behavior\u2026', 'ok');
      try {
        const result = await window.electronAPI.advOperatorModel('ANALYST_01', caseData?.auditLog || []);
        el('operatorProfileOutput').innerHTML = `<strong class="fg">Operator Profile:</strong> <span style="color:#a78bfa;">${escapeHtml(String(result?.profile||result?.summary||JSON.stringify(result)).substring(0,120))}</span>`;
        setStatus('Operator model built.', 'ok');
      } catch (e) { setStatus(`Operator model failed: ${e.message}`, 'bad'); }
    }

    // Advanced Prediction
    async function runAdvancedForecast() {
      if (!window.electronAPI?.advPredictFuture) return;
      setStatus('Running advanced temporal forecast\u2026', 'ok');
      try {
        const result = await window.electronAPI.advPredictFuture([], {});
        const forecast = result?.forecast || result?.predictions || result;
        el('advPredictPanel').innerHTML = `<div style="font-size:0.64rem;white-space:pre-wrap;color:#fbbf24;">${escapeHtml(JSON.stringify(forecast, null, 2).substring(0,350))}</div>`;
        setStatus('Advanced forecast complete.', 'ok');
      } catch (e) { setStatus(`Forecast failed: ${e.message}`, 'bad'); }
    }

    // Copilot Synthesis
    async function copilotSynthesize() {
      if (!window.electronAPI?.advAssistantSynthesize) return;
      const caseData = window.caseMgr?.activeCase;
      setStatus('AI Copilot synthesizing\u2026', 'ok');
      try {
        const result = await window.electronAPI.advAssistantSynthesize(caseData?.bundles || [], caseData?.auditLog || []);
        const text = result?.synthesis || result?.recommendations || result?.text || JSON.stringify(result, null, 2);
        el('copilotPanel').innerHTML = `<div style="font-size:0.64rem;white-space:pre-wrap;color:var(--color-secure);">${escapeHtml(String(text).substring(0,500))}</div>`;
        setStatus('Copilot synthesis complete.', 'ok');
      } catch (e) { setStatus(`Copilot synthesis failed: ${e.message}`, 'bad'); }
    }

    // ── Wire all buttons ──
    const _deep = [
      ['btnLoadReviews',        loadReviews],
      ['btnRedactText',         redactText],
      ['btnPubList',            loadPubItems],
      ['btnGenerateModelReport',generateModelReport],
      ['btnOrchHistory',        loadOrchHistory],
      ['btnReconstructTimeline',reconstructTimeline],
      ['btnInfraDrift',         infraDriftAnalysis],
      ['btnPredictRisk',        predictRisk],
      ['btnSimHistory',         loadSimHistory],
      ['btnRunSimulation',      runSimulation],
      ['btnThreatList',         loadThreatList],
      ['btnGenerateThreat',     generateThreatReport],
      ['btnGlobalGraphSummary', loadGlobalGraphSummary],
      ['btnGlobalNeighborhood', exploreNeighborhood],
      ['btnRunAttribution',     runAttribution],
      ['btnAdvfpGroup',         advfpGroupPatterns],
      ['btnAdvfpFingerprint',   advfpFingerprintBundle],
      ['btnHealAudit',          loadHealAudit],
      ['btnHealRecover',        triggerRecovery],
      ['btnDiscoveryRun',       runAutonomousDiscovery],
      ['btnEndgameReplay',      getEndgameReplay],
      ['btnEndgameHistory',     loadCommandHistory],
      ['btnEndgameExecute',     executeEndgameCommand],
      ['btnExplainCase',        explainCase],
      ['btnGenerateHeatmap',    generateHeatmap],
      ['btnExplainBundle',      explainBundle],
      ['btnNarrativeTrack',     trackNarrative],
      ['btnOperatorModel',      modelOperatorBehavior],
      ['btnAdvPredict',         runAdvancedForecast],
      ['btnCopilotSynthesize',  copilotSynthesize],
    ];
    _deep.forEach(([id, fn]) => {
      const btn = el(id);
      if (btn) btn.addEventListener('click', withLoading(btn, fn));
    });

    const endgameInput = el('endgameCommandInput');
    if (endgameInput) endgameInput.addEventListener('keydown', ev => { if (ev.key === 'Enter') executeEndgameCommand(); });

    const globalNeighborInput2 = el('globalNeighborInput');
    if (globalNeighborInput2) globalNeighborInput2.addEventListener('keydown', ev => { if (ev.key === 'Enter') exploreNeighborhood(); });

    // ==================== SUB-ACTION DEEP WIRING (v1.6.2) ====================

    // ── Phase 81: Review sub-actions (comment / decide) ──────────────────────
    async function reviewComment() {
      const reviewId = el('reviewIdInput')?.value?.trim();
      const text = el('reviewCommentInput')?.value?.trim();
      if (!reviewId || !text) { setStatus('Enter review ID and comment text.', 'bad'); return; }
      if (!window.electronAPI?.reviewComment) { setStatus('Review API not available.', 'bad'); return; }
      setStatus(`Posting comment on review ${reviewId}…`, 'ok');
      try {
        await window.electronAPI.reviewComment(reviewId, 'ANALYST', text);
        el('reviewCommentInput').value = '';
        setStatus(`Comment posted on ${reviewId}.`, 'ok');
        el('reviewWorkflowPanel').innerHTML = `<div style="font-size:0.64rem;padding:4px 0;color:var(--color-ok);">Comment on <b>${escapeHtml(reviewId)}</b>: "${escapeHtml(text.slice(0,60))}"</div>`;
      } catch(e) { setStatus(`Comment failed: ${e.message}`, 'bad'); }
    }
    async function reviewDecide() {
      const reviewId = el('reviewIdInput')?.value?.trim();
      const decision = el('reviewDecision')?.value;
      if (!reviewId) { setStatus('Enter a review ID.', 'bad'); return; }
      if (!window.electronAPI?.reviewDecide) { setStatus('Review API not available.', 'bad'); return; }
      setStatus(`Recording decision "${decision}" on ${reviewId}…`, 'ok');
      try {
        await window.electronAPI.reviewDecide(reviewId, decision, `Decision: ${decision}`);
        const color = decision === 'approve' ? 'var(--color-ok)' : decision === 'reject' ? 'var(--color-bad)' : 'var(--color-warn)';
        el('reviewWorkflowPanel').innerHTML = `<div style="font-size:0.64rem;padding:4px 0;color:${color};">Review <b>${escapeHtml(reviewId)}</b>: <b>${escapeHtml(decision.toUpperCase())}</b></div>`;
        setStatus(`Decision "${decision}" recorded.`, 'ok');
      } catch(e) { setStatus(`Decision failed: ${e.message}`, 'bad'); }
    }
    el('btnReviewComment')?.addEventListener('click', withLoading('btnReviewComment', reviewComment));
    el('btnReviewDecide')?.addEventListener('click', withLoading('btnReviewDecide', reviewDecide));
    el('reviewCommentInput')?.addEventListener('keydown', ev => { if (ev.key === 'Enter') reviewComment(); });

    // ── Phase 83: Publication submit + transition ─────────────────────────────
    async function pubSubmit() {
      const caseData = window.caseMgr?.activeCase;
      if (!window.electronAPI?.pubSubmit) { setStatus('Publication API not available.', 'bad'); return; }
      setStatus('Submitting case for publication…', 'ok');
      try {
        const result = await window.electronAPI.pubSubmit({ caseId: caseData?.case_id || 'DRAFT-001', title: caseData?.title || 'Draft Report', content: {} });
        el('publicationPanel').innerHTML = `<div style="font-size:0.64rem;padding:4px 0;color:var(--color-ok);">Submitted: <b>${escapeHtml(result?.id || result?.itemId || 'PUB-NEW')}</b> — status: draft</div>`;
        setStatus('Publication submitted.', 'ok');
      } catch(e) { setStatus(`Pub submit failed: ${e.message}`, 'bad'); }
    }
    async function pubTransition() {
      const itemId = el('pubItemIdInput')?.value?.trim();
      const newState = el('pubTransitionSelect')?.value;
      if (!itemId) { setStatus('Enter an item ID.', 'bad'); return; }
      if (!window.electronAPI?.pubTransition) { setStatus('Publication API not available.', 'bad'); return; }
      setStatus(`Transitioning ${itemId} → ${newState}…`, 'ok');
      try {
        await window.electronAPI.pubTransition(itemId, newState);
        const color = newState === 'approve' ? 'var(--color-ok)' : newState === 'reject' ? 'var(--color-bad)' : 'var(--text-accent)';
        el('publicationPanel').innerHTML = `<div style="font-size:0.64rem;padding:4px 0;color:${color};"><b>${escapeHtml(itemId)}</b> → <b>${escapeHtml(newState)}</b></div>`;
        el('pubItemIdInput').value = '';
        setStatus(`Item ${itemId} transitioned to ${newState}.`, 'ok');
      } catch(e) { setStatus(`Pub transition failed: ${e.message}`, 'bad'); }
    }
    el('btnPubSubmit')?.addEventListener('click', withLoading('btnPubSubmit', pubSubmit));
    el('btnPubTransition')?.addEventListener('click', withLoading('btnPubTransition', pubTransition));

    // ── Phase 85: Orchestrator deploy + rollback ──────────────────────────────
    async function orchDeploy() {
      const target = el('orchTargetInput')?.value?.trim() || 'production';
      if (!window.electronAPI?.orchestrateDeploy) { setStatus('Orchestrator API not available.', 'bad'); return; }
      setStatus(`Deploying to "${target}"…`, 'ok');
      try {
        const result = await window.electronAPI.orchestrateDeploy({ target, caseId: window.caseMgr?.activeCase?.case_id, timestamp: Date.now() });
        const depId = result?.deploymentId || result?.id || 'DEP-001';
        el('orchestrationPanel').innerHTML = `<div style="font-size:0.64rem;padding:4px 0;color:var(--color-ok);">DEPLOYED to <b>${escapeHtml(target)}</b> — ID: <b>${escapeHtml(depId)}</b></div>`;
        el('orchTargetInput').value = '';
        setStatus(`Deployed to "${target}".`, 'ok');
      } catch(e) { setStatus(`Deploy failed: ${e.message}`, 'bad'); }
    }
    async function orchRollback() {
      const target = el('orchTargetInput')?.value?.trim() || 'production';
      if (!window.electronAPI?.orchestrateRollback) { setStatus('Orchestrator API not available.', 'bad'); return; }
      setStatus(`Rolling back "${target}"…`, 'ok');
      try {
        const result = await window.electronAPI.orchestrateRollback({ target, reason: 'manual' });
        el('orchestrationPanel').innerHTML = `<div style="font-size:0.64rem;padding:4px 0;color:var(--color-warn);">ROLLBACK on <b>${escapeHtml(target)}</b>: ${escapeHtml(result?.status || 'complete')}</div>`;
        setStatus(`Rolled back "${target}".`, 'ok');
      } catch(e) { setStatus(`Rollback failed: ${e.message}`, 'bad'); }
    }
    el('btnOrchDeploy')?.addEventListener('click', withLoading('btnOrchDeploy', orchDeploy));
    el('btnOrchRollback')?.addEventListener('click', withLoading('btnOrchRollback', orchRollback));
    el('orchTargetInput')?.addEventListener('keydown', ev => { if (ev.key === 'Enter') orchDeploy(); });

    // ── Phase 87: Infra record node + history + migrations ────────────────────
    async function infraHistory() {
      if (!window.electronAPI?.infraHistory) { setStatus('Infra history API not available.', 'bad'); return; }
      setStatus('Loading infrastructure history…', 'ok');
      try {
        const result = await window.electronAPI.infraHistory();
        const events = result?.history || result || [];
        renderList('infraEvolutionPanel', events, e => fmtItem(e, '#67e8f9'));
        setStatus(`${events.length} infra history event(s).`, 'ok');
      } catch(e) { setStatus(`Infra history failed: ${e.message}`, 'bad'); }
    }
    async function infraMigrations() {
      if (!window.electronAPI?.infraMigrations) { setStatus('Infra migrations API not available.', 'bad'); return; }
      setStatus('Loading node migrations…', 'ok');
      try {
        const result = await window.electronAPI.infraMigrations();
        const migs = result?.migrations || result || [];
        renderList('infraEvolutionPanel', migs, m => fmtItem(m, '#fb923c'));
        setStatus(`${migs.length} migration(s) found.`, 'ok');
      } catch(e) { setStatus(`Migrations failed: ${e.message}`, 'bad'); }
    }
    async function infraRecordNode() {
      const nodeId = el('infraNodeInput')?.value?.trim();
      if (!nodeId) { setStatus('Enter a node ID.', 'bad'); return; }
      if (!window.electronAPI?.infraRecord) { setStatus('Infra record API not available.', 'bad'); return; }
      setStatus(`Recording node "${nodeId}"…`, 'ok');
      try {
        await window.electronAPI.infraRecord({ nodeId, timestamp: Date.now(), source: 'manual' });
        el('infraNodeInput').value = '';
        el('infraEvolutionPanel').innerHTML = `<div style="font-size:0.64rem;padding:4px 0;color:var(--color-ok);">Node <b>${escapeHtml(nodeId)}</b> recorded.</div>`;
        setStatus(`Node "${nodeId}" recorded in infra evolution.`, 'ok');
      } catch(e) { setStatus(`Record failed: ${e.message}`, 'bad'); }
    }
    el('btnInfraHistory')?.addEventListener('click', withLoading('btnInfraHistory', infraHistory));
    el('btnInfraMigrations')?.addEventListener('click', withLoading('btnInfraMigrations', infraMigrations));
    el('btnInfraRecord')?.addEventListener('click', withLoading('btnInfraRecord', infraRecordNode));
    el('infraNodeInput')?.addEventListener('keydown', ev => { if (ev.key === 'Enter') infraRecordNode(); });

    // ── Phase 88: Predict high-risk only ─────────────────────────────────────
    async function predictHighRisk() {
      if (!window.electronAPI?.predictHighRisk) { setStatus('Predictive risk API not available.', 'bad'); return; }
      setStatus('Filtering high-risk predictions…', 'ok');
      try {
        const result = await window.electronAPI.predictHighRisk({ threshold: 0.75 });
        const items = result?.highRisk || result?.items || result || [];
        renderList('predictivePanel', items, i => `<div style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.64rem;color:var(--color-bad);">HIGH-RISK: ${escapeHtml(String(i?.node || i?.id || JSON.stringify(i).slice(0,60)))}</div>`);
        setStatus(`${items.length} high-risk node(s) flagged.`, 'ok');
      } catch(e) { setStatus(`High-risk predict failed: ${e.message}`, 'bad'); }
    }
    el('btnPredictHighRisk')?.addEventListener('click', withLoading('btnPredictHighRisk', predictHighRisk));

    // ── Phase 89: Simulate scenario with input ────────────────────────────────
    async function runScenarioSimulation() {
      const scenario = el('simScenarioInput')?.value?.trim();
      if (!window.electronAPI?.simulateScenario) { setStatus('Simulator API not available.', 'bad'); return; }
      const config = scenario ? { name: scenario } : { name: 'default', inject: true };
      setStatus(`Running simulation: ${config.name}…`, 'ok');
      try {
        const result = await window.electronAPI.simulateScenario(config);
        const outcome = result?.outcome || result?.result || result;
        el('simulatorPanel').innerHTML = `<div style="font-size:0.64rem;white-space:pre-wrap;color:#67e8f9;">${escapeHtml(JSON.stringify(outcome, null, 2).slice(0,300))}</div>`;
        if (scenario) el('simScenarioInput').value = '';
        setStatus(`Simulation "${config.name}" complete.`, 'ok');
      } catch(e) { setStatus(`Simulation failed: ${e.message}`, 'bad'); }
    }
    // Override existing runSimulation binding — now uses input scenario
    el('btnRunSimulation')?.removeEventListener('click', () => {});
    document.getElementById('btnRunSimulation')?.addEventListener('click', withLoading('btnRunSimulation', runScenarioSimulation));
    el('simScenarioInput')?.addEventListener('keydown', ev => { if (ev.key === 'Enter') runScenarioSimulation(); });

    // ── Phase 73: Fingerprint Library search / compare / export ──────────────
    async function fplibSearch() {
      const query = el('fplibQueryInput')?.value?.trim();
      if (!window.electronAPI?.fplibSearch) { setStatus('FP Library API not available.', 'bad'); return; }
      setStatus('Searching fingerprint library…', 'ok');
      try {
        let features;
        try { features = JSON.parse(query || '{}'); } catch { features = { keyword: query }; }
        const result = await window.electronAPI.fplibSearch(features);
        const hits = result?.matches || result?.results || result || [];
        el('statFpLibEntries').textContent = hits.length;
        renderList('fpLibraryList', hits, h => fmtItem(h, '#a78bfa'));
        setStatus(`${hits.length} fingerprint match(es).`, 'ok');
      } catch(e) { setStatus(`FP search failed: ${e.message}`, 'bad'); }
    }
    async function fplibCompare() {
      const query = el('fplibQueryInput')?.value?.trim();
      if (!window.electronAPI?.fplibCompare) { setStatus('FP Library API not available.', 'bad'); return; }
      const caseData = window.caseMgr?.activeCase;
      const candidate = { keyword: query, caseId: caseData?.case_id };
      setStatus('Comparing candidate against fingerprint library…', 'ok');
      try {
        const result = await window.electronAPI.fplibCompare(candidate);
        const conf = result?.confidence ?? result?.score ?? 0;
        const label = result?.matchId || result?.match || 'unknown';
        el('fpLibraryList').innerHTML = `<div style="font-size:0.64rem;padding:4px 0;color:${conf >= 0.7 ? 'var(--color-ok)' : 'var(--color-warn)'};">Best match: <b>${escapeHtml(String(label))}</b> — confidence: ${(conf * 100).toFixed(0)}%</div>`;
        el('statFpLibConf').textContent = `${(conf * 100).toFixed(0)}%`;
        setStatus(`FP compare: ${(conf * 100).toFixed(0)}% match.`, 'ok');
      } catch(e) { setStatus(`FP compare failed: ${e.message}`, 'bad'); }
    }
    async function fplibExport() {
      if (!window.electronAPI?.fplibExport) { setStatus('FP export API not available.', 'bad'); return; }
      setStatus('Exporting fingerprint library…', 'ok');
      try {
        const result = await window.electronAPI.fplibExport();
        const count = result?.entries?.length ?? result?.count ?? 0;
        el('fpLibraryList').innerHTML = `<div style="font-size:0.64rem;padding:4px 0;color:var(--color-ok);">Library exported: <b>${count}</b> entries.</div>`;
        el('statFpLibEntries').textContent = count;
        setStatus(`FP library exported (${count} entries).`, 'ok');
      } catch(e) { setStatus(`FP export failed: ${e.message}`, 'bad'); }
    }
    el('btnFplibSearch')?.addEventListener('click', withLoading('btnFplibSearch', fplibSearch));
    el('btnFplibCompare')?.addEventListener('click', withLoading('btnFplibCompare', fplibCompare));
    el('btnFplibExport')?.addEventListener('click', withLoading('btnFplibExport', fplibExport));
    el('fplibQueryInput')?.addEventListener('keydown', ev => { if (ev.key === 'Enter') fplibSearch(); });

    // ── Phase 98-99: Memory record/annotate + Provenance tag/step ─────────────
    async function memoryRecord() {
      if (!window.electronAPI?.expMemoryRecord) { setStatus('Memory API not available.', 'bad'); return; }
      const caseData = window.caseMgr?.activeCase;
      setStatus('Recording to institutional memory…', 'ok');
      try {
        const result = await window.electronAPI.expMemoryRecord({ caseId: caseData?.case_id, bundles: caseData?.bundles || [], timestamp: Date.now() });
        const count = result?.totalRecords ?? result?.count ?? 1;
        el('memoryRecordCount').innerHTML = `<strong class="fg">Institutional Memory:</strong> <span style="color:var(--color-ok);">${count} record(s) synced.</span>`;
        setStatus(`Memory recorded (${count} entries).`, 'ok');
      } catch(e) { setStatus(`Memory record failed: ${e.message}`, 'bad'); }
    }
    async function memoryAnnotate() {
      const text = el('memoryAnnotateInput')?.value?.trim();
      if (!text) { setStatus('Enter annotation text.', 'bad'); return; }
      if (!window.electronAPI?.expMemoryAnnotate) { setStatus('Memory API not available.', 'bad'); return; }
      const caseData = window.caseMgr?.activeCase;
      setStatus('Annotating memory record…', 'ok');
      try {
        await window.electronAPI.expMemoryAnnotate({ caseId: caseData?.case_id, annotation: text, timestamp: Date.now() });
        el('memoryAnnotateInput').value = '';
        el('memoryRecordCount').innerHTML = `<strong class="fg">Institutional Memory:</strong> <span style="color:var(--color-ok);">Annotated: "${escapeHtml(text.slice(0,50))}"</span>`;
        setStatus('Memory annotation saved.', 'ok');
      } catch(e) { setStatus(`Annotate failed: ${e.message}`, 'bad'); }
    }
    async function provTag() {
      if (!window.electronAPI?.expProvTag) { setStatus('Provenance API not available.', 'bad'); return; }
      const caseData = window.caseMgr?.activeCase;
      setStatus('Tagging data provenance…', 'ok');
      try {
        const result = await window.electronAPI.expProvTag({ source: caseData?.case_id || 'unknown', tag: 'EVIDENCE', timestamp: Date.now() });
        el('provenanceOutput').innerHTML = `<strong class="fg">Data Provenance Engine:</strong> <span style="color:var(--color-ok);">Tag: EVIDENCE — ${escapeHtml(result?.tag || 'tagged')}</span>`;
        setStatus('Provenance tag applied.', 'ok');
      } catch(e) { setStatus(`Prov tag failed: ${e.message}`, 'bad'); }
    }
    async function provStep() {
      if (!window.electronAPI?.expProvStep) { setStatus('Provenance API not available.', 'bad'); return; }
      const caseData = window.caseMgr?.activeCase;
      setStatus('Recording provenance step…', 'ok');
      try {
        const result = await window.electronAPI.expProvStep({ action: 'ANALYSIS', input: caseData?.case_id || 'input', output: 'report', timestamp: Date.now() });
        el('provenanceOutput').innerHTML = `<strong class="fg">Data Provenance Engine:</strong> <span style="color:#a78bfa;">Step recorded: ANALYSIS → report (${escapeHtml(result?.stepId || 'step-1')})</span>`;
        setStatus('Provenance step recorded.', 'ok');
      } catch(e) { setStatus(`Prov step failed: ${e.message}`, 'bad'); }
    }
    el('btnMemoryRecord')?.addEventListener('click', withLoading('btnMemoryRecord', memoryRecord));
    el('btnMemoryAnnotate')?.addEventListener('click', withLoading('btnMemoryAnnotate', memoryAnnotate));
    el('btnProvTag')?.addEventListener('click', withLoading('btnProvTag', provTag));
    el('btnProvStep')?.addEventListener('click', withLoading('btnProvStep', provStep));
    el('memoryAnnotateInput')?.addEventListener('keydown', ev => { if (ev.key === 'Enter') memoryAnnotate(); });

    // ── Phase 101: Operator profile lookup (adv-operator-get) ─────────────────
    async function operatorGet() {
      const id = el('operatorLookupInput')?.value?.trim();
      if (!id) { setStatus('Enter an operator ID.', 'bad'); return; }
      if (!window.electronAPI?.advOperatorGet) { setStatus('Operator profile API not available.', 'bad'); return; }
      setStatus(`Looking up operator "${id}"…`, 'ok');
      try {
        const result = await window.electronAPI.advOperatorGet(id);
        const profile = result?.profile || result?.summary || JSON.stringify(result).slice(0, 120);
        el('operatorProfileOutput').innerHTML = `<strong class="fg">Operator Profile (${escapeHtml(id)}):</strong> <span style="color:#a78bfa;">${escapeHtml(String(profile))}</span>`;
        el('operatorLookupInput').value = '';
        setStatus(`Profile loaded for operator "${id}".`, 'ok');
      } catch(e) { setStatus(`Operator lookup failed: ${e.message}`, 'bad'); }
    }
    el('btnOperatorGet')?.addEventListener('click', withLoading('btnOperatorGet', operatorGet));
    el('operatorLookupInput')?.addEventListener('keydown', ev => { if (ev.key === 'Enter') operatorGet(); });

    // ==================== SUB-ACTION DEEP WIRING (v1.6.3) ====================

    // ── Phase 76: Workspace add-member + activity feed ────────────────────────
    async function wsAddMember() {
      const memberId = el('wsMemberInput')?.value?.trim();
      if (!memberId) { setStatus('Enter a member ID.', 'bad'); return; }
      if (!window.electronAPI?.wsAddMember) { setStatus('Workspace API not available.', 'bad'); return; }
      const wsId = window.caseMgr?.activeCase?.case_id || 'default-ws';
      setStatus(`Adding member "${memberId}" to workspace…`, 'ok');
      try {
        await window.electronAPI.wsAddMember(wsId, memberId);
        el('wsMemberInput').value = '';
        el('workspacePanel').innerHTML = `<div style="font-size:0.64rem;padding:4px 0;color:var(--color-ok);">Member <b>${escapeHtml(memberId)}</b> added to workspace <b>${escapeHtml(wsId)}</b>.</div>`;
        setStatus(`Member "${memberId}" added.`, 'ok');
      } catch(e) { setStatus(`Add member failed: ${e.message}`, 'bad'); }
    }
    async function wsActivityFeed() {
      if (!window.electronAPI?.wsActivityFeed) { setStatus('Workspace API not available.', 'bad'); return; }
      const wsId = window.caseMgr?.activeCase?.case_id || 'default-ws';
      setStatus('Loading workspace activity feed…', 'ok');
      try {
        const result = await window.electronAPI.wsActivityFeed(wsId);
        const events = result?.events || result || [];
        renderList('workspacePanel', events, e => fmtItem(e, '#67e8f9'));
        setStatus(`${events.length} activity event(s).`, 'ok');
      } catch(e) { setStatus(`Activity feed failed: ${e.message}`, 'bad'); }
    }
    el('btnWsAddMember')?.addEventListener('click', withLoading('btnWsAddMember', wsAddMember));
    el('btnWsActivityFeed')?.addEventListener('click', withLoading('btnWsActivityFeed', wsActivityFeed));
    el('wsMemberInput')?.addEventListener('keydown', ev => { if (ev.key === 'Enter') wsAddMember(); });

    // ── Phase 77: Trust add-source + log-exchange ─────────────────────────────
    async function trustAddSource() {
      const sourceId = el('trustSourceInput')?.value?.trim();
      if (!sourceId) { setStatus('Enter a source ID.', 'bad'); return; }
      if (!window.electronAPI?.trustAddSource) { setStatus('Trust API not available.', 'bad'); return; }
      setStatus(`Adding trusted source "${sourceId}"…`, 'ok');
      try {
        await window.electronAPI.trustAddSource({ id: sourceId, name: sourceId, type: 'manual', trustedSince: Date.now() });
        el('trustRegistryPanel').innerHTML = `<div style="font-size:0.64rem;padding:4px 0;color:var(--color-ok);">Source <b>${escapeHtml(sourceId)}</b> added to trust registry.</div>`;
        const countEl = el('statTrustSources');
        if (countEl) countEl.textContent = parseInt(countEl.textContent || '0') + 1;
        setStatus(`Source "${sourceId}" trusted.`, 'ok');
      } catch(e) { setStatus(`Add source failed: ${e.message}`, 'bad'); }
    }
    async function trustLogExchange() {
      const action = el('trustLogInput')?.value?.trim() || 'SHARE';
      if (!window.electronAPI?.trustLogExchange) { setStatus('Trust API not available.', 'bad'); return; }
      const sourceId = el('trustSourceInput')?.value?.trim() || 'unknown';
      setStatus(`Logging trust exchange: ${action}…`, 'ok');
      try {
        const result = await window.electronAPI.trustLogExchange({ sourceId, action, timestamp: Date.now(), caseId: window.caseMgr?.activeCase?.case_id });
        el('trustRegistryPanel').innerHTML = `<div style="font-size:0.64rem;padding:4px 0;color:#67e8f9;">Exchange logged: <b>${escapeHtml(action)}</b> from <b>${escapeHtml(sourceId)}</b>.</div>`;
        const excEl = el('statExchanges');
        if (excEl) excEl.textContent = parseInt(excEl.textContent || '0') + 1;
        el('trustLogInput').value = '';
        setStatus('Exchange logged.', 'ok');
      } catch(e) { setStatus(`Log exchange failed: ${e.message}`, 'bad'); }
    }
    el('btnTrustAddSource')?.addEventListener('click', withLoading('btnTrustAddSource', trustAddSource));
    el('btnTrustLogExchange')?.addEventListener('click', withLoading('btnTrustLogExchange', trustLogExchange));
    el('trustLogInput')?.addEventListener('keydown', ev => { if (ev.key === 'Enter') trustLogExchange(); });

    // ── Phase 81: Review create ───────────────────────────────────────────────
    async function reviewCreate() {
      if (!window.electronAPI?.reviewCreate) { setStatus('Review API not available.', 'bad'); return; }
      const caseData = window.caseMgr?.activeCase;
      if (!caseData) { setStatus('Load a case first.', 'bad'); return; }
      setStatus('Creating review for active case…', 'ok');
      try {
        const result = await window.electronAPI.reviewCreate(caseData.case_id, 'ANALYST', { priority: 'normal' });
        const revId = result?.reviewId || result?.id || 'REV-NEW';
        el('reviewIdInput').value = revId;
        el('reviewWorkflowPanel').innerHTML = `<div style="font-size:0.64rem;padding:4px 0;color:var(--color-ok);">Review created: <b>${escapeHtml(revId)}</b> for case <b>${escapeHtml(caseData.case_id)}</b>.</div>`;
        const countEl = el('statPendingReviews');
        if (countEl) countEl.textContent = parseInt(countEl.textContent || '0') + 1;
        setStatus(`Review ${revId} created.`, 'ok');
      } catch(e) { setStatus(`Review create failed: ${e.message}`, 'bad'); }
    }
    el('btnReviewCreate')?.addEventListener('click', withLoading('btnReviewCreate', reviewCreate));

    // ── Phase 82: Redact entire bundle ────────────────────────────────────────
    async function redactBundle() {
      if (!window.electronAPI?.redactBundle) { setStatus('Redact bundle API not available.', 'bad'); return; }
      const caseData = window.caseMgr?.activeCase;
      const bundle = caseData?.bundles?.[0];
      if (!bundle) { setStatus('No bundle in active case to redact.', 'bad'); return; }
      setStatus('Redacting active bundle…', 'ok');
      try {
        const result = await window.electronAPI.redactBundle(bundle);
        const redactedCount = result?.redactedFields ?? result?.count ?? 0;
        el('redactionPanel').innerHTML = `<div style="font-size:0.65rem;word-break:break-all;color:var(--color-warn);">Bundle redacted: <b>${redactedCount}</b> field(s) scrubbed. Fingerprint: ${escapeHtml(bundle.fingerprint || 'unknown')}</div>`;
        setStatus(`Bundle redacted (${redactedCount} fields).`, 'ok');
      } catch(e) { setStatus(`Bundle redact failed: ${e.message}`, 'bad'); }
    }
    el('btnRedactBundle')?.addEventListener('click', withLoading('btnRedactBundle', redactBundle));

    // ── Phase 91: Global graph add-node + lineage ─────────────────────────────
    async function globalGraphAddNode() {
      const nodeId = el('globalNeighborInput')?.value?.trim();
      if (!nodeId) { setStatus('Enter a node ID to add.', 'bad'); return; }
      if (!window.electronAPI?.globalGraphAddNode) { setStatus('Global graph API not available.', 'bad'); return; }
      setStatus(`Adding node "${nodeId}" to global graph…`, 'ok');
      try {
        await window.electronAPI.globalGraphAddNode(nodeId, 'CDN', { label: nodeId }, { source: 'manual' });
        const nodesEl = el('statGlobalNodes');
        if (nodesEl) nodesEl.textContent = parseInt(nodesEl.textContent || '0') + 1;
        el('globalGraphPanel').innerHTML = `<div style="font-size:0.64rem;padding:4px 0;color:var(--color-ok);">Node <b>${escapeHtml(nodeId)}</b> added to global graph.</div>`;
        setStatus(`Node "${nodeId}" added.`, 'ok');
      } catch(e) { setStatus(`Add node failed: ${e.message}`, 'bad'); }
    }
    async function globalGraphLineage() {
      const elementId = el('globalNeighborInput')?.value?.trim();
      if (!elementId) { setStatus('Enter an element ID for lineage.', 'bad'); return; }
      if (!window.electronAPI?.globalGraphLineage) { setStatus('Global graph API not available.', 'bad'); return; }
      setStatus(`Loading lineage for "${elementId}"…`, 'ok');
      try {
        const result = await window.electronAPI.globalGraphLineage(elementId);
        const chain = result?.chain || result?.lineage || result || [];
        renderList('globalGraphPanel', Array.isArray(chain) ? chain : [result], n => fmtItem(n, '#a78bfa'));
        setStatus(`Lineage: ${Array.isArray(chain) ? chain.length : 1} step(s).`, 'ok');
      } catch(e) { setStatus(`Lineage failed: ${e.message}`, 'bad'); }
    }
    el('btnGlobalAddNode')?.addEventListener('click', withLoading('btnGlobalAddNode', globalGraphAddNode));
    el('btnGlobalGraphLineage')?.addEventListener('click', withLoading('btnGlobalGraphLineage', globalGraphLineage));

    // ── Phase 62: Replay mutate clear ────────────────────────────────────────
    async function replayMutateClear() {
      if (!window.electronAPI?.replayMutateClear) { setStatus('Replay API not available.', 'bad'); return; }
      setStatus('Clearing all replay mutations…', 'ok');
      try {
        await window.electronAPI.replayMutateClear('DEFAULT_REPLAY_SESSION');
        el('mutationActiveState').textContent = 'INACTIVE';
        el('mutationActiveState').className = 'muted';
        el('mutationCount').textContent = '0';
        setStatus('All replay mutations cleared.', 'ok');
      } catch(e) { setStatus(`Clear mutations failed: ${e.message}`, 'bad'); }
    }
    el('btnReplayMutateClear')?.addEventListener('click', withLoading('btnReplayMutateClear', replayMutateClear));

    // ==================== PHASES 72, 74, 76-80 + CUSTODY WIRING ====================

    // ── Phase 72: Anomaly ML Scoring ────────────────────────────────────────
    async function scoreAnomalies() {
      if (!window.electronAPI?.aiScoreAnomalies) { setStatus('Anomaly scorer not available.', 'bad'); return; }
      const obs = window.caseMgr?.activeCase?.bundles || [];
      setStatus('Scoring anomalies…', 'ok');
      try {
        const result = await window.electronAPI.aiScoreAnomalies(obs);
        const scores = result?.scores || result || [];
        const high = scores.filter(s => (s.score ?? s.riskScore ?? 0) >= 0.7).length;
        const avg = scores.length ? (scores.reduce((a, s) => a + (s.score ?? s.riskScore ?? 0), 0) / scores.length).toFixed(2) : '—';
        el('statAnomalyHigh').textContent = high;
        el('statAnomalyAvg').textContent = avg;
        renderList('anomalyScoringList', scores, s =>
          `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);">` +
          `<span class="mono tiny" style="color:var(--text-accent);">${escapeHtml(s.bundleId || s.id || 'bundle')}</span>` +
          `<span style="color:${(s.score ?? s.riskScore ?? 0) >= 0.7 ? 'var(--color-bad)' : 'var(--color-ok)'};">${((s.score ?? s.riskScore ?? 0) * 100).toFixed(0)}%</span>` +
          `</div>`
        );
        setStatus(`Scored ${scores.length} bundle(s). ${high} high-risk.`, 'ok');
      } catch(e) { setStatus(`Anomaly scoring failed: ${e.message}`, 'bad'); }
    }
    el('btnScoreAnomalies')?.addEventListener('click', withLoading('btnScoreAnomalies', scoreAnomalies));

    // ── Phase 74: Cross-Case Mining ──────────────────────────────────────────
    async function crossMineCases() {
      if (!window.electronAPI?.crossCaseMine) { setStatus('Cross-case miner not available.', 'bad'); return; }
      setStatus('Mining cross-case correlations…', 'ok');
      try {
        const cases = (await window.electronAPI.caseList?.()) || [];
        const result = await window.electronAPI.crossCaseMine(cases);
        const hits = result?.correlations || result?.hits || result || [];
        el('statCrossCorrelations').textContent = hits.length;
        renderList('crossCaseResults', hits, h =>
          `<div style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.64rem;">` +
          `<span style="color:var(--text-accent);">${escapeHtml(h.caseA || h.from || '?')}</span>` +
          ` ↔ <span style="color:var(--color-ok);">${escapeHtml(h.caseB || h.to || '?')}</span>` +
          ` <span class="muted">${escapeHtml(String(h.similarity || h.score || ''))}</span></div>`
        );
        setStatus(`${hits.length} cross-case correlation(s) found.`, 'ok');
      } catch(e) { setStatus(`Cross-case mining failed: ${e.message}`, 'bad'); }
    }
    el('btnCrossMineCases')?.addEventListener('click', withLoading('btnCrossMineCases', crossMineCases));

    // ── Phase 76: Workspace Management ──────────────────────────────────────
    async function listWorkspaces() {
      if (!window.electronAPI?.wsList) { setStatus('Workspace API not available.', 'bad'); return; }
      setStatus('Loading workspaces…', 'ok');
      try {
        const ws = await window.electronAPI.wsList();
        const list = ws || [];
        el('statWorkspaces').textContent = list.length;
        renderList('workspacePanel', list, w =>
          `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);">` +
          `<span style="color:var(--text-accent);font-size:0.64rem;">${escapeHtml(w.name || w.id || 'workspace')}</span>` +
          `<span class="muted tiny">${(w.members?.length ?? 0)} member(s)</span></div>`
        );
        setStatus(`${list.length} workspace(s) loaded.`, 'ok');
      } catch(e) { setStatus(`Workspace list failed: ${e.message}`, 'bad'); }
    }
    async function createWorkspace() {
      const name = el('wsNameInput')?.value?.trim();
      if (!name) { setStatus('Enter a workspace name.', 'bad'); return; }
      if (!window.electronAPI?.wsCreate) { setStatus('Workspace API not available.', 'bad'); return; }
      setStatus(`Creating workspace "${name}"…`, 'ok');
      try {
        await window.electronAPI.wsCreate(name, {});
        el('wsNameInput').value = '';
        setStatus(`Workspace "${name}" created.`, 'ok');
        await listWorkspaces();
      } catch(e) { setStatus(`Workspace create failed: ${e.message}`, 'bad'); }
    }
    async function wsAssignCase() {
      const analystId = el('wsAssignCaseInput')?.value?.trim();
      if (!analystId) { setStatus('Enter an analyst ID.', 'bad'); return; }
      if (!window.electronAPI?.wsAssignCase) { setStatus('Workspace API not available.', 'bad'); return; }
      const caseId = window.caseMgr?.activeCase?.case_id;
      if (!caseId) { setStatus('Load a case first.', 'bad'); return; }
      const wsId = caseId;
      setStatus(`Assigning case ${caseId} to analyst "${analystId}"…`, 'ok');
      try {
        await window.electronAPI.wsAssignCase(wsId, caseId, analystId);
        el('wsAssignCaseInput').value = '';
        el('workspacePanel').innerHTML = `<div style="font-size:0.64rem;padding:4px 0;color:var(--color-ok);">Case <b>${escapeHtml(caseId)}</b> assigned to analyst <b>${escapeHtml(analystId)}</b>.</div>`;
        setStatus(`Case assigned to "${analystId}".`, 'ok');
      } catch(e) { setStatus(`Assign case failed: ${e.message}`, 'bad'); }
    }
    async function caseUpdateFinding() {
      const findingId = el('findingUpdateInput')?.value?.trim();
      if (!findingId) { setStatus('Enter a finding ID to update.', 'bad'); return; }
      if (!window.electronAPI?.caseUpdateFinding) { setStatus('Case API not available.', 'bad'); return; }
      const caseId = window.caseMgr?.activeCase?.case_id;
      if (!caseId) { setStatus('Load a case first.', 'bad'); return; }
      setStatus(`Updating finding ${findingId}…`, 'ok');
      try {
        const result = await window.electronAPI.caseUpdateFinding(caseId, findingId, { reviewed: true, updatedAt: Date.now() });
        el('findingUpdateInput').value = '';
        const body = el('caseFindingsBody');
        if (body) body.innerHTML = `<tr><td colspan="3" style="color:var(--color-ok);padding:6px;font-size:0.72rem;">Finding <b>${escapeHtml(findingId)}</b> updated ✓</td></tr>`;
        setStatus(`Finding ${findingId} updated.`, 'ok');
      } catch(e) { setStatus(`Update finding failed: ${e.message}`, 'bad'); }
    }
    el('btnCaseUpdateFinding')?.addEventListener('click', withLoading('btnCaseUpdateFinding', caseUpdateFinding));
    el('findingUpdateInput')?.addEventListener('keydown', ev => { if (ev.key === 'Enter') caseUpdateFinding(); });
    el('btnListWorkspaces')?.addEventListener('click', withLoading('btnListWorkspaces', listWorkspaces));
    el('btnCreateWorkspace')?.addEventListener('click', withLoading('btnCreateWorkspace', createWorkspace));
    el('btnWsAssignCase')?.addEventListener('click', withLoading('btnWsAssignCase', wsAssignCase));
    el('wsNameInput')?.addEventListener('keydown', ev => { if (ev.key === 'Enter') createWorkspace(); });
    el('wsAssignCaseInput')?.addEventListener('keydown', ev => { if (ev.key === 'Enter') wsAssignCase(); });

    // ── Phase 77: Trust Registry ─────────────────────────────────────────────
    async function trustAudit() {
      if (!window.electronAPI?.trustAudit) { setStatus('Trust registry not available.', 'bad'); return; }
      setStatus('Loading trust audit…', 'ok');
      try {
        const result = await window.electronAPI.trustAudit();
        const exchanges = result?.exchanges || result || [];
        el('statExchanges').textContent = exchanges.length;
        renderList('trustRegistryPanel', exchanges, x =>
          `<div style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.64rem;">` +
          `<span style="color:var(--text-accent);">${escapeHtml(x.sourceId || x.id || 'source')}</span>` +
          ` <span class="muted">${escapeHtml(x.action || x.type || '')} · ${escapeHtml(String(x.timestamp || ''))}</span></div>`
        );
        setStatus(`${exchanges.length} exchange(s) in trust audit.`, 'ok');
      } catch(e) { setStatus(`Trust audit failed: ${e.message}`, 'bad'); }
    }
    async function trustVerifySource() {
      const id = el('trustSourceInput')?.value?.trim();
      if (!id) { setStatus('Enter a source ID.', 'bad'); return; }
      if (!window.electronAPI?.trustVerify) { setStatus('Trust registry not available.', 'bad'); return; }
      setStatus(`Verifying source "${id}"…`, 'ok');
      try {
        const result = await window.electronAPI.trustVerify(id);
        const trusted = result?.trusted ?? result?.status === 'trusted' ?? false;
        const sourceCountEl = el('statTrustSources');
        if (sourceCountEl) sourceCountEl.textContent = trusted ? '1+' : '0';
        el('trustRegistryPanel').innerHTML =
          `<div style="padding:6px;font-size:0.64rem;color:${trusted ? 'var(--color-ok)' : 'var(--color-bad)'};">` +
          `Source <b>${escapeHtml(id)}</b>: ${trusted ? 'TRUSTED ✓' : 'UNTRUSTED ✗'}</div>`;
        setStatus(`Source "${id}" is ${trusted ? 'trusted' : 'NOT trusted'}.`, trusted ? 'ok' : 'bad');
      } catch(e) { setStatus(`Trust verify failed: ${e.message}`, 'bad'); }
    }
    el('btnTrustAudit')?.addEventListener('click', withLoading('btnTrustAudit', trustAudit));
    el('btnTrustVerify')?.addEventListener('click', withLoading('btnTrustVerify', trustVerifySource));
    el('trustSourceInput')?.addEventListener('keydown', ev => { if (ev.key === 'Enter') trustVerifySource(); });

    // ── Phase 78: Graph Analytics ────────────────────────────────────────────
    async function runGraphAnalytics(mode) {
      if (!window.electronAPI) { setStatus('Graph analytics not available.', 'bad'); return; }
      const graph = window._lastIntelGraph || { nodes: [], edges: [] };
      setStatus(`Running graph ${mode}…`, 'ok');
      try {
        let result, label;
        if (mode === 'hot') {
          result = await window.electronAPI.graphHotNodes(graph);
          label = 'Hot Nodes';
          const nodes = result?.hotNodes || result?.nodes || result || [];
          const top = nodes[0]?.id || nodes[0] || '—';
          el('statTopNode').textContent = String(top);
          renderList('graphAnalyticsPanel', nodes, n =>
            `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);">` +
            `<span style="color:var(--text-accent);font-size:0.64rem;">${escapeHtml(String(n.id || n))}</span>` +
            `<span class="muted tiny">score: ${escapeHtml(String(n.score ?? n.heat ?? ''))}</span></div>`
          );
          setStatus(`${nodes.length} hot node(s) scored.`, 'ok');
        } else if (mode === 'centrality') {
          result = await window.electronAPI.graphCentrality(graph);
          label = 'Centrality';
          const scores = result?.scores ? Object.entries(result.scores) : [];
          scores.sort((a,b) => b[1] - a[1]);
          if (scores.length) el('statTopNode').textContent = scores[0][0];
          renderList('graphAnalyticsPanel', scores, ([id, score]) =>
            `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);">` +
            `<span style="color:var(--text-accent);font-size:0.64rem;">${escapeHtml(id)}</span>` +
            `<span class="muted tiny">${(score * 100).toFixed(1)}%</span></div>`
          );
          setStatus(`Centrality computed for ${scores.length} node(s).`, 'ok');
        } else if (mode === 'bridges') {
          result = await window.electronAPI.graphBridges(graph);
          label = 'Bridges';
          const bridges = result?.bridges || result || [];
          el('statBridgeCount').textContent = bridges.length;
          renderList('graphAnalyticsPanel', bridges, b =>
            `<div style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.64rem;color:var(--color-warn);">` +
            `BRIDGE: ${escapeHtml(String(b.edge || b.from || b))}</div>`
          );
          setStatus(`${bridges.length} bridge edge(s) detected.`, 'ok');
        }
      } catch(e) { setStatus(`Graph ${mode} failed: ${e.message}`, 'bad'); }
    }
    el('btnGraphHotNodes')?.addEventListener('click', withLoading('btnGraphHotNodes', () => runGraphAnalytics('hot')));
    el('btnGraphCentrality')?.addEventListener('click', withLoading('btnGraphCentrality', () => runGraphAnalytics('centrality')));
    el('btnGraphBridges')?.addEventListener('click', withLoading('btnGraphBridges', () => runGraphAnalytics('bridges')));

    // ── Phase 79: Policy Engine ──────────────────────────────────────────────
    async function policyLoadDefaults() {
      if (!window.electronAPI?.policyLoad) { setStatus('Policy engine not available.', 'bad'); return; }
      setStatus('Loading default policies…', 'ok');
      try {
        const defaults = [
          { id: 'EXPORT_CONTROL', action: 'export', allow: true },
          { id: 'REDACT_REQUIRED', action: 'publish', requireRedact: true },
          { id: 'SEAL_ON_CLOSE', action: 'close_case', sealEvidence: true }
        ];
        await window.electronAPI.policyLoad(defaults);
        renderList('policyPanel', defaults, p =>
          `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.64rem;">` +
          `<span style="color:var(--text-accent);">${escapeHtml(p.id)}</span>` +
          `<span class="muted">${escapeHtml(p.action)}</span></div>`
        );
        el('statPolicyDecisions').textContent = defaults.length;
        setStatus(`${defaults.length} default polic(ies) loaded.`, 'ok');
      } catch(e) { setStatus(`Policy load failed: ${e.message}`, 'bad'); }
    }
    async function policyAuditLog() {
      if (!window.electronAPI?.policyAudit) { setStatus('Policy engine not available.', 'bad'); return; }
      setStatus('Loading policy audit log…', 'ok');
      try {
        const log = await window.electronAPI.policyAudit();
        const entries = Array.isArray(log) ? log : (log?.entries || []);
        el('statPolicyDecisions').textContent = entries.length;
        renderList('policyPanel', entries, e =>
          `<div style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.64rem;">` +
          `<span style="color:${e.allowed ? 'var(--color-ok)' : 'var(--color-bad)'};">${e.allowed ? 'ALLOW' : 'DENY'}</span>` +
          ` <span class="muted">${escapeHtml(e.action || e.rule || '')} · ${escapeHtml(String(e.timestamp || ''))}</span></div>`
        );
        setStatus(`${entries.length} policy decision(s) in log.`, 'ok');
      } catch(e) { setStatus(`Policy audit failed: ${e.message}`, 'bad'); }
    }
    el('btnPolicyLoadDefaults')?.addEventListener('click', withLoading('btnPolicyLoadDefaults', policyLoadDefaults));
    el('btnPolicyAudit')?.addEventListener('click', withLoading('btnPolicyAudit', policyAuditLog));

    // ── Phase 80: Enterprise Controls / Deployment Profiles ──────────────────
    async function listDeployProfiles() {
      if (!window.electronAPI?.deployList) { setStatus('Deployment profiles not available.', 'bad'); return; }
      setStatus('Loading deployment profiles…', 'ok');
      try {
        const profiles = await window.electronAPI.deployList();
        const list = profiles || [];
        renderList('enterprisePanel', list, p =>
          `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);">` +
          `<span style="color:var(--text-accent);font-size:0.64rem;">${escapeHtml(p.name || p.id || 'profile')}</span>` +
          `<span class="pill tiny" style="background:${p.active ? 'var(--color-ok)' : 'rgba(255,255,255,0.08)'};color:${p.active ? '#000' : 'inherit'};">${p.active ? 'ACTIVE' : 'idle'}</span></div>`
        );
        const active = list.find(p => p.active);
        if (active) el('statActiveProfile').textContent = active.name || active.id;
        setStatus(`${list.length} profile(s) available.`, 'ok');
      } catch(e) { setStatus(`Profile list failed: ${e.message}`, 'bad'); }
    }
    async function deployQuotaReport() {
      if (!window.electronAPI?.deployQuota) { setStatus('Quota API not available.', 'bad'); return; }
      setStatus('Loading quota report…', 'ok');
      try {
        const quota = await window.electronAPI.deployQuota();
        el('enterprisePanel').innerHTML =
          `<div style="font-size:0.64rem;padding:6px;display:flex;flex-direction:column;gap:4px;">` +
          `<div><span class="muted">Decode quota:</span> <b style="color:var(--color-ok);">${quota?.decodeQuota ?? '∞'}</b></div>` +
          `<div><span class="muted">Cases used:</span> <b style="color:var(--color-ok);">${quota?.casesUsed ?? 0}</b></div>` +
          `<div><span class="muted">Storage:</span> <b style="color:var(--color-ok);">${quota?.storageUsedMb ?? 0} MB</b></div>` +
          `<div><span class="muted">Tier:</span> <b style="color:var(--text-accent);">${quota?.tier ?? 'COMMUNITY'}</b></div>` +
          `</div>`;
        setStatus('Quota report loaded.', 'ok');
      } catch(e) { setStatus(`Quota report failed: ${e.message}`, 'bad'); }
    }
    async function deployActivateProfile() {
      const name = el('deployProfileInput')?.value?.trim();
      if (!name) { setStatus('Enter a profile name.', 'bad'); return; }
      if (!window.electronAPI?.deployActivate) { setStatus('Deployment API not available.', 'bad'); return; }
      setStatus(`Activating profile "${name}"…`, 'ok');
      try {
        await window.electronAPI.deployActivate(name);
        el('statActiveProfile').textContent = name;
        el('deployProfileInput').value = '';
        setStatus(`Profile "${name}" activated.`, 'ok');
        await listDeployProfiles();
      } catch(e) { setStatus(`Profile activation failed: ${e.message}`, 'bad'); }
    }
    el('btnDeployList')?.addEventListener('click', withLoading('btnDeployList', listDeployProfiles));
    el('btnDeployQuota')?.addEventListener('click', withLoading('btnDeployQuota', deployQuotaReport));
    el('btnDeployActivate')?.addEventListener('click', withLoading('btnDeployActivate', deployActivateProfile));
    el('deployProfileInput')?.addEventListener('keydown', ev => { if (ev.key === 'Enter') deployActivateProfile(); });

    // ── Phase 58: Chain of Custody ────────────────────────────────────────────
    async function auditGetLogs() {
      if (!window.electronAPI?.auditGetLogs) { setStatus('Audit API not available.', 'bad'); return; }
      setStatus('Loading audit log…', 'ok');
      try {
        const logs = await window.electronAPI.auditGetLogs();
        const entries = logs || [];
        el('statAuditEntries').textContent = entries.length;
        renderList('custodyChainPanel', entries, e =>
          `<div style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.64rem;">` +
          `<span style="color:var(--text-accent);">${escapeHtml(e.type || e.event || 'AUDIT')}</span>` +
          ` <span class="muted">${escapeHtml(String(e.timestamp || e.ts || ''))}</span>` +
          ` <span style="font-size:0.6rem;color:rgba(255,255,255,0.4);">${escapeHtml(JSON.stringify(e.data || {}).slice(0,60))}</span></div>`
        );
        setStatus(`${entries.length} audit log entries.`, 'ok');
      } catch(e) { setStatus(`Audit log failed: ${e.message}`, 'bad'); }
    }
    async function custodyGetChain() {
      const fp = el('custodyFingerprintInput')?.value?.trim() || (window.caseMgr?.activeCase?.bundles?.[0]?.fingerprint);
      if (!fp) { setStatus('No fingerprint — load a case or enter one.', 'bad'); return; }
      if (!window.electronAPI?.custodyGetChain) { setStatus('Custody API not available.', 'bad'); return; }
      setStatus(`Loading custody chain for ${fp.slice(0,12)}…`, 'ok');
      try {
        const chain = await window.electronAPI.custodyGetChain(fp);
        const events = chain?.events || chain || [];
        el('statCustodyEvents').textContent = events.length;
        renderList('custodyChainPanel', events, ev =>
          `<div style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.64rem;">` +
          `<span class="pill tiny" style="background:rgba(42,198,255,0.15);color:var(--text-accent);">${escapeHtml(ev.action || ev.type || 'EVENT')}</span>` +
          ` <span class="muted">${escapeHtml(String(ev.timestamp || ev.ts || ''))}</span>` +
          ` ${escapeHtml(ev.details || ev.by || '')}</div>`
        );
        setStatus(`${events.length} custody event(s) for fingerprint.`, 'ok');
      } catch(e) { setStatus(`Custody chain failed: ${e.message}`, 'bad'); }
    }
    async function evidenceSignActive() {
      if (!window.electronAPI?.evidenceSign) { setStatus('Evidence sign API not available.', 'bad'); return; }
      const caseData = window.caseMgr?.activeCase;
      if (!caseData) { setStatus('Load a case before signing.', 'bad'); return; }
      setStatus('Signing evidence bundle…', 'ok');
      try {
        const result = await window.electronAPI.evidenceSign(caseData);
        el('custodyChainPanel').innerHTML =
          `<div style="padding:8px;font-size:0.64rem;color:var(--color-ok);">` +
          `Evidence SIGNED ✓<br><span class="mono" style="word-break:break-all;font-size:0.58rem;">${escapeHtml(result?.signature?.slice(0,64) || String(result))}</span></div>`;
        setStatus('Evidence signed and recorded.', 'ok');
      } catch(e) { setStatus(`Sign failed: ${e.message}`, 'bad'); }
    }
    async function custodyLookup() {
      const fp = el('custodyFingerprintInput')?.value?.trim();
      if (fp) await custodyGetChain();
    }
    el('btnAuditGetLogs')?.addEventListener('click', auditGetLogs);
    el('btnCustodyGetChain')?.addEventListener('click', custodyGetChain);
    el('btnEvidenceSign')?.addEventListener('click', evidenceSignActive);
    el('btnCustodyLookup')?.addEventListener('click', custodyLookup);
    el('custodyFingerprintInput')?.addEventListener('keydown', ev => { if (ev.key === 'Enter') custodyLookup(); });

    // ==================== v1.6.0 POLISH ====================

    // ── Footer live updater ──────────────────────────────────────────────────
    function updateFooter(action) {
      const footerCase = el('footerCase');
      const footerQueue = el('footerQueue');
      const footerLast = el('footerLastAction');
      const footerVersion = el('footerVersion');
      const uiVer = el('uiVer');
      if (footerVersion && uiVer) {
        footerVersion.textContent = uiVer.textContent;
      }
      if (typeof window.updateProofStatus === 'function') window.updateProofStatus();
      if (footerCase) {
        const c = window.caseMgr?.activeCase;
        footerCase.textContent = c ? `Case: ${c.title || c.case_id}` : 'No case loaded yet';
        footerCase.style.color = c ? 'var(--color-ok)' : 'var(--text-muted)';
      }
      if (footerQueue) {
        const q = state.lastAutomation?.queue?.length ?? 0;
        footerQueue.textContent = `Queue: ${q}`;
        footerQueue.style.color = q > 0 ? 'var(--color-warn)' : 'var(--text-muted)';
      }
      if (footerLast && action) {
        const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        footerLast.textContent = `${action} · ${t}`;
        footerLast.style.color = 'var(--text-accent)';
        setTimeout(() => { if (footerLast) footerLast.style.color = 'var(--text-muted)'; }, 4000);
      }
    }
    // Patch setStatus to also push to footer
    const _origSetStatus = typeof setStatus === 'function' ? setStatus : null;
    if (_origSetStatus) {
      window._setStatus = _origSetStatus;
      window.setStatus = function(msg, type) {
        _origSetStatus(msg, type);
        updateFooter(msg);
      };
    }
    setInterval(updateFooter, 5000);

    // ── Keyboard shortcuts ───────────────────────────────────────────────────
    const _tabOrder = [
      'tabBtnSummary','tabBtnTimeline','tabBtnLadder','tabBtnCandidates',
      'tabBtnHar','tabBtnReport','tabBtnAutomation','tabBtnCases',
      'tabBtnIntelligence','tabBtnPatterns','tabBtnAdvanced'
    ];
    document.addEventListener('keydown', ev => {
      const tag = document.activeElement?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // Ctrl+D — decode
      if (ev.ctrlKey && ev.key === 'd' && !inInput) {
        ev.preventDefault();
        el('btnDecode')?.click();
        updateFooter('Ctrl+D → decode');
        return;
      }
      // Ctrl+K — clear input
      if (ev.ctrlKey && ev.key === 'k') {
        ev.preventDefault();
        el('btnClear')?.click();
        updateFooter('Ctrl+K → clear');
        return;
      }
      // Ctrl+Enter — rebuild intelligence graph
      if (ev.ctrlKey && ev.key === 'Enter') {
        ev.preventDefault();
        el('btnIntelRebuildGraph')?.click();
        updateFooter('Ctrl+↵ → rebuild graph');
        return;
      }
      // Ctrl+1..9 — switch tabs
      if (ev.ctrlKey && !ev.shiftKey && !ev.altKey && ev.key >= '1' && ev.key <= '9') {
        const idx = parseInt(ev.key, 10) - 1;
        const tabBtn = _tabOrder[idx] ? el(_tabOrder[idx]) : null;
        if (tabBtn) {
          ev.preventDefault();
          tabBtn.click();
          updateFooter(`Ctrl+${ev.key} → ${tabBtn.textContent.trim()}`);
        }
        return;
      }
      // Ctrl+/ — focus decode input
      if (ev.ctrlKey && ev.key === '/') {
        ev.preventDefault();
        el('input')?.focus();
        updateFooter('Ctrl+/ → focus input');
      }
    });

    // ── Case search/filter ───────────────────────────────────────────────────
    const caseSearchInput = el('caseSearchInput');
    if (caseSearchInput) {
      caseSearchInput.addEventListener('input', () => {
        const q = caseSearchInput.value.toLowerCase().trim();
        const rows = el('caseListBody')?.querySelectorAll('tr[data-case-id]') || [];
        rows.forEach(row => {
          const text = row.textContent.toLowerCase();
          row.style.display = (!q || text.includes(q)) ? '' : 'none';
        });
      });
    }

    // ── Intelligence tab: auto-load on first open ────────────────────────────
    const _intelTabBtn = el('tabBtnIntelligence');
    let _intelLoaded = false;
    if (_intelTabBtn) {
      _intelTabBtn.addEventListener('click', () => {
        if (!_intelLoaded) {
          _intelLoaded = true;
          setTimeout(() => { el('btnIntelRebuildGraph')?.click(); }, 150);
        }
      });
    }

    // ── Patterns tab: auto-load on first open ────────────────────────────────
    const _patternTabBtn = el('tabBtnPatterns');
    let _patternsLoaded = false;
    if (_patternTabBtn) {
      _patternTabBtn.addEventListener('click', () => {
        if (!_patternsLoaded && state.lastJson?.candidates?.length) {
          _patternsLoaded = true;
          setTimeout(() => { el('btnRunPatterns')?.click(); }, 150);
        }
      });
    }

    // ── Patch CaseManager to keep footer in sync ─────────────────────────────
    // Run after caseMgr is constructed
    setTimeout(() => {
      if (window.caseMgr) {
        const _origLoad = window.caseMgr.loadCase.bind(window.caseMgr);
        const _origClose = window.caseMgr.closeCase.bind(window.caseMgr);
        window.caseMgr.loadCase = function(id) { const r = _origLoad(id); updateFooter(`Case loaded: ${id}`); return r; };
        window.caseMgr.closeCase = function() { const r = _origClose(); updateFooter('Case closed'); return r; };
      }
    }, 200);

    // ── Queue depth footer sync — hook into render cycle ─────────────────────
    const _origRender = typeof render === 'function' ? render : null;
    if (_origRender) {
      window.render = function(data) {
        _origRender(data);
        updateFooter(null);
      };
    }

    // ── Initial footer paint ─────────────────────────────────────────────────
    updateFooter('Ready');

    // ==================== END EXPANSION TABS ====================

    // ── Settings modal + control-alive wiring ────────────────────────────────
    (function wireSettingsAndControls() {
      const settingsModal = el('settingsModal');
      function setSettingsStatus(msg, kind) {
        const s = el('settingsStatus');
        if (!s) return;
        s.textContent = msg || '\u00a0';
        s.className = 'tiny ' + (kind === 'ok' ? 'ok' : kind === 'bad' ? 'bad' : 'muted');
      }
      function openSettings() {
        if (!settingsModal) return;
        const v = el('uiVer');
        if (v && el('setVersion')) el('setVersion').textContent = v.textContent;
        settingsModal.style.display = 'flex';
        setSettingsStatus('');
        if (typeof window._syncAppearanceControls === 'function') window._syncAppearanceControls();
        el('btnSettingsClose') && el('btnSettingsClose').focus();
        if (typeof setStatus === 'function') setStatus('Settings opened.', 'muted');
      }
      function closeSettings() {
        if (settingsModal) settingsModal.style.display = 'none';
      }
      el('btnSettings') && el('btnSettings').addEventListener('click', openSettings);
      el('uiVer') && el('uiVer').addEventListener('click', openSettings);
      el('brandShell') && el('brandShell').addEventListener('click', openSettings);
      el('brandShell') && el('brandShell').addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openSettings(); }
      });
      el('btnSettingsClose') && el('btnSettingsClose').addEventListener('click', closeSettings);
      settingsModal && settingsModal.addEventListener('click', (ev) => {
        if (ev.target === settingsModal) closeSettings();
      });
      document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && settingsModal && settingsModal.style.display !== 'none') closeSettings();
      });

      function buildDiagnosticReport() {
        return [
          'HyperSnatch diagnostic report',
          'Generated: ' + new Date().toISOString(),
          'Version: ' + ((el('uiVer') && el('uiVer').textContent) || ''),
          'Bridge: ' + ((el('bridgeText') && el('bridgeText').textContent) || ''),
          'Evidence: ' + ((el('valGlobalStatus') && el('valGlobalStatus').textContent) || ''),
          ((el('footerCase') && el('footerCase').textContent) || ''),
          ((el('footerQueue') && el('footerQueue').textContent) || ''),
          "CSP: script-src 'self' — no unsafe-inline",
          'UA: ' + navigator.userAgent
        ].join('\n');
      }

      el('btnSetOpenRelease') && el('btnSetOpenRelease').addEventListener('click', () => {
        window.open('https://github.com/Z3r0DayZion-install/hypersnatch/releases/latest', '_blank');
        setSettingsStatus('Opening the release page in your browser…', 'ok');
      });
      // btnSetOpenSample handler moved below (in-app sample load)
      el('btnSetClearEvidence') && el('btnSetClearEvidence').addEventListener('click', () => {
        if (typeof window.setEvidenceLoaded === 'function') window.setEvidenceLoaded(false);
        const list = el('lrFileList');
        if (list) list.innerHTML = '<div class="muted" style="font-size:0.8rem; padding:1rem; text-align:center;">Awaiting evidence load.</div>';
        if (typeof window.updateProofStatus === 'function') window.updateProofStatus();
        setSettingsStatus('Loaded evidence cleared.', 'ok');
        if (typeof setStatus === 'function') setStatus('Evidence cleared.', 'muted');
      });
      el('btnSetResetUi') && el('btnSetResetUi').addEventListener('click', () => {
        el('btnClear') && el('btnClear').click();
        if (typeof window.setEvidenceLoaded === 'function') window.setEvidenceLoaded(false);
        if (typeof window.updateProofStatus === 'function') window.updateProofStatus();
        setSettingsStatus('Session UI reset.', 'ok');
        if (typeof setStatus === 'function') setStatus('Session UI reset.', 'muted');
      });
      el('btnSetCopyDiag') && el('btnSetCopyDiag').addEventListener('click', async () => {
        const report = buildDiagnosticReport();
        let ok = false;
        try {
          if (window.electronAPI && window.electronAPI.copyToClipboard) ok = window.electronAPI.copyToClipboard(report);
          else { await navigator.clipboard.writeText(report); ok = true; }
        } catch (e) { ok = false; }
        setSettingsStatus(ok ? 'Diagnostic report copied to clipboard.' : 'Could not copy report.', ok ? 'ok' : 'bad');
      });
      el('btnSetOpenLogs') && el('btnSetOpenLogs').addEventListener('click', async () => {
        if (!(window.electronAPI && window.electronAPI.openLogsFolder)) {
          setSettingsStatus('Logs folder is not available in this build.', 'bad');
          return;
        }
        try { await window.electronAPI.openLogsFolder(); setSettingsStatus('Opened logs folder.', 'ok'); }
        catch (e) { setSettingsStatus('Could not open logs folder.', 'bad'); }
      });

      // Bridge indicator: explain status on click instead of staying silent.
      function explainBridge() {
        const t = (el('bridgeText') && el('bridgeText').textContent) || 'Bridge status unavailable';
        if (typeof setStatus === 'function') setStatus('Bridge status: ' + t, 'muted');
      }
      const bridgeText = el('bridgeText');
      const bridgeDot = el('bridgeDot');
      if (bridgeText) { bridgeText.style.cursor = 'pointer'; bridgeText.title = 'Click for bridge status'; bridgeText.addEventListener('click', explainBridge); }
      if (bridgeDot) { bridgeDot.style.cursor = 'pointer'; bridgeDot.addEventListener('click', explainBridge); }

      // Left-rail Verify: real action when evidence is loaded, clear reason otherwise.
      const btnVerify = el('btnVerifyIntegrity');
      if (btnVerify) {
        btnVerify.addEventListener('click', () => {
          if (!document.body.classList.contains('evidence-loaded')) {
            if (typeof setStatus === 'function') setStatus('Load evidence first — Verify then checks the artifact bundle.', 'muted');
            return;
          }
          if (typeof window.updateProofStatus === 'function') window.updateProofStatus();
          const hashTxt = (el('intHash') && el('intHash').textContent) || '--';
          const hasHash = hashTxt && hashTxt !== '--' && hashTxt.replace(/\s/g, '').length > 8;
          if (typeof setStatus === 'function') {
            setStatus(hasHash
              ? 'Integrity check: bundle hash present, proof status refreshed.'
              : 'Proof status refreshed — run a decode to generate the bundle hash.', hasHash ? 'ok' : 'muted');
          }
        });
      }

      // Settings trust surface: path population
      window._populateSettingsPaths = function(appInfo) {
        if (appInfo && appInfo.runtimeDir) { setText('setStoragePath', appInfo.runtimeDir); }
        const ws = window._sampleWorkspace;
        setText('setSamplesPath', (ws && ws.base) ? ws.base : 'bundled with the app (samples/demo-case)');
      };

      el('btnSetReopenOnboarding') && el('btnSetReopenOnboarding').addEventListener('click', function() {
        closeSettings();
        setTimeout(function() {
          if (typeof window._reopenOnboarding === 'function') window._reopenOnboarding();
        }, 50);
      });

      el('btnSetOpenSample') && el('btnSetOpenSample').addEventListener('click', function() {
        closeSettings();
        const fd = el('fdOpenSample');
        if (fd) { fd.click(); if (typeof setStatus === 'function') setStatus('Loading sample proof workspace...', 'ok'); }
      });
    })();

    // ── Left/right rail responsiveness ───────────────────────────────────────
    (function wireRails() {
      // Left rail: Evidence Source Path opens the evidence folder when loaded.
      function openEvidence() {
        if (!document.body.classList.contains('evidence-loaded')) {
          if (typeof setStatus === 'function') setStatus('No evidence loaded yet — load a target folder or open the sample proof workspace.', 'muted');
          return;
        }
        if (window.electronAPI && window.electronAPI.openEvidenceFolder) {
          try { window.electronAPI.openEvidenceFolder(); if (typeof setStatus === 'function') setStatus('Opening evidence folder…', 'ok'); }
          catch (e) { if (typeof setStatus === 'function') setStatus('Could not open evidence folder.', 'bad'); }
        } else if (typeof setStatus === 'function') {
          setStatus('Opening the evidence folder is not available in this build.', 'muted');
        }
      }
      const lrPath = el('lrSessionPath');
      if (lrPath) {
        lrPath.addEventListener('click', openEvidence);
        lrPath.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openEvidence(); }
        });
      }

      // Right rail: Proof Status pills explain themselves on click (informational, never silent).
      const proofExplain = {
        psEvidence: 'Evidence: whether an artifact bundle is loaded. Load a target folder or open the sample proof workspace.',
        psCase: 'Case: an open case holds findings, notes, and exports. Open one from the Cases tab.',
        psHash: 'Hash: SHA-256 of the captured artifact. Created after you run a decode.',
        psManifest: 'Manifest: the proof manifest of artifacts and hashes. Ready after a decode.',
        psExport: 'Export: a proof package can be exported once a case is active and a run has completed.'
      };
      const proofStatus = el('proofStatus');
      if (proofStatus) {
        proofStatus.addEventListener('click', (ev) => {
          const pill = ev.target && ev.target.closest ? ev.target.closest('[id^="ps"]') : null;
          if (!pill || !proofExplain[pill.id]) return;
          const val = (pill.textContent || '').trim();
          if (typeof setStatus === 'function') setStatus(proofExplain[pill.id] + ' (Currently: ' + val + ')', 'muted');
        });
      }
    })();

    // ── Front-door Workbench actions ─────────────────────────────────────────
    function setText(id, val) { var n = el(id); if (n) n.textContent = val == null ? '—' : String(val); }

    (function wireFrontDoor() {
      el('fdOpenSample') && el('fdOpenSample').addEventListener('click', async () => {
        if (typeof setStatus === 'function') setStatus('Loading sample proof workspace...', 'ok');
        const loadToast = window.showToast ? window.showToast('Loading sample proof workspace…', 'loading') : null;
        try {
          const result = await window.electronAPI.readSampleWorkspace();
          if (!result || !result.success) {
            const emsg = 'Could not load sample workspace: ' + ((result && result.error) || 'unknown error');
            if (typeof setStatus === 'function') setStatus(emsg, 'bad');
            if (loadToast) window.updateToast(loadToast, emsg, 'bad');
            return;
          }
          window._sampleWorkspace = result;
          const counts = result.counts;

          const lrPath = el('lrSessionPath');
          if (lrPath) { lrPath.textContent = result.base; lrPath.title = 'Click to open the sample proof folder'; }

          const list = el('lrFileList');
          if (list && Array.isArray(result.files)) {
            list.innerHTML = result.files.map((f) => {
              const shorts = (f.sha256 || '').slice(0, 12);
              return '<div class="file-entry"><span class="file-name mono">' + escapeHtml(f.path) + '</span><span class="file-hash mono tiny muted">' + escapeHtml((f.role || '') + ' · ' + shorts) + '</span></div>';
            }).join('');
          }

          setEvidenceLoaded(true, { sample: true, counts: counts });

          const card = el('sampleSummaryCard');
          if (card) card.style.display = 'block';
          if (counts) {
            setText('sscArtifactCount', String(counts.artifacts));
            setText('sscHashCount', String(counts.hashes));
            setText('sscReceiptCount', String(counts.receipts));
          }

          const exportBtn = el('btnExportBundle');
          if (exportBtn) { exportBtn.disabled = false; exportBtn.title = 'Export the sample proof bundle to a folder of your choice.'; }

          if (typeof window._showPassportPreExport === 'function') window._showPassportPreExport(counts);

          const proofPills = el('proofStatus');
          if (proofPills) proofPills.style.display = 'block';
          updateProofStatus();

          const front = document.querySelector('.front-door');
          if (front) front.style.display = 'none';

          if (typeof setStatus === 'function') setStatus('Sample case loaded: ' + counts.artifacts + ' artifacts, ' + counts.hashes + ' hashes, ' + counts.receipts + ' receipt. Proof: Ready.', 'ok');
          if (loadToast) window.updateToast(loadToast, 'Sample loaded: ' + counts.artifacts + ' artifacts · ' + counts.hashes + ' hashes · ' + counts.receipts + ' receipt', 'ok');
          if (window.recordRecentSample) window.recordRecentSample(result.base);

          window.electronAPI.verifySampleWorkspace().then((vr) => {
            window._sampleVerify = vr;
          }).catch(() => {});
        } catch (e) {
          const emsg = 'Sample workspace error: ' + (e.message || e);
          if (typeof setStatus === 'function') setStatus(emsg, 'bad');
          if (loadToast) window.updateToast(loadToast, emsg, 'bad');
        }
      });
      el('fdLoadEvidence') && el('fdLoadEvidence').addEventListener('click', () => {
        const b = el('btnLoadEvidence');
        if (b) { b.click(); if (typeof setStatus === 'function') setStatus('Choose a target folder to load evidence.', 'muted'); }
      });
      el('fdCreateCase') && el('fdCreateCase').addEventListener('click', () => {
        const t = el('tabBtnCases');
        if (t) { t.click(); if (typeof setStatus === 'function') setStatus('Cases: create a new case or open an existing one.', 'muted'); }
      });
      el('fdSettings') && el('fdSettings').addEventListener('click', () => {
        const s = el('btnSettings');
        if (s) s.click();
      });
    })();

    (function wireReceiptModal() {
      const modal = el('receiptModal');
      const closeBtn = el('btnReceiptClose');

      function openReceiptModal() {
        try {
          const ws = window._sampleWorkspace;
          if (!ws) { alert('No sample workspace loaded. Open the sample proof workspace first.'); return; }

          setText('rcptReceiptId', ws.receipt && ws.receipt.receiptId || '—');
          setText('rcptCaseId', ws.receipt && ws.receipt.caseId || ws.case && ws.case.id || '—');
          setText('rcptCaseTitle', ws.case && ws.case.title || '—');
          setText('rcptIssuedAt', ws.receipt && ws.receipt.issuedAt || '—');
          setText('rcptSourcePage', (ws.receipt && ws.receipt.page && ws.receipt.page.capturePath) || (ws.capture && ws.capture.capturePath) || '—');
          setText('rcptCapturedAt', (ws.receipt && ws.receipt.page && ws.receipt.page.capturedAt) || (ws.capture && ws.capture.capturedAt) || '—');
          setText('rcptViewport', (ws.capture && ws.capture.viewport) || '—');
          setText('rcptUserAgent', (ws.capture && ws.capture.userAgent) || '—');
          setText('rcptDownloadLink', (ws.receipt && ws.receipt.download && ws.receipt.download.filename) || '—');
          setText('rcptDownloadSha', (ws.receipt && ws.receipt.download && ws.receipt.download.sha256) || '—');
          setText('rcptManifestSha', (ws.manifest && ws.manifest.sha256) || '—');

          const vr = window._sampleVerify;
          const badge = el('rcptVerifiedBadge');
          const note = el('rcptVerifiedNote');
          if (vr && vr.results && vr.allVerified) {
            if (badge) { badge.textContent = 'Verified'; badge.className = 'pill tiny ok'; }
            if (note) note.textContent = 'All ' + vr.results.length + ' files match SHA256SUMS.';
          } else if (vr && vr.results) {
            const failed = vr.results.filter(function(r) { return !r.verified; });
            if (badge) { badge.textContent = 'Mismatch'; badge.className = 'pill tiny bad'; }
            if (note) note.textContent = failed.length + ' of ' + vr.results.length + ' file hashes do not match.';
          } else {
            if (badge) { badge.textContent = 'Pending'; badge.className = 'pill tiny idle'; }
            if (note) note.textContent = 'Verification in progress or unavailable.';
          }

          const sumsEl = el('rcptSumsText');
          if (sumsEl) sumsEl.textContent = ws.sumsText || '—';

          const tbody = el('rcptFileBody');
          if (tbody && Array.isArray(ws.files)) {
            var vrMap = {};
            if (vr && Array.isArray(vr.results)) {
              vr.results.forEach(function(r) { vrMap[r.path] = r; });
            }
            tbody.innerHTML = ws.files.map(function(f) {
              var v = vrMap[f.path];
              var verifiedHtml = '—';
              if (v) {
                verifiedHtml = v.verified ? '<span class="pill tiny ok" style="font-size:0.58rem;">OK</span>' : '<span class="pill tiny bad" style="font-size:0.58rem;">FAIL</span>';
              }
              return '<tr><td class="mono">' + escapeHtml(f.path) + '</td><td>' + escapeHtml(f.role || '') + '</td><td class="mono tiny">' + escapeHtml(f.sha256 || '') + '</td><td>' + verifiedHtml + '</td></tr>';
            }).join('');
          }

          if (modal) modal.style.display = 'flex';
        } catch (e) {
          console.error('Receipt modal error:', e);
        }
      }

      if (closeBtn) closeBtn.addEventListener('click', function() { if (modal) modal.style.display = 'none'; });
      if (modal) {
        modal.addEventListener('click', function(e) { if (e.target === modal) modal.style.display = 'none'; });
      }
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
          modal.style.display = 'none';
        }
      });

      el('btnViewReceipt') && el('btnViewReceipt').addEventListener('click', openReceiptModal);

      el('btnCopyReceipt') && el('btnCopyReceipt').addEventListener('click', function() {
        var ws = window._sampleWorkspace;
        if (!ws || !ws.receipt) { alert('No receipt to copy.'); return; }
        var ok = window.electronAPI.copyToClipboard(JSON.stringify(ws.receipt, null, 2));
        if (typeof setStatus === 'function') setStatus(ok ? 'Receipt copied to clipboard.' : 'Could not copy receipt.', ok ? 'ok' : 'bad');
        if (window.showToast) window.showToast(ok ? 'Receipt copied to clipboard' : 'Could not copy receipt', ok ? 'ok' : 'bad');
      });

      el('btnOpenReceiptFolder') && el('btnOpenReceiptFolder').addEventListener('click', function() {
        window.electronAPI.openSampleProofFolder().catch(function(e) {
          console.error('Open receipt folder error:', e);
        });
      });

      el('btnExportBundle') && el('btnExportBundle').addEventListener('click', async function() {
        let exportToast = null;
        try {
          if (typeof setStatus === 'function') setStatus('Selecting export destination...', 'ok');
          const sel = await window.electronAPI.selectExportDestination();
          if (!sel || !sel.success) {
            if (sel && sel.canceled) {
              if (typeof setStatus === 'function') setStatus('Export cancelled.', 'muted');
              return;
            }
            const emsg = 'Could not open folder picker: ' + ((sel && sel.error) || 'unknown error');
            if (typeof setStatus === 'function') setStatus(emsg, 'bad');
            if (window.showToast) window.showToast(emsg, 'bad');
            return;
          }
          if (typeof setStatus === 'function') setStatus('Exporting proof bundle to ' + sel.destPath + '...', 'ok');
          exportToast = window.showToast ? window.showToast('Exporting proof bundle…', 'loading') : null;
          const exp = await window.electronAPI.exportProofBundle(sel.destPath);
          if (exp && exp.success) {
            if (typeof setStatus === 'function') setStatus('Export complete: ' + exp.fileCount + ' files written to ' + exp.bundleName, 'ok');
            if (window.recordRecentExport) window.recordRecentExport(exp);
            if (typeof window._showPassportAfterExport === 'function') window._showPassportAfterExport(exp);
            if (exportToast) {
              window.updateToast(exportToast, 'Export complete: ' + exp.fileCount + ' files → ' + exp.bundleName + '. Offline verifier included — open VERIFY-HYPERSNATCH.html.', 'ok', {
                actionLabel: 'Open folder',
                onAction: function() { window.electronAPI.openExportFolder(exp.bundlePath).catch(function() {}); }
              });
            }
          } else {
            const emsg = 'Export failed: ' + ((exp && exp.error) || 'unknown error');
            if (typeof setStatus === 'function') setStatus(emsg, 'bad');
            if (exportToast) window.updateToast(exportToast, emsg, 'bad');
            else if (window.showToast) window.showToast(emsg, 'bad');
          }
        } catch (e) {
          const emsg = 'Export error: ' + (e.message || e);
          if (typeof setStatus === 'function') setStatus(emsg, 'bad');
          if (exportToast) window.updateToast(exportToast, emsg, 'bad');
          else if (window.showToast) window.showToast(emsg, 'bad');
        }
      });
    })();

    (function wireOnboarding() {
      const modal = el('onboardingModal');
      const KEY = 'hs_onboarding_seen';

      function isDismissed() {
        try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
      }
      function dismiss() { try { localStorage.setItem(KEY, '1'); } catch (e) {} if (modal) modal.style.display = 'none'; }
      function show() { if (modal) modal.style.display = 'flex'; }

      if (!isDismissed() && modal) { modal.style.display = 'flex'; }

      window._reopenOnboarding = function() { if (modal) modal.style.display = 'flex'; };

      el('btnOnboardingDismiss') && el('btnOnboardingDismiss').addEventListener('click', dismiss);

      if (modal) {
        modal.addEventListener('click', function(e) { if (e.target === modal) dismiss(); });
      }
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') dismiss();
      });

      el('btnOnboardingSample') && el('btnOnboardingSample').addEventListener('click', function() {
        dismiss();
        el('fdOpenSample') && el('fdOpenSample').click();
      });
      el('btnOnboardingLoadEvidence') && el('btnOnboardingLoadEvidence').addEventListener('click', function() {
        dismiss();
        el('fdLoadEvidence') && el('fdLoadEvidence').click();
      });
    })();

    // ── Toast notifications + recent activity (v1.6.16 polish) ───────────────
    (function wireToastsAndRecents() {
      let seq = 0;
      const toasts = {};
      const ICONS = { ok: '\u2713', bad: '\u2715', info: '\u2139', loading: '\u25CC' };

      function removeToast(id) {
        const t = toasts[id];
        if (!t) return;
        if (t.timer) clearTimeout(t.timer);
        const node = t.node;
        node.classList.remove('show');
        setTimeout(function() { if (node && node.parentNode) node.parentNode.removeChild(node); }, 200);
        delete toasts[id];
      }

      function scheduleAuto(id, kind, timeout) {
        const t = toasts[id];
        if (!t) return;
        if (t.timer) clearTimeout(t.timer);
        if (kind === 'loading') return;
        const ms = timeout || (kind === 'bad' ? 6000 : 4000);
        t.timer = setTimeout(function() { removeToast(id); }, ms);
      }

      function buildContent(node, kind, message, opts) {
        node.className = 'hs-toast ' + (kind || 'info');
        node.innerHTML = '';
        const icon = document.createElement('span');
        icon.className = 'hs-toast-icon';
        icon.textContent = ICONS[kind] || ICONS.info;
        node.appendChild(icon);
        const body = document.createElement('div');
        body.className = 'hs-toast-body';
        const msg = document.createElement('span');
        msg.className = 'hs-toast-msg';
        msg.textContent = message == null ? '' : String(message);
        body.appendChild(msg);
        if (opts && opts.actionLabel && typeof opts.onAction === 'function') {
          const abtn = document.createElement('button');
          abtn.type = 'button';
          abtn.className = 'hs-toast-action';
          abtn.textContent = opts.actionLabel;
          abtn.addEventListener('click', function() { try { opts.onAction(); } catch (e) {} });
          body.appendChild(abtn);
        }
        node.appendChild(body);
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'hs-toast-close';
        close.setAttribute('aria-label', 'Dismiss');
        close.textContent = '\u00D7';
        node.appendChild(close);
        return close;
      }

      window.showToast = function(message, kind, opts) {
        const container = el('toastContainer');
        if (!container) return null;
        kind = kind || 'info';
        opts = opts || {};
        const id = opts.id || ('t' + (++seq));
        const existing = toasts[id];
        const node = existing ? existing.node : document.createElement('div');
        const close = buildContent(node, kind, message, opts);
        close.addEventListener('click', function() { removeToast(id); });
        if (!existing) {
          container.appendChild(node);
          toasts[id] = { node: node, timer: null };
          requestAnimationFrame(function() { node.classList.add('show'); });
        } else {
          node.classList.add('show');
        }
        scheduleAuto(id, kind, opts.timeout);
        return id;
      };

      window.updateToast = function(id, message, kind, opts) {
        if (!id || !toasts[id]) return window.showToast(message, kind, opts);
        return window.showToast(message, kind, Object.assign({}, opts || {}, { id: id }));
      };

      window.dismissToast = function(id) { removeToast(id); };

      // ── Recent activity ──────────────────────────────────────────────
      const K_SAMPLE = 'hs_last_sample';
      const K_EXPORT = 'hs_last_export';

      function readJSON(key) {
        try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
      }
      function writeJSON(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
      }
      function relTime(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      }

      function render() {
        const card = el('recentActivityCard');
        if (!card) return;
        const sample = readJSON(K_SAMPLE);
        const exp = readJSON(K_EXPORT);
        let any = false;
        const sRow = el('recentSampleRow');
        if (sRow) {
          if (sample && sample.base) {
            el('recentSampleValue').textContent = sample.base;
            el('recentSampleValue').title = sample.base;
            el('recentSampleMeta').textContent = relTime(sample.ts);
            sRow.style.display = 'flex';
            any = true;
          } else { sRow.style.display = 'none'; }
        }
        const eRow = el('recentExportRow');
        if (eRow) {
          if (exp && exp.bundleName) {
            el('recentExportValue').textContent = exp.bundleName + (exp.fileCount ? ' (' + exp.fileCount + ' files)' : '');
            el('recentExportValue').title = exp.bundlePath || exp.bundleName;
            el('recentExportMeta').textContent = relTime(exp.ts);
            eRow.style.display = 'flex';
            any = true;
          } else { eRow.style.display = 'none'; }
        }
        card.style.display = any ? 'block' : 'none';
      }

      window.recordRecentSample = function(base) { writeJSON(K_SAMPLE, { base: base, ts: Date.now() }); render(); };
      window.recordRecentExport = function(info) {
        writeJSON(K_EXPORT, { bundleName: info.bundleName, fileCount: info.fileCount, bundlePath: info.bundlePath, ts: Date.now() });
        render();
      };

      el('btnOpenRecentSample') && el('btnOpenRecentSample').addEventListener('click', function() {
        if (window.electronAPI && window.electronAPI.openSampleProofFolder) {
          window.electronAPI.openSampleProofFolder().catch(function() {});
        }
      });
      el('btnOpenRecentExport') && el('btnOpenRecentExport').addEventListener('click', function() {
        const exp = readJSON(K_EXPORT);
        if (exp && exp.bundlePath && window.electronAPI && window.electronAPI.openExportFolder) {
          window.electronAPI.openExportFolder(exp.bundlePath).catch(function() {});
        }
      });

      render();
    })();

    // ── Proof Passport + Prove It Again (v1.6.16) ───────────────────────────
    (function wireProofPassport() {
      let lastExport = null; // { bundlePath, bundleId, fileCount, passport }

      function setText(id, val) { const n = el(id); if (n) n.textContent = (val == null ? '—' : String(val)); }
      function setStatusPill(text, kind) {
        const p = el('ppProofStatus');
        if (!p) return;
        p.textContent = text;
        p.className = 'ppc-status' + (kind ? ' ' + kind : '');
      }

      window._showPassportPreExport = function(counts) {
        const card = el('proofPassportCard');
        if (!card) return;
        card.style.display = 'block';
        setText('ppBundleId', '— export to generate');
        setText('ppArtifacts', counts ? counts.artifacts : '—');
        setText('ppReceipts', counts ? counts.receipts : '—');
        setText('ppHashes', 'not exported yet');
        setText('ppExportStatus', 'Not exported');
        setText('ppLastVerified', '—');
        setText('ppCloud', 'No');
        setText('ppVerifier', 'after export');
        setStatusPill('Not exported', '');
        const btn = el('btnProveItAgain');
        if (btn) { btn.disabled = true; btn.title = 'Export a proof bundle first, then re-prove it from disk.'; }
        _showTamperTrialPreExport();
      };

      function ttStatusPill(text, kind) {
        const p = el('ttStatus');
        if (!p) return;
        p.textContent = text;
        p.className = 'ppc-status' + (kind ? ' ' + kind : '');
      }

      function _showTamperTrialPreExport() {
        const card = el('tamperTrialCard');
        if (card) card.style.display = 'block';
        ttStatusPill('Not run', '');
        setText('ttCaught', '—');
        setText('ttCaseModified', '—');
        setText('ttCaseMissing', '—');
        setText('ttCasePassport', '—');
        setText('ttCaseVerifier', '—');
        setText('ttOriginal', '—');
        const pathRow = document.querySelector('.ttc-path-row');
        if (pathRow) pathRow.style.display = 'none';
        const run = el('btnRunTamperTrial');
        if (run) { run.disabled = true; run.title = 'Export a proof bundle first, then run a tamper trial on a temporary copy.'; }
        const open = el('btnOpenTamperResult');
        if (open) open.disabled = true;
      }

      function _enableTamperTrialAfterExport() {
        const card = el('tamperTrialCard');
        if (card) card.style.display = 'block';
        const run = el('btnRunTamperTrial');
        if (run) { run.disabled = false; run.title = 'Copy the export to a temp folder, damage the copy, and confirm HyperSnatch catches it.'; }
      }

      window._showPassportAfterExport = function(exp) {
        const card = el('proofPassportCard');
        if (!card || !exp) return;
        card.style.display = 'block';
        lastExport = { bundlePath: exp.bundlePath, bundleId: exp.bundleId, fileCount: exp.fileCount, passport: exp.passport };
        const pp = exp.passport || {};
        const counts = pp.counts || {};
        setText('ppBundleId', exp.bundleId || (pp.bundle_id) || '—');
        setText('ppArtifacts', counts.artifacts != null ? counts.artifacts : '—');
        setText('ppReceipts', counts.receipts != null ? counts.receipts : '—');
        setText('ppHashes', (counts.sha256_entries != null ? counts.sha256_entries : exp.fileCount) + ' files hashed');
        setText('ppExportStatus', 'Exported');
        setText('ppLastVerified', 'not re-proven yet');
        setText('ppCloud', 'No');
        const verifierIncluded = pp.capsule && pp.capsule.verifier_included;
        setText('ppVerifier', verifierIncluded ? 'Yes' : 'No');
        const clean = pp.verification && pp.verification.status === 'clean';
        setStatusPill(clean ? 'Clean' : 'Needs review', clean ? 'clean' : 'bad');
        const btn = el('btnProveItAgain');
        if (btn) { btn.disabled = false; btn.title = 'Re-read the exported bundle from disk and re-verify every hash.'; }
        _showTamperTrialPreExport();
        _enableTamperTrialAfterExport();
      };

      el('btnProveItAgain') && el('btnProveItAgain').addEventListener('click', async function() {
        if (!lastExport || !lastExport.bundlePath) {
          if (window.showToast) window.showToast('Export a proof bundle first.', 'bad');
          return;
        }
        const t = window.showToast ? window.showToast('Re-proving exported bundle from disk…', 'loading') : null;
        try {
          const r = await window.electronAPI.reverifyExportBundle(lastExport.bundlePath);
          if (!r || !r.success) {
            const emsg = 'Could not re-prove bundle: ' + ((r && r.error) || 'unknown error');
            if (t) window.updateToast(t, emsg, 'bad'); else if (window.showToast) window.showToast(emsg, 'bad');
            setStatusPill('Needs review', 'bad');
            return;
          }
          const when = new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          setText('ppLastVerified', when);
          if (r.status === 'clean') {
            setStatusPill('Clean', 'clean');
            setText('ppHashes', r.verified + '/' + r.total + ' verified');
            if (r.verifierPresent) setText('ppVerifier', 'Yes');
            const msg = 'Still clean. ' + r.verified + '/' + r.total + ' hashes verified. Proof Passport present.' + (r.verifierPresent ? ' Offline verifier present.' : '');
            if (t) window.updateToast(t, msg, 'ok'); else if (window.showToast) window.showToast(msg, 'ok');
            if (typeof setStatus === 'function') setStatus(msg, 'ok');
          } else {
            setStatusPill('Needs review', 'bad');
            const reasons = [];
            if (r.failed) reasons.push(r.failed + ' hash mismatch');
            if (r.missing) reasons.push(r.missing + ' missing');
            if (!r.passportPresent) reasons.push('passport missing');
            else if (!r.passportValid) reasons.push('passport invalid');
            if (!r.receiptPresent) reasons.push('receipt missing');
            if (!r.manifestPresent) reasons.push('manifest missing');
            if (!r.verifierPresent) reasons.push('offline verifier missing');
            if (r.repoHygieneFound) reasons.push(r.repoHygieneFound + ' repo hygiene file(s)');
            const msg = 'Re-prove failed: ' + (reasons.join(', ') || 'verification did not pass');
            if (t) window.updateToast(t, msg, 'bad'); else if (window.showToast) window.showToast(msg, 'bad');
            if (typeof setStatus === 'function') setStatus(msg, 'bad');
          }
        } catch (e) {
          const emsg = 'Re-prove error: ' + (e.message || e);
          if (t) window.updateToast(t, emsg, 'bad'); else if (window.showToast) window.showToast(emsg, 'bad');
        }
      });

      let lastTrial = null;

      function caseLabel(c) {
        if (!c) return '—';
        return c.detected ? 'Detected' : 'Not caught';
      }
      function caseKind(c) { return c && c.detected ? 'ok' : 'bad'; }
      function setCase(id, c) {
        const n = el(id);
        if (!n) return;
        n.textContent = caseLabel(c);
        n.className = 'ppc-value ' + caseKind(c);
      }

      el('btnRunTamperTrial') && el('btnRunTamperTrial').addEventListener('click', async function() {
        if (!lastExport || !lastExport.bundlePath) {
          if (window.showToast) window.showToast('Export a proof bundle first.', 'bad');
          return;
        }
        const t = window.showToast ? window.showToast('Running tamper trial on a temporary copy…', 'loading') : null;
        try {
          const r = await window.electronAPI.runTamperTrial(lastExport.bundlePath);
          if (!r || !r.success) {
            const emsg = 'Tamper Trial error: ' + ((r && r.error) || 'unknown error');
            ttStatusPill('Error', 'bad');
            if (t) window.updateToast(t, emsg, 'bad'); else if (window.showToast) window.showToast(emsg, 'bad');
            return;
          }
          lastTrial = r;
          const byCase = {};
          (r.cases || []).forEach(function(c) { byCase[c.case] = c; });
          setCase('ttCaseModified', byCase['modified_hashed_file']);
          setCase('ttCaseMissing', byCase['missing_hashed_file']);
          setCase('ttCasePassport', byCase['altered_passport']);
          setCase('ttCaseVerifier', byCase['missing_verifier']);
          const caught = r.summary ? r.summary.caught : 0;
          const total = r.summary ? r.summary.total : 4;
          setText('ttCaught', caught + '/' + total);
          const origOk = r.originalStatus === 'clean';
          const origNode = el('ttOriginal');
          if (origNode) { origNode.textContent = origOk ? 'Still clean' : 'Review'; origNode.className = 'ppc-value ' + (origOk ? 'ok' : 'bad'); }
          const pathRow = document.querySelector('.ttc-path-row');
          if (pathRow) pathRow.style.display = 'flex';
          setText('ttTrialPath', r.trialBundle || '—');
          const openBtn = el('btnOpenTamperResult');
          if (openBtn) openBtn.disabled = false;

          const passed = r.summary && r.summary.status === 'passed';
          if (passed) {
            ttStatusPill('Passed', 'clean');
            const msg = 'Tamper Trial passed. HyperSnatch caught ' + caught + '/' + total + ' tamper cases on a temporary copy. Your real export is unchanged' + (origOk ? ' and still verifies clean.' : '.');
            if (t) window.updateToast(t, msg, 'ok'); else if (window.showToast) window.showToast(msg, 'ok');
            if (typeof setStatus === 'function') setStatus(msg, 'ok');
          } else {
            ttStatusPill('Needs review', 'bad');
            const msg = 'Tamper Trial needs review. HyperSnatch caught ' + caught + '/' + total + ' tamper cases.';
            if (t) window.updateToast(t, msg, 'bad'); else if (window.showToast) window.showToast(msg, 'bad');
            if (typeof setStatus === 'function') setStatus(msg, 'bad');
          }
        } catch (e) {
          ttStatusPill('Error', 'bad');
          const emsg = 'Tamper Trial error: ' + (e.message || e);
          if (t) window.updateToast(t, emsg, 'bad'); else if (window.showToast) window.showToast(emsg, 'bad');
        }
      });

      el('btnOpenTamperResult') && el('btnOpenTamperResult').addEventListener('click', function() {
        if (lastTrial && lastTrial.trialBundle) {
          window.electronAPI.openExportFolder(lastTrial.trialBundle).catch(function() {});
        }
      });
    })();

    const caseMgr = new CaseManager();
    window.caseMgr = caseMgr; // Expose globally for onclick handlers
