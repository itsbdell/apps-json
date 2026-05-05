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
feed from their repos, inventory their apps, or find creator-made software
that should be published in an app feed.

## Workflow

1. Establish the scan area.
   - Prefer the current workspace if the user names one.
   - Otherwise ask or infer likely repo roots such as `~/Coding`, `~/Documents`,
     `~/Documents/GitHub`, or the user's project folder.
   - Do not scan private or unrelated directories without a user request.

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
     - `.claude/commands/`, `.codex/commands/`, `commands/`, `agents/`,
       `mcp/`, or `servers/` folders with reusable agent workflows.
     - plugin manifests such as `.codex-plugin/plugin.json`, MCP server config,
       package `bin` entries, or README install commands.
   - Weak signals: library-only package, notes-only repo, archived experiment,
     private automation.
   - When uncertain, list the candidate for user confirmation rather than
     silently publishing it.
   - Do not treat `CLAUDE.md` or `AGENTS.md` as publishable by itself. Treat
     them as discovery evidence unless the repo clearly packages a reusable
     skill, command, agent, server, or tool.

4. Draft each app entry from evidence.
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
     `claude-skill`, `codex-skill`, `mcp-server`, `cli`, `web`, or another
     clear kind. Unknown target kinds are allowed by the standard.
   - Add `tags` sparingly from clear domain/framework clues.
   - Add `vibe_coded`, `forkable`, `prompt_log`, and `replaces` only when the
     repo or user provides evidence. Treat them as creator claims, not proof.

5. Create or update the feed.
   - Prefer `./apps.json` unless the user requests a public output path such as
     `site/apps.json`, `public/apps.json`, or `static/apps.json`.
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

6. Validate and report.
   - Run `npx @apps-json/cli validate ./apps.json` when available.
   - If working inside this repo, run `node appfeed/bin/appfeed.js validate ./apps.json`.
   - Report entries added, entries left as candidates, and evidence gaps.
   - Remind the user that publishing requires serving the file publicly with
     browser-readable CORS headers when browser readers need to fetch it.

## Output Standard

Finish with:

- the feed path changed,
- apps added or updated,
- candidates skipped or needing confirmation,
- validation result,
- suggested next publish step.
