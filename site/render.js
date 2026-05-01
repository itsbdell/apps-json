// site/render.js
// Pure DOM rendering for an apps.json feed. No fetching, no validation
// here — call validate(feed) first and pass in the validated feed.
//
// Security: every string from the feed is set via textContent, never
// innerHTML. Every URL used as href or src is gated by safeWebUrl()
// which only allows http(s) schemes — javascript:, data:, vbscript:
// are filtered out.

export function safeWebUrl(s) {
  if (typeof s !== "string" || s.length === 0) return null;
  try {
    const u = new URL(s);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
    return null;
  } catch {
    return null;
  }
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k === "html") {
      // intentionally rare; only used for known-safe inline SVG strings
      node.innerHTML = v;
    } else if (k.startsWith("on") && typeof v === "function") {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === "href" || k === "src") {
      const safe = safeWebUrl(v);
      if (safe) node.setAttribute(k, safe);
    } else {
      node.setAttribute(k, String(v));
    }
  }
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) {
      for (const cc of c) if (cc != null) node.append(cc);
    } else if (typeof c === "string" || typeof c === "number") {
      node.append(String(c));
    } else {
      node.append(c);
    }
  }
  return node;
}

function hostFromUrl(s) {
  const safe = safeWebUrl(s);
  if (!safe) return null;
  try { return new URL(safe).host; } catch { return null; }
}

function renderSocial(social) {
  if (!Array.isArray(social) || social.length === 0) return null;
  return el("ul", { class: "social-chips" },
    ...social
      .filter(entry => entry && safeWebUrl(entry.url))
      .map(entry => {
        const handle = (typeof entry.handle === "string" && entry.handle) ||
                       hostFromUrl(entry.url) || "link";
        const platform = (typeof entry.platform === "string" && entry.platform) || null;
        return el("li", {},
          el("a", { class: "chip", href: entry.url, rel: "me noopener", target: "_blank" },
            platform ? el("span", { class: "chip-platform", text: platform }) : null,
            el("span", { class: "chip-handle", text: handle })
          )
        );
      })
  );
}

function renderAuthor(author) {
  if (!author || typeof author !== "object") return null;
  const name = typeof author.name === "string" ? author.name : null;
  const safeUrl = safeWebUrl(author.url);
  return el("section", { class: "author-block" },
    name
      ? (safeUrl
          ? el("h1", {}, el("a", { href: safeUrl, rel: "me noopener", target: "_blank", text: name }))
          : el("h1", { text: name }))
      : null,
    renderSocial(author.social)
  );
}

function renderTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) return null;
  return el("ul", { class: "tag-row" },
    ...tags
      .filter(t => typeof t === "string" && t.length)
      .map(t => el("li", { class: "tag", text: t }))
  );
}

function renderTargetButton(t) {
  if (!t || typeof t !== "object") return null;
  const kind = typeof t.kind === "string" ? t.kind : "open";
  const label = typeof t.label === "string" && t.label.length
    ? t.label
    : `Open (${kind})`;
  const safe = safeWebUrl(t.url);
  if (safe) {
    return el("a", { class: `target-btn target-${kind}`, href: safe, target: "_blank", rel: "noopener" },
      el("span", { class: "target-label", text: label }),
      el("span", { class: "target-kind", text: kind })
    );
  }
  // CLI / prompt kinds may carry a 'command' string instead of a url
  if (typeof t.command === "string" && t.command.length) {
    return el("button", {
      class: `target-btn target-${kind}`,
      type: "button",
      onclick: () => {
        try {
          navigator.clipboard?.writeText(t.command);
        } catch {}
      },
      title: "Click to copy command"
    },
      el("span", { class: "target-label", text: label }),
      el("span", { class: "target-kind", text: `${kind} · copy` })
    );
  }
  return null;
}

function renderTargets(app) {
  const targets = Array.isArray(app.targets) ? app.targets : [];
  const buttons = targets.map(renderTargetButton).filter(Boolean);
  if (buttons.length === 0) {
    // Fallback to top-level url as the only target
    const safe = safeWebUrl(app.url);
    if (safe) {
      return el("div", { class: "target-row" },
        el("a", { class: "target-btn target-web", href: safe, target: "_blank", rel: "noopener" },
          el("span", { class: "target-label", text: "Open" }),
          el("span", { class: "target-kind", text: "web" })
        )
      );
    }
    return null;
  }
  return el("div", { class: "target-row" }, ...buttons);
}

function renderProvenance(app) {
  const bits = [];
  if (app.vibe_coded === true) bits.push(el("span", { class: "chip chip-vibe", text: "vibe-coded" }));
  if (app.forkable === true) bits.push(el("span", { class: "chip chip-fork", text: "forkable" }));
  if (safeWebUrl(app.prompt_log)) {
    bits.push(el("a", { class: "prov-link", href: app.prompt_log, target: "_blank", rel: "noopener", text: "prompt log" }));
  }
  if (safeWebUrl(app.source)) {
    bits.push(el("a", { class: "prov-link", href: app.source, target: "_blank", rel: "noopener", text: "source" }));
  }
  if (safeWebUrl(app.replaces)) {
    bits.push(el("span", { class: "prov-link" },
      "replaces ",
      el("a", { href: app.replaces, target: "_blank", rel: "noopener", text: hostFromUrl(app.replaces) || "upstream" })
    ));
  } else if (typeof app.replaces === "string" && app.replaces.startsWith("app://")) {
    // app:// URI form — render as plain text
    bits.push(el("span", { class: "prov-link", text: `replaces ${app.replaces}` }));
  }
  if (bits.length === 0) return null;
  return el("div", { class: "prov-row" }, ...bits);
}

function renderApp(app) {
  if (!app || typeof app !== "object") return null;
  const name = typeof app.name === "string" ? app.name : "(unnamed)";
  const description = typeof app.description === "string" ? app.description : null;
  const version = typeof app.version === "string" ? app.version : null;
  const updated = typeof app.updated === "string" ? app.updated : null;

  return el("article", { class: "app-card" },
    el("header", { class: "app-head" },
      el("h2", { class: "app-name", text: name }),
      (version || updated)
        ? el("div", { class: "app-meta" },
            version ? el("span", { class: "ver", text: `v${version}` }) : null,
            updated ? el("span", { class: "updated muted", text: updated.slice(0, 10) }) : null
          )
        : null
    ),
    description ? el("p", { class: "app-desc", text: description }) : null,
    renderTags(app.tags),
    renderTargets(app),
    renderProvenance(app)
  );
}

export function renderProfile(feed, { sourceUrl } = {}) {
  const root = el("div", { class: "profile" });
  root.append(renderAuthor(feed.author) || el("section", { class: "author-block" },
    el("h1", { text: hostFromUrl(sourceUrl) || "apps.json feed" })
  ));

  const apps = Array.isArray(feed.apps) ? feed.apps : [];
  if (apps.length === 0) {
    root.append(el("p", { class: "empty", text: "(empty feed)" }));
  } else {
    const list = el("div", { class: "app-list" });
    for (const app of apps) {
      const card = renderApp(app);
      if (card) list.append(card);
    }
    root.append(list);
  }

  if (sourceUrl) {
    root.append(el("footer", { class: "feed-footer muted" },
      "Source: ",
      el("a", { href: sourceUrl, target: "_blank", rel: "noopener", text: sourceUrl })
    ));
  }
  return root;
}

export function renderError({ kind, url, message, hint }) {
  return el("div", { class: `error-card error-${kind || "generic"}` },
    el("h2", { class: "error-title", text: "Couldn't load this feed" }),
    el("p", { class: "error-message", text: message || "unknown error" }),
    url ? el("p", { class: "muted error-url" },
      "URL: ",
      el("code", { text: url })
    ) : null,
    hint ? el("div", { class: "error-hint" },
      el("h3", { text: "Likely fix" }),
      el("p", { text: hint })
    ) : null,
    el("p", { class: "error-diag muted" },
      "Diagnostic: ", el("code", { text: `${kind || "error"} ${url || ""} — ${message || ""}` })
    )
  );
}

export function renderSchemaErrors({ errors, warnings, sourceUrl }) {
  const root = el("div", { class: "error-card error-schema" },
    el("h2", { class: "error-title", text: "Feed has schema errors" }),
    sourceUrl ? el("p", { class: "muted", text: sourceUrl }) : null,
    el("ul", { class: "error-list" },
      ...errors.map(e => el("li", {},
        el("code", { class: "error-path", text: e.path || "/" }),
        " ",
        el("span", { class: "error-msg", text: e.message })
      ))
    )
  );
  if (Array.isArray(warnings) && warnings.length) {
    root.append(el("details", { class: "warning-block" },
      el("summary", { text: `${warnings.length} warning${warnings.length === 1 ? "" : "s"}` }),
      el("ul", {},
        ...warnings.map(w => el("li", {},
          el("code", { class: "warning-path", text: w.path || "/" }),
          " ",
          el("span", { class: "warning-msg", text: w.message })
        ))
      )
    ));
  }
  return root;
}
