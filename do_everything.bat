@echo off
setlocal EnableExtensions

rem HyperSnatch: one-command "do everything" wrapper (Windows batch).
rem - Scans for latest local builds (Downloads + repo dist)
rem - Scans Downloads for "onlyhypersnatch" artifacts (optional deep scan)
rem - Runs release.bat (unsigned/dev/pfx) with safe defaults
rem - Verifies expected outputs exist and prints next commands

set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

set "REPO=%HYPERSNATCH_REPO%"
if "%REPO%"=="" set "REPO=%SCRIPT_DIR%"

if not exist "%REPO%\release.bat" (
  echo FAILED: release.bat not found at:
  echo   %REPO%
  echo Set HYPERSNATCH_REPO to your repo path and retry.
  exit /b 2
)

pushd "%REPO%" >nul

rem Pick PowerShell (pwsh preferred)
set "PWSH=%ProgramFiles%\PowerShell\7\pwsh.exe"
if exist "%PWSH%" (set "PS=%PWSH%") else set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"

set "MODE=dev"
set "DEEP_SCAN=0"
set "NO_TIMESTAMP=0"
set "TRACE=0"
set "OUT="

:parse
if "%~1"=="" goto :parsed
if /I "%~1"=="--unsigned" (set "MODE=unsigned"& shift& goto :parse)
if /I "%~1"=="--dev" (set "MODE=dev"& shift& goto :parse)
if /I "%~1"=="--pfx" (set "MODE=pfx"& shift& goto :parse)
if /I "%~1"=="--deep-scan" (set "DEEP_SCAN=1"& shift& goto :parse)
if /I "%~1"=="--no-timestamp" (set "NO_TIMESTAMP=1"& shift& goto :parse)
if /I "%~1"=="--trace" (set "TRACE=1"& shift& goto :parse)
if /I "%~1"=="--outdir" (set "OUT=%~2"& shift& shift& goto :parse)
if /I "%~1"=="-h" goto :help
if /I "%~1"=="--help" goto :help
echo Unknown option: %~1
goto :help

:parsed
if "%TRACE%"=="1" echo on

for /f "delims=" %%V in ('node -p "require('./VERSION.json').version" 2^>nul') do set "VER=%%V"
if "%VER%"=="" (
  echo FAILED: VERSION.json missing or node not available.
  popd >nul
  exit /b 3
)

for /f "delims=" %%D in ('""%PS%" -NoProfile -Command "Get-Date -Format yyyy-MM-dd""') do set "DATETAG=%%D"
if "%DATETAG%"=="" set "DATETAG=unknown-date"

if "%OUT%"=="" set "OUT=%USERPROFILE%\Downloads\HyperSnatch_FINAL_%VER%_%DATETAG%"

echo(
echo === HyperSnatch DO EVERYTHING ===
echo Repo:    %REPO%
echo Version: %VER%
echo Mode:    %MODE%
echo OutDir:  %OUT%
echo(

call :scan_builds
call :scan_only_downloads
if "%DEEP_SCAN%"=="1" call :scan_only_deep

echo(
echo --- Building / Testing / Packaging ---

if "%NO_TIMESTAMP%"=="1" goto :run_no_ts

call "%REPO%\release.bat" %MODE% --outdir "%OUT%"
if "%TRACE%"=="1" echo on
set "RC=%errorlevel%"
if "%RC%"=="0" goto :after_run

echo(
echo Release failed (exit %RC%). Retrying with --no-timestamp...
call "%REPO%\release.bat" %MODE% --no-timestamp --outdir "%OUT%"
if "%TRACE%"=="1" echo on
set "RC=%errorlevel%"
goto :after_run

:run_no_ts
call "%REPO%\release.bat" %MODE% --no-timestamp --outdir "%OUT%"
if "%TRACE%"=="1" echo on
set "RC=%errorlevel%"

:after_run
if not "%RC%"=="0" goto :fail_rc

rem Output checks
if not exist "%OUT%\HyperSnatch-Setup-%VER%.exe" goto :fail_installer

dir /b "%OUT%\BUILD_REPORT_*.txt" >nul 2>&1
if errorlevel 1 goto :fail_report

echo(
echo SUCCESS.
echo Output folder: %OUT%
echo(
echo Run from PowerShell (no leading '-' !):
echo   cmd.exe /c "cd /d %REPO% ^&^& do_everything.bat"
echo(
echo Open output:
echo   explorer "%OUT%"

popd >nul
exit /b 0

:fail_rc
echo(
echo FAILED (exit %RC%).
popd >nul
exit /b %RC%

:fail_installer
echo(
echo FAILED: missing installer:
echo   %OUT%\HyperSnatch-Setup-%VER%.exe
popd >nul
exit /b 10

:fail_report
echo(
echo FAILED: missing BUILD_REPORT_*.txt
popd >nul
exit /b 11

:scan_builds
echo --- Local Build Scan (latest) ---
"%PS%" -NoProfile -Command "& { $ErrorActionPreference='SilentlyContinue'; $repo='%REPO%'; $dl=Join-Path $env:USERPROFILE 'Downloads'; $targets=@($dl,(Join-Path $repo 'dist')); foreach($t in $targets){ if(Test-Path $t){ Write-Host ('['+$t+']'); Get-ChildItem -LiteralPath $t -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'HyperSnatch*' -or $_.Name -like '*hypersnatch*' } | Sort-Object LastWriteTime -Descending | Select-Object -First 6 | ForEach-Object { Write-Host ('  '+$_.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')+'  '+$_.Name) } } } $exe=Get-ChildItem -LiteralPath $dl -Recurse -Filter 'HyperSnatch-Setup-*.exe' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1; Write-Host ''; if($exe){ Write-Host ('Latest installer: '+$exe.FullName) } else { Write-Host 'Latest installer: (none found in Downloads)' } }"
exit /b 0

:scan_only_downloads
echo(
echo --- Downloads Scan: onlyhypersnatch ---
"%PS%" -NoProfile -Command "& { $ErrorActionPreference='SilentlyContinue'; $dl=Join-Path $env:USERPROFILE 'Downloads'; $hits=Get-ChildItem -LiteralPath $dl -Recurse -Force -Filter '*onlyhypersnatch*' -ErrorAction SilentlyContinue | Select-Object FullName,LastWriteTime | Sort-Object LastWriteTime -Descending; if(-not $hits){ Write-Host '  none found'; return }; $hits | Select-Object -First 20 | ForEach-Object { Write-Host ('  '+$_.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')+'  '+$_.FullName) }; if($hits.Count -gt 20){ Write-Host ('  ... '+($hits.Count-20)+' more'); } }"
exit /b 0

:scan_only_deep
echo(
echo --- Deep Scan (slow): onlyhypersnatch under %USERPROFILE% ---
"%PS%" -NoProfile -Command "& { $ErrorActionPreference='SilentlyContinue'; $root=$env:USERPROFILE; $hits=Get-ChildItem -LiteralPath $root -Recurse -Force -Filter '*onlyhypersnatch*' -ErrorAction SilentlyContinue | Select-Object FullName,LastWriteTime | Sort-Object LastWriteTime -Descending; if(-not $hits){ Write-Host '  none found'; return }; $hits | Select-Object -First 30 | ForEach-Object { Write-Host ('  '+$_.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')+'  '+$_.FullName) }; if($hits.Count -gt 30){ Write-Host ('  ... '+($hits.Count-30)+' more'); } }"
exit /b 0

:help
echo Usage:
echo   HyperSnatch_do_everything.bat [--dev^|--unsigned^|--pfx] [--outdir PATH] [--no-timestamp] [--deep-scan] [--trace]
echo(
echo Notes:
echo   - Set HYPERSNATCH_REPO to override repo path.
echo(
echo Examples:
echo   HyperSnatch_do_everything.bat
echo   HyperSnatch_do_everything.bat --unsigned
echo   HyperSnatch_do_everything.bat --dev --deep-scan
echo   HyperSnatch_do_everything.bat --trace --unsigned
echo   HyperSnatch_do_everything.bat --outdir "%USERPROFILE%\Downloads\HS_Test"

popd >nul
exit /b 0
