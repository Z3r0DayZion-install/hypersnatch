#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "  HyperSnatch Reproducible Build Proof"
echo "=========================================================="
echo ""

if [ -z "$1" ]; then
  echo "Usage: ./verify_repro.sh <git-tag-or-commit>"
  echo "Example: ./verify_repro.sh v1.2.1"
  exit 1
fi

TARGET_REF="$1"
BUILD_DIR="/tmp/hypersnatch-repro-build"

echo "[1/4] Cloning repository at ref: $TARGET_REF"
rm -rf "$BUILD_DIR"
git clone --depth 1 --branch "$TARGET_REF" https://github.com/Z3r0DayZion-install/hypersnatch.git "$BUILD_DIR"
cd "$BUILD_DIR"

echo ""
echo "[2/4] Building reproducible container image..."
docker build -f Dockerfile.repro -t hypersnatch-repro:$TARGET_REF .

echo ""
echo "[3/4] Running detached build..."
docker run --rm -v "$PWD/dist:/app/dist" hypersnatch-repro:$TARGET_REF

echo ""
echo "[4/4] Verifying Hashes against CI Manifest..."
echo "Comparing freshly built /dist against committed MANIFEST.json"
echo "----------------------------------------------------------"

# Use the cross-platform Node verifier included in the repo
node scripts/verify_node.js --verify dist/MANIFEST.json

echo ""
echo "=========================================================="
echo "  ✅ REPRODUCIBILITY PROOF COMPLETE"
echo "  The locally built binary perfectly matches the CI manifest."
echo "=========================================================="
