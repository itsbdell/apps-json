# appfeed — reference CLI for apps.json

A small Node.js CLI for validating, fetching, and following `apps.json`
feeds. This is the reference implementation for the [apps.json spec](../spec/SPEC.md).

## Status

**Scaffold only.** This document defines the CLI's surface area and the
implementation skeleton. The working code does not yet exist — see
[Implementation plan](#implementation-plan) below.

## Install (planned)

```bash
# zero-install
npx appfeed validate https://briandell.com/apps.json

# global install
npm install -g appfeed
appfeed --help
```

## Commands

### `appfeed validate <url-or-path>`

Fetches (or reads from disk) and validates an `apps.json` against the v1.0
JSON Schema. Exits 0 on success, 1 on schema errors, 2 on network errors.

```
$ appfeed validate https://briandell.com/apps.json
✔ apps.json v1.0 — valid
  3 apps
  feed updated 2026-04-30T12:00:00Z
```

```
$ appfeed validate ./broken.json
✖ apps.json — 2 errors
  /apps/0  missing required property 'url'
  /apps/1/targets/0/kind  must be string
```

### `appfeed fetch <url>`

Pretty-prints the apps in a feed.

```
$ appfeed fetch https://briandell.com/apps.json
Brian Dell — apps.json
updated 2026-04-30 · 3 apps

  Smaug                       v0.4.2 · vibe_coded · forkable
    Personal bookmarks vault with AI synthesis.
    https://smaug.briandell.com
    targets: web, macos

  Outreach                    vibe_coded
    Topic-driven networking pipeline as a Claude skill.
    https://briandell.com/skills/outreach
    targets: claude-skill

  Phrase Chain — Spanish      vibe_coded · forkable
    Fork of phrase-chain retrained on Spanish corpora.
    replaces app://someone-else.com/phrase-chain
```

`--json` emits the parsed feed unchanged. `--raw` emits the response body.

### `appfeed follow <url>`

Adds a feed URL to `~/.appfeed/feeds.json` and fetches it once. Idempotent.

```
$ appfeed follow https://simonwillison.net/apps.json
✔ following simonwillison.net (5 apps)
```

### `appfeed list`

Shows followed feeds with last-checked time and app count.

### `appfeed update`

Refreshes every followed feed and prints what changed since the last update
(new apps, updated apps, gone apps). This is what makes `apps.json` feel
like RSS.

```
$ appfeed update
✔ briandell.com — no change
✔ simonwillison.net — 1 new (datasette-public-mirror)
✖ shouldnotwork.test — fetch failed (ENOTFOUND)
```

### `appfeed init`

(Stretch goal.) Generates a starter `apps.json` in the current directory by
inspecting `package.json`, recent git commits, and any sibling `dist/`
binaries. Bias toward producing *something* the author can edit, not toward
producing it perfectly.

## Project layout

```
appfeed/
├── package.json
├── tsconfig.json
├── README.md
├── bin/
│   └── appfeed.js          # shebang entry, just imports dist/cli.js
└── src/
    ├── cli.ts              # commander setup
    ├── commands/
    │   ├── validate.ts
    │   ├── fetch.ts
    │   ├── follow.ts
    │   ├── list.ts
    │   └── update.ts
    ├── lib/
    │   ├── load.ts         # url-or-path -> parsed JSON
    │   ├── validate.ts     # ajv wrapper
    │   ├── render.ts       # pretty-printer
    │   └── store.ts        # ~/.appfeed/feeds.json read/write
    └── schema/
        └── apps.schema.json # copy of ../spec/apps.schema.json (or symlink)
```

## Implementation plan

### Dependencies

- `commander` — argument parsing.
- `ajv` + `ajv-formats` — JSON Schema validation.
- `picocolors` — terminal colors without bringing in chalk's bundle.
- `undici` (built-in via fetch in Node 22+) — HTTP.

No state managers, no plugin systems. The whole thing should be < 500 LOC.

### `package.json` skeleton

```json
{
  "name": "appfeed",
  "version": "0.1.0",
  "description": "Reference CLI for the apps.json standard.",
  "bin": { "appfeed": "bin/appfeed.js" },
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "build": "tsc",
    "test": "node --test"
  },
  "dependencies": {
    "ajv": "^8.17.0",
    "ajv-formats": "^3.0.1",
    "commander": "^12.1.0",
    "picocolors": "^1.0.1"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.6.0"
  }
}
```

### `src/cli.ts` skeleton

```ts
import { Command } from "commander";
import { validateCmd } from "./commands/validate.js";
import { fetchCmd } from "./commands/fetch.js";
import { followCmd } from "./commands/follow.js";
import { listCmd } from "./commands/list.js";
import { updateCmd } from "./commands/update.js";

const program = new Command();

program
  .name("appfeed")
  .description("Reference CLI for the apps.json standard")
  .version("0.1.0");

program.command("validate <urlOrPath>")
  .description("Validate an apps.json against the v1.0 schema")
  .action(validateCmd);

program.command("fetch <url>")
  .description("Pretty-print the apps in a feed")
  .option("--json", "emit parsed JSON")
  .option("--raw", "emit raw response body")
  .action(fetchCmd);

program.command("follow <url>")
  .description("Subscribe to a feed (stored locally)")
  .action(followCmd);

program.command("list")
  .description("List followed feeds")
  .action(listCmd);

program.command("update")
  .description("Refresh all followed feeds and report changes")
  .action(updateCmd);

program.parseAsync();
```

### `src/lib/load.ts` skeleton

```ts
import { readFile } from "node:fs/promises";

export async function load(urlOrPath: string): Promise<unknown> {
  if (/^https?:\/\//.test(urlOrPath)) {
    const res = await fetch(urlOrPath, {
      headers: { "User-Agent": "appfeed/0.1 (+https://apps-json.org)" },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return res.json();
  }
  const text = await readFile(urlOrPath, "utf8");
  return JSON.parse(text);
}
```

### `src/lib/store.ts` skeleton

```ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const DIR = join(homedir(), ".appfeed");
const FILE = join(DIR, "feeds.json");

interface Followed {
  url: string;
  followed_at: string;     // ISO 8601
  last_checked?: string;
  last_seen_apps?: Record<string, string>; // id-or-url -> updated
}

interface Store {
  version: 1;
  feeds: Followed[];
}

export async function readStore(): Promise<Store> {
  try {
    return JSON.parse(await readFile(FILE, "utf8"));
  } catch {
    return { version: 1, feeds: [] };
  }
}

export async function writeStore(store: Store): Promise<void> {
  await mkdir(DIR, { recursive: true });
  await writeFile(FILE, JSON.stringify(store, null, 2));
}
```

## Open questions

- **Authentication on private feeds.** v1.0 says no. Should `appfeed` still
  honor `Authorization` env vars on `validate`/`fetch` for testing
  purposes? Probably yes, but we don't expose it as a feature.
- **Retry / backoff.** A single attempt on `update` is fine for v0.1.
  Smarter polling can come later.
- **Diff format on `update`.** Right now the plan is "human-readable list."
  A `--json` flag that emits a structured changelog would let other tools
  consume the output (e.g., a daily digest skill that tells you what your
  followed authors shipped).

## Why Node, not Python

Node 22+ ships `fetch`, the JSON Schema ecosystem (ajv) is mature, and
`npx appfeed` is a one-line install for the audience this is aimed at.
A Python port using `jsonschema` + `httpx` is a few hundred lines and
welcome — it just isn't the reference.
