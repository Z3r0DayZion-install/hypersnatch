#!/usr/bin/env python3
"""
HyperSnatch Minimal Offline Verifier (Python)
Dependencies: None (uses standard library `hashlib` and `json`)
Note: Python's standard library does not support Ed25519 natively without `cryptography` or `pynacl` modules.
Thus, this verifier performs HASH VERIFICATION ONLY. For signature verification, use verify_node.js or verify.sh.
"""

import sys
import os
import hashlib
import json

print("==========================================================")
print("  HyperSnatch Minimum-Dependency Verifier (Python)")
print("  Mode: HASH ONLY (Run verify_node.js for signatures)")
print("==========================================================")

if len(sys.argv) < 2:
    print("Usage: python verify.py <path-to-binary.exe>")
    sys.exit(1)

binary_path = sys.argv[1]

if not os.path.isfile(binary_path):
    print(f"❌ Error: Target file '{binary_path}' not found.")
    sys.exit(1)

# Locate manifest
manifest_paths = [
    "MANIFEST.json",
    "release/verify/MANIFEST.json",
    os.path.join(os.path.dirname(binary_path), "MANIFEST.json")
]

manifest_data = None
used_manifest_path = None

for path in manifest_paths:
    if os.path.isfile(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                manifest_data = json.load(f)
                used_manifest_path = path
                break
        except Exception as e:
            pass

if not manifest_data:
    print("❌ Error: Could not locate or parse MANIFEST.json.")
    sys.exit(1)

print(f"[1/1] Checking SHA-256 hash against manifest ({used_manifest_path})...")

# Compute actual hash
sha256_hash = hashlib.sha256()
with open(binary_path, "rb") as f:
    for byte_block in iter(lambda: f.read(4096), b""):
         sha256_hash.update(byte_block)
         
actual_hash = sha256_hash.hexdigest().lower()

# Get expected hash
basename = os.path.basename(binary_path)
expected_hash = None

if manifest_data and "files" in manifest_data and basename in manifest_data["files"]:
    expected_hash = manifest_data["files"][basename].get("sha256", "").lower()
elif isinstance(manifest_data, dict):
    # Fallback search
    for key, value in manifest_data.items():
        if isinstance(value, dict) and value.get("sha256"):
            if basename in key:
                expected_hash = value["sha256"].lower()
                break

if not expected_hash:
    print(f"  ❌ HASH NOT FOUND IN MANIFEST — This binary is unknown.")
    sys.exit(1)

print(f"  Expected: {expected_hash}")
print(f"  Actual:   {actual_hash}")

if actual_hash == expected_hash:
    print("\n==========================================================")
    print("  ✅ VERIFICATION SUCCESSFUL")
    print("  The binary exactly matches the signed build manifest.")
    print("==========================================================")
    sys.exit(0)
else:
    print("\n==========================================================")
    print("  ❌ VERIFICATION FAILED")
    print("  The binary has been tampered with or corrupted.")
    print("==========================================================")
    sys.exit(1)
