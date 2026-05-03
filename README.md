# apps.json

`apps.json` is a small file for publishing the apps you make.

Put it at `https://yourdomain.com/apps.json`, list the things you have
shipped, and now other people can discover them, follow them, render them,
index them, or build readers on top.

> RSS for vibe-coded micro-apps. No registry, no submission, no central
> authority. Just a well-known file and a boringly useful schema.

## What's in this repo

| Path | What it is |
| --- | --- |
| [`spec/SPEC.md`](spec/SPEC.md) | Human-readable spec (v1.0). |
| [`spec/apps.schema.json`](spec/apps.schema.json) | JSON Schema (Draft 2020-12). |
| [`spec/apps.example.json`](spec/apps.example.json) | A complete example feed. |
| [`appfeed/`](appfeed/) | Reference CLI. Publishes as `@apps-json/cli`. |
| [`site/`](site/) | The web reader, seeded directory, digest, badge generator, and shared validator. |
| [`docs/ECOSYSTEM.md`](docs/ECOSYSTEM.md) | Map of readers, discovery, adopters. |

## The Tiny Version

```json
{
  "version": "1.0",
  "apps": [
    { "name": "My Cool App", "url": "https://example.com/cool" }
  ]
}
```

That is enough. Required fields are deliberately tiny: `version`, `apps[]`,
and per-app `name` + `url`.

Everything else is additive: author info, tags, targets, version, source,
prompt logs, forkability, replacement lineage. A feed can be one app or a
whole little constellation.

## Why This Exists

More people are making small, weird, useful software now: vibe-coded tools,
Claude skills, internal-ish utilities that escape into public life, one-off
apps that are too small for an app store and too numerous for a pinned tweet.

The missing piece is not another platform. It is a way to follow a creator's
apps as a set.

RSS solved this for writing. `apps.json` tries the same move for software:
publish a plain file, let the ecosystem decide what to do with it.

## Seeded directory and digest

The directory is "what exists"; the digest is "what changed." Both are
generated from [`site/seeds.json`](site/seeds.json), which lists public
`apps.json` feeds that creators or platforms have published. Publishing a
valid public feed is the opt-in. The seed list does not invent feeds for real
creators, and demo feeds must be owned, fictional, or clearly marked.

```bash
node scripts/build-seed-data.js
node scripts/build-seed-data.js --check
```

Generated artifacts live in `site/generated/`, with public subscription
outputs at `site/feed.json` and `site/feed.xml`.

## Creator Claims

Fields like `vibe_coded`, `forkable`, `source`, `prompt_log`, and `replaces`
are creator-declared metadata. They are useful because readers can show them
compactly, search over them, and attach trust checks later. They are not
certification from this repo.

## Try It

```bash
# try the CLI without installing
npx @apps-json/cli validate <url-or-path>

# try the reader
open https://apps-json.vercel.app/?feed=<url-of-your-apps.json>
```

Live preview: [apps-json.vercel.app](https://apps-json.vercel.app).
