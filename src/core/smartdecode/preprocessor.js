"use strict";

/**
 * Preprocessor
 * ------------
 * Normalizes forensic input for deterministic extraction.
 * Keeps transformations narrowly-scoped to avoid corrupting unrelated content.
 */
const Preprocessor = {
  /**
   * @param {string} raw - Untrusted input string
   * @returns {string} Sanitized string
   */
  normalize(raw) {
    if (typeof raw !== "string") return "";

    return raw
      // 1) Uniform newline convention
      // Convert CRLF -> LF, then CR -> LF.
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")

      // 2) Repair split media extensions (e.g., "variant.\nm3u8" -> "variant.m3u8")
      // Only repairs dot + whitespace/newline + known extension, to avoid over-joining.
      .replace(
        /\.\s*\n\s*(m3u8|u8|m3u|mp4|ts|m4s|m4a|webm|mkv|mov|mpd|jpg|png|gif)\b/gi,
        ".$1"
      )

      // 3) Repair base64 data URIs by stripping internal whitespace in the payload
      // Example: data:text/html;base64,PHZpZ... (with accidental spaces/newlines)
      .replace(
        /(data:[^;]+;base64,)([\s\S]+?)(["']|$)/gi,
        (m, head, body, tail) => head + body.replace(/\s/g, "") + tail
      )

      // 4) Collapse extreme vertical whitespace to maintain segment boundaries
      // Keep up to one blank line (i.e., convert 3+ newlines -> 2 newlines).
      .replace(/\n{3,}/g, "\n\n")

      .trim();
  },

  /**
   * detectLinks(text)
   * Extracts all HTTP/HTTPS links from raw text and deduplicates them.
   * @param {string} text 
   * @returns {string[]} Unique URLs
   */
  detectLinks(text) {
    const s = String(text || "");
    const re = /https?:\/\/[^\s"'<>]+/gi;
    const out = new Set();
    let m;
    while ((m = re.exec(s))) {
      const cleaned = m[0].replace(/[),.;]+$/g, "");
      try {
        const u = new URL(cleaned);
        out.add(u.href);
      } catch (e) {
        // Skip malformed URLs
      }
    }
    return Array.from(out);
  }
};

module.exports = Preprocessor;