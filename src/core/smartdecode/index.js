"use strict";

const crypto = require("crypto");
const Preprocessor = require("./preprocessor");
const DirectExtractor = require("./direct");
const Base64Extractor = require("./base64");
const AuthBoundaryDetector = require("./auth-boundary");
const Ranker = require("./ranker");
const Iframe = require("./iframe");
const RustEngine = require("./rust-engine");

function scanHttpUrls(text) {
  const s = String(text || "");
  const re = /https?:\/\/[^\s"'<>]+/gi;
  const out = [];
  let m;
  while ((m = re.exec(s))) {
    // strip trailing punctuation that often sticks to URLs
    const cleaned = m[0].replace(/[),.;]+$/g, "");
    out.push(cleaned);
  }
  return out;
}

/**
 * SmartDecode 2.3.2 - Orchestration Module
 * Deterministic forensic extraction pipeline.
 */
const SmartDecode = {
  VERSION: "2.3.2",

  /**
   * Deterministic pipeline entry.
   * @param {string} input - Raw untrusted input
   * @param {Object} options - Configuration overrides
   */
  async run(input, options = {}) {
    const requested = String(options.engine || process.env.HYPERSNATCH_SMARTDECODE_ENGINE || "").toLowerCase();
    const normalizedRequested = requested === "auto" ? "" : requested;
    const isElectron = Boolean(process.versions && process.versions.electron);
    const engine = normalizedRequested || (isElectron ? "rust" : "js");
    if (engine === "rust") {
      const strict = Boolean(options.strictEngine) || process.env.HYPERSNATCH_SMARTDECODE_ENGINE_STRICT === "1";

      if (!RustEngine.canRun()) {
        if (strict) throw new Error("Rust SmartDecode engine requested but hs-core binary not found.");
      } else {
        try {
          const r = await RustEngine.smartdecode(String(input || ""), {
            splitSegments: Boolean(options.splitSegments),
          });

          return {
            version: this.VERSION,
            candidates: Array.isArray(r?.candidates) ? r.candidates : [],
            best: r?.best ?? null,
            refusals: Array.isArray(r?.refusals) ? r.refusals : [],
          };
        } catch (e) {
          if (strict) throw e;
          // Fall back to JS engine on any Rust failure.
        }
      }
    }

    const normalized = Preprocessor.normalize(input);
    // Segment splitting is opt-in or based on double-newlines
    const segments = options.splitSegments ? normalized.split(/\n\n+/) : [normalized];

    const allAccepted = [];
    const allRefused = [];

    for (const segment of segments) {
      if (!segment.trim()) continue;
      const result = await this.processSegment(segment);
      allAccepted.push(...result.candidates);
      allRefused.push(...result.refusals);
    }

    // Deterministic Sort Projection (Triple-Key - Locale-Independent)
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

  async processSegment(html) {
    const refused = [];
    const byUrl = new Map(); // urlStr -> candidate object

    // 1. Safe Packed JS Detection (Signature Only - No Execution)
    const hasPacked = /eval\(function\(p,a,c,k,e,d\)/i.test(html);
    if (hasPacked) {
      const staticUrls = DirectExtractor.extract(html) || [];
      if (staticUrls.length === 0) {
        refused.push({
          host: "packed_js_block",
          reason: "dynamic_execution_required",
          status: "rejected",
          url: "",
        });
        return { candidates: [], refusals: refused };
      }
    }

    // 2. Static Extraction Layers
    // Pull nested iframe HTML and run through the same pipeline
    const nestedCandidates = await Iframe.extract(html, async (nestedHtml, depth) => {
      const r = await this.processSegment(nestedHtml, { depth });
      return { candidates: r.candidates || [] };
    }, 0);

    const raw = [
      ...(DirectExtractor.extract(html) || []),
      ...(Base64Extractor.extract(html, DirectExtractor) || []),
      ...(nestedCandidates || []),
    ];

    for (const c of raw) {
      let urlStr = String(c?.url || "");
      if (!urlStr) continue;

      try {
        urlStr = new URL(urlStr).href;
      } catch (e) {
        // keep raw string; preserves rejection behavior
      }

      // Absolute URL Enforcement
      if (!/^https?:\/\//i.test(urlStr)) {
        refused.push({
          host: c?.host || "unknown",
          reason: "incomplete_or_relative_url",
          status: "rejected",
          url: urlStr,
        });
        continue;
      }

      const auth = AuthBoundaryDetector.check(urlStr, html);
      if (auth?.requiresAuthorization) {
        refused.push({
          host: c?.host || "unknown",
          reason: auth.stopReason || "requires_auth",
          status: "rejected",
          url: urlStr,
        });
      } else {
        // Deterministic classification and fingerprinting
        const finalizedType = this.classifyType(urlStr, html);
        const fingerprint = crypto.createHash("sha256").update(urlStr).digest("hex");

        const candidate = {
          ...c,
          type: finalizedType,
          fingerprint,
          status: "accepted",
          url: urlStr,
        };

        // Deterministic duplicate resolution: keep lexicographically smallest key
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

    const urlSweep = scanHttpUrls(html);
    for (const u of urlSweep) {
      const auth = AuthBoundaryDetector.check(u, html);
      if (auth && auth.requiresAuthorization) {
        refused.push({
          host: (() => { try { return new URL(u).hostname; } catch { return "unknown"; } })(),
          reason: auth.stopReason || "Cash Policy Shield violation",
          markers: Array.isArray(auth.markers) ? auth.markers : ["premium"],
        });
      }
    }

    // 3. Ranking Layer (Preserved for ordering behavior)
    const candidates = Array.from(byUrl.values());
    const rankedResults = Ranker.rank(candidates);

    return { candidates: rankedResults.candidates, best: rankedResults.best, refusals: refused };
  },

  /**
   * Deterministic Media Type Classification
   */
  classifyType(url, rawHtmlSnippet) {
    try {
      const p = new URL(url).pathname.toLowerCase();
      if (p.endsWith(".m3u8")) return "m3u8";
      if (p.endsWith(".mp4")) return "mp4";
    } catch (e) {
      // Fallback for invalid URLs or relative paths
      const lowerUrl = url.toLowerCase().split("?")[0];
      if (lowerUrl.endsWith(".m3u8")) return "m3u8";
      if (lowerUrl.endsWith(".mp4")) return "mp4";
    }
    if (rawHtmlSnippet && rawHtmlSnippet.includes("#EXTM3U")) return "hls";
    return "video";
  },
};

module.exports = SmartDecode;


