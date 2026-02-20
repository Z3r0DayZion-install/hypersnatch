#!/usr/bin/env node
"use strict";
const fs = require("fs");

const file = process.argv[2] || "hypersnatch.html";
const s = fs.readFileSync(file, "utf8");

// crude but effective: extract <script> blocks
const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let m, idx=0;
let bad = 0;

function countTicks(t){
  let c=0;
  for (let i=0;i<t.length;i++) if (t[i] === "`") c++;
  return c;
}

while ((m = re.exec(s)) !== null) {
  idx++;
  const body = m[1];
  const ticks = countTicks(body);
  if (ticks % 2 === 1) {
    bad++;
    const start = Math.max(0, body.lastIndexOf("`") - 120);
    const end = Math.min(body.length, body.lastIndexOf("`") + 120);
    console.log(`UNBALANCED_BACKTICKS script#${idx} ticks=${ticks}`);
    console.log(body.slice(start, end).replace(/\r/g,""));
    console.log("----");
  }
}

if (bad === 0) {
  console.log("OK: no unbalanced backticks detected in inline <script> blocks");
  process.exit(0);
} else {
  console.log(`FAIL: ${bad} inline <script> block(s) with unbalanced backticks`);
  process.exit(2);
}
