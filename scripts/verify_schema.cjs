const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const { execSync } = require('child_process');

const ajv = new Ajv({ strict: false });

try {
    console.log("running sample decode to get json output...");
    const out = execSync("node src/cli/hypersnatch-cli.js decode --in fixtures/baseline.json --json", { encoding: "utf8" });
    const resultJson = JSON.parse(out);

    const schemaStr = fs.readFileSync(path.join(__dirname, "../schema/hypersnatch.result.schema.json"), "utf8");
    const schema = JSON.parse(schemaStr);

    const validate = ajv.compile(schema);
    const valid = validate(resultJson);

    if (!valid) {
        console.error("Schema validation failed:", validate.errors);
        process.exit(1);
    }

    console.log("✅ Schema validation perfectly passed.");
} catch (e) {
    console.error("Failed to verify schema:", e.message || e);
    process.exit(1);
}
