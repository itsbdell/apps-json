---
name: apps-json-setup
description: >
  Use when bootstrapping an apps.json feed for a creator or workspace by
  looking across local repositories, identifying creator-made software such as
  apps, Claude/Codex skills, CLIs, MCP servers, extensions, and templates,
  drafting app entries, and validating the resulting feed.
---

# apps.json Setup

Use this skill when a user asks to create an initial `apps.json`, populate a
feed from their repos, inventory their apps, or find creator-made software that
should be published in an app feed.

Guiding posture: be comprehensive in discovery and enrichment, conservative in
execution. Look broadly for creator-made software and capture the wider
inventory, but only add evidence-backed entries and fields to an executable
`apps.json` draft.

## Workflow

1. Establish the scan area.
   - Prefer the current workspace if the user names one.
   - Otherwise ask or infer likely repo roots such as `~/Coding`, `~/Documents`,
     `~/Documents/GitHub`, or the user's project folder.
   - Do not scan private or unrelated directories without a user request.
   - For public creator research, start from the creator's supplied or
     discovered public app indexes, project pages, GitHub profile/org, package
     docs, skill catalogs, README files, release pages, and linked demos.
   - For multi-root scans, require an explicit root list from the user or a
     repo-local allowlist. Treat the scan as an inventory pass first, not a
     publishing pass.

2. Inventory candidate repos.
   - From the chosen roots, start with:

```bash
rg --files \
  -g package.json \
  -g pyproject.toml \
  -g Cargo.toml \
  -g go.mod \
  -g vercel.json \
  -g netlify.toml \
  -g wrangler.toml \
  -g app.json \
  -g manifest.json \
  -g mcp.json \
  -g SKILL.md \
  -g CLAUDE.md \
  -g AGENTS.md \
  -g skills.md \
  -g Skills.md \
  -g 'skills/**' \
  -g '.claude/**' \
  -g '.codex/**' \
  -g 'commands/**' \
  -g 'plugins/**' \
  -g README.md
```

   - Group files by git repo when possible with `git -C <dir> rev-parse
     --show-toplevel`.
   - Skip obvious dependency/cache directories: `node_modules`, `.next`,
     `dist`, `build`, `.git`, `.venv`, `vendor`.
   - In multi-root mode, write or update a review artifact such as
     `docs/app-feed-inventory.md` with:
     - scan roots,
     - entries that are safe to add from public evidence,
     - candidates that need confirmation,
     - skipped repos and why.

3. Decide whether a repo contains publishable software.
   - Strong signals: deployed web app config, package scripts like `dev`,
     `start`, or `deploy`, app routes/pages, CLI bin entries, Electron/Tauri,
     Expo/React Native, browser extension manifests, MCP servers, Claude/Codex
     skills, installable templates, automation tools, or public README usage
     instructions.
   - Agent/skill signals:
     - `SKILL.md` files, especially under `skills/`, `.claude/skills/`,
       `.codex/skills/`, plugin folders, or marketplace-style skill folders.
     - `CLAUDE.md`, `AGENTS.md`, `skills.md`, or `Skills.md` files that point
       to reusable skills, commands, agents, MCP servers, or installation
       instructions.
     - `.claude/commands/`, `.codex/commands/`, `commands/`, `agents/`, `mcp/`,
       or `servers/` folders with reusable agent workflows.
     - plugin manifests such as `.codex-plugin/plugin.json`, MCP server config,
       package `bin` entries, or README install commands.
   - Weak signals: library-only package, notes-only repo, archived experiment,
     private automation.
   - When uncertain, list the candidate for user confirmation rather than
     silently publishing it.
   - In multi-root mode, default uncertain, private, pilot, shared, or
     source-only projects into the confirmation bucket unless the repo provides
     a clear public launch/install surface.
   - Do not treat `CLAUDE.md` or `AGENTS.md` as publishable by itself. Treat
     them as discovery evidence unless the repo clearly packages a reusable
     skill, command, agent, server, or tool.

4. Classify findings before drafting.
   - Use three buckets:
     - `include_in_candidate_json`: enough public evidence for at least `name`,
       `url`, and a useful factual description.
     - `needs_confirmation`: likely app, tool, skill, CLI, MCP server,
       extension, or template, but missing canonical URL, ownership, current
       status, install target, source URL, or description confidence.
     - `omit_for_now`: weak signal, private-looking, abandoned, duplicate,
       dependency-only, library-only, or not clearly software.
   - Do not throw away fuzzy findings. Preserve them in `needs_confirmation`
     with the question that would unblock inclusion.
   - Keep `include_in_candidate_json` smaller and higher-confidence than the
     full inventory.

5. Draft each app entry from evidence.
   - Required: `name`, `url`.
   - Prefer `id` from repo/package slug.
   - Derive `description` from README, package description, or project docs.
   - Do not invent public URLs. If no launch URL is evident, mark the repo as a
     candidate needing confirmation instead of adding a guessed entry.
   - Derive `source` from `git remote get-url origin` when it is public or the
     user confirms it should be listed.
   - Derive `targets` from deploy URLs, package bins, install docs, or app
     platform configs.
   - For skills, MCP servers, CLIs, templates, and extensions, use target kinds
     that describe how someone uses or installs the artifact, such as
     `claude-skill`, `codex-skill`, `mcp-server`, `cli`, `web`, or another clear
     kind. Unknown target kinds are allowed by the standard.
   - Add `tags` sparingly from clear domain/framework clues.
   - Add rich optional metadata when evidenced: `description`, `tags`,
     `targets`, `source`, `updated`, `version`, `forkable`, `vibe_coded`,
     `prompt_log`, and `replaces`.
   - Add `vibe_coded`, `forkable`, `prompt_log`, and `replaces` only when the
     repo, public source, or user provides evidence. Treat them as creator
     claims, not proof.
   - If a useful optional field is plausible but not evidenced, omit it from
     JSON and list it as an enrichment question.

6. Create or update the feed.
   - Prefer `./apps.json` unless the user requests a public output path such as
     `site/apps.json`, `public/apps.json`, or `static/apps.json`, or the repo's
     deploy config clearly serves one of those folders as the public output
     directory.
   - For static hosts, check configs such as `vercel.json`, `netlify.toml`, or
     framework settings before choosing the path. If `vercel.json` declares
     `"outputDirectory": "site"`, create or update `site/apps.json` so the feed
     publishes at `/apps.json`.
   - If no feed exists, create:

```json
{
  "version": "1.0",
  "apps": []
}
```

   - Preserve existing entries and unknown fields.
   - Match existing entries by `id`, then `url`, then source repo.
   - Ask before deleting entries.

7. Validate and report.
   - Run `npx @apps-json/cli validate ./apps.json` when available.
   - If working inside the main `apps-json` repo, run `node appfeed/bin/appfeed.js
     validate <feed-path>`.
   - Report entries added, `needs_confirmation` candidates, `omit_for_now`
     skips, and evidence gaps.
   - Remind the user that publishing requires serving the file publicly with
     browser-readable CORS headers when browser readers need to fetch it.

## Output Standard

Finish with:

- the feed path changed,
- apps added or updated,
- candidates needing confirmation,
- candidates omitted for now and why,
- validation result,
- suggested next publish step.

