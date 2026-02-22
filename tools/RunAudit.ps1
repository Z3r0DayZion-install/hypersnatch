param(
  [string]$Root=".",
  [switch]$Apply,
  [switch]$PurgeTrash,
  [switch]$ReinstallDeps
)
Set-StrictMode -Version Latest
$ErrorActionPreference="Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$script = Join-Path $here "HS_FullAuditClean.ps1"
if(!(Test-Path $script)){ throw "Missing $script" }
& $script -Root $Root @(
  $(if($Apply){ "-Apply" } else { $null }),
  $(if($PurgeTrash){ "-PurgeTrash" } else { $null }),
  $(if($ReinstallDeps){ "-ReinstallDeps" } else { $null })
) | Out-Null
