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
| [`appfeed/README.md`](appfeed/README.md) | Reference CLI scaffold. |
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

A web reader at `apps-json.org/?feed=<url>` that fetches and renders any
`apps.json` as a profile page, plus a seeded directory of ~20 hand-curated
feeds, plus a 100-line `npx appfeed validate` script. See the
[requirements doc](docs/brainstorms/2026-04-30-apps-json-requirements.md#smallest-viable-shipment)
for why this is the right starting bundle.

## Status

This is a **brainstorm artifact**, not a shipped product. The spec, the
example, the ecosystem map, and the CLI scaffold are drafted. The reader,
the published CLI, and the seed directory are next.
