# Key Compromise Protocol

> Incident response procedures for the Ed25519 root signing key.

## Trigger Conditions

This protocol MUST be initiated if any of the following occur:
1. The developer machine is compromised or stolen.
2. The `SIGNING_KEY_PEM` GitHub Action secret is exfiltrated or inadvertently exposed.
3. The offline encrypted backup USB drive is lost or accessed by an unauthorized party.
4. A release is published with a valid signature but containing malicious code (indicating an insider threat or key misuse).

## Immediate Response (0-4 Hours)

### 1. Revoke Fingerprint
The current Ed25519 root fingerprint must be immediately removed from all 'Trust Anchor' locations:
- Delete `release/verify/ROOT_FINGERPRINT.txt`
- Remove the fingerprint from the `README.md` and `docs/PROOF.md`

### 2. Publish Revocation Notice
Create `docs/REVOKED_KEYS.txt` and append the compromised fingerprint alongside the date and incident ID.
Update `SECURITY.md` and `TRANSPARENCY_INDEX.md` with an active incident alert warning users not to trust the compromised key.

### 3. Contain GitHub Actions
Immediately remove or rotate the `SIGNING_KEY_PEM` secret in the repository settings to prevent further malicious CI builds.

## Recovery Phase (24-48 Hours)

### 1. Generate New Root Key
Perform the Key Ceremony (`node scripts/sign_manifest.cjs --generate-keys`) on a known-clean, physically isolated machine. Backup the new private key to a sterile USB drive.

### 2. Publish Cross-Signed Transition
Publish the new public key (`release/verify/root_public_key.pem`) and explicitly update `ROOT_FINGERPRINT.txt`. Create a signed text document detailing the compromise, signed by the *new* key, proving ownership of the new infrastructure.

### 3. Update Verifiers
Increment the version requirement in `verify_node.js` and `verify.ps1`, ensuring older verifier scripts are explicitly marked deprecated.

### 4. Audit Transparency Log
Review `release/transparency.log` to identify the exact window of compromise. Annotate the log with `[REVOKED]` tags for the affected releases.

## Historical Incident Index
No key compromise incidents have occurred. The current key fingerprint (`B90B E0DB 35A2 8123 318E 9BCB FF0D ECB3 10B7 906B D538 C8F5 0541 3C8D 67E3 6CDC`) is the original and only root of trust.
