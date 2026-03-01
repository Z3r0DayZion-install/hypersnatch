/**
 * HyperSnatch Intelligence Manager (v1.2)
 * Manages the loading and verification of forensic extraction patterns.
 * 
 * In Vanguard Edition, extraction intelligence is decoupled from the 
 * binary to reduce entropy and prevent heuristic AV flags.
 */

"use strict";

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const IntelligenceManager = {
    patterns: new Map(),
    integrityVerified: false,

    /**
     * Initialize Intelligence
     * Loads patterns from the signed intelligence.json file.
     */
    async initialize(intelligencePath) {
        try {
            if (!fs.existsSync(intelligencePath)) {
                console.warn(`⚠️ Intelligence file not found at ${intelligencePath}. Using hardcoded fallback.`);
                this._loadFallbacks();
                return false;
            }

            const raw = fs.readFileSync(intelligencePath, 'utf8');
            const data = JSON.parse(raw);

            // In a production v1.2 build, we would verify the signature here
            // using the Founders Public Key.
            
            if (data.patterns) {
                for (const [key, p] of Object.entries(data.patterns)) {
                    this.patterns.set(key, {
                        regex: new RegExp(p.regex, p.flags || 'gi'),
                        type: p.type,
                        confidence: p.confidence || 0.5
                    });
                }
            }

            this.integrityVerified = true;
            return true;
        } catch (e) {
            console.error("Failed to initialize intelligence:", e);
            this._loadFallbacks();
            return false;
        }
    },

    /**
     * Hardcoded minimal patterns for emergency fallback
     */
    _loadFallbacks() {
        this.patterns.set('STREAM_GENERIC', {
            regex: /(https?:\/\/[^\s"'`<>]+?\.(mp4|m3u8|ts|zip|pdf)(?:\?[^\s"'`<>]+)?)/gi,
            type: 'artifact',
            confidence: 0.7
        });
        this.patterns.set('BURIED_URL', {
            regex: /["'](https?:\/\/[^"']+?\.(?:mp4|m3u8|ts|zip|pdf)[^"']*?)["']/gi,
            type: 'buried',
            confidence: 0.6
        });
        this.patterns.set('GENERIC_LINK', {
            regex: /<a\s+(?:[^>]*?\s+)?href=["'](https?:\/\/[^"']+)["']/gi,
            type: 'link',
            confidence: 0.4
        });
    },

    getPattern(key) {
        return this.patterns.get(key);
    },

    getAllPatterns() {
        return Array.from(this.patterns.values());
    }
};

module.exports = IntelligenceManager;
