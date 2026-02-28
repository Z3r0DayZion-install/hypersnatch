@echo off
setlocal EnableExtensions

rem HyperSnatch: one-command build + (optional) sign + verify + stage + report.
rem This batch is self-contained and does not require running any *.ps1 directly.

set "REPO=%~dp0"
if "%REPO:~-1%"=="\" set "REPO=%REPO:~0,-1%"

set "PWSH=%ProgramFiles%\PowerShell\7\pwsh.exe"
if exist "%PWSH%" (
  set "PS=%PWSH%"
) else (
  set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
)

set "MODE=%~1"
if "%MODE%"=="" goto :help
if /I "%MODE%"=="help" goto :help
if /I "%MODE%"=="-h" goto :help
if /I "%MODE%"=="--help" goto :help

shift

rem Defaults
set "OUTDIR="
set "THUMBPRINT=%HYPERSNATCH_DEV_THUMBPRINT%"
if "%THUMBPRINT%"=="" set "THUMBPRINT=434D1C458BE048CCA4F0CA0564A77CC631779D77"
set "PFX_PATH=%HYPERSNATCH_PFX_PATH%"
set "PFX_PASSWORD=%HYPERSNATCH_PFX_PASSWORD%"
set "TS_URL=%HYPERSNATCH_TIMESTAMP_URL%"
if "%TS_URL%"=="" set "TS_URL=http://timestamp.digicert.com"
set "TRUST_DEV=1"
set "SIGN_ELECTRON=1"
set "STAGE=1"
set "REQUIRE_TIMESTAMP=0"
set "NO_TIMESTAMP=0"

:parse
if "%~1"=="" goto :parsed

if /I "%~1"=="--outdir" (
  set "OUTDIR=%~2"
  shift
  shift
  goto :parse
)

if /I "%~1"=="--thumbprint" (
  set "THUMBPRINT=%~2"
  shift
  shift
  goto :parse
)

if /I "%~1"=="--pfx" (
  set "PFX_PATH=%~2"
  shift
  shift
  goto :parse
)

if /I "%~1"=="--pfx-pass" (
  set "PFX_PASSWORD=%~2"
  shift
  shift
  goto :parse
)

if /I "%~1"=="--timestamp-url" (
  set "TS_URL=%~2"
  shift
  shift
  goto :parse
)

if /I "%~1"=="--no-trust" (
  set "TRUST_DEV=0"
  shift
  goto :parse
)

if /I "%~1"=="--no-electron-sign" (
  set "SIGN_ELECTRON=0"
  shift
  goto :parse
)

if /I "%~1"=="--no-stage" (
  set "STAGE=0"
  shift
  goto :parse
)

if /I "%~1"=="--enforce-timestamp" (
  set "REQUIRE_TIMESTAMP=1"
  shift
  goto :parse
)

if /I "%~1"=="--no-timestamp" (
  set "NO_TIMESTAMP=1"
  shift
  goto :parse
)

echo Unknown option: %~1
exit /b 2

:parsed

if /I "%MODE%"=="untrust-dev" (
  call :untrust_dev "%THUMBPRINT%"
  exit /b %errorlevel%
)

pushd "%REPO%" >nul

for /f "delims=" %%V in ('node -p "require('./VERSION.json').version"') do set "VER=%%V"
if "%VER%"=="" (
  echo Failed to read VERSION.json
  popd >nul
  exit /b 3
)

for /f "delims=" %%D in ('""%PS%" -NoProfile -Command "Get-Date -Format yyyy-MM-dd""') do set "DATETAG=%%D"
if "%DATETAG%"=="" set "DATETAG=unknown-date"

if "%OUTDIR%"=="" (
  set "OUTDIR=%USERPROFILE%\Downloads\HyperSnatch_Latest_%VER%_RustCore_%DATETAG%"
  if /I not "%MODE%"=="unsigned" set "OUTDIR=%OUTDIR%_Signed"
)

rem Clear signing env to avoid cross-run contamination
call :clear_signing_env

set "HS_CORE_REQUIRED=1"

if /I "%MODE%"=="unsigned" (
  set "HYPERSNATCH_SIGN=0"
  set "HYPERSNATCH_ENFORCE_SIGNING=0"
  set "HYPERSNATCH_ENFORCE_TIMESTAMP=0"
) else if /I "%MODE%"=="dev" (
  if "%TRUST_DEV%"=="1" call :trust_dev "%THUMBPRINT%"
  set "HYPERSNATCH_SIGN=1"
  set "HYPERSNATCH_SIGN_THUMBPRINT=%THUMBPRINT%"
  set "HYPERSNATCH_ENFORCE_SIGNING=1"
  set "HYPERSNATCH_ENFORCE_TIMESTAMP=0"
) else if /I "%MODE%"=="pfx" (
  if "%PFX_PATH%"=="" (
    echo Missing PFX path. Set HYPERSNATCH_PFX_PATH or pass --pfx.
    popd >nul
    exit /b 4
  )
  if "%PFX_PASSWORD%"=="" (
    echo Missing PFX password. Set HYPERSNATCH_PFX_PASSWORD or pass --pfx-pass.
    popd >nul
    exit /b 4
  )
  set "HYPERSNATCH_SIGN=1"
  set "HYPERSNATCH_SIGN_PFX=%PFX_PATH%"
  set "HYPERSNATCH_SIGN_PFX_PASSWORD=%PFX_PASSWORD%"
  set "HYPERSNATCH_ENFORCE_SIGNING=1"
  if "%REQUIRE_TIMESTAMP%"=="1" (
    set "HYPERSNATCH_ENFORCE_TIMESTAMP=1"
  ) else (
    set "HYPERSNATCH_ENFORCE_TIMESTAMP=0"
  )
) else (
  echo Unknown mode: %MODE%
  popd >nul
  exit /b 2
)

if "%SIGN_ELECTRON%"=="1" (
  set "HYPERSNATCH_SIGN_ELECTRON=1"
)

if "%NO_TIMESTAMP%"=="0" (
  set "HYPERSNATCH_SIGN_TIMESTAMP_URL=%TS_URL%"
)

echo.
echo === HyperSnatch Release ===
echo Mode: %MODE%
echo Version: %VER%
echo OutDir: %OUTDIR%
echo Timestamp URL: %HYPERSNATCH_SIGN_TIMESTAMP_URL%
echo.

node scripts/verify_release.cjs
set "RC=%errorlevel%"
if not "%RC%"=="0" (
  rem In PFX mode, allow an optional fallback to no-timestamp unless explicitly enforced.
  if /I "%MODE%"=="pfx" if "%REQUIRE_TIMESTAMP%"=="0" if "%NO_TIMESTAMP%"=="0" (
    echo.
    echo Signing/timestamping may have failed. Retrying without timestamp...
    set "HYPERSNATCH_SIGN_TIMESTAMP_URL=0"
    node scripts/verify_release.cjs
    set "RC=%errorlevel%"
  )
)

if not "%RC%"=="0" (
  popd >nul
  exit /b %RC%
)

if "%STAGE%"=="1" (
  call :stage "%OUTDIR%" "%VER%"
  if errorlevel 1 (
    popd >nul
    exit /b 10
  )
  call :report "%OUTDIR%" "%VER%" "%DATETAG%"
)

popd >nul

echo.
echo Done.
echo Output: %OUTDIR%
exit /b 0

:clear_signing_env
for %%K in (
  HYPERSNATCH_SIGN
  HYPERSNATCH_SIGN_THUMBPRINT
  HYPERSNATCH_SIGN_SHA1
  HYPERSNATCH_SIGN_SUBJECT
  HYPERSNATCH_SIGN_PFX
  HYPERSNATCH_SIGN_PFX_PASSWORD
  HYPERSNATCH_SIGN_PFX_PASS
  HYPERSNATCH_SIGN_MACHINE_STORE
  HYPERSNATCH_SIGN_ELECTRON
  HYPERSNATCH_SIGN_TIMESTAMP_URL
  HYPERSNATCH_ENFORCE_SIGNING
  HYPERSNATCH_ENFORCE_TIMESTAMP
  HS_CORE_REQUIRED
) do set "%%K="
exit /b 0

:trust_dev
set "TP=%~1"
if "%TP%"=="" exit /b 1
"%PS%" -NoProfile -ExecutionPolicy Bypass -Command "& { param([string]$thumb) $thumb=($thumb -replace '\\s','').ToUpperInvariant(); $c=Get-ChildItem Cert:\\CurrentUser\\My | Where-Object Thumbprint -eq $thumb | Select-Object -First 1; if(-not $c){ throw 'cert not found in CurrentUser\\My' }; $tmp=Join-Path $env:TEMP ('HyperSnatchCodesign-'+$thumb+'.cer'); Export-Certificate -Cert $c.PSPath -FilePath $tmp -Force | Out-Null; Import-Certificate -FilePath $tmp -CertStoreLocation Cert:\\CurrentUser\\Root | Out-Null; Import-Certificate -FilePath $tmp -CertStoreLocation Cert:\\CurrentUser\\TrustedPublisher | Out-Null; Remove-Item -LiteralPath $tmp -Force }" "%TP%"
exit /b %errorlevel%

:untrust_dev
set "TP=%~1"
if "%TP%"=="" exit /b 1
"%PS%" -NoProfile -ExecutionPolicy Bypass -Command "& { param([string]$thumb) $thumb=($thumb -replace '\\s','').ToUpperInvariant(); foreach($store in @('Root','TrustedPublisher')){ $p='Cert:\\CurrentUser\\'+$store; Get-ChildItem $p | Where-Object Thumbprint -eq $thumb | Remove-Item -Force -ErrorAction SilentlyContinue } }" "%TP%"
exit /b %errorlevel%

:stage
set "OUT=%~1"
set "VER=%~2"
if "%OUT%"=="" exit /b 1
if not exist "%OUT%" mkdir "%OUT%" >nul 2>&1

set "DIST=%REPO%\dist"
if not exist "%DIST%" (
  echo Missing dist folder: %DIST%
  exit /b 1
)

copy /y "%DIST%\HyperSnatch-Setup-%VER%.exe" "%OUT%\" >nul 2>&1
copy /y "%DIST%\HyperSnatch-Setup-%VER%.exe.blockmap" "%OUT%\" >nul 2>&1
copy /y "%DIST%\latest.yml" "%OUT%\" >nul 2>&1
copy /y "%DIST%\MANIFEST.json" "%OUT%\" >nul 2>&1
copy /y "%DIST%\SHA256SUMS.txt" "%OUT%\" >nul 2>&1
copy /y "%DIST%\hypersnatch.exe" "%OUT%\" >nul 2>&1
if exist "%DIST%\HyperSnatch_release.zip" copy /y "%DIST%\HyperSnatch_release.zip" "%OUT%\" >nul 2>&1

if exist "%DIST%\win-unpacked" (
  if exist "%SystemRoot%\System32\robocopy.exe" (
    robocopy "%DIST%\win-unpacked" "%OUT%\win-unpacked" /E /R:1 /W:1 /NFL /NDL /NJH /NJS >nul
    if errorlevel 8 exit /b 1
  ) else (
    xcopy "%DIST%\win-unpacked" "%OUT%\win-unpacked" /E /I /Y >nul
  )
)

exit /b 0

:report
set "OUT=%~1"
set "VER=%~2"
set "DATE=%~3"
if "%OUT%"=="" exit /b 1
set "REPORT=%OUT%\BUILD_REPORT_%DATE%.txt"

"%PS%" -NoProfile -ExecutionPolicy Bypass -Command "& { $ErrorActionPreference='Stop'; $out='%OUT%'; $ver='%VER%'; $date='%DATE%'; $repo='%REPO%'; $files=@( (Join-Path $out ('HyperSnatch-Setup-'+$ver+'.exe')), (Join-Path $out ('HyperSnatch-Setup-'+$ver+'.exe.blockmap')), (Join-Path $out 'latest.yml'), (Join-Path $out 'MANIFEST.json'), (Join-Path $out 'SHA256SUMS.txt'), (Join-Path $out 'hypersnatch.exe'), (Join-Path $out 'win-unpacked\\HyperSnatch.exe'), (Join-Path $out 'win-unpacked\\resources\\hs-core.exe') ); $hashes=$files|Where-Object{Test-Path -LiteralPath $_}|ForEach-Object{ $h=Get-FileHash -Algorithm SHA256 -LiteralPath $_; [pscustomobject]@{file=(Resolve-Path -LiteralPath $_).Path; sha256=$h.Hash}}; $sigs=$files|Where-Object{(Test-Path -LiteralPath $_) -and ($_ -like '*.exe')}|ForEach-Object{ $s=Get-AuthenticodeSignature -FilePath $_; [pscustomobject]@{file=(Resolve-Path -LiteralPath $_).Path; status=$s.Status.ToString(); signer=$s.SignerCertificate.Subject; thumb=$s.SignerCertificate.Thumbprint; timestamp=[bool]$s.TimeStamperCertificate}}; $head=(git -C $repo rev-parse HEAD 2>$null); if(-not $head){$head='(no git head)'}; $nl=[Environment]::NewLine; $text='HyperSnatch Build Report'+$nl+('Date: '+$date)+$nl+('Version: '+$ver)+$nl+('Git HEAD: '+$head)+$nl+('Node: '+(node -v 2>$null))+$nl+('npm: '+(npm -v 2>$null))+$nl+('cargo: '+(cargo -V 2>$null))+$nl+$nl+'Artifacts (SHA256):'+$nl+(($hashes|Sort-Object file|ForEach-Object{ '- '+$_.sha256+'  '+$_.file }) -join $nl)+$nl+$nl+'Authenticode:'+$nl+(($sigs|Sort-Object file|ForEach-Object{ '- '+$_.status+' signer=' +$_.signer+' thumb=' +$_.thumb+' timestamp=' +$_.timestamp+'  '+$_.file }) -join $nl)+$nl; Set-Content -LiteralPath (Join-Path $out ('BUILD_REPORT_'+$date+'.txt')) -Value $text -Encoding utf8 -Force }"

exit /b %errorlevel%

:help
echo Usage:
echo   release.bat unsigned [options]
echo   release.bat dev [options]
echo   release.bat pfx [options]
echo   release.bat untrust-dev [--thumbprint THUMB]
echo.
echo Options:
echo   --outdir PATH
 echo   --no-stage
 echo   --no-electron-sign
 echo   --timestamp-url URL
 echo   --no-timestamp
 echo   --enforce-timestamp
 echo   --no-trust           (dev mode)
 echo   --thumbprint THUMB   (dev/untrust-dev)
 echo   --pfx PATH           (pfx mode)
 echo   --pfx-pass PASS      (pfx mode)
echo.
echo Env vars (optional):
echo   HYPERSNATCH_DEV_THUMBPRINT
 echo   HYPERSNATCH_PFX_PATH
 echo   HYPERSNATCH_PFX_PASSWORD
 echo   HYPERSNATCH_TIMESTAMP_URL
exit /b 0
