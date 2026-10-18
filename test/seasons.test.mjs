import assert from "node:assert/strict";
import { test } from "node:test";
import seasons from "../src/_data/seasons.js";

function seasonForMonth(month) {
  const n = Number(month);
  for (const [id, season] of Object.entries(seasons)) {
    if (season.months.includes(n)) return id;
  }
  return null;
}

/** Mirrors the head script: query wins, then a saved off switch, then the month. */
function resolveSeason(query, month, stored) {
  const key = String(query || "").toLowerCase();
  if (key === "default") return "default";
  if (Object.prototype.hasOwnProperty.call(seasons, key)) return key;
  if (stored === "off") return "default";
  return seasonForMonth(month);
}

const WHITE = "#ffffff";

function channel(hex, start) {
  const value = parseInt(hex.slice(start, start + 2), 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
}

function contrast(a, b) {
  const left = luminance(a);
  const right = luminance(b);
  const hi = Math.max(left, right);
  const lo = Math.min(left, right);
  return (hi + 0.05) / (lo + 0.05);
}

test("meteorological months map to one season each", () => {
  const expected = {
    12: "winter",
    1: "winter",
    2: "winter",
    3: "spring",
    4: "spring",
    5: "spring",
    6: "summer",
    7: "summer",
    8: "summer",
    9: "fall",
    10: "fall",
    11: "fall",
  };
  for (const [month, id] of Object.entries(expected)) {
    assert.equal(seasonForMonth(Number(month)), id);
  }
  assert.equal(seasonForMonth(0), null);
});

test("query override beats the saved switch, and default clears the theme", () => {
  assert.equal(resolveSeason("winter", 10, "off"), "winter");
  assert.equal(resolveSeason("SUMMER", 1, "off"), "summer");
  assert.equal(resolveSeason("default", 7, "on"), "default");
  assert.equal(resolveSeason("nope", 10, "off"), "default");
  assert.equal(resolveSeason("", 3, "off"), "default");
  assert.equal(resolveSeason("", 3, "on"), "spring");
  assert.equal(resolveSeason("", 1, ""), "winter");
});

test("each seasonal palette keeps WCAG AA text contrast", () => {
  const pairs = [
    ["cream on spruce", (c) => [c.cream, c.spr]],
    ["cream on deep", (c) => [c.cream, c.deep]],
    ["cream on bark", (c) => [c.cream, c.bark]],
    ["ink on blaze", (c) => [c.ink, c.blaze]],
    ["ink on paper", (c) => [c.ink, c.paper]],
    ["ink on card", (c) => [c.ink, c.card]],
    ["blaze on spruce", (c) => [c.blaze, c.spr]],
    ["blaze on bark", (c) => [c.blaze, c.bark]],
    ["blaze on deep", (c) => [c.blaze, c.deep]],
    ["white on rust", (c) => [WHITE, c.rust]],
    ["rust on paper", (c) => [c.rust, c.paper]],
    ["rust on card", (c) => [c.rust, c.card]],
    ["rust on cream", (c) => [c.rust, c.cream]],
    ["spruce on paper", (c) => [c.spr, c.paper]],
    ["spruce on cream", (c) => [c.spr, c.cream]],
    ["spruce on card", (c) => [c.spr, c.card]],
    ["bark on paper", (c) => [c.bark, c.paper]],
    ["bark on card", (c) => [c.bark, c.card]],
    ["muted on paper", (c) => [c.muted, c.paper]],
    ["muted on card", (c) => [c.muted, c.card]],
  ];
  for (const [id, season] of Object.entries(seasons)) {
    for (const [label, pick] of pairs) {
      const [a, b] = pick(season.colors);
      const ratio = contrast(a, b);
      assert.ok(ratio >= 4.5, `${id} ${label} is ${ratio.toFixed(2)}`);
    }
  }
});

test("homepage hero is a capped 8 to 12 second moment", () => {
  const kinds = new Set(["snow", "spring", "summer", "leaf"]);
  for (const [id, season] of Object.entries(seasons)) {
    assert.ok(kinds.has(season.fx.kind), id);
    assert.ok(season.fx.hero >= 8000 && season.fx.hero <= 12000, id);
    assert.ok(season.fx.count >= 8 && season.fx.count <= 60, id);
    assert.ok(season.fx.ambient >= 3 && season.fx.ambient <= 12, id);
    for (const hex of Object.values(season.colors)) {
      assert.match(hex, /^#[0-9a-f]{6}$/i);
    }
  }
});
