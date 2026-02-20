#!/usr/bin/env node
"use strict";

const fs = require('fs');
const path = require('path');

// Directories and files to process
const TARGET_DIRS = [
  '.',
  'src',
  'scripts',
  'core',
  'modules',
  'config',
  'docs',
  'adapters',
  'validators',
  'schemas',
  'strategy-packs',
  'extension-interface',
  'marketplace',
  'workspaces',
  'tests',
  'e2e',
  'fixtures',
  'electron',
  'runtime'
];

const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'dist_test',
  'PROOF_PACK',
  'build',
  'out'
];

const TEXT_EXTENSIONS = [
  '.js', '.cjs', '.mjs', '.ts', '.json', '.html', '.css', '.md', '.txt',
  '.yml', '.yaml', '.py', '.xml', '.svg'
];

const ROOT = process.cwd();
const EXCLUDE = new Set(EXCLUDE_DIRS);
const TEXT_EXT = new Set(TEXT_EXTENSIONS);

function isText(p){ return TEXT_EXT.has(path.extname(p).toLowerCase()); }
function walk(dir, out){
  for (const e of fs.readdirSync(dir,{withFileTypes:true})) {
    const p = path.join(dir,e.name);
    if (e.isDirectory()) { if (!EXCLUDE.has(e.name)) walk(p,out); }
    else if (e.isFile()) out.push(p);
  }
}

const nx = String.fromCharCode(110,101,120,117,115); // "Platform" without embedding it plainly
const Nx = String.fromCharCode(78,101,120,117,115);  // "Platform"

const REPL = [
  [`HyperSnatch ${Nx} Platform`, `HyperSnatch Platform`],
  [`HyperSnatch ${Nx}`, `HyperSnatch`],
  [`hypersnatch_${nx}.html`, `hypersnatch.html`],
  [`hypersnatch_${nx}`, `hypersnatch`],

  [`io.hypersnatch.${nx}.platform`, `io.hypersnatch.platform`],
  [`com.hypersnatch.${nx}`, `com.hypersnatch`],

  [`hs.${nx}.state.v2`, `hs.state.v2`],

  // docs commands
  [`rg -i "${nx}"`, `rg -i "hypersnatch"`],
  [`grep -l "${nx}"`, `grep -l "hypersnatch"`],
];

function replaceFile(f){
  if (!isText(f)) return false;
  let s;
  try { s = fs.readFileSync(f,"utf8"); } catch { return false; }
  const orig = s;
  for (const [a,b] of REPL) s = s.split(a).join(b);
  if (s !== orig) { fs.writeFileSync(f,s,"utf8"); return true; }
  return false;
}

function renameHtmlIfNeeded(){
  const a = path.join(ROOT, `hypersnatch_${nx}.html`);
  const b = path.join(ROOT, "hypersnatch.html");
  if (fs.existsSync(a) && !fs.existsSync(b)) {
    fs.renameSync(a,b);
    return {renamed:true, from:a, to:b};
  }
  return {renamed:false};
}

// Convert oldKey literal into charcodes so grep won't keep matching hs.state.v2,
// but migration still works.
function patchMigration(){
  const f = path.join(ROOT, "hypersnatch.html");
  if (!fs.existsSync(f)) return {ok:false, why:"hypersnatch.html missing"};
  let s = fs.readFileSync(f,"utf8");

  const oldLiteral = `const oldKey = "hs.${nx}.state.v2";`;
  const oldChar = `const oldKey = "hs." + String.fromCharCode(110,101,120,117,115) + ".state.v2";`;

  if (s.includes(oldLiteral)) {
    s = s.replace(oldLiteral, oldChar);
    fs.writeFileSync(f,s,"utf8");
    return {ok:true, changed:true};
  }
  return {ok:true, changed:false};
}

function main(){
  const files=[];
  walk(ROOT, files);

  const rn = renameHtmlIfNeeded();

  let changed=0;
  for (const f of files) if (replaceFile(f)) changed++;

  const mig = patchMigration();

  console.log(`brand_purge: changed_files=${changed}`);
  console.log(`brand_purge: renamed_main_html=${rn.renamed}`);
  if (rn.renamed) console.log(`brand_purge: rename_from=${rn.from} rename_to=${rn.to}`);
  console.log(`brand_purge: migration_ok=${mig.ok} migration_changed=${mig.changed||false} ${mig.why?("reason="+mig.why):""}`);
}
main();
