[CmdletBinding()]
param(
  [string]$RepoRoot,
  [string]$OutDir,

  # Signing identity (choose one)
  [string]$Thumbprint,
  [string]$Subject,
  [string]$PfxPath,
  [string]$PfxPassword,

  # Optional RFC3161 timestamping
  [string]$TimestampUrl,

  # Optional: trust dev cert locally (CurrentUser Root + TrustedPublisher)
  [switch]$TrustDevCert,

  # Optional: use LocalMachine store when signing from store
  [switch]$MachineStore,

  # Toggles
  [switch]$NoSign,
  [switch]$NoElectronSign,
  [switch]$NoStage,
  [switch]$EnforceTimestamp
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if (-not $RepoRoot) {
  $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}

$versionPath = Join-Path $RepoRoot 'VERSION.json'
if (-not (Test-Path -LiteralPath $versionPath)) {
  throw "Missing VERSION.json at $versionPath"
}

$ver = (Get-Content -LiteralPath $versionPath -Raw | ConvertFrom-Json).version
if (-not $ver) {
  throw 'VERSION.json missing version'
}

$dateTag = Get-Date -Format 'yyyy-MM-dd'
if (-not $OutDir) {
  $downloads = Join-Path $env:USERPROFILE 'Downloads'
  $OutDir = Join-Path $downloads ("HyperSnatch_Latest_" + $ver + "_RustCore_" + $dateTag)
  if (-not $NoSign) {
    $OutDir += '_Signed'
  }
}

function Clear-SigningEnv {
  foreach ($k in @(
    'HYPERSNATCH_SIGN',
    'HYPERSNATCH_SIGN_THUMBPRINT',
    'HYPERSNATCH_SIGN_SHA1',
    'HYPERSNATCH_SIGN_SUBJECT',
    'HYPERSNATCH_SIGN_PFX',
    'HYPERSNATCH_SIGN_PFX_PASSWORD',
    'HYPERSNATCH_SIGN_PFX_PASS',
    'HYPERSNATCH_SIGN_MACHINE_STORE',
    'HYPERSNATCH_SIGN_ELECTRON',
    'HYPERSNATCH_SIGN_TIMESTAMP_URL',
    'HYPERSNATCH_ENFORCE_SIGNING',
    'HYPERSNATCH_ENFORCE_TIMESTAMP'
  )) {
    Remove-Item -Path ("Env:" + $k) -ErrorAction SilentlyContinue
  }
}

Clear-SigningEnv

if ($TrustDevCert) {
  if (-not $Thumbprint) {
    throw '-Thumbprint is required with -TrustDevCert'
  }
  & (Join-Path $PSScriptRoot 'trust_dev_codesign.ps1') -Thumbprint $Thumbprint
}

if (-not $NoSign) {
  $env:HYPERSNATCH_SIGN = '1'

  if ($PfxPath) {
    if (-not (Test-Path -LiteralPath $PfxPath)) {
      throw "PFX not found: $PfxPath"
    }
    if (-not $PfxPassword) {
      throw '-PfxPassword is required with -PfxPath'
    }
    $env:HYPERSNATCH_SIGN_PFX = $PfxPath
    $env:HYPERSNATCH_SIGN_PFX_PASSWORD = $PfxPassword
  } elseif ($Thumbprint) {
    $env:HYPERSNATCH_SIGN_THUMBPRINT = $Thumbprint
  } elseif ($Subject) {
    $env:HYPERSNATCH_SIGN_SUBJECT = $Subject
  } else {
    throw 'Choose a signing identity: -Thumbprint, -Subject, or -PfxPath/-PfxPassword (or pass -NoSign).'
  }

  if ($MachineStore) {
    $env:HYPERSNATCH_SIGN_MACHINE_STORE = '1'
  }

  if ($TimestampUrl) {
    $env:HYPERSNATCH_SIGN_TIMESTAMP_URL = $TimestampUrl
  }

  if (-not $NoElectronSign) {
    $env:HYPERSNATCH_SIGN_ELECTRON = '1'
  }
}

$env:HYPERSNATCH_ENFORCE_SIGNING = if ($NoSign) { '0' } else { '1' }
$env:HYPERSNATCH_ENFORCE_TIMESTAMP = if ($EnforceTimestamp) { '1' } else { '0' }

$defaultTimestampUrl = 'http://timestamp.digicert.com'
if ($EnforceTimestamp -and -not $TimestampUrl) {
  $TimestampUrl = $defaultTimestampUrl
}


Push-Location $RepoRoot
try {
  Write-Host 'Running release gate...'
  & node scripts/verify_release.cjs
  if ($LASTEXITCODE -ne 0) {
    throw "verify_release failed with exit code $LASTEXITCODE"
  }
} finally {
  Pop-Location
}

if ($NoStage) {
  Write-Host 'Done (no staging).'
  return
}

$dist = Join-Path $RepoRoot 'dist'
if (-not (Test-Path -LiteralPath $dist)) {
  throw "Missing dist folder at $dist"
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$setup = Join-Path $dist ("HyperSnatch-Setup-" + $ver + '.exe')
$blockmap = Join-Path $dist ("HyperSnatch-Setup-" + $ver + '.exe.blockmap')
$latestYml = Join-Path $dist 'latest.yml'
$manifest = Join-Path $dist 'MANIFEST.json'
$shaSums = Join-Path $dist 'SHA256SUMS.txt'
$cli = Join-Path $dist 'hypersnatch.exe'
$unpacked = Join-Path $dist 'win-unpacked'

foreach ($p in @($setup, $blockmap, $latestYml, $manifest, $shaSums, $cli)) {
  if (Test-Path -LiteralPath $p) {
    Copy-Item -LiteralPath $p -Destination $OutDir -Force
  }
}

if (Test-Path -LiteralPath $unpacked) {
  Copy-Item -LiteralPath $unpacked -Destination (Join-Path $OutDir 'win-unpacked') -Recurse -Force
}

# Write build report
$report = Join-Path $OutDir ("BUILD_REPORT_" + $dateTag + '.txt')
$files = @(
  (Join-Path $OutDir ("HyperSnatch-Setup-" + $ver + '.exe')),
  (Join-Path $OutDir ("HyperSnatch-Setup-" + $ver + '.exe.blockmap')),
  (Join-Path $OutDir 'latest.yml'),
  (Join-Path $OutDir 'MANIFEST.json'),
  (Join-Path $OutDir 'SHA256SUMS.txt'),
  (Join-Path $OutDir 'hypersnatch.exe'),
  (Join-Path $OutDir 'win-unpacked\HyperSnatch.exe'),
  (Join-Path $OutDir 'win-unpacked\resources\hs-core.exe')
)

$hashes = $files | Where-Object { (Test-Path -LiteralPath $_) } | ForEach-Object {
  $h = Get-FileHash -Algorithm SHA256 -LiteralPath $_
  [pscustomobject]@{ file = (Resolve-Path -LiteralPath $_).Path; sha256 = $h.Hash }
}

$sigs = $files | Where-Object { (Test-Path -LiteralPath $_) -and ($_ -like '*.exe') } | ForEach-Object {
  $s = Get-AuthenticodeSignature -FilePath $_
  [pscustomobject]@{
    file = (Resolve-Path -LiteralPath $_).Path
    status = $s.Status.ToString()
    signer = $s.SignerCertificate.Subject
    thumb = $s.SignerCertificate.Thumbprint
    timestamp = [bool]$s.TimeStamperCertificate
  }
}

$head = (git -C $RepoRoot rev-parse HEAD 2>$null)
if (-not $head) { $head = '(no git head)' }

$lines = @()
$lines += 'HyperSnatch Build Report'
$lines += ("Date: " + $dateTag)
$lines += ("Version: " + $ver)
$lines += ("Git HEAD: " + $head)
$lines += ("Node: " + (node -v 2>$null))
$lines += ("npm: " + (npm -v 2>$null))
$lines += ("cargo: " + (cargo -V 2>$null))
$lines += ''
$lines += 'Artifacts (SHA256):'
$lines += ($hashes | Sort-Object file | ForEach-Object { "- $($_.sha256)  $($_.file)" })
$lines += ''
$lines += 'Authenticode:'
$lines += ($sigs | Sort-Object file | ForEach-Object { "- $($_.status) signer=$($_.signer) thumb=$($_.thumb) timestamp=$($_.timestamp)  $($_.file)" })
$lines += ''
$lines += 'Notes:'
$lines += ("- Signing enforced: " + ($env:HYPERSNATCH_ENFORCE_SIGNING -eq '1'))
$lines += ("- Timestamp enforced: " + ($env:HYPERSNATCH_ENFORCE_TIMESTAMP -eq '1'))
$lines += ("- Timestamp URL: " + ($TimestampUrl ? $TimestampUrl : '(none)'))

Set-Content -LiteralPath $report -Value ($lines -join "`r`n") -Encoding utf8 -Force

Write-Host "Staged release to: $OutDir"
Write-Host "Report: $report"
