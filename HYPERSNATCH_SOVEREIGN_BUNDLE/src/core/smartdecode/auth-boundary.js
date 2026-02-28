/**
 * AuthBoundaryDetector — HyperSnatch v1.0
 *
 * Mandatory pre-flight guard for the SmartDecode pipeline.
 * Pure function: no I/O, no network, no side effects, no randomness.
 *
 * Detects authorization boundaries BEFORE any deeper extraction attempt.
 * When requiresAuthorization=true is returned, the engine MUST stop
 * extraction on this candidate and record the stopReason.
 *
 * Legal constraint: do NOT attempt to bypass, strip, or replay any
 * detected auth signal. Detection = stop, not workaround.
 */

"use strict";

// ─── Signed / expiring query-param names ───────────────────────────────────
// These params signal time-limited, signed, or session-bound access.
const SIGNED_QUERY_PARAMS = new Set([
    // Generic token patterns
    'token', 'access_token', 'auth_token', 'bearer',
    // Signature patterns
    'sig', 'signature', 'hmac', 'hash',
    // Expiry patterns
    'expires', 'expiry', 'exp', 'expiration', 'ttl', 'until',
    // Hash-based auth (e.g. DoodStream pass_md5)
    'md5',
    // AWS CloudFront / S3 signed URLs
    'x-amz-signature', 'x-amz-security-token', 'x-amz-credential',
    'policy', 'key-pair-id',
    // Google Cloud Storage
    'x-goog-signature', 'x-goog-credential',
    // Azure Blob SAS
    'sv', 'sr', 'sp', 'spr', 'se', 'skoid', 'sks', 'sktid', 'ske', 'skv',
]);

// ─── URL path segments that indicate auth-gated resources ──────────────────
const AUTH_PATH_SEGMENTS = [
    '/pass_md5/',
    '/download_token/',
    '/secure/',
    '/protected/',
    '/private/',
    '/member/',
    '/premium/',
    '/subscriber/',
    '/auth/',
    '/login',
    'premium'
];

// ─── HTML markers for login / premium gate ─────────────────────────────────
const LOGIN_GATE_PATTERNS = [
    // Login form on page
    /<form[^>]+action=["'][^"']*(?:login|signin|sign-in|auth)[^"']*["']/i,
    // Explicit login-to-download messaging
    /(?:login|sign.?in|register)\s+to\s+(?:download|access|view|watch)/i,
    // "You need to be logged in"
    /you\s+(?:need\s+to|must)\s+be\s+(?:logged\s+in|authenticated)/i,
];

const PREMIUM_GATE_PATTERNS = [
    // "Premium user / account / membership required"
    /(?:premium|paid|pro)\s+(?:account|user|member|plan)\s+(?:required|needed|only)/i,
    // "You need to be a Premium user"
    /you\s+need\s+to\s+be\s+a\s+(?:premium|paid|pro)\s+(?:user|member)/i,
    // "Upgrade / Subscribe to download" | "must upgrade to download"
    /(?:must\s+)?(?:upgrade|subscribe|purchase)\s+(?:(?:a\s+|your\s+)\w+\s+)?to\s+(?:download|access|view)/i,
    // "This file requires a premium account"
    /this\s+(?:file|content|video|download)\s+requires\s+(?:a\s+)?(?:premium|paid)/i,
    // CSS class patterns
    /class=["'][^"']*(?:premium.gate|paywall|members.only|subscriber.only)[^"']*["']/i,
];

// ─── Known time-param key patterns (heuristic for numeric value timestamps) ─
const TIME_PARAM_KEY_PATTERN = /expir|ttl|until|stamp|timeout/i;

const fs = require('fs');
const path = require('path');

// ─── Canary / Honey-pot patterns ──────────────────────────────────────────
const CANARY_PATTERNS = [
    /bot-?check/i,
    /canary/i,
    /honey-?pot/i,
    /trap/i,
    /security-?verification/i,
    /verify-?human/i
];

let globalIntelMemory = { trapUrls: [] };
function loadIntel() {
    try {
        const intelPath = path.resolve(__dirname, '../../../../NeuralShell/state/global_threat_intel.json');
        if (fs.existsSync(intelPath)) {
            globalIntelMemory = JSON.parse(fs.readFileSync(intelPath, 'utf8'));
        }
    } catch (e) {
        // Best effort
    }
}

const AuthBoundaryDetector = {

    /**
     * Pre-checks the HTML for login or premium gates once.
     * @param {string} html 
     * @returns {string|null} stopReason if gate detected
     */
    checkHtml(html) {
        if (!html || typeof html !== 'string' || html.length === 0) {
            return null;
        }
        const loginReason = this._detectLoginGate(html);
        if (loginReason) return loginReason;

        const premiumReason = this._detectPremiumGate(html);
        if (premiumReason) return premiumReason;

        return null;
    },

    /**
     * Primary entry point.
     *
     * @param {string} url   — URL candidate to evaluate
     * @param {string} html  — Surrounding HTML context (pass '' if unavailable)
     * @param {string|null} precomputedHtmlReason — Optional precomputed HTML gate reason
     * @returns {{ requiresAuthorization: boolean, stopReason: string|null }}
     */
    check(url, html, precomputedHtmlReason = null) {
        if (!url || typeof url !== 'string') {
            return { requiresAuthorization: true, stopReason: 'invalid_url:empty_or_non_string' };
        }

        // Real-time Intel Sync
        loadIntel();

        // 0. Canary / Honey-pot check (Patterns + Global Intel)
        const canaryMatch = CANARY_PATTERNS.find(p => p.test(url));
        if (canaryMatch || (globalIntelMemory.trapUrls && globalIntelMemory.trapUrls.includes(url))) {
            return {
                requiresAuthorization: true,
                stopReason: `canary_trap_detected:${canaryMatch ? canaryMatch.source : 'global_intel'}`,
            };
        }

        // 1. Signed / expiring query parameters
        const signedParam = this._detectSignedQueryParam(url);
        if (signedParam) {
            return {
                requiresAuthorization: true,
                stopReason: `signed_url_detected:${signedParam}`,
            };
        }

        // 2. Auth-gated path segments
        const authSeg = this._detectAuthPathSegment(url);
        if (authSeg) {
            return {
                requiresAuthorization: true,
                stopReason: `auth_path_segment:${authSeg}`,
            };
        }

        // 3. HTML login-gate markers (prefer precomputed)
        if (precomputedHtmlReason) {
            return { requiresAuthorization: true, stopReason: precomputedHtmlReason };
        }

        if (html && typeof html === 'string' && html.length > 0) {
            const loginReason = this._detectLoginGate(html);
            if (loginReason) {
                return { requiresAuthorization: true, stopReason: loginReason };
            }

            const premiumReason = this._detectPremiumGate(html);
            if (premiumReason) {
                return { requiresAuthorization: true, stopReason: premiumReason };
            }
        }

        return { requiresAuthorization: false, stopReason: null };
    },

    // ─── Private helpers ─────────────────────────────────────────────────────

    _detectSignedQueryParam(url) {
        let parsed;
        try {
            parsed = new URL(url);
        } catch (_) {
            // URL cannot be parsed — flag it conservatively
            return 'unparseable_url';
        }

        for (const [key, value] of parsed.searchParams) {
            const lowerKey = key.toLowerCase();

            // Known signed param names
            if (SIGNED_QUERY_PARAMS.has(lowerKey)) {
                return key;
            }

            // Heuristic: numeric values that look like Unix timestamps + time-related key names
            if (TIME_PARAM_KEY_PATTERN.test(lowerKey) && /^[0-9]{10,13}$/.test(value)) {
                return `time_param:${key}`;
            }
        }

        return null;
    },

    _detectAuthPathSegment(url) {
        const lowerUrl = url.toLowerCase();
        for (const seg of AUTH_PATH_SEGMENTS) {
            if (lowerUrl.includes(seg)) return seg.trim();
        }
        return null;
    },

    _detectLoginGate(html) {
        for (const pattern of LOGIN_GATE_PATTERNS) {
            if (pattern.test(html)) {
                return `login_gate:${pattern.source.substring(0, 50)}`;
            }
        }
        return null;
    },

    _detectPremiumGate(html) {
        for (const pattern of PREMIUM_GATE_PATTERNS) {
            if (pattern.test(html)) {
                return `premium_gate:${pattern.source.substring(0, 50)}`;
            }
        }
        return null;
    },
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthBoundaryDetector;
}
