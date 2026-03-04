# HyperSnatch 🚀

<div align="center">

  ![Version](https://img.shields.io/github/v/release/Z3r0DayZion-install/hypersnatch?include_prereleases&style=for-the-badge)
  ![Verification](https://img.shields.io/badge/Verification-PowerShell%205%2B-blue?logo=powershell&style=for-the-badge)
  ![Offline](https://img.shields.io/badge/Offline-First-green?logo=offline&style=for-the-badge)
  ![Build](https://img.shields.io/github/actions/workflow/status/Z3r0DayZion-install/hypersnatch/release.yml?style=for-the-badge)

  ### Offline Media URL Extractor with Detached Binary Verification

  [Installation](#-installation) •
  [Verification](#-binary-verification) •
  [Usage](#-usage) •
  [Development](#-development) •
  [Security](#-security)

</div>

---

## ✨ Features

- 🔒 **Offline-First** – Zero network calls, local execution only.
- 🔐 **Self-Verifying** – Built-in PowerShell verifier for binary integrity.
- 📦 **Deterministic Builds** – Bit-for-bit reproducible release artifacts.
- 🪟 **Windows Native** – Optimized for Windows with Electron + Rust core.
- 🧪 **Tested** – Automated forensic validation in CI/CD.
- 🚀 **Automated Releases** – High-integrity delivery pipeline via GitHub Actions.

---

## 🔧 Installation

### Option 1: Installer (Recommended)
1. Download the latest installer from [Releases](https://github.com/Z3r0DayZion-install/hypersnatch/releases).
2. **Verify** before running:
```powershell
.\scripts\verify.ps1 -FilePath .\HyperSnatch-Setup-*.exe
```

### Option 2: Portable
1. Download the portable zip or executable.
2. Verify integrity:
```powershell
.\scripts\verify.ps1 -FilePath .\HyperSnatch-portable.exe
```

### Option 3: Build from Source
```bash
git clone https://github.com/Z3r0DayZion-install/hypersnatch
cd hypersnatch
npm install
npm run build:repro
```

---

## 🔐 Binary Verification

Every HyperSnatch release includes cryptographic verification to ensure the binary you run is exactly what we built. **No network required.**

### Quick Verify
```powershell
.\scripts\verify.ps1 -FilePath .\HyperSnatch-Setup-1.2.0.exe
```

### Advanced Usage
```powershell
# Detailed output with logging
.\scripts\verify.ps1 -FilePath .\HyperSnatch.exe -Detailed

# Self-test the verifier logic
.\scripts\verify.ps1 -SelfTest

# Update hash manifest (for maintainers)
.\scripts\verify.ps1 -UpdateHashes
```

### Exit Codes
| Code | Meaning |
|------|---------|
| 0 | ✅ Verified – Binary is authentic |
| 1 | ❌ File not found |
| 2 | ❌ Hash mismatch – **DO NOT RUN** |
| 3 | ❌ Manifest error |
| 4 | ❌ Permission error |
| 5 | ⚠️ Self-test failed |

---

## 🚀 Usage

### CLI Mode (Alpha)
```bash
# Basic extraction
hypersnatch extract https://example.com/video

# Batch mode
hypersnatch batch --file urls.txt
```

---

## 🛠 Development

### Prerequisites
- Node.js 20.17.0+
- Rust Toolchain (Stable)
- PowerShell 5.1+

### Build Process
```bash
npm install
npm run test:ci
npm run build:repro
```

---

## 🤝 Contributing
We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on security-first development and build determinism.

---

## 📜 License
MIT License – See [LICENSE](LICENSE) file.

---

## 🔒 Security
Report vulnerabilities to [security@hypersnatch.dev](mailto:security@hypersnatch.dev). See [SECURITY.md](SECURITY.md) for our full disclosure policy.

<div align="center">
  <sub>Built with 🔥 by Z3r0DayZion-install • Sovereign technology • Verify before trust</sub>
</div>