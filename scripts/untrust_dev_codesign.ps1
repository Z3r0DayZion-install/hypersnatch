[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Thumbprint
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$thumb = ($Thumbprint -replace '\s', '').ToUpperInvariant()
$removed = 0

foreach ($store in @('Root', 'TrustedPublisher')) {
  $path = "Cert:\CurrentUser\$store"
  $certs = @(Get-ChildItem $path | Where-Object Thumbprint -eq $thumb)
  if ($certs.Count -gt 0) {
    $certs | Remove-Item -Force
    $removed += $certs.Count
  }
}

Write-Host "Removed $removed cert(s) for $thumb from CurrentUser Root/TrustedPublisher"
