# License Fulfillment — Email Templates

## Template 1: License Key Delivery

**Subject:** Your HyperSnatch License Key 🔑

---

Hi [NAME],

Thanks for purchasing HyperSnatch [EDITION] Edition!

Your license key is attached as `license.json`. To activate:

1. Open HyperSnatch
2. Click **Import Key** in the header bar
3. Select the attached `license.json`

Your license is valid for 1 year and is bound to your hardware (HWID: [HWID_SHORT]...).

If you need to transfer to a new machine, just reply with your new HWID and I'll regenerate it.

Best,
[FOUNDER_NAME]
HyperSnatch

---

## Template 2: HWID Request (Pre-Purchase / Missing HWID)

**Subject:** RE: HyperSnatch Purchase — Need Your HWID

---

Hi [NAME],

Thanks for your purchase! To generate your license key, I need your Hardware Node ID:

1. Open HyperSnatch
2. Click the green chip icon in the header bar (it will say something like `7bbe0d87...`)
3. It copies your full 64-character HWID to your clipboard
4. Reply to this email with it

I'll have your key back to you within 12 hours.

Best,
[FOUNDER_NAME]

---

## Template 3: Machine Transfer

**Subject:** RE: HyperSnatch — License Transfer Confirmed

---

Hi [NAME],

Your license has been regenerated for your new machine.

New key is attached. Old key is now invalid.

To activate, click **Import Key** in HyperSnatch and select the new `license.json`.

Best,
[FOUNDER_NAME]

---

## Quick Commands (for the founder)

```bash
# Generate SOVEREIGN license ($149)
node scripts/generate_license.js --hwid [PASTE_HWID] --user "buyer@email.com" --edition SOVEREIGN

# Generate INSTITUTIONAL license ($499)
node scripts/generate_license.js --hwid [PASTE_HWID] --user "corp@email.com" --edition INSTITUTIONAL --expiry-years 2

# Generate for your own machine (testing)
node scripts/generate_license.js --edition SOVEREIGN --user "founder"
```
