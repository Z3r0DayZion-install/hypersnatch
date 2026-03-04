#!/usr/bin/env bash
# HyperSnatch Reproducible Build via Docker
# Usage: ./scripts/reproduce_docker.sh
#
# Builds the project inside a deterministic container and prints
# artifact hashes for comparison against the release manifest.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"
IMAGE_NAME="hypersnatch-repro"

echo ""
echo "  ╔════════════════════════════════════════════════╗"
echo "  ║   HyperSnatch Reproducible Build (Docker)      ║"
echo "  ╚════════════════════════════════════════════════╝"
echo ""

# Build the container
echo "  [1/2] Building container..."
docker build -f "$ROOT/Dockerfile.repro" -t "$IMAGE_NAME" "$ROOT"

# Run and print hashes
echo ""
echo "  [2/2] Running build and extracting hashes..."
echo ""
docker run --rm "$IMAGE_NAME"

echo ""
echo "  ════════════════════════════════════════════════"
echo "  Compare output above against release/verify/manifest.json"
echo "  If hashes match, the build is reproducible."
echo ""
