---
name: apps-json-publisher
description: >
  Use when maintaining an apps.json feed for a project or creator: add newly
  shipped apps, update changed app metadata, preserve creator-declared claims,
  and validate the feed.
---

# apps.json Publisher

Use this skill when a user asks to publish, update, maintain, or validate an
`apps.json` feed, or when a project change ships new creator-made software that
should appear in the feed, including apps, Claude/Codex skills, CLIs, MCP
servers, extensions, templates, or other installable/useful software.

## Workflow

1. Find the feed file.
   - Prefer `./apps.json`.
   - Also check site/public output paths such as `public/apps.json`,
     `static/apps.json`, or `site/apps.json`.
   - If no feed exists, create `apps.json` with `version: "1.0"` and `apps: []`.
   - Use the resolved feed path as `<feed-path>` in every validation and CLI
     command below.

2. Identify the app entry.
   - Required: `name`, `url`.
   - Prefer a stable lowercase `id`.
   - Include `description`, `tags`, `targets`, `source`, `prompt_log`,
     `replaces`, `vibe_coded`, and `forkable` when the project has evidence for
     them.
   - Treat `vibe_coded`, `forkable`, `source`, `prompt_log`, and `replaces` as
     creator-declared metadata, not endorsements.
   - For Claude/Codex skills, CLIs, MCP servers, templates, and other
     installable artifacts, add or update the entry only when there is clear
     evidence of creator/workspace ownership, canonical URL or source, intended
     install/use target, and current status.
   - Do not add downloaded marketplace/plugin-cache skills, vendored examples,
     copied third-party tools, or unclear private automation directly to the
     feed. Report a confirmation question instead.

3. Update timestamps.
   - Set feed-level `updated` when the file changes.
   - Set app-level `updated` when adding or materially changing an app.
   - Use ISO 8601 date-time strings.

4. Validate.
   - Run `npx @apps-json/cli validate <feed-path>` when available.
   - If working inside the main `apps-json` repo, run `node appfeed/bin/appfeed.js
     validate <feed-path>`.
   - Fix schema errors before finishing.

5. Report what changed.
   - Mention the app id/name added or updated.
   - Mention validation result.
   - If CORS/deployment headers are relevant, remind the user to serve
     `Access-Control-Allow-Origin: *`.

## CLI Shortcut

When the `appfeed` CLI is available, prefer:

```bash
appfeed add <feed-path> \
  --name "App Name" \
  --url "https://example.com/app" \
  --description "One sentence." \
  --tags "utility,ai" \
  --target "web|https://example.com/app|Open"
```

Use `--replace` when updating an existing entry with the same `id` or `url`.
