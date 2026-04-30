# apps.json — Spec v1.0

A decentralized standard for publishing and following the apps a person or
organization makes. One file, one well-known location, no registry.

## TL;DR

Drop a file at `https://yourdomain.com/apps.json` that lists your apps.
Anyone can read it. Aggregators discover by crawling. Identity is verified
via cross-linked social profiles, not by a central authority.

## Design philosophy

This spec follows Dave Winer's *Rules for Standards-Makers*:

1. **Solve the simplest problem first.** Required fields are tiny.
2. **Be permissive on read, strict on write.** Readers MUST tolerate unknown
   fields and unknown `target.kind` values without error. Writers SHOULD
   validate before publishing.
3. **Format wins by adoption, not by mandate.** Anyone can publish; anyone
   can read; no submission step exists.
4. **Stable on day one.** Once `version: "1.0"` ships, additions are made
   through new optional fields, never by removing or repurposing existing
   ones.

## Where the file lives

- **Primary location:** `https://<host>/apps.json`
- **Optional alternates:** `/.well-known/apps.json` for hosts whose root
  cannot serve custom JSON (e.g., GitHub Pages user sites should still use
  `/apps.json` because they can).
- **Content type:** `application/json` (or `application/feed+json`-style
  variants if a host already serves that for JSON Feed).
- **CORS:** SHOULD return `Access-Control-Allow-Origin: *` so browser-based
  readers can fetch directly.
- **Caching:** SHOULD set `Cache-Control` to a value the publisher is happy
  to be polled at (e.g., `max-age=3600`).

## Required fields

Top-level:

| Field     | Type   | Notes                              |
| --------- | ------ | ---------------------------------- |
| `version` | string | Must be `"1.0"` for this spec.     |
| `apps`    | array  | May be empty (an empty feed is valid). |

Per app:

| Field  | Type   | Notes                                  |
| ------ | ------ | -------------------------------------- |
| `name` | string | Human-readable app name.               |
| `url`  | string | Primary launch surface (usually web).  |

Everything else is optional.

## Optional fields (top-level)

| Field      | Type           | Notes                                          |
| ---------- | -------------- | ---------------------------------------------- |
| `self`     | URI            | Canonical URL of this file. Helps mirroring.   |
| `updated`  | ISO 8601       | Feed-level last-modified time.                 |
| `author`   | author object  | Default author for apps that don't override.   |

## Optional fields (per app)

| Field         | Type           | Notes                                                              |
| ------------- | -------------- | ------------------------------------------------------------------ |
| `id`          | slug           | Stable identifier across renames. Unique within file.              |
| `description` | string         |                                                                    |
| `version`     | string         | App's own version. Free-form, semver recommended.                  |
| `updated`     | ISO 8601       |                                                                    |
| `screenshot`  | URI            |                                                                    |
| `icon`        | URI            |                                                                    |
| `tags`        | array<string>  |                                                                    |
| `targets`     | array<target>  | Other install/launch surfaces. See below.                          |
| `author`      | author object  | Overrides feed-level author for this app.                          |
| `vibe_coded`  | boolean        | Self-attestation that the app was primarily AI-assisted.           |
| `prompt_log`  | URI            | Public transcript of the prompts that built it.                    |
| `forkable`    | boolean        | Author invites forks. SHOULD imply `source` is published.          |
| `source`      | URI            | Source repository or canonical source location.                    |
| `replaces`    | URI            | Upstream app this forks. Either an https URL or `app://host/id`.   |

## The `target` block

```json
{ "kind": "claude-skill", "url": "https://example.com/skill.zip", "label": "Install in Claude Code" }
```

Only `kind` is required. The current hint list:

`web`, `claude-skill`, `claude-app`, `mcp-server`, `cli`, `macos`, `windows`,
`linux`, `ios`, `android`, `vscode`, `browser-extension`, `iframe`, `prompt`.

This is a *hint list*, not a closed enum. Readers MUST tolerate unknown kinds
and SHOULD render them as "unknown target — open URL".

For `cli` and `prompt` kinds, `command` carries the literal command line or
prompt body.

For binary downloads, `checksum` is recommended (e.g., `"sha256:abc123..."`).

## The `author` block

```json
{
  "name": "Brian Dell",
  "url": "https://briandell.com",
  "social": [
    { "platform": "github", "url": "https://github.com/briandell" },
    { "platform": "twitter", "url": "https://twitter.com/briandell" }
  ]
}
```

`url` is the verification anchor. Verifying agents fetch each entry in
`social[]` and check that the linked profile contains a backlink to either
`author.url` or to the apps.json's host. Verification is the *agent's*
responsibility — the file makes claims, agents decide how much to trust them.

## Forkability semantics

- `forkable: true` is a license signal, not a license. Pair with a real
  license in the `source` repo.
- `replaces` lets a fork point at its upstream so aggregators can build a
  family tree. The upstream's own `apps.json` does not need to know about
  the fork. (Backlinks are discovered by the crawl, not declared.)
- `prompt_log` lets fork chains carry their construction history. Three
  generations of `replaces` + `prompt_log` is a remix lineage.

## What this spec deliberately does *not* specify

- **No discovery protocol.** Crawlers find feeds however they want
  (well-known URL, social bio links, GitHub topic, README badge).
- **No rating, voting, or comment mechanism.** Apps can carry tags; opinions
  live on the reader side.
- **No private feeds.** If you don't want it crawled, don't publish it.
- **No federation handshake.** Subscribing to a feed is just polling its URL.

## Versioning policy

The spec evolves by adding optional fields under `version: "1.0"`. A `2.0`
will only happen if a breaking change is unavoidable, and `1.0` files will
remain readable.
