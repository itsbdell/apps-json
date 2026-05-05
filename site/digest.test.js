import { test } from "node:test";
import assert from "node:assert/strict";
import { groupDigestItems } from "./digest.js";

test("groups feed additions separately from app updates", () => {
  const groups = groupDigestItems([
    { id: "feed", type: "feed_added" },
    { id: "app", type: "app_updated" },
    { id: "other", type: "app_added" }
  ]);

  assert.deepEqual(groups.feeds.map(item => item.id), ["feed"]);
  assert.deepEqual(groups.apps.map(item => item.id), ["app", "other"]);
});
