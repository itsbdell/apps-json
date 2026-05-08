# Publishing apps.json

`apps.json` should be as boring to maintain as RSS.

Put the file at:

```text
https://yourdomain.com/apps.json
```

or, if your site prefers well-known files:

```text
https://yourdomain.com/.well-known/apps.json
```

## Three Ways To Keep It Fresh

### 1. Hand-edit it

Good for a solo builder with a few apps.

```bash
npx @apps-json/cli validate ./apps.json
```

Edit the file when you ship a new app or materially update an existing one.
Keep `updated` timestamps current if you want readers and digests to notice.

### 2. Use the CLI helper

Good when you want a small repeatable command without building your own
generator.

```bash
npx @apps-json/cli add ./apps.json \
  --name "Tiny Tool" \
  --url "https://example.com/tiny" \
  --description "A small useful app." \
  --tags "utility,ai" \
  --target "web|https://example.com/tiny|Open" \
  --vibe-coded true \
  --forkable true \
  --source "https://github.com/example/tiny"
```

The command creates `apps.json` if it does not exist, appends the app, updates
the feed timestamp, and validates the result.

Use `--replace` to update an existing app with the same `id` or `url`.

### 3. Generate it from your existing source of truth

Best for static sites, monorepos, CMS-backed sites, and platforms.

Examples:

- A static site builds `/apps.json` from `content/apps/*.md`.
- A monorepo builds it from `apps/*/package.json`.
- A CMS exposes `/apps.json` from the same entries used for a projects page.
- A vibe-coding platform exposes per-user feeds at `/users/:handle/apps.json`.

Manual is fine at first. Generated is how the file stays fresh without
becoming another chore.

## Server Requirements

Serve the file as JSON and allow browser readers to fetch it:

```http
Content-Type: application/json; charset=utf-8
Access-Control-Allow-Origin: *
```

The CORS header matters because browser-based readers cannot fetch a feed from
another domain without it.

## GitHub Action

For a repo-hosted feed:

```yaml
name: validate apps.json

on:
  pull_request:
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npx @apps-json/cli validate ./apps.json
```

## Agent Workflow

Agents should treat `apps.json` as a project artifact:

1. Detect when a new app, skill, CLI, MCP server, or significant app update was
   shipped.
2. Add or update the relevant entry.
3. Preserve creator-declared claims such as `vibe_coded`, `forkable`,
   `source`, `prompt_log`, and `replaces`.
4. Run validation.
5. Include the feed update in the same commit as the app change when practical.

For agent-assisted setup or maintenance, point the agent at
[`apps-json-agent-skills`](https://github.com/itsbdell/apps-json-agent-skills)
and ask it to use `apps-json-setup` or `apps-json-publisher`. That standalone
repo is the canonical agent-facing distribution copy of the skills; this repo
keeps reference mirrors.
