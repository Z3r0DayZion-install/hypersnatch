@echo off
echo [HyperSnatch] Launching Vanguard v1.1.0 in Portable Mode...
echo [Forensic] Redirecting user-data to local .untime
start "" "%~dp0win-unpackedHyperSnatch.exe" --user-data-dir="%~dp0runtime" --no-sandbox