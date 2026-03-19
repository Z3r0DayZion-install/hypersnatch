
# Simple verification script

Write-Host "Verifying HyperSnatch release integrity..."
Get-FileHash ..\dist\HyperSnatch.exe -Algorithm SHA256
Get-FileHash ..\dist\hypersnatch-cli.exe -Algorithm SHA256
