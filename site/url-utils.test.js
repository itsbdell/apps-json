import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeFeedUrl, wellKnownFallback } from "./url-utils.js";

test("normalizes local demo feeds against the current origin", () => {
  assert.equal(
    normalizeFeedUrl("/apps.example.json", "http://localhost:4173"),
    "http://localhost:4173/apps.example.json"
  );
  assert.equal(
    normalizeFeedUrl("apps.example.json", "http://localhost:4173"),
    "http://localhost:4173/apps.example.json"
  );
});

test("normalizes bare domains to the default apps.json path", () => {
  assert.equal(normalizeFeedUrl("ada.example"), "https://ada.example/apps.json");
  assert.equal(normalizeFeedUrl("https://ada.example"), "https://ada.example/apps.json");
});

test("rejects protocol-relative local-looking input", () => {
  assert.equal(normalizeFeedUrl("//evil.example/apps.json", "http://localhost:4173"), null);
});

test("builds well-known fallback only for apps.json paths", () => {
  assert.equal(
    wellKnownFallback("https://ada.example/apps.json"),
    "https://ada.example/.well-known/apps.json"
  );
  assert.equal(wellKnownFallback("https://ada.example/custom.json"), null);
});
