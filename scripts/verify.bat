@echo off
REM HyperSnatch Binary Verification Launcher
REM Usage: verify.bat [FilePath]

if "%~1"=="" (
    echo [!] Usage: verify.bat [FilePath]
    echo [!] Example: verify.bat HyperSnatch-Setup-1.2.0.exe
    pause
    exit /b 1
)

powershell -ExecutionPolicy Bypass -File "%~dp0verify.ps1" -FilePath "%~1" -Detailed

if %ERRORLEVEL% NEQ 0 (
    echo [!] Verification FAILED. Do not run this file.
) else (
    echo [!] Verification SUCCESSFUL.
)

pause
