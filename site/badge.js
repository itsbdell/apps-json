// site/badge.js
// Badge generator. Reads the feed URL input, optionally fetches+validates
// the feed (best effort), and emits paste-ready snippets in three forms:
// live-link HTML, static-SVG-only HTML, and Markdown.

import { validate } from "/validator.js";
import { safeWebUrl } from "/render.js";

const READER_ORIGIN = location.origin;
const BADGE_PATH = "/badge.svg";
const READER_PATH = "/";

const $input = document.getElementById("feed-input");
const $status = document.getElementById("feed-status");
const $previews = document.getElementById("previews");
const $previewLink = document.getElementById("preview-link");
const $snippetLink = document.getElementById("snippet-link");
const $snippetStatic = document.getElementById("snippet-static");
const $snippetMd = document.getElementById("snippet-md");

let validateTimer = null;
let lastValidatedUrl = null;

$input.addEventListener("input", onChange);

for (const btn of document.querySelectorAll(".copy-btn")) {
  btn.addEventListener("click", () => copySnippet(btn));
}

prefillFromQuery();

function prefillFromQuery() {
  const params = new URLSearchParams(location.search);
  const f = params.get("feed");
  if (f) {
    $input.value = f;
    onChange();
  }
}

function onChange() {
  const raw = $input.value.trim();
  if (!raw) {
    setStatus("");
    $previews.hidden = true;
    return;
  }
  const safe = safeWebUrl(raw);
  if (!safe) {
    setStatus("That doesn't look like a valid http(s) URL.", "warn");
    $previews.hidden = true;
    return;
  }
  renderPreviews(safe);
  $previews.hidden = false;

  // Best-effort fetch+validate (debounced)
  clearTimeout(validateTimer);
  validateTimer = setTimeout(() => liveValidate(safe), 400);
}

function setStatus(text, kind) {
  $status.textContent = text || "";
  $status.dataset.kind = kind || "";
}

async function liveValidate(url) {
  if (url === lastValidatedUrl) return;
  lastValidatedUrl = url;
  setStatus(`Checking ${url}…`);
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) {
      setStatus(`✖ HTTP ${res.status} from ${url}`, "warn");
      return;
    }
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch (e) {
      setStatus(`✖ ${url} did not return JSON.`, "warn");
      return;
    }
    const v = validate(data);
    if (v.ok) {
      const n = Array.isArray(data.apps) ? data.apps.length : 0;
      setStatus(`✓ valid — ${n} app${n === 1 ? "" : "s"}`, "ok");
    } else {
      setStatus(`✖ ${v.errors.length} schema error${v.errors.length === 1 ? "" : "s"} (badge will still work; reader will surface details)`, "warn");
    }
  } catch (e) {
    setStatus(`(couldn't reach ${url} — likely a CORS issue. The badge will still link correctly.)`, "muted");
  }
}

function readerUrlFor(feedUrl) {
  return `${READER_ORIGIN}${READER_PATH}?feed=${encodeURIComponent(feedUrl)}`;
}

function badgeImgUrl() {
  return `${READER_ORIGIN}${BADGE_PATH}`;
}

function renderPreviews(feedUrl) {
  const reader = readerUrlFor(feedUrl);
  const img = badgeImgUrl();

  // Visual preview (linked badge)
  $previewLink.replaceChildren();
  const a = document.createElement("a");
  a.href = reader;
  a.target = "_blank";
  a.rel = "noopener";
  const i = document.createElement("img");
  i.src = img;
  i.alt = "apps.json";
  i.height = 22;
  a.append(i);
  $previewLink.append(a);

  // HTML — live link
  $snippetLink.value =
    `<a href="${escapeAttr(reader)}"><img src="${escapeAttr(img)}" alt="apps.json" height="22"></a>`;

  // HTML — static SVG only
  $snippetStatic.value =
    `<img src="${escapeAttr(img)}" alt="apps.json" height="22">`;

  // Markdown
  $snippetMd.value = `[![apps.json](${img})](${reader})`;
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function copySnippet(btn) {
  const id = btn.getAttribute("data-target");
  const ta = document.getElementById(id);
  if (!ta) return;
  try {
    await navigator.clipboard.writeText(ta.value);
    const orig = btn.textContent;
    btn.textContent = "Copied!";
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = orig;
      btn.disabled = false;
    }, 1200);
  } catch {
    ta.select();
    btn.textContent = "Press ⌘C";
    setTimeout(() => { btn.textContent = "Copy"; }, 1500);
  }
}
