// site/url-utils.js
// Shared URL helpers for the reader and the badge generator. Pure ESM,
// no DOM access.

// Normalize a feed URL the user typed (or pasted into ?feed=). Accepts:
//   - "ada.example"             -> "https://ada.example/apps.json"
//   - "https://ada.example"     -> "https://ada.example/apps.json"
//   - "https://ada.example/apps.json"  -> unchanged
//   - "https://ada.example/feeds/apps.json"  -> unchanged (custom path preserved)
// Returns null when the input cannot be coerced into a valid http(s) URL.
export function normalizeFeedUrl(raw) {
  let s = (raw || "").trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) {
    s = "https://" + s.replace(/^\/+/, "");
  }
  let u;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (u.pathname === "" || u.pathname === "/") {
    u.pathname = "/apps.json";
  }
  return u.toString();
}

// Returns the canonical /.well-known/apps.json URL for a feed URL whose
// path ends in /apps.json. Preserves search and hash. Returns null when
// the input doesn't end in /apps.json (so the caller can skip fallback).
export function wellKnownFallback(feedUrl) {
  let u;
  try {
    u = new URL(feedUrl);
  } catch {
    return null;
  }
  if (!u.pathname.endsWith("/apps.json")) return null;
  u.pathname = u.pathname.replace(/\/apps\.json$/, "/.well-known/apps.json");
  return u.toString();
}
