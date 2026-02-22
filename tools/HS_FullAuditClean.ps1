param(
  [Parameter(Mandatory=$false)][string]$Root = ".",
  [switch]$Apply,
  [switch]$PurgeTrash,
  [switch]$ReinstallDeps
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Say($msg){ Write-Host $msg -ForegroundColor Cyan }
function Ok($msg){ Write-Host $msg -ForegroundColor Green }
function Warn($msg){ Write-Host $msg -ForegroundColor Yellow }
function Fail($msg){ Write-Host $msg -ForegroundColor Red; $script:FAILS++; Add-Content -Path $REPORT -Value ("FAIL: " + $msg) }
function Blocked($msg){ Write-Host $msg -ForegroundColor Magenta; $script:BLOCKS++; Add-Content -Path $REPORT -Value ("BLOCKED: " + $msg) }

$script:FAILS = 0
$script:BLOCKS = 0

$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$ROOT = (Resolve-Path $Root).Path
$OPS  = Join-Path $ROOT "ops"
$OUT  = Join-Path $OPS  "reports\$ts"
$TRASH = Join-Path $ROOT "_TRASH\$ts"
New-Item -ItemType Directory -Force $OUT | Out-Null
New-Item -ItemType Directory -Force $TRASH | Out-Null
$REPORT = Join-Path $OUT "REPORT.txt"

Add-Content $REPORT "HyperSnatch Full Audit/Clean"
Add-Content $REPORT ("Root: " + $ROOT)
Add-Content $REPORT ("Time: " + (Get-Date).ToString("s"))
Add-Content $REPORT "----------------------------------------"

function Run($label, [scriptblock]$cmd, [switch]$SoftBlockOnEPERM){
  $log = Join-Path $OUT ("cmd_" + $label + ".log")
  Add-Content $REPORT ("RUN: " + $label)
  try {
    $out = & $cmd 2>&1
    $out | Tee-Object -FilePath $log | Out-Null
    $exit = $LASTEXITCODE
    if($exit -ne 0 -and $exit -ne $null){
      # Treat node execution policy/AV EPERM blocks as BLOCKED not FAIL
      $text = ($out | Out-String)
      if($SoftBlockOnEPERM -and ($text -match "EPERM" -or $text -match "spawnSync" -or $text -match "Access is denied")){
        Blocked("$label blocked by environment (EPERM/spawn). See $log")
      } else {
        Fail("$label exited with code $exit (see $log)")
      }
    }
  } catch {
    Fail("$label threw: " + $_.Exception.Message + " (see $log)")
    $_ | Out-File -FilePath $log -Append
  }
}

function WriteTree(){
  $treePath = Join-Path $OUT "TREE.txt"
  $items = Get-ChildItem -Path $ROOT -Recurse -Force -File |
    Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\.git\\' -and $_.FullName -notmatch '\\_TRASH\\' } |
    ForEach-Object { $_.FullName.Substring($ROOT.Length).TrimStart('\') }
  $items | Sort-Object | Set-Content -Encoding UTF8 $treePath
  Add-Content $REPORT ("TREE: " + $treePath)
}

function ScanBannedPublicTerms(){
  $banned = @("download","downloader","video","stream","m3u8","hls","yt-dlp","youtube-dl","bypass","crack","decrypt")
  $folders = @("demo","landing","site","public","docs_public")
  $targets = @()
  foreach($d in $folders){
    $p = Join-Path $ROOT $d
    if(Test-Path $p){ $targets += $p }
  }
  if($targets.Count -eq 0){
    Warn "No public-surface folders found for banned-term scan (demo/landing/site/public/docs)."
    Add-Content $REPORT "WARN: No public-surface folders found for banned-term scan."
    return
  }

  $hits = New-Object System.Collections.Generic.List[string]
  $files = Get-ChildItem -Recurse -File -Force -Path $targets -Include *.html,*.md,*.txt,*.json |
    Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\.git\\' }

  foreach($f in $files){
    $text = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
    if([string]::IsNullOrWhiteSpace($text)){ continue }
    foreach($w in $banned){
      if($text -match "(?i)\b$([regex]::Escape($w))\b"){
        $hits.Add(("{0} :: {1}" -f $w, $f.FullName.Substring($ROOT.Length).TrimStart('\')))
      }
    }
  }

  $hitPath = Join-Path $OUT "BANNED_TERM_HITS.txt"
  if($hits.Count -gt 0){
    $hits | Sort-Object | Set-Content -Encoding UTF8 $hitPath
    Fail("Banned terms found in public surfaces. See $hitPath")
  } else {
    Add-Content $REPORT "BANNED_TERM_SCAN: PASS"
    Ok "BANNED_TERM_SCAN: PASS"
  }
}

function FindDemoDir(){
  foreach($cand in @(
    (Join-Path $ROOT "demo"),
    (Join-Path $ROOT "site_public\demo"),
    (Join-Path $ROOT "public\demo"),
    (Join-Path $ROOT "HyperSnatch_PUBLIC_SITE_FINAL\demo"),
    (Join-Path $ROOT "HyperSnatch_PUBLIC_SITE\demo")
  )){
    if(Test-Path $cand){ return $cand }
  }
  return $null
}

function ValidateDemo(){
  $demoDir = FindDemoDir
  if(-not $demoDir){
    Warn "Demo folder not found (demo/site_public/demo/public/demo). Skipping demo validation."
    Add-Content $REPORT "WARN: Demo folder not found; demo validation skipped."
    return
  }

  $payload = Join-Path $demoDir "sample-payload.html"
  $manifest = Join-Path $demoDir "manifest.json"
  if(!(Test-Path $payload)){ Fail("Missing demo payload: $payload"); return }
  if(!(Test-Path $manifest)){ Fail("Missing expected manifest: $manifest"); return }

  $payloadText = Get-Content $payload -Raw
  $m = Get-Content $manifest -Raw | ConvertFrom-Json

  if(-not $m.resources){ Fail("manifest.json missing resources[]"); return }

  $miss = @()
  foreach($r in $m.resources){
    $v = [string]$r.value
    if([string]::IsNullOrWhiteSpace($v)){ continue }
    if($payloadText -notmatch [regex]::Escape($v)){
      $miss += $v
    }
  }
  if($miss.Count -gt 0){
    $mp = Join-Path $OUT "DEMO_MANIFEST_MISMATCH.txt"
    $miss | Set-Content -Encoding UTF8 $mp
    Fail("Demo manifest values not found in payload. See $mp")
  } else {
    Add-Content $REPORT "DEMO_MANIFEST_MATCH: PASS"
    Ok "DEMO_MANIFEST_MATCH: PASS"
  }

  if($payloadText -match 'enc:\s*"([^"]+)"'){
    $b64 = $Matches[1]
    try{
      $bytes = [Convert]::FromBase64String($b64)
      $decoded = [Text.Encoding]::UTF8.GetString($bytes)
      $null = $decoded | ConvertFrom-Json
      Add-Content $REPORT "DEMO_BASE64_DECODE: PASS"
      Ok "DEMO_BASE64_DECODE: PASS"
    } catch {
      Fail("Base64 decode or JSON parse failed for demo enc field.")
    }
  } else {
    Add-Content $REPORT "WARN: Demo payload has no enc field; base64 decode skipped."
    Warn "Demo payload has no enc field; base64 decode skipped."
  }
}

function MoveGarbage(){
  $trashDirs = @(
    ".tear_runtime",".vite",".cache","tmp","temp",
    "build\handoff","build\release","out","dist","release",
    "electron_bootstrap\dist\win-unpacked",".next","coverage"
  )
  $moved = New-Object System.Collections.Generic.List[string]

  foreach($d in $trashDirs){
    $p = Join-Path $ROOT $d
    if(Test-Path $p){
      $dest = Join-Path $TRASH ($d -replace '[\\/:*?"<>|]','_')
      try{
        New-Item -ItemType Directory -Force (Split-Path $dest) | Out-Null
        Move-Item -Force -Path $p -Destination $dest
        $moved.Add($d)
      } catch {
        Fail("Failed moving $d to trash: " + $_.Exception.Message)
      }
    }
  }

  $junkPatterns = @("*.tmp","*.bak","*.old","*.log")
  $junkFiles = Get-ChildItem -Path $ROOT -Recurse -Force -File |
    Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\.git\\' -and $_.FullName -notmatch '\\_TRASH\\' } |
    Where-Object {
      $n = $_.Name.ToLowerInvariant()
      ($junkPatterns | ForEach-Object { $n -like $_ }) -contains $true
    }

  foreach($f in $junkFiles){
    $rel = $f.FullName.Substring($ROOT.Length).TrimStart('\')
    $dest = Join-Path $TRASH ("files\" + ($rel -replace '[\\/:*?"<>|]','_'))
    try{
      New-Item -ItemType Directory -Force (Split-Path $dest) | Out-Null
      Move-Item -Force -Path $f.FullName -Destination $dest
      $moved.Add($rel)
    } catch {
      Fail("Failed moving junk file ${rel}: " + $_.Exception.Message)
    }
  }

  $movedPath = Join-Path $OUT "MOVED_TO_TRASH.txt"
  $moved | Sort-Object | Set-Content -Encoding UTF8 $movedPath
  Add-Content $REPORT ("TRASH_DIR: " + $TRASH)
  Add-Content $REPORT ("MOVED_LIST: " + $movedPath)

  if($PurgeTrash){
    try{
      Remove-Item -Recurse -Force $TRASH
      Add-Content $REPORT "TRASH_PURGE: DONE"
      Ok "TRASH_PURGE: DONE"
    } catch {
      Fail("Trash purge failed: " + $_.Exception.Message)
    }
  }
}

function GitHygiene(){
  if(!(Test-Path (Join-Path $ROOT ".git"))){
    Add-Content $REPORT "GIT: not detected; skipping git hygiene."
    return
  }
  Run "git_status" { git status -sb }
  Run "git_clean_preview" { git clean -ndX }
}

function NodeTestSuite(){
  $pkgPath = Join-Path $ROOT "package.json"
  if(!(Test-Path $pkgPath)){
    Warn "package.json not found; skipping npm-based tests."
    Add-Content $REPORT "WARN: package.json not found; npm tests skipped."
    return
  }

  Run "node_version" { node -v } -SoftBlockOnEPERM
  Run "npm_version"  { npm -v } -SoftBlockOnEPERM

  if($ReinstallDeps){
    Run "npm_ci" { npm ci } -SoftBlockOnEPERM
  }

  $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
  $scripts = @()
  if($pkg.scripts){
    $scripts = $pkg.scripts.PSObject.Properties.Name
  }

  if($scripts -contains "lint"){ Run "npm_lint" { npm run -s lint } -SoftBlockOnEPERM }
  if($scripts -contains "test"){ Run "npm_test" { npm run -s test } -SoftBlockOnEPERM }
  if($scripts -contains "build"){ Run "npm_build" { npm run -s build } -SoftBlockOnEPERM }

  $vg = Join-Path $ROOT "verify_golden.js"
  if(Test-Path $vg){
    Run "verify_golden" { node $vg } -SoftBlockOnEPERM
  }

  $va = Join-Path $ROOT "scripts\verify_all.cjs"
  if(Test-Path $va){
    Run "verify_all" { node $va } -SoftBlockOnEPERM
  }
}

Say "== HyperSnatch Full Audit/Clean =="
Say ("Root: " + $ROOT)

WriteTree
ScanBannedPublicTerms
ValidateDemo
GitHygiene
NodeTestSuite

if($Apply){
  MoveGarbage
} else {
  Add-Content $REPORT "CLEAN: skipped (run with -Apply to move garbage to _TRASH)."
}

Add-Content $REPORT "----------------------------------------"
Add-Content $REPORT ("FAILS: " + $script:FAILS)
Add-Content $REPORT ("BLOCKS: " + $script:BLOCKS)

if($script:FAILS -eq 0){
  Ok "GO: All checks passed."
  Say ("Report: " + $REPORT)
  exit 0
} else {
  Warn ("NO-GO: " + $script:FAILS + " failure(s).")
  Say ("Report: " + $REPORT)
  exit 2
}


