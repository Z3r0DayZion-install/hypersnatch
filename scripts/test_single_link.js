/**
 * Ad-hoc test for a specific Emload link
 */
const SmartDecode = require('../src/core/smartdecode');

const link = "https://www.emload.com/v2/file/SEdNZUZ3aFlIamdpOTF2bk9XdHRjUT09/344VIP2955309137.mp4";
console.log(`🔍 Testing link: ${link}`);

const result = SmartDecode.run(link);
console.log("\n--- Extraction Results ---");
console.log(JSON.stringify(result, null, 2));
