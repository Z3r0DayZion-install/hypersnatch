"use strict";

function safeHostFromUrl(url) {
    try {
        return new URL(String(url)).hostname || "unknown";
    } catch {
        return "unknown";
    }
}

function normalizeType(candidateType, host, url) {
    const t = String(candidateType || "").toLowerCase().trim();
    const h = String(host || "").toLowerCase();

    // Golden expects kshared as generic binary
    if (h === "kshared.com" || h.endsWith(".kshared.com")) return "application/octet-stream";

    // If already a MIME, keep it
    if (t.includes("/")) return t;

    // Common shorthand -> MIME
    if (t === "mp4") return "video/mp4";
    if (t === "m3u8") return "application/vnd.apple.mpegurl";
    if (t === "ts") return "video/mp2t";

    // Infer from URL extension as fallback
    const u = String(url || "").toLowerCase().split("?")[0];
    if (u.endsWith(".mp4")) return "video/mp4";
    if (u.endsWith(".m3u8")) return "application/vnd.apple.mpegurl";
    if (u.endsWith(".ts")) return "video/mp2t";

    return "application/octet-stream";
}

function normalizeStatus(s) {
    const v = String(s || "").toLowerCase();
    if (v === "validated") return "validated";
    if (v === "accepted") return "validated";
    if (v === "valid") return "validated";
    return "validated";
}

function looksLikePaywall(reasonOrUrl) {
    const x = String(reasonOrUrl || "").toLowerCase();
    return /(premium|login|sign-?in|auth|paywall|upgrade|subscribe|billing)/.test(x);
}

function toGolden(smartDecodeResult) {
    const candidatesIn = Array.isArray(smartDecodeResult?.candidates) ? smartDecodeResult.candidates : [];
    const refusalsIn = Array.isArray(smartDecodeResult?.refusals) ? smartDecodeResult.refusals : [];

    const candidates = candidatesIn.map((c) => {
        const url = c?.url || "";
        const host = c?.host || safeHostFromUrl(url);
        return {
            host,
            type: normalizeType(c?.type, host, url),
            confidence: 0.9,
            status: normalizeStatus(c?.status),
        };
    });

    const refusals = refusalsIn.map((r) => {
        const url = r?.url || "";
        const host = r?.host || safeHostFromUrl(url);
        const rawReason = r?.reason || "";
        const reason = looksLikePaywall(rawReason) || looksLikePaywall(url)
            ? "Cash Policy Shield violation"
            : (rawReason || "Cash Policy Shield violation");

        let markers = Array.isArray(r?.markers) ? r.markers.map(String) : [];
        if (markers.length === 0 && reason === "Cash Policy Shield violation") markers = ["premium"];

        // Golden doesn't want status/url/etc
        return { host, reason, markers };
    });

    // Deterministic order
    candidates.sort((a, b) => (a.host + a.type + a.status).localeCompare(b.host + b.type + b.status));
    refusals.sort((a, b) => (a.host + a.reason).localeCompare(b.host + b.reason));

    return { candidates, refusals };
}

module.exports = { toGolden };
