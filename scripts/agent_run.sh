#!/bin/bash
# HyperSnatch Agent Run Script - Git Bash

echo "=== HyperSnatch Agent Run ==="

# Clean and create directories
rm -rf PROOF_PACK dist_test
mkdir -p PROOF_PACK dist_test

# Dump environment info
echo "Environment:"
pwd > PROOF_PACK/00_pwd.txt
node -v > PROOF_PACK/01_node.txt
npm -v > PROOF_PACK/02_npm.txt
git status > PROOF_PACK/03_git_status_before.txt

# Platform scan before purge
echo "Scanning for Platform references before purge..."
if command -v rg >/dev/null 2>&1; then
    rg -n -i "Platform" . > PROOF_PACK/04_nexus_before.txt 2>&1 || echo "no matches" >> PROOF_PACK/04_nexus_before.txt
else
    find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/PROOF_PACK/*" -not -path "*/dist_test/*" -not -path "*/dist/*" -not -path "*/build/*" -not -path "*/out/*" -exec grep -l "Platform" {} \; > PROOF_PACK/04_nexus_before.txt 2>&1 || echo "no matches" >> PROOF_PACK/04_nexus_before.txt
fi

# Run brand purge
echo "Running brand purge..."
node scripts/drop_nexus.js > PROOF_PACK/05_drop_nexus_run.txt

# Platform scan after purge
echo "Scanning for Platform references after purge..."
if command -v rg >/dev/null 2>&1; then
    rg -n -i "Platform" . > PROOF_PACK/06_nexus_after.txt 2>&1 || echo "no matches" >> PROOF_PACK/06_nexus_after.txt
else
    find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/PROOF_PACK/*" -not -path "*/dist_test/*" -not -path "*/dist/*" -not -path "*/build/*" -not -path "*/out/*" -exec grep -l "Platform" {} \; > PROOF_PACK/06_nexus_after.txt 2>&1 || echo "no matches" >> PROOF_PACK/06_nexus_after.txt
fi

# Run npm install
echo "Running npm install..."
npm install > PROOF_PACK/07_npm_install.txt 2>&1

# Build release pack
echo "Building release pack..."
node scripts/build_release_pack.js --out ./dist_test > PROOF_PACK/10_build_release_pack.txt 2>&1

# List dist_test contents
echo "Listing dist_test contents..."
ls -la ./dist_test > PROOF_PACK/10_dist_test_listing.txt

# Verify release pack
echo "Verifying release pack..."
LATEST_PACK=$(ls -t ./dist_test/*.json | head -n1)
if [ -n "$LATEST_PACK" ]; then
    node scripts/verify_release_pack.js --in "./dist_test/$LATEST_PACK" > PROOF_PACK/11_verify_release_pack.txt 2>&1
else
    echo "No release pack found to verify" >> PROOF_PACK/11_verify_release_pack.txt
fi

echo "=== Agent Run Complete ==="
