/**
 * DNS Fallback Module — HyperSnatch v1.1.0
 * Resolves hostnames via DNS-over-HTTPS (DoH) using Cloudflare.
 * Falls back to an offline JSON cache when DoH is unavailable.
 *
 * This is the ONLY module allowed to make external HTTP calls.
 * All other modules remain fully offline.
 */

"use strict";

const https = require("https");
const fs = require("fs");
const path = require("path");

const DOH_ENDPOINT = "https://cloudflare-dns.com/dns-query";
const CACHE_FILENAME = "dns_cache.json";
const DEFAULT_TTL = 3600; // 1 hour in seconds
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

const DnsFallback = {
    _cache: null,
    _cacheDir: null,

    /**
     * Initialize the DNS fallback module.
     * @param {string} [cacheDir] - Directory to store dns_cache.json. Defaults to process cwd.
     */
    init(cacheDir) {
        this._cacheDir = cacheDir || process.cwd();
        this._cache = this._loadCacheSync();
    },

    /**
     * Load cache from disk synchronously.
     * @returns {Object} Parsed cache or empty object.
     */
    _loadCacheSync() {
        const cachePath = this._getCachePath();
        try {
            if (fs.existsSync(cachePath)) {
                const raw = fs.readFileSync(cachePath, "utf8");
                const parsed = JSON.parse(raw);
                return typeof parsed === "object" && parsed !== null ? parsed : {};
            }
        } catch (e) {
            // Corrupted cache — start fresh
        }
        return {};
    },

    /**
     * Save cache to disk synchronously.
     */
    _saveCacheSync() {
        const cachePath = this._getCachePath();
        try {
            const dir = path.dirname(cachePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(cachePath, JSON.stringify(this._cache, null, 2), "utf8");
        } catch (e) {
            // Silent fail — cache write is best-effort
        }
    },

    _getCachePath() {
        return path.join(this._cacheDir || process.cwd(), CACHE_FILENAME);
    },

    /**
     * Check if a cached entry is still valid.
     * @param {Object} entry - Cache entry with `ips`, `timestamp`, `ttl`.
     * @returns {boolean}
     */
    _isValid(entry) {
        if (!entry || !entry.timestamp || !Array.isArray(entry.ips)) return false;
        const age = (Date.now() - entry.timestamp) / 1000;
        return age < (entry.ttl || DEFAULT_TTL);
    },

    /**
     * Resolve a hostname to IP addresses.
     * Strategy: cache → DoH → expired cache fallback.
     * @param {string} hostname
     * @returns {Promise<string[]>} Array of IP addresses.
     */
    async resolve(hostname) {
        if (!hostname || typeof hostname !== "string") {
            return [];
        }

        // Ensure cache is loaded
        if (!this._cache) this.init();

        // 1. Check fresh cache
        const cached = this._cache[hostname];
        if (this._isValid(cached)) {
            return cached.ips;
        }

        // 2. Try DoH resolution
        try {
            const ips = await this._queryDoH(hostname);
            if (ips.length > 0) {
                this._cache[hostname] = {
                    ips,
                    timestamp: Date.now(),
                    ttl: DEFAULT_TTL,
                };
                this._saveCacheSync();
                return ips;
            }
        } catch (e) {
            // DoH failed — fall through to stale cache
        }

        // 3. Stale cache fallback (return expired data rather than nothing)
        if (cached && Array.isArray(cached.ips) && cached.ips.length > 0) {
            return cached.ips;
        }

        return [];
    },

    /**
     * Resolve with retry logic and exponential backoff.
     * @param {string} hostname
     * @param {number} [retries=3]
     * @returns {Promise<string[]>}
     */
    async resolveWithRetry(hostname, retries) {
        const maxRetries = typeof retries === "number" ? retries : MAX_RETRIES;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const ips = await this.resolve(hostname);
                if (ips.length > 0) return ips;
            } catch (e) {
                // Continue retrying
            }

            if (attempt < maxRetries) {
                const delay = RETRY_BASE_MS * Math.pow(2, attempt);
                await new Promise(r => setTimeout(r, delay));
            }
        }

        return [];
    },

    /**
     * Query Cloudflare DoH endpoint for A + AAAA records.
     * @param {string} hostname
     * @returns {Promise<string[]>} IP addresses.
     */
    _queryDoH(hostname) {
        return new Promise((resolve, reject) => {
            const url = `${DOH_ENDPOINT}?name=${encodeURIComponent(hostname)}&type=A`;
            const options = {
                headers: {
                    Accept: "application/dns-json",
                },
                timeout: 5000,
            };

            const req = https.get(url, options, (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => {
                    try {
                        const json = JSON.parse(data);
                        const ips = [];

                        if (json.Answer && Array.isArray(json.Answer)) {
                            for (const answer of json.Answer) {
                                // Type 1 = A record, Type 28 = AAAA record
                                if ((answer.type === 1 || answer.type === 28) && answer.data) {
                                    ips.push(answer.data);
                                }
                            }
                        }

                        resolve(ips);
                    } catch (e) {
                        reject(new Error("Failed to parse DoH response"));
                    }
                });
            });

            req.on("error", reject);
            req.on("timeout", () => {
                req.destroy();
                reject(new Error("DoH request timed out"));
            });
        });
    },

    /**
     * Get the current cache contents (for diagnostics).
     * @returns {Object}
     */
    getCache() {
        if (!this._cache) this.init();
        return { ...this._cache };
    },

    /**
     * Clear the in-memory and disk cache.
     */
    clearCache() {
        this._cache = {};
        this._saveCacheSync();
    },

    /**
     * Manually seed the cache (for offline bootstrap).
     * @param {string} hostname
     * @param {string[]} ips
     * @param {number} [ttl]
     */
    seedCache(hostname, ips, ttl) {
        if (!this._cache) this.init();
        this._cache[hostname] = {
            ips: Array.isArray(ips) ? ips : [],
            timestamp: Date.now(),
            ttl: ttl || DEFAULT_TTL * 24, // 24 hours for seeded entries
        };
        this._saveCacheSync();
    },
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = DnsFallback;
}
