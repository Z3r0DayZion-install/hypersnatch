/**
 * Fingerprint Jittering Module
 * Randomizes browser headers to bypass host-level anti-bot measures.
 */

"use strict";

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0"
];

const Fingerprint = {
    /**
     * Generates a randomized set of browser headers.
     * @returns {Object}
     */
    generate() {
        const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
        return {
            "User-Agent": ua,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Sec-CH-UA": ua.includes("Chrome") ? '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"' : undefined,
            "Sec-CH-UA-Mobile": "?0",
            "Sec-CH-UA-Platform": ua.includes("Windows") ? '"Windows"' : '"macOS"',
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-User": "?1",
            "Sec-Fetch-Dest": "document"
        };
    }
};

module.exports = Fingerprint;
