# HyperSnatch Code Signing Infrastructure (v1.2)

To move from "Experimental Software" to "Enterprise Publisher" status, HyperSnatch Vanguard relies on standard Authenticode/EV Code Signing. 

## 🛡️ Why This is Non-Negotiable
Unsigned binaries trigger Windows SmartScreen, aggressive Defender heuristics, and organizational AppLocker policies. Code signing establishes publisher identity and significantly reduces installation friction for your users.

## ⚙️ How It Works in v1.2
The `package.json` build pipeline is now pre-configured to detect standard Code Signing Environment Variables and inject them into `electron-builder`.

### Option 1: Standard Authenticode (.pfx file)
If you purchase a standard Authenticode certificate (e.g., from SSL.com, Sectigo, DigiCert), export it as a `.pfx` file and set the following environment variables in your CI/CD pipeline or local environment:

```bash
# Set the path to your .pfx file
export CSC_LINK="/path/to/your/certificate.pfx"

# Set the password for the .pfx file
export CSC_KEY_PASSWORD="your-super-secret-password"
```

Run the build script:
```bash
npm run build:repro
```
`electron-builder` will automatically detect `CSC_LINK` and sign both the unpackaged `.exe` and the final installer, timestamping it against `http://timestamp.digicert.com`.

### Option 2: Extended Validation (EV) Hardware Token
EV certificates are physically mailed to you on a USB token (e.g., YubiKey) and provide instant SmartScreen reputation.

To use an EV Token with our `sign_windows.cjs` script:
1. Plug in the USB Token.
2. Ensure the Safenet Authentication Client (or equivalent) is running.
3. Find your certificate's SHA1 Thumbprint (via `certmgr.msc` or PowerShell).

```powershell
$env:HYPERSNATCH_SIGN="1"
$env:HYPERSNATCH_SIGN_THUMBPRINT="YOUR_SHA1_THUMBPRINT_HERE"
npm run build:repro
```
This tells the internal `signtool.exe` wrapper to query the Windows Certificate Store for your hardware-bound key.

## 🔍 Validation
To manually verify that your generated installer is signed and timestamped:
1. Right-click `dist\HyperSnatch-Setup-1.2.0-dev.exe` -> Properties.
2. Go to the **Digital Signatures** tab.
3. Verify that your Publisher Name appears and the timestamp is present.

---
*HyperSnatch Security Team - March 2026*
