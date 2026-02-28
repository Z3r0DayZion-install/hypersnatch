[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$Thumbprint
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$thumb = ($Thumbprint -replace '\s', '').ToUpperInvariant()
$cert = Get-ChildItem Cert:\CurrentUser\My | Where-Object Thumbprint -eq $thumb | Select-Object -First 1
if (-not $cert) {
  throw "Certificate not found in Cert:\CurrentUser\My for thumbprint $thumb"
}

$tmp = Join-Path $env:TEMP ("HyperSnatchCodesign-" + $thumb + ".cer")
Export-Certificate -Cert $cert.PSPath -FilePath $tmp -Force | Out-Null
Import-Certificate -FilePath $tmp -CertStoreLocation Cert:\CurrentUser\Root | Out-Null
Import-Certificate -FilePath $tmp -CertStoreLocation Cert:\CurrentUser\TrustedPublisher | Out-Null
Remove-Item -LiteralPath $tmp -Force

Write-Host "Trusted $thumb in CurrentUser Root + TrustedPublisher"
