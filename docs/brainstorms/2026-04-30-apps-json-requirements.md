# apps.json — Requirements

**Date:** 2026-04-30
**Author:** Brian Dell
**Status:** Brainstorm — durable artifact, ready for planning
**Scope tier:** Deep — product

## Problem

There is no decentralized standard for "here are the apps I've made." A
person who ships small AI-assisted apps today has to choose between:

- Posting on Twitter/X, where the apps disappear from the timeline within
  hours and are unindexable.
- Pasting them into a personal site, where they're readable by humans but
  not machines.
- Submitting to a centralized directory (Product Hunt, GitHub topic, Awesome
  list), which gates inclusion and centralizes the trust graph.

RSS solved this for blog posts in 2003. There is no analogue for apps. The
proposal: a single JSON file at `https://<host>/apps.json` that anyone can
publish, anyone can read, no registry required.

## Users

Two sides of a market:

**Publishers** — people and orgs who ship multiple small apps and want them
findable as a set. The first wave is solo tool builders, Claude/Cursor
skill curators, vibe-coding platforms exposing per-user feeds, and indie
SaaS operators with adjacent micro-products.

**Subscribers** — people who follow specific authors' work over time, plus
aggregator/reader operators who index across feeds. The reader-operator
class is small but high-leverage: each one builds discovery infrastructure
the network needs.

## Goals

- A spec a person can read in 10 minutes and publish a valid feed in 60
  seconds.
- A reference CLI that lets early adopters validate their feeds before
  publishing.
- Enough conceptual surface (provenance, forkability, multi-target) to be
  *interesting* to vibe coders, not just a cleaner Awesome list.
- Adoption-friendly defaults: tiny required surface, additive evolution,
  no central authority anyone has to ask permission of.

## Non-goals

- A hosted directory site as the primary product. The format is the
  product; directories are downstream readers.
- Account-mediated publishing. Authentication is the publisher's web
  server's problem, not the spec's.
- Complete metadata coverage. `apps.json` describes apps for *discovery*,
  not for installation correctness — that's what the linked target URLs
  are for.
- A new federation protocol. Subscribing is polling.

## In scope (for the initial release)

- The v1.0 schema in JSON Schema Draft 2020-12 form.
- A human-readable `SPEC.md` covering required vs optional fields, target
  kinds, author verification, and forkability semantics.
- A reference CLI `appfeed` with `validate`, `fetch`, `follow`, `list`,
  and `update` commands.
- An ecosystem map describing reader/aggregator surfaces, discovery
  bootstraps, and the first 10 adopter archetypes.
- A weekend-shippable demonstration that creates the first viral hook
  (see "Smallest viable shipment" below).

## Deferred for later

- A hosted directory site at `apps-json.org`. Worth doing soon, but the
  spec must stand on its own first.
- A web reader UI beyond the simplest "fetch and render" page.
- Crawler infrastructure. Comes after enough seed feeds exist.
- Authenticated/private feeds. Solvable later via standard HTTP auth.
- Diff/changelog formats beyond the human-readable list.
- Schema versioning beyond 1.0.

## Outside this product's identity

These are not just deferred — they would change what the product *is*:

- **A central registry or submission mechanism.** Killing the registry is
  the whole point. Even a "verified authors" list with manual approval
  would re-centralize identity.
- **A monetization layer.** No payments, no marketplaces, no transaction
  surface. The spec has nothing to say about commerce.
- **A rating/review system.** Tags can carry opinion; opinions live on
  reader sides, not in the spec.
- **A platform-specific format** (e.g., "apps.json for Claude Skills
  only"). The format must be platform-neutral; the `targets[]` array is
  how platforms get represented.

## Approach

Three deliverables, ordered by foundational dependency:

1. **The spec** — JSON Schema + human-readable doc. Status: drafted at
   `spec/apps.schema.json` and `spec/SPEC.md`.
2. **The reference CLI (`appfeed`)** — Node 22+ TypeScript, ~500 LOC,
   `commander` + `ajv`. Status: scaffold defined at `appfeed/README.md`,
   working code not yet written.
3. **The ecosystem map** — Concrete tier-1/2/3 reader surfaces, three
   discovery bootstraps, ten adopter archetypes. Status: drafted at
   `docs/ECOSYSTEM.md`.

### Why this shape (vs alternatives)

The brief locked in "JSON file at a well-known URL." That's the right
shape, but the choice deserves to be visible:

- **JSON file at /apps.json (chosen).** Lowest publish friction. Any
  static host serves it. Readers fetch with `fetch()`. Trade-off: no
  schema migration story beyond optional-field additions.
- **Atom/RSS-style XML feed.** More mature ecosystem, but XML is a
  publish-friction tax in 2026 — vibe coders write JSON natively.
- **Sitemap.xml extension.** Free crawler integration, but sitemap is for
  search engines, not for human-readable subscription. The mental model
  is wrong.
- **GitHub topic / well-known URL pattern only.** Solves discovery but
  not metadata. Doesn't capture provenance or targets.
- **A new federated protocol (ActivityPub-style).** Way too much surface
  for a v1.0. Polling is sufficient.

The chosen shape pays its way only if the format is genuinely simpler than
a custom site index. Required fields are kept tiny (`version`, `apps[]`,
per-app `name` + `url`) to make sure that's true.

### Why a CLI as the second-priority artifact

A spec without a validator gets misread. Validators raise the floor of
correctness, which is what makes the network compose. `appfeed validate`
is the first thing any motivated publisher will run; the rest of the CLI
piggybacks on the same infrastructure.

## Success criteria

- **For the spec:** A vibe coder can read `SPEC.md`, publish a valid
  `apps.json`, and have it pass `appfeed validate` in under 5 minutes.
- **For the CLI:** Five people unrelated to the author publish feeds in
  the first week of public availability.
- **For the ecosystem:** Within 30 days of public release, at least one
  reader/aggregator built by someone other than the spec author exists
  in some form (a gist, a one-page web reader, a digest script — any
  third-party reader counts).

## Smallest viable shipment

The single thing to ship in a weekend that proves the concept and pulls in
the first adopters:

> **A live web reader at `apps-json.org` plus a seeded directory of ~20
> hand-built `apps.json` files from people the author already knows.**
>
> The reader takes any `apps.json` URL as a query param, validates it,
> and renders a profile-style page (author, social-verified handles,
> apps with descriptions, version, and target install buttons). The
> directory is a static page with the seeded feeds, plus a "found at"
> badge generator that gives publishers a snippet for their README.
>
> The author personally writes the first ~5 feeds for friends — Simon
> Willison-style solo builders, Claude skill curators, indie SaaS
> founders — and gets permission to host them or have the friends host
> them. That seeds the first adopter wave with people who already had a
> reason to want this.

Why this is the right weekend shipment:

- **It gives publishers an immediate visible reward.** "Drop a file, get a
  rendered profile page at this URL" is a complete loop. No subscriber
  base required for the publisher to feel value.
- **It demonstrates the format better than a spec page can.** The spec
  page is a reference document; the rendered profile is *the pitch*.
- **The seeded directory does double duty as initial proof of life and as
  the seed for any future crawler.** Twenty hand-curated feeds is a
  better starting set than a permissive submission form.
- **It's deferrable from "fully decentralized."** Hosting a reader at
  one URL is fine — the spec stays decentralized; the reader is just one
  early implementation. If `apps-json.org` later goes away, the format
  doesn't.

The CLI's first published version (`appfeed validate` only, no follow/
update yet) ships alongside as a 100-line `npx`-runnable script. Spec +
reader + minimal validator is the weekend bundle.

## Risks

- **No demand.** This solves a problem the author feels keenly; demand
  among others is unverified. Mitigation: ship the weekend bundle and see
  who picks up a feed within 2 weeks. Hard cutoff for "this isn't going
  anywhere" should be set in advance (e.g., "if fewer than 5 unaffiliated
  feeds appear in 30 days, mothball").
- **Platform pre-emption.** Anthropic, Vercel, or GitHub could ship a
  proprietary registry. Mitigation: design the spec so platforms could
  *export* `apps.json` as an artifact and look generous doing it.
- **The provenance fields date the spec.** `vibe_coded` and `prompt_log`
  are a current-moment hook. If AI assistance becomes universal, the
  fields fade in salience. Mitigation: they're optional; the format
  works without them. The spec is not staked on the cultural moment.
- **Spam and trust collapse if/when crawlers exist.** Mitigation: the
  ecosystem map proposes social-graph discovery first, full open-web
  crawling later. Reputation is implicit in who backlinks whom.
- **Standards committee creep.** The format gets "improved" into
  unpublishability. Mitigation: 1.0 is closed; future additions are
  optional fields only; explicit BDFL during the early phase.

## Assumptions to verify

- **Demand assumption.** That solo builders and skill curators actually
  want this and will adopt it given a 5-minute publish path. Untested;
  the weekend ship is partly the test.
- **Identity assumption.** That cross-linked social profiles are a
  good-enough trust signal for low-stakes discovery. Plausible — it's
  how most people currently verify identity informally — but if any
  reader builds a high-stakes feature on it, the model needs to
  harden.
- **Reader-operator assumption.** That at least one third party will
  build a reader within the first 30 days if seeded. If not, the format
  is talking to itself.

## Open questions

- **Naming the CLI.** `appfeed` is fine; `apps` is taken on npm; consider
  `apps-cli` or just `npx apps-json/cli` if `appfeed` collides.
- **`.well-known/apps.json` as the alternate path.** Should we recommend
  it for hosts where root JSON is awkward, or keep one path to keep
  discovery simple?
- **Verification badge format.** Should the "verified by apps-json.org"
  badge be a static asset, or should it be a redirect that re-runs
  validation each time someone clicks it? (The latter is more honest
  but requires uptime.)

## Next steps

1. Draft a 1-paragraph announcement post to test framing on 3-5 friends
   before the weekend ship.
2. Decide a final domain (`apps-json.org` is the working assumption).
3. Run `/ce-plan` against the weekend shipment specifically — that's the
   bounded piece that needs an implementation plan.
4. Identify the seed list of 20 publishers and confirm at least 5 will
   host their feeds within the first week.

## References

- [Spec](../../spec/SPEC.md)
- [JSON Schema](../../spec/apps.schema.json)
- [Example feed](../../spec/apps.example.json)
- [appfeed CLI scaffold](../../appfeed/README.md)
- [Ecosystem map](../ECOSYSTEM.md)
