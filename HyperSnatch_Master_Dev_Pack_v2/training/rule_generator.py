#!/usr/bin/env python3

"""
Rule Generator (offline)

Consumes out/patterns/patterns.json and emits:
- rules/player_rules.json
- rules/site_rules.json

These are starter rules; humans/agents should refine.

Usage:
  python training/rule_generator.py out/patterns out/rules
"""

import json, sys
from pathlib import Path

def main(patterns_dir, rules_dir):
    patterns_dir = Path(patterns_dir)
    rules_dir = Path(rules_dir)
    rules_dir.mkdir(parents=True, exist_ok=True)

    patterns = json.loads((patterns_dir / "patterns.json").read_text(encoding="utf-8"))

    player_rules = {}
    site_rules = {}

    for rec in patterns:
        target = rec.get("target")
        hints = rec.get("player_hints") or []
        protos = rec.get("protocol_signals") or []
        urls = rec.get("candidate_urls") or []

        # site rule
        site_rules[target] = {
            "player_hints": hints,
            "protocols": protos,
            "top_candidates": urls[:10],
        }

        # player rule aggregation
        for h in hints:
            player_rules.setdefault(h, {"count": 0, "protocols": set()})
            player_rules[h]["count"] += 1
            for p in protos:
                player_rules[h]["protocols"].add(p)

    # normalize sets
    for k,v in player_rules.items():
        v["protocols"] = sorted(v["protocols"])

    (rules_dir / "player_rules.json").write_text(json.dumps(player_rules, indent=2), encoding="utf-8")
    (rules_dir / "site_rules.json").write_text(json.dumps(site_rules, indent=2), encoding="utf-8")

    print(f"Wrote rules to {rules_dir}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: rule_generator.py <patterns_dir> <rules_dir>")
        sys.exit(2)
    main(sys.argv[1], sys.argv[2])
