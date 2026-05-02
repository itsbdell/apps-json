# apps.json

A lightweight, decentralized standard for publishing the apps you make.
Drop a file at `https://yourdomain.com/apps.json` and let anyone discover,
follow, and fork what you ship.

> RSS for vibe-coded micro-apps. No registry, no submission, no central
> authority — just a well-known file and a permissive schema.

## What's in this repo

| Path | What it is |
| --- | --- |
| [`spec/SPEC.md`](spec/SPEC.md) | Human-readable spec (v1.0). |
| [`spec/apps.schema.json`](spec/apps.schema.json) | JSON Schema (Draft 2020-12). |
| [`spec/apps.example.json`](spec/apps.example.json) | A complete example feed. |
| [`appfeed/`](appfeed/) | Reference CLI (v0.1 — `validate` shipped). Publishes as `@apps-json/cli`. |
| [`site/`](site/) | The web reader, badge generator, and shared validator. |
| [`docs/ECOSYSTEM.md`](docs/ECOSYSTEM.md) | Map of readers, discovery, adopters. |
| [`docs/brainstorms/2026-04-30-apps-json-requirements.md`](docs/brainstorms/2026-04-30-apps-json-requirements.md) | Requirements doc and weekend-ship plan. |

## Minimum viable feed

```json
{
  "version": "1.0",
  "apps": [
    { "name": "My Cool App", "url": "https://example.com/cool" }
  ]
}
```

Required fields are deliberately tiny: `version`, `apps[]`, and per-app
`name` + `url`. Everything else (id, description, version, targets, author,
provenance, forkability) is optional.

## Smallest weekend shipment

A web reader at `?feed=<url>` that fetches and renders any `apps.json`
as a profile page, a paste-ready badge generator, and an `npx
@apps-json/cli validate` script. See the [requirements
doc](docs/brainstorms/2026-04-30-apps-json-requirements.md#smallest-viable-shipment)
for why this is the right starting bundle.

## Status

The weekend bundle is **shipped on `feat/weekend-ship`** (PR #1). Live
preview at [apps-json.vercel.app](https://apps-json.vercel.app). The
spec, schema, example feed, browser reader, badge generator, and CLI
v0.1 are all in. Pending: production domain, `npm publish`, seed
directory.

```bash
# try the CLI without installing
npx @apps-json/cli validate <url-or-path>

# try the reader
open https://apps-json.vercel.app/?feed=<url-of-your-apps.json>
```
