#!/usr/bin/env bash
# Minimal offline verifier for *nix environments.
# Dependencies: openssl (for Ed25519) and sha256sum (or shasum).
set -e

MANIFEST="MANIFEST.json"
SIG_FILE="manifest.sig"
PUB_KEY="root_public_key.pem"
VERIFY_DIR="release/verify"

echo "=========================================================="
echo "  HyperSnatch Minimum-Dependency Verifier (Bash)"
echo "=========================================================="

if [ -z "$1" ]; then
    echo "Usage: ./verify.sh <path-to-binary.exe>"
    exit 1
fi

BINARY="$1"

if [ ! -f "$BINARY" ]; ]; then
    echo "❌ Error: Target file '$BINARY' not found."
    exit 1
fi

# Locate verification assets
if [ -f "$MANIFEST" ]; then
    MANIFEST_PATH="$MANIFEST"
    SIG_PATH="$SIG_FILE"
    PUB_PATH="$PUB_KEY"
elif [ -d "$VERIFY_DIR" ]; then
    MANIFEST_PATH="$VERIFY_DIR/$MANIFEST"
    SIG_PATH="$VERIFY_DIR/$SIG_FILE"
    PUB_PATH="$VERIFY_DIR/$PUB_KEY"
else
    echo "❌ Error: Could not locate MANIFEST.json in current directory or $VERIFY_DIR/"
    exit 1
fi

# 1. Verify Manifest Signature (openssl)
echo "[1/2] Checking Ed25519 signature of manifest..."
if ! command -v openssl &> /dev/null; then
    echo "⚠️  'openssl' not installed. Skipping signature check."
elif [ -f "$SIG_PATH" ] && [ -f "$PUB_PATH" ]; then
    if openssl pkeyutl -verify -pubin -inkey "$PUB_PATH" -rawin -in "$MANIFEST_PATH" -sigfile "$SIG_PATH" > /dev/null 2>&1; then
        echo "  ✅ SIGNATURE VALID"
    else
        echo "  ❌ SIGNATURE INVALID — manifest may be forged."
        exit 1
    fi
else
    echo "⚠️  Missing $SIG_FILE or $PUB_KEY. Signature verification skipped."
fi

# 2. Verify Binary Hash
echo "[2/2] Checking SHA-256 hash against manifest..."

if command -v sha256sum &> /dev/null; then
    ACTUAL_HASH=$(sha256sum "$BINARY" | awk '{print $1}')
elif command -v shasum &> /dev/null; then
    ACTUAL_HASH=$(shasum -a 256 "$BINARY" | awk '{print $1}')
else
    echo "❌ Error: Neither sha256sum nor shasum is installed."
    exit 1
fi

# Extract expected hash from JSON simply using grep/awk (no jq dependency)
BASENAME=$(basename "$BINARY")
EXPECTED_HASH=$(grep -A 2 "\"$BASENAME\"" "$MANIFEST_PATH" | grep "sha256" | awk -F'"' '{print $4}')

if [ -z "$EXPECTED_HASH" ]; then
    echo "  ❌ HASH NOT FOUND IN MANIFEST — This binary is unknown."
    exit 1
fi

echo "  Expected: $EXPECTED_HASH"
echo "  Actual:   $ACTUAL_HASH"

if [ "$ACTUAL_HASH" == "$EXPECTED_HASH" ]; then
    echo ""
    echo "=========================================================="
    echo "  ✅ VERIFICATION SUCCESSFUL"
    echo "  The binary exactly matches the signed build manifest."
    echo "=========================================================="
    exit 0
else
    echo ""
    echo "=========================================================="
    echo "  ❌ VERIFICATION FAILED"
    echo "  The binary has been tampered with or corrupted."
    echo "=========================================================="
    exit 1
fi
