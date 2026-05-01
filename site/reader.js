// site/reader.js
// Entry point for the reader. When ?feed=<url> is present, hide the
// directory placeholder, fetch the feed, validate it, and render the
// profile (or actionable errors) into #reader-output.

import { validate } from "/validator.js";
import { renderProfile, renderError, renderSchemaErrors, safeWebUrl } from "/render.js";

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

function normalizeFeedUrl(raw) {
  let s = (raw || "").trim();
  if (!s) return null;
  // accept bare hosts ("briandell.com") and missing schemes
  if (!/^https?:\/\//i.test(s)) {
    s = "https://" + s.replace(/^\/+/, "");
  }
  // bare host or trailing slash → append /apps.json
  try {
    const u = new URL(s);
    if (u.pathname === "" || u.pathname === "/") {
      u.pathname = "/apps.json";
    }
    return u.toString();
  } catch {
    return null;
  }
}

async function fetchJson(url) {
  let res;
  try {
    res = await fetch(url, { redirect: "follow" });
  } catch (e) {
    const isLikelyCors = /Failed to fetch|NetworkError|TypeError/i.test(e?.message || "");
    return {
      ok: false,
      kind: "network",
      url,
      message: e?.message || "fetch failed",
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

  let result = await fetchJson(url);

  // Fallback: 404 on /apps.json → try /.well-known/apps.json
  if (!result.ok && result.kind === "http" && result.status === 404 && /\/apps\.json$/.test(url)) {
    const fallback = url.replace(/\/apps\.json$/, "/.well-known/apps.json");
    setStatus(output, `Trying ${fallback}…`);
    const second = await fetchJson(fallback);
    if (second.ok) result = second;
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
