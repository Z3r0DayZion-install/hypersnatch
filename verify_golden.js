"use strict";

const fs = require("fs");
const SmartDecode = require("./src/core/smartdecode/index");

async function runRegression() {
  const fixtureData = JSON.parse(fs.readFileSync("./fixtures/baseline.json", "utf8"));
  const goldenRaw = JSON.parse(fs.readFileSync("./goldens/baseline.json", "utf8"));

  const goldenData = Array.isArray(goldenRaw) ? goldenRaw : fixtureData.map(() => goldenRaw);

  console.log(`--- Starting Per-Fixture Regression (v${SmartDecode.VERSION || "unknown"}) ---`);

  for (let i = 0; i < fixtureData.length; i++) {
    const input = fixtureData[i];
    const results = await SmartDecode.run(input, { splitSegments: false });

    const { toGolden } = require("./src/core/smartdecode/golden-adapter");
    const projection = toGolden(results);

    const actual = JSON.stringify(projection, null, 2);
    const expected = JSON.stringify(goldenData[i] || {}, null, 2);

    if (actual !== expected) {
      console.error(`❌ FIXTURE FAIL [Index ${i}]`);
      console.error(`EXPECTED:\n${expected}\n\nACTUAL:\n${actual}`);
      process.exit(1);
    }

    console.log(`✅ FIXTURE PASS [Index ${i}]`);
  }

  console.log("--- ALL DETERMINISTIC TESTS PASSED ---");
  process.exit(0);
}

runRegression().catch((err) => {
  console.error("❌ VERIFY CRASHED:", err);
  process.exit(1);
});
