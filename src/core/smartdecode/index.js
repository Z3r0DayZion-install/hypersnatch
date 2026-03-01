"use strict";

const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const Preprocessor = require("./preprocessor");
const DirectExtractor = require("./direct");
const Base64Extractor = require("./base64");
const AuthBoundaryDetector = require("./auth-boundary");
const Ranker = require("./ranker");
const Iframe = require("./iframe");
const HostExtractors = require("./hosts");
const RustEngine = require("./rust-engine");
const IntelligenceManager = require("./intelligence_manager");

function scanHttpUrls(text) {
  const s = String(text || "");
  const re = /https?:\/\/[^\s"'<>]+/gi;
  const out = [];
  let m;
  while ((m = re.exec(s))) {
    const cleaned = m[0].replace(/[),.;]+$/g, "");
    out.push(cleaned);
  }
  return out;
}

/**
 * SmartDecode 2.4.0 - Orchestration Module
 * Deterministic forensic extraction pipeline.
 */
const SmartDecode = {
  VERSION: "2.4.0",
  MAX_RECURSION_DEPTH: 3,

  /**
   * Deterministic pipeline entry.
   */
  async run(input, options = {}) {
    // 0. Initialize Intelligence (Institutional Hardening)
    const intelPath = options.intelligencePath || path.join(__dirname, '..', '..', '..', 'config', 'forensic_intelligence.json');
    await IntelligenceManager.initialize(intelPath);

    const requested = String(options.engine || process.env.HYPERSNATCH_SMARTDECODE_ENGINE || "").toLowerCase();
    const engine = (requested === "auto" ? "" : requested) || (Boolean(process.versions && process.versions.electron) ? "rust" : "js");
    
    if (engine === "rust") {
      const strict = Boolean(options.strictEngine) || process.env.HYPERSNATCH_SMARTDECODE_ENGINE_STRICT === "1";
      if (RustEngine.canRun()) {
        try {
          const r = await RustEngine.smartdecode(String(input || ""), { splitSegments: Boolean(options.splitSegments) });
          return {
            version: this.VERSION,
            candidates: Array.isArray(r?.candidates) ? r.candidates : [],
            best: r?.best ?? null,
            refusals: Array.isArray(r?.refusals) ? r.refusals : [],
          };
        } catch (e) {
          if (strict) throw e;
        }
      }
    }

    const normalized = Preprocessor.normalize(input);
    let segments = [normalized];

    // Segment splitting for memory optimization on massive payloads
    if (options.splitSegments || normalized.length > 5 * 1024 * 1024) {
      segments = this.chunkInput(normalized, 2 * 1024 * 1024);
    }

    const allAccepted = [];
    const allRefused = [];

    for (const segment of segments) {
      if (!segment.trim()) continue;
      const result = await this.processSegment(segment, 0); // Start at depth 0
      allAccepted.push(...result.candidates);
      allRefused.push(...result.refusals);
    }

    // Deterministic Sort
    const clean = (s) => String(s ?? "").replace(/\0/g, "");
    const getSortKey = (obj, keys) => keys.map((k) => clean(obj?.[k])).join("\0");
    const sortC = (a, b) => {
      const kA = getSortKey(a, ["host", "type", "url"]);
      const kB = getSortKey(b, ["host", "type", "url"]);
      return kA < kB ? -1 : (kA > kB ? 1 : 0);
    };
    const sortR = (a, b) => {
      const kA = getSortKey(a, ["host", "reason", "url"]);
      const kB = getSortKey(b, ["host", "reason", "url"]);
      return kA < kB ? -1 : (kA > kB ? 1 : 0);
    };

    const finalRanked = Ranker.rank(allAccepted.sort(sortC));

    return {
      version: this.VERSION,
      candidates: finalRanked.candidates,
      best: finalRanked.best,
      refusals: allRefused.sort(sortR),
    };
  },

  async processSegment(html, depth = 0) {
    if (depth > this.MAX_RECURSION_DEPTH) return { candidates: [], refusals: [] };

    const refused = [];
    const byUrl = new Map();

    // 1. Packed JS Guard
    if (/eval\(function\(p,a,c,k,e,d\)/i.test(html)) {
      if ((DirectExtractor.extract(html) || []).length === 0) {
        refused.push({ host: "packed_js_block", reason: "dynamic_execution_required", status: "rejected", url: "" });
        return { candidates: [], refusals: refused };
      }
    }

    // 2. Static Extraction Layers
    const nestedCandidates = await Iframe.extract(html, async (nestedHtml, nextDepth) => {
      return await this.processSegment(nestedHtml, nextDepth);
    }, depth);

    const raw = [
      ...(DirectExtractor.extract(html) || []),
      ...(Base64Extractor.extract(html, DirectExtractor, HostExtractors) || []),
      ...(HostExtractors.extractAll(html) || []),
      ...(nestedCandidates || []),
    ];

    for (const c of raw) {
      let urlStr = String(c?.url || "");
      if (!urlStr) continue;

      try { urlStr = new URL(urlStr).href; } catch (e) {}

      if (!/^https?:\/\//i.test(urlStr)) {
        refused.push({ host: c?.host || "unknown", reason: "incomplete_or_relative_url", status: "rejected", url: urlStr });
        continue;
      }

      const auth = AuthBoundaryDetector.check(urlStr, html);
      if (auth?.requiresAuthorization) {
        refused.push({ host: c?.host || "unknown", reason: auth.stopReason || "requires_auth", status: "rejected", url: urlStr });
      } else {
        const candidate = {
          ...c,
          type: this.classifyType(urlStr, html),
          fingerprint: crypto.createHash("sha256").update(urlStr).digest("hex"),
          status: "accepted",
          url: urlStr,
        };

        const keyNew = (String(candidate.host ?? "") + "\0" + String(candidate.type ?? "") + "\0" + String(candidate.url ?? ""));
        const prev = byUrl.get(urlStr);
        if (!prev) {
          byUrl.set(urlStr, candidate);
        } else {
          const keyPrev = (String(prev.host ?? "") + "\0" + String(prev.type ?? "") + "\0" + String(prev.url ?? ""));
          if (keyNew < keyPrev) byUrl.set(urlStr, candidate);
        }
      }
    }

    // URL Sweep for Boundary Detection
    for (const u of scanHttpUrls(html)) {
      const auth = AuthBoundaryDetector.check(u, html);
      if (auth && auth.requiresAuthorization) {
        refused.push({
          host: (() => { try { return new URL(u).hostname; } catch { return "unknown"; } })(),
          reason: auth.stopReason || "Cash Policy Shield violation",
          url: u
        });
      }
    }

    const rankedResults = Ranker.rank(Array.from(byUrl.values()));
    return { candidates: rankedResults.candidates, best: rankedResults.best, refusals: refused };
  },

  classifyType(url, rawHtmlSnippet) {
    try {
      const p = new URL(url).pathname.toLowerCase();
      if (p.endsWith(".m3u8")) return "m3u8";
      if (p.endsWith(".mp4")) return "mp4";
      if (p.endsWith(".pdf")) return "document";
    } catch (e) {
      const lowerUrl = url.toLowerCase().split("?")[0];
      if (lowerUrl.endsWith(".m3u8")) return "m3u8";
      if (lowerUrl.endsWith(".mp4")) return "mp4";
      if (lowerUrl.endsWith(".pdf")) return "document";
    }
    if (rawHtmlSnippet && rawHtmlSnippet.includes("#EXTM3U")) return "hls";
    return "link";
  },

  chunkInput(str, chunkSize) {
    const segments = [];
    let i = 0;
    while (i < str.length) {
      let end = i + chunkSize;
      if (end < str.length) {
        let safeEnd = -1;
        for (let j = end; j > Math.max(i, end - 10000); j--) {
          if (/[ \n\r\t<>]/.test(str[j])) {
            safeEnd = j;
            break;
          }
        }
        end = safeEnd !== -1 ? safeEnd : end;
      }
      segments.push(str.substring(i, end));
      i = end;
    }
    return segments;
  }
};

module.exports = SmartDecode;
