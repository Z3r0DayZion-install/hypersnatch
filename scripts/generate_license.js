const crypto = require('crypto');
const fs = require('fs');

if (!fs.existsSync('founder_keys.json')) {
  console.log("Generating new secp256k1 key pair...");
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'secp256k1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  fs.writeFileSync('founder_keys.json', JSON.stringify({ public: publicKey, private: privateKey }, null, 2));
  console.log("Keys saved to founder_keys.json. DO NOT SHIP THIS FILE.");
}

const keys = JSON.parse(fs.readFileSync('founder_keys.json', 'utf8'));

// If an HWID is provided as an argument, use it. Otherwise, auto-generate for the local machine.
let hwid = process.argv[2];

async function generate() {
  if (!hwid) {
    const os = require('os');
    const cpuId = os.cpus()[0].model.replace(/\s+/g, '_');
    const baseboardId = `${os.hostname()}_${os.userInfo().username}`;
    hwid = crypto.createHash('sha256').update(`HS-HWID-${cpuId}-${baseboardId}`).digest('hex');
    console.log(`Auto-detected local HWID: ${hwid}`);
  }

  const edition = process.argv[3] || 'LEGENDARY';
  const email = process.argv[4] || 'founder@hypersnatch.com';

  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1); // 1 year expiration

  const payload = {
    user: email,
    hwid: hwid,
    edition: edition,
    expiry: expiry.toISOString(),
    issued: new Date().toISOString(),
    features: ["ORACLE", "GHOST", "MAP", "FREEZE", "PDF", "VAULT"]
  };

  const sign = crypto.createSign('SHA256');
  sign.update(JSON.stringify(payload));
  sign.end();
  const signature = sign.sign(keys.private, 'hex');

  const license = {
    payload,
    signature
  };

  const outFile = `license_${hwid.substring(0, 8)}.json`;
  fs.writeFileSync(outFile, JSON.stringify(license, null, 2));
  console.log(`\nLicense generated: ${outFile}`);
  console.log(JSON.stringify(license, null, 2));
}

generate().catch(console.error);
