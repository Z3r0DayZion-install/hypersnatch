# Upload release assets to GitHub using stored credentials
# This script reads the GitHub token from Windows Credential Manager and uploads files to the release

$repo = "Z3r0DayZion-install/hypersnatch"
$tag = "v1.2.0"

# Get GitHub token from credential manager
$token = $null
try {
    Add-Type -AssemblyName System.Runtime.InteropServices
    $target = "gh:github.com:Z3r0DayZion-install"
    $credObj = Get-StoredCredential -Target $target -ErrorAction SilentlyContinue
    if ($credObj) {
        $token = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($credObj.Password)
        )
    }
}
catch {}

# Fallback: try git credential helper
if (-not $token) {
    $gitCred = "protocol=https`nhost=github.com`nusername=Z3r0DayZion-install`n`n" | git credential fill 2>&1
    $token = ($gitCred | Select-String "password=(.+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }) -join ""
}

if (-not $token) {
    Write-Host "ERROR: Could not retrieve GitHub token. Please set `$env:GITHUB_TOKEN manually." -ForegroundColor Red
    exit 1
}

Write-Host "Token retrieved (length: $($token.Length))"

# Get release ID
$headers = @{
    Authorization          = "Bearer $token"
    Accept                 = "application/vnd.github.v3+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

$releasesUrl = "https://api.github.com/repos/$repo/releases/tags/$tag"
$release = Invoke-RestMethod -Uri $releasesUrl -Headers $headers -Method Get
$releaseId = $release.id
$uploadUrl = $release.upload_url -replace "\{.*?\}", ""

Write-Host "Release ID: $releaseId"
Write-Host "Upload URL base: $uploadUrl"

# Files to upload
$files = @(
    @{ Path = "C:\Users\KickA\HyperSnatch_Work\verify.ps1"; ContentType = "text/plain" },
    @{ Path = "C:\Users\KickA\HyperSnatch_Work\SHA256SUMS.txt"; ContentType = "text/plain" },
    @{ Path = "C:\Users\KickA\HyperSnatch_Work\dist\HyperSnatch-Setup-1.2.0.exe"; ContentType = "application/octet-stream" }
)

foreach ($file in $files) {
    $filePath = $file.Path
    $fileName = Split-Path $filePath -Leaf
    $contentType = $file.ContentType
    
    Write-Host ""
    Write-Host "Uploading: $fileName ..."
    
    $assetUrl = "$uploadUrl`?name=$([Uri]::EscapeDataString($fileName))"
    
    try {
        $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
        $result = Invoke-RestMethod -Uri $assetUrl -Headers $headers -Method Post `
            -Body $fileBytes -ContentType $contentType
        Write-Host "  SUCCESS: $($result.browser_download_url)" -ForegroundColor Green
    }
    catch {
        Write-Host "  ERROR: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Done! Check: https://github.com/$repo/releases/tag/$tag" -ForegroundColor Cyan
