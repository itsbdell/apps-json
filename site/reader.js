// site/reader.js
// Entry point for the reader. When ?feed=<url> is present, hide the
// directory placeholder, fetch the feed, validate it, and render the
// profile (or actionable errors) into #reader-output.

import { validate } from "/validator.js";
import { renderProfile, renderError, renderSchemaErrors, safeWebUrl } from "/render.js";
import { normalizeFeedUrl, wellKnownFallback } from "/url-utils.js";

const FETCH_TIMEOUT_MS = 15000;

const params = new URLSearchParams(location.search);
const rawFeed = params.get("feed");

if (rawFeed) {
  const directory = document.getElementById("directory-mode");
  const output = document.getElementById("reader-output");
  if (directory) directory.hidden = true;
  if (output) {
    output.hidden = false;
    output.replaceChildren();
    runReader(rawFeed, output).catch(e => {
      output.replaceChildren(renderError({
        kind: "internal",
        message: e?.message || String(e)
      }));
    });
  }
}

async function fetchJson(url) {
  let res;
  try {
    res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
  } catch (e) {
    const isTimeout = e?.name === "TimeoutError" || e?.name === "AbortError";
    const isLikelyCors = !isTimeout && /Failed to fetch|NetworkError|TypeError/i.test(e?.message || "");
    return {
      ok: false,
      kind: isTimeout ? "timeout" : "network",
      url,
      message: isTimeout
        ? `Timed out after ${FETCH_TIMEOUT_MS}ms`
        : (e?.message || "fetch failed"),
      hint: isLikelyCors
        ? "The publisher's server may not be sending Access-Control-Allow-Origin. They need to add the header (e.g. on Cloudflare Pages, GitHub Pages, or via Vercel) for browser readers to fetch their feed."
        : null
    };
  }
  if (!res.ok) {
    return { ok: false, kind: "http", status: res.status, url, message: `HTTP ${res.status} ${res.statusText}` };
  }
  let text;
  try {
    text = await res.text();
  } catch (e) {
    return { ok: false, kind: "network", url, message: e?.message || "read failed" };
  }
  try {
    return { ok: true, data: JSON.parse(text), url };
  } catch (e) {
    return { ok: false, kind: "parse", url, message: `Invalid JSON: ${e?.message || "parse failed"}` };
  }
}

async function runReader(rawFeed, output) {
  const url = normalizeFeedUrl(rawFeed);
  if (!url || !safeWebUrl(url)) {
    output.replaceChildren(renderError({
      kind: "input",
      url: rawFeed,
      message: "That doesn't look like a valid http(s) URL.",
      hint: "Try ?feed=https://yourdomain.com/apps.json"
    }));
    return;
  }

  setStatus(output, `Loading ${url}…`);

  const primary = await fetchJson(url);
  let result = primary;

  // Fallback: 404 on /apps.json → try /.well-known/apps.json
  if (!result.ok && result.kind === "http" && result.status === 404) {
    const fallback = wellKnownFallback(url);
    if (fallback) {
      setStatus(output, `Trying ${fallback}…`);
      const second = await fetchJson(fallback);
      if (second.ok) {
        result = second;
      } else {
        // Both failed — surface the original 404 with a note that fallback was attempted
        result = {
          ...primary,
          message: `${primary.message} (also tried ${fallback}: ${second.kind === "http" ? `HTTP ${second.status}` : second.message})`
        };
      }
    }
  }

  if (!result.ok) {
    output.replaceChildren(renderError(result));
    return;
  }

  const v = validate(result.data);
  if (!v.ok) {
    output.replaceChildren(renderSchemaErrors({
      errors: v.errors,
      warnings: v.warnings,
      sourceUrl: result.url
    }));
    return;
  }

  output.replaceChildren(renderProfile(result.data, { sourceUrl: result.url }));
  document.title = profileTitle(result.data, result.url);
}

function profileTitle(feed, url) {
  const author = feed.author?.name;
  if (author) return `${author} — apps.json`;
  try { return `${new URL(url).host} — apps.json`; } catch { return "apps.json"; }
}

function setStatus(output, msg) {
  output.replaceChildren(
    Object.assign(document.createElement("p"), { className: "loading muted", textContent: msg })
  );
}
