#!/usr/bin/env node
// scripts/sync-schemas.js
// Sync the canonical schema (spec/apps.schema.json) to the two derived
// copies (appfeed/src/schema.json, site/schemas/v1.json). Idempotent.
//
// Usage:
//   node scripts/sync-schemas.js          # writes copies, exits 0
//   node scripts/sync-schemas.js --check  # exits 0 if all copies match,
//                                         # 1 if any diverge (CI guard)

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const SOURCE = join(REPO_ROOT, "spec", "apps.schema.json");
const COPIES = [
  join(REPO_ROOT, "appfeed", "src", "schema.json"),
  join(REPO_ROOT, "site", "schemas", "v1.json"),
];

const checkOnly = process.argv.includes("--check");

async function main() {
  let canonical;
  try {
    canonical = await readFile(SOURCE, "utf8");
  } catch (e) {
    console.error(`✖ Cannot read canonical schema at ${SOURCE}: ${e.message}`);
    process.exit(2);
  }

  if (checkOnly) {
    let diverged = 0;
    for (const dest of COPIES) {
      try {
        const got = await readFile(dest, "utf8");
        if (got !== canonical) {
          diverged++;
          console.error(`✖ ${rel(dest)} differs from ${rel(SOURCE)}`);
        } else {
          console.log(`✓ ${rel(dest)} matches`);
        }
      } catch (e) {
        diverged++;
        console.error(`✖ ${rel(dest)} unreadable: ${e.message}`);
      }
    }
    if (diverged > 0) {
      console.error(`\n${diverged} schema copy/copies are out of sync. Run \`npm run sync-schemas\` to fix.`);
      process.exit(1);
    }
    console.log(`\nAll ${COPIES.length} schema copies in sync.`);
    return;
  }

  for (const dest of COPIES) {
    await writeFile(dest, canonical);
    console.log(`✓ wrote ${rel(dest)}`);
  }
}

function rel(p) {
  return p.startsWith(REPO_ROOT + "/") ? p.slice(REPO_ROOT.length + 1) : p;
}

main().catch(e => {
  console.error(e);
  process.exit(2);
});
