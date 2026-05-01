// site/validator.js
// Pure ES module — no DOM access, no Node-specific APIs. Runs in browsers
// and in Node so the same code can be exercised by node --test.
//
// Validates the v1.0 apps.json hard contract:
//   - top-level: version === "1.0", apps is an array
//   - each app: name (non-empty string), url (parseable URL)
//
// Everything else is best-effort: optional fields produce warnings when
// they look malformed, never errors. The spec philosophy is "be permissive
// on read" — readers must tolerate unknown fields and unknown target.kind
// values without failing.

export const SPEC_VERSION = "1.0";

function isParseableUrl(s) {
  if (typeof s !== "string" || s.length === 0) return false;
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

function isIsoDateLike(s) {
  if (typeof s !== "string") return false;
  // accept YYYY-MM-DD or full ISO 8601; cheap check, not a strict parser
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/.test(s);
}

function pushErr(out, path, message) {
  out.errors.push({ path, message });
}

function pushWarn(out, path, message) {
  out.warnings.push({ path, message });
}

function validateAuthor(author, out, path) {
  if (author == null) return;
  if (typeof author !== "object" || Array.isArray(author)) {
    pushWarn(out, path, "author should be an object");
    return;
  }
  if (author.url != null && !isParseableUrl(author.url)) {
    pushWarn(out, `${path}/url`, "author.url is not a parseable URL");
  }
  if (Array.isArray(author.social)) {
    author.social.forEach((entry, i) => {
      if (entry && typeof entry === "object") {
        if (!isParseableUrl(entry.url)) {
          pushWarn(out, `${path}/social/${i}/url`, "social URL is not parseable");
        }
      } else {
        pushWarn(out, `${path}/social/${i}`, "social entry should be an object with a url");
      }
    });
  }
}

function validateApp(app, out, path) {
  if (app == null || typeof app !== "object" || Array.isArray(app)) {
    pushErr(out, path, "app must be an object");
    return;
  }
  if (typeof app.name !== "string" || app.name.length === 0) {
    pushErr(out, `${path}/name`, "missing required property 'name' (non-empty string)");
  }
  if (!isParseableUrl(app.url)) {
    pushErr(out, `${path}/url`, "missing or unparseable required property 'url'");
  }
  if (app.id != null && typeof app.id !== "string") {
    pushWarn(out, `${path}/id`, "id should be a string");
  }
  if (app.updated != null && !isIsoDateLike(app.updated)) {
    pushWarn(out, `${path}/updated`, "updated should be ISO 8601");
  }
  if (Array.isArray(app.targets)) {
    app.targets.forEach((t, i) => {
      const tp = `${path}/targets/${i}`;
      if (t == null || typeof t !== "object") {
        pushWarn(out, tp, "target should be an object with a 'kind'");
        return;
      }
      if (typeof t.kind !== "string" || t.kind.length === 0) {
        pushWarn(out, `${tp}/kind`, "target.kind should be a non-empty string (any value tolerated)");
      }
      if (t.url != null && !isParseableUrl(t.url)) {
        pushWarn(out, `${tp}/url`, "target.url is not parseable");
      }
    });
  } else if (app.targets != null) {
    pushWarn(out, `${path}/targets`, "targets should be an array");
  }
  if (app.author != null) validateAuthor(app.author, out, `${path}/author`);
  for (const f of ["prompt_log", "source", "replaces"]) {
    if (app[f] != null && !isParseableUrl(app[f])) {
      pushWarn(out, `${path}/${f}`, `${f} is not a parseable URL`);
    }
  }
}

export function validate(feed) {
  const out = { ok: true, errors: [], warnings: [] };

  if (feed == null || typeof feed !== "object" || Array.isArray(feed)) {
    pushErr(out, "/", "feed must be a JSON object");
    out.ok = false;
    return out;
  }

  if (feed.version !== SPEC_VERSION) {
    if (feed.version == null) {
      pushErr(out, "/version", "missing required property 'version'");
    } else {
      pushErr(out, "/version", `version must be "${SPEC_VERSION}" (got ${JSON.stringify(feed.version)})`);
    }
  }

  if (!Array.isArray(feed.apps)) {
    pushErr(out, "/apps", "missing required property 'apps' (array)");
  } else {
    feed.apps.forEach((app, i) => validateApp(app, out, `/apps/${i}`));
  }

  if (feed.author != null) validateAuthor(feed.author, out, "/author");
  if (feed.self != null && !isParseableUrl(feed.self)) {
    pushWarn(out, "/self", "self is not a parseable URL");
  }
  if (feed.updated != null && !isIsoDateLike(feed.updated)) {
    pushWarn(out, "/updated", "updated should be ISO 8601");
  }

  out.ok = out.errors.length === 0;
  return out;
}
