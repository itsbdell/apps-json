# apps.json

`apps.json` is a small file for publishing the apps you make.

Home: [apps-json.org](https://apps-json.org)

Put it at `https://yourdomain.com/apps.json`, list your apps, and people can
discover, follow, render, install, and fork them from anywhere.

It is RSS-ish: publish one plain file, and any reader, crawler, launcher,
directory, or search engine can understand it.

## Why this exists

More people are making small, personal software: tools, experiments, Claude
skills, prototypes, tiny utilities, and apps that do one useful thing.

But there is no simple way to follow someone's apps as a set. They are
scattered across GitHub repos, launch posts, personal sites, app stores,
Discord links, and half-forgotten demos.

`apps.json` gives those apps a home on the open web. No central registry, no
submission form, no platform account required.

## Start small

Create a file at:

```text
https://yourdomain.com/apps.json
```

Then add the smallest useful feed:

```json
{
  "version": "1.0",
  "apps": [
    { "name": "My Cool App", "url": "https://example.com/cool" }
  ]
}
```

That is enough. Only `version`, `apps`, and per-app `name` + `url` are
required.

## Add claims when they help

Apps are different from posts. People want to know where an app runs, whether
it is current, whether the source is available, whether it was vibe-coded, and
whether it can be forked.

`apps.json` handles that with optional creator claims:

```json
{
  "name": "My Cool App",
  "url": "https://example.com/cool",
  "version": "1.2.0",
  "tags": ["writing", "utility"],
  "vibe_coded": true,
  "forkable": true,
  "source": "https://github.com/example/cool",
  "prompt_log": "https://example.com/cool/prompts",
  "targets": [
    { "kind": "web", "url": "https://example.com/cool", "label": "Open" }
  ]
}
```

These are not certifications from `apps.json`. They are useful facts declared
by the creator. Readers can show them, search over them, and build trust layers
on top later.

## Principles

- **Publish to participate.** A public `apps.json` file is the opt-in.
- **No central registry.** Directories and readers can exist, but the standard
  is just the file.
- **Tiny required surface.** Only `version`, `apps`, `name`, and `url` are
  required.
- **Useful app context.** Apps need a little more metadata than posts: where to
  run them, what version they are, where the source lives, and whether they can
  be forked.
- **Claims, not certification.** Creator fields are creator claims. Readers can
  show them; trust layers can come later.
- **For builders and audiences.** Builders get a canonical list. Audiences get
  a way to follow and discover what people are making.

## Reader, Directory, and Digest

This repo includes example tools around the standard: a reference reader, a
seeded directory, a badge generator, and a digest. They are here to prove the
format is useful and easy to build on. They are not required infrastructure,
and they are not the canonical platform for `apps.json`.

The directory is "what exists"; the digest is "what changed." Both start from
public feeds in [`site/seeds.json`](site/seeds.json), and publishing a valid
public feed is the opt-in.

The seed list does not invent feeds for real creators.

## What's in this repo

| Path | What it is |
| --- | --- |
| [`spec/SPEC.md`](spec/SPEC.md) | Human-readable spec (v1.0). |
| [`spec/apps.schema.json`](spec/apps.schema.json) | JSON Schema (Draft 2020-12). |
| [`spec/apps.example.json`](spec/apps.example.json) | A complete example feed. |
| [`appfeed/`](appfeed/) | Example/reference CLI. Publishes as `@apps-json/cli`. |
| [`site/`](site/) | Example web reader, seeded directory, digest, badge generator, and shared validator. |
| [`docs/ECOSYSTEM.md`](docs/ECOSYSTEM.md) | Map of readers, discovery, adopters. |
| [`docs/PUBLISHING.md`](docs/PUBLISHING.md) | How to publish and keep a feed fresh. |
| [`skills/apps-json-setup/`](skills/apps-json-setup/) | Codex/Claude skill for finding apps, skills, CLIs, MCP servers, and other software across repos, then drafting a feed. |
| [`skills/apps-json-publisher/`](skills/apps-json-publisher/) | Small Codex/Claude skill for maintaining a feed. |

The skills are mirrored here for reference. The canonical agent-facing copies
live in
[`apps-json-agent-skills`](https://github.com/itsbdell/apps-json-agent-skills),
a smaller repo you can point agents at directly.

## Try It

```bash
# try the CLI without installing
npx @apps-json/cli validate <url-or-path>

# add a new app to a local feed
npx @apps-json/cli add ./apps.json --name "Tiny Tool" --url "https://example.com/tiny"

# try the reader
open https://apps-json.org/?feed=<url-of-your-apps.json>
```

For agent-assisted setup or maintenance, point the agent at
[`apps-json-agent-skills`](https://github.com/itsbdell/apps-json-agent-skills)
and ask it to use `apps-json-setup` or `apps-json-publisher`.

Live site: [apps-json.org](https://apps-json.org).

## Development

```bash
node scripts/build-seed-data.js
node scripts/build-seed-data.js --check
node scripts/sync-schemas.js --check
```

Generated directory and digest artifacts live in `site/generated/`, with public
subscription outputs at `site/feed.json` and `site/feed.xml`.

## References

- Matt Webb: [We need RSS for sharing abundant vibe-coded apps](https://interconnected.org/home/2026/04/29/syndicating-vibes)
- Tom Critchlow: [Library JSON](https://tomcritchlow.com/2020/04/15/library-json/)
- Dave Winer: [Rules for standards-makers](http://scripting.com/2017/05/09/rulesForStandardsmakers.html)
