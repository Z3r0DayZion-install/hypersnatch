# Test Harness Spec

## Folder structure
tests/
  targets/
    direct_mp4.txt
    hls.txt
    dash.txt
    players.txt
    mse.txt
  runners/
    run_detect.js
    run_trace.js
    run_rebuild.js
    run_forensics.js
  results/
    target_001/
      metadata.json
      report.md

## Standard run stages
1. load target
2. capture network
3. fingerprint player
4. capture runtime traces
5. capture MSE if present
6. detect candidate streams
7. attempt extraction
8. export evidence
9. score result
