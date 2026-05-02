# apps.json — Ecosystem Map

A guide to what the format enables, what can be built on top, and who would
adopt it first.

## What the file enables

Once a meaningful number of `apps.json` files exist on the open web, you get:

1. **A crawlable index of the long tail of apps.** No platform mediation,
   no app store fees, no submission process. The web *itself* becomes the
   directory.
2. **Verifiable authorship.** Cross-linked social profiles let any agent
   independently confirm "this domain's apps are made by this Twitter
   account." No central identity provider.
3. **Provenance trails.** `vibe_coded` + `prompt_log` make AI-assisted
   construction a first-class fact about an app, in the same way a
   Wikipedia article's history is a first-class fact about it.
4. **Forking as protocol.** `forkable` + `replaces` create a remix lineage
   discoverable by aggregators. This is what `git fork` is for code, but
   for *running products*.
5. **Multi-target manifests.** A single app entry can carry web, native,
   and skill targets. Aggregators can present the install option that
   matches the visitor's environment.

## What can be built on top

Reader and aggregator surfaces, in rough order of how much work they take:

### Tier 1 — exists in a weekend

- **A web reader at `apps-json.org/?feed=<url>`** that fetches any
  `apps.json` and renders it as a profile page. The "view source" of the
  format. *(Shipped, currently at apps-json.vercel.app.)*
- **A validator badge** that authors paste into their site footer:
  `<a href="https://apps-json.org/?feed=mysite.com/apps.json">apps.json ✓</a>`.
  *(Shipped — generator at `/badge.html`.)*
- **A directory page** with curated `apps.json` URLs. Manual at first; a
  crawler later. *(Pending — needs the seed list.)*

### Tier 2 — exists in a month

- **A "what shipped this week" digest.** Crawls a few hundred feeds and
  emails or RSSes the deltas. The compounding loop: people subscribe
  to find new apps, which gives publishers a reason to keep their feeds
  fresh.
- **A search engine across feeds** (think `apps.fyi`). Indexes name,
  description, and tags. Filter by `vibe_coded`, by target kind, by
  forkability.
- **A Claude Skill marketplace.** Crawl feeds for `targets.kind ==
  "claude-skill"`, render install buttons. Fully decentralized; Anthropic
  doesn't have to bless anything.
- **Editor extensions** (VS Code, Cursor) that subscribe to feeds and offer
  one-click install of new skills, MCP servers, or CLIs as their authors
  publish them.

### Tier 3 — exists in a year

- **Family-tree visualizers** that follow `replaces` chains across feeds
  to show app lineages. "This skill descends from these three earlier
  ones, here are the prompt logs that produced each."
- **Fork-aware diff tools** that take an upstream `apps.json` entry and a
  downstream fork's `prompt_log`, and produce a human-readable summary of
  the divergence.
- **Reputation overlays** built on social-graph backlinks. "47 of the
  authors you follow follow this author."

## Discovery without a registry

Three concrete bootstraps, ranked by leverage:

### 1. Backlink crawls

Most authors already publish their personal site to a small audience. A
crawler that starts from a seed list of ~100 hand-curated `apps.json` URLs
and follows every `author.url` and every `social[].url` will fan out to
the rest of the web within a few hops. Every author who adds a friend's
backlink to their site implicitly extends the index.

### 2. Social-graph discovery

If `author.social[]` lists a Twitter/Mastodon/GitHub handle and that
profile links back to the author's site, an agent can walk the social
graph: "the people I follow on Twitter who have an `apps.json` on their
linked website." This makes discovery follow trust.

### 3. "Found at" badge program

A tiny GitHub repo accepts PRs adding `apps.json` URLs to a list. Authors
get a badge for their README. The list is the seed for crawlers. This
deliberately mirrors how the early webring scenes built reach.

What we explicitly do *not* build: a submission form on a central site
that gates inclusion. The whole point is that publishing IS the
submission.

## First 10 adopter archetypes

The pattern: each archetype already produces multiple apps, already has a
home on the web, and already has a reason to want them findable as a set.

1. **Solo tool builders (Simon Willison, Geoffrey Litt).** Already
   maintain personal index pages of their tools. `apps.json` formalizes
   that page so others can mirror, search, or notify.
2. **Vibe-coding platforms (Lovable, v0, Replit, Cursor).** Could expose
   per-user feeds at `lovable.dev/<user>/apps.json`, turning every paid
   user into a publisher. The platform gets a network effect; users get
   a portable identity.
3. **Claude / Cursor / OpenAI skill curators.** People who collect and
   recommend skills (a known archetype within Claude Code's plugin
   ecosystem). Their `apps.json` becomes a curated feed others subscribe
   to.
4. **Indie SaaS founders with adjacent micro-products.** Anyone running
   3+ small products under one brand (Levels.fyi types, Pieter Levels'
   constellation). Today they cross-link in a footer; with `apps.json`
   they can be subscribed to.
5. **Agencies showcasing client work.** Replaces the "Recent Projects"
   page with a structured feed clients can syndicate.
6. **Open-source maintainers cross-referencing tools.** Maintainers of
   ecosystems (Astro, Tauri, Bun) could publish curated feeds of
   ecosystem apps as a discovery surface.
7. **Newsletter writers with companion apps.** Substack/Beehiiv writers
   who ship small tools alongside posts (Lenny's archetype). Their
   `apps.json` becomes a permanent index decoupled from any one post.
8. **Researchers publishing demo apps.** Academic groups with multiple
   project pages already do this informally. `apps.json` makes the
   collection machine-readable.
9. **Educators with course-supplement apps.** Bootcamp instructors and
   creators who ship companion tools per cohort (Wes Bos style). The
   feed becomes a syllabus index.
10. **AI-native publishers (Every, Stratechery-adjacent operations).**
    Publications that ship apps as part of editorial. Each issue can link
    to "this week's app" and the feed accumulates.

## Adoption ladder

A path from zero to network effect:

1. **One author publishes a feed.** Friction: writing the file (5
   minutes) and adding `validate` to their CI (5 minutes). Reward: a
   permanent canonical list of their apps that survives platform churn.
2. **Five friends mirror each other's feeds in their footers.** Friction:
   one anchor tag. Reward: cross-promotion that doesn't require a
   shared platform.
3. **Someone builds the first reader at apps-json.org.** Friction:
   weekend project. Reward: instant URL to share whenever they show off
   what they make. *(Done — apps-json.vercel.app, weekend of 2026-04-30.)*
4. **A vibe-coding platform exposes per-user feeds.** Friction: one
   server-side endpoint. Reward: every published user becomes a
   publisher of structured metadata, which platforms have wanted but
   couldn't extract.
5. **A digest service launches.** Friction: a crawler + email list.
   Reward: critical mass — now there's a destination that surfaces what
   the network is producing.
6. **A second platform's reader treats `apps.json` as the canonical
   provenance source.** This is when the format escapes its origin and
   becomes a standard.

## Risks to durability

- **Platform pre-emption.** Anthropic, GitHub, or Vercel could ship a
  proprietary registry that solves the same problem with better UX. The
  defense: be openly compatible — design the spec so any of them could
  expose `apps.json` as an export and look generous doing it.
- **Vibe-coding cools as a category.** The provenance fields
  (`vibe_coded`, `prompt_log`) are a current-moment hook. If AI assistance
  becomes assumed, those fields fade. Defense: those fields are optional;
  the format works without them.
- **Spam and trust collapse.** A crawler that ingests everything will
  eventually ingest AI-generated junk. Defense: discovery walks the
  social graph rather than crawling the open web by default. Reputation
  is implicit in who backlinks whom.
- **Standards committee creep.** The format gets "improved" until it's
  too heavy to publish casually. Defense: version `1.0` is closed;
  additions are optional fields.
