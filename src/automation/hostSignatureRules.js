/**
 * hostSignatureRules.js
 * Strict regex signature constraints for SmartSnatch Auto-Detect.
 * Prevents loose matching from triggering accidental decodes.
 */

const HOST_SIGNATURES = {
    RAPIDGATOR: /^https?:\/\/(www\.)?(rapidgator\.net\/file\/|rg\.to\/file\/|rapidgator\.net\/folder\/)[a-zA-Z0-9_-]+\/?.*$/i,
    KSHARED: /^https?:\/\/(www\.)?kshared\.com\/(df|file|f|folder)\/[a-zA-Z0-9_-]+\/?.*$/i,
    NITROFLARE: /^https?:\/\/(www\.)?nitroflare\.com\/(view|folder)\/[a-zA-Z0-9_-]+\/?.*$/i,
    EMLOAD: /^https?:\/\/(www\.)?emload\.com\/(f|folder)\/[a-zA-Z0-9_-]+\/?.*$/i,
    FILELION: /^https?:\/\/(www\.)?filelion\.(live|online|net)\/(f|list)\/[a-zA-Z0-9_-]+\/?.*$/i
};

function matchStrict(text) {
    if (!text || typeof text !== 'string') return null;

    const trimmed = text.trim();

    for (const [host, regex] of Object.entries(HOST_SIGNATURES)) {
        if (regex.test(trimmed)) {
            return {
                host: host,
                url: trimmed
            };
        }
    }

    return null; // No strict match
}

module.exports = {
    HOST_SIGNATURES,
    matchStrict
};
