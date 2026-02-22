# Build Instructions - HyperSnatch v1.0.1

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Windows 10/11 x64 (for Windows builds)
- Git (for source management)

## Setup

```bash
# Clone repository
git clone https://github.com/Z3r0DayZion-install/hypersnatch.git
cd hypersnatch

# Checkout release tag
git checkout v1.0.1

# Install dependencies
npm ci
```

## Build Process

### 1. Development Build
```bash
# Run tests first
npm test

# Build for development
npm run build
```

### 2. Production Build
```bash
# Clean previous builds
npm run clean

# Production build
npm run build

# Output location: dist/
```

### 3. Build Artifacts

The build process generates:
- `dist/HyperSnatch-Setup-1.0.1.exe` - Installer (72.7 MB)
- `dist/HyperSnatch-Portable-1.0.1.exe` - Portable version (168.6 MB)
- `dist/builder-effective-config.yaml` - Build configuration
- `dist/latest.yml` - Update manifest

## Hash Computation

### PowerShell (Recommended)
```powershell
# Compute SHA256 for all artifacts
Get-FileHash dist/*.exe -Algorithm SHA256 | Format-Table -AutoSize

# Individual file hash
Get-FileHash dist/HyperSnatch-Setup-1.0.1.exe -Algorithm SHA256
```

### Git Bash
```bash
# Compute SHA256
sha256sum dist/*.exe

# Individual file hash
sha256sum dist/HyperSnatch-Setup-1.0.1.exe
```

## Expected Hashes

```
HyperSnatch-Setup-1.0.1.exe: B2A93F88385F300EF971C21C91867C7EA213C13D8C7779AAD8BCB87EAAC69023
HyperSnatch-Portable-1.0.1.exe: bcadf7bd68c74bba682f516ffba667386c125a06960652b4be11688d6e2d3e03
```

## Output Structure

```
dist/
├── HyperSnatch-Setup-1.0.1.exe          # Installer
├── HyperSnatch-Setup-1.0.1.exe.blockmap # Blockmap for updates
├── HyperSnatch-Portable-1.0.1.exe      # Portable version
├── HyperSnatch-Portable-1.0.1.exe.blockmap
├── win-unpacked/                       # Unpacked application
│   ├── HyperSnatch.exe
│   └── resources/
├── builder-effective-config.yaml       # Build configuration
└── latest.yml                          # Update manifest
```

## Build Configuration

The build is configured in `package.json`:

```json
{
  "build": {
    "appId": "com.hypersnatch.platform",
    "productName": "HyperSnatch",
    "files": [
      "src/**/*",
      "hypersnatch.html",
      "package.json"
    ],
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        },
        {
          "target": "portable",
          "arch": ["x64"]
        }
      ]
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Build fails with "No JSON content found in output"**
   - Solution: Clean node_modules and reinstall
   ```bash
   rm -rf node_modules
   npm ci
   ```

2. **Large file warnings during Git operations**
   - Solution: Ensure .gitignore excludes build artifacts
   - Check: `git ls-files | Select-String -Pattern ".exe"`

3. **Test failures**
   - Solution: Run tests individually
   ```bash
   npm test
   ```

### Build Verification

After build, verify:

1. **File existence**: Check all expected files exist in `dist/`
2. **Hash verification**: Compare computed hashes with expected values
3. **Installation test**: Run installer on clean system
4. **Functionality test**: Verify all features work correctly

## Release Preparation

For production release:

1. **Clean build environment**
2. **Run full test suite**
3. **Generate build artifacts**
4. **Compute and verify hashes**
5. **Prepare release documentation**
6. **Create GitHub Release**

## Security Notes

- Build environment should be clean and trusted
- Verify all dependencies are from trusted sources
- Check for any security advisories in dependencies
- Ensure no secrets are included in build artifacts

---

*For issues, refer to TROUBLESHOOTING.md or check the project documentation.*
