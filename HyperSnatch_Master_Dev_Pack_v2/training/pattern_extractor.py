#!/usr/bin/env python3

"""
Pattern Extractor (offline)

Reads evidence bundles and extracts:
- player signals
- protocol signals
- candidate stream URLs discovered in HAR/trace/config

Usage:
  python training/pattern_extractor.py datasets/evidence_targets out/patterns
"""

import os, json, re, sys, hashlib
from pathlib import Path

URL_RE = re.compile(r'https?://[^\s"\'<>]+', re.I)
M3U8_RE = re.compile(r'\.m3u8(\?|$)', re.I)
MPD_RE  = re.compile(r'\.mpd(\?|$)', re.I)
MP4_RE  = re.compile(r'\.mp4(\?|$)', re.I)
SEG_RE  = re.compile(r'\.(ts|m4s|cmfv|cmfa)(\?|$)', re.I)

def load_json(p):
    try:
        return json.loads(Path(p).read_text(encoding="utf-8", errors="ignore"))
    except Exception:
        return None

def extract_urls_from_text(text):
    return sorted(set(URL_RE.findall(text or "")))

def classify_url(u):
    if M3U8_RE.search(u): return "hls"
    if MPD_RE.search(u): return "dash"
    if MP4_RE.search(u): return "mp4"
    if SEG_RE.search(u): return "segment"
    return "other"

def main(src_root, out_root):
    src_root = Path(src_root)
    out_root = Path(out_root)
    out_root.mkdir(parents=True, exist_ok=True)

    patterns = []

    for target_dir in sorted([p for p in src_root.iterdir() if p.is_dir()]):
        dom = (target_dir / "dom_snapshot.html")
        har = (target_dir / "network.har")
        cfg = (target_dir / "player_config.json")
        trace = (target_dir / "stream_trace.json")

        record = {
            "target": target_dir.name,
            "protocol_signals": [],
            "candidate_urls": [],
            "player_hints": [],
        }

        # HAR URLs
        if har.exists():
            txt = har.read_text(encoding="utf-8", errors="ignore")
            urls = extract_urls_from_text(txt)
            record["candidate_urls"].extend(urls)

        # Trace URLs
        if trace.exists():
            txt = trace.read_text(encoding="utf-8", errors="ignore")
            urls = extract_urls_from_text(txt)
            record["candidate_urls"].extend(urls)

        # Config URLs
        if cfg.exists():
            txt = cfg.read_text(encoding="utf-8", errors="ignore")
            urls = extract_urls_from_text(txt)
            record["candidate_urls"].extend(urls)

        record["candidate_urls"] = sorted(set(record["candidate_urls"]))
        record["protocol_signals"] = sorted(set(classify_url(u) for u in record["candidate_urls"]))

        # DOM hints
        if dom.exists():
            d = dom.read_text(encoding="utf-8", errors="ignore")
            hints = []
            for h in ["video-js", "jwplayer", "shaka", "dashjs", "hls.js", "bitmovin"]:
                if h.lower() in d.lower():
                    hints.append(h)
            record["player_hints"] = hints

        patterns.append(record)

    (out_root / "patterns.json").write_text(json.dumps(patterns, indent=2), encoding="utf-8")
    print(f"Wrote {len(patterns)} pattern records to {out_root / 'patterns.json'}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: pattern_extractor.py <evidence_root> <out_dir>")
        sys.exit(2)
    main(sys.argv[1], sys.argv[2])
