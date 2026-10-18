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

function seasonFromQuery(value, month) {
  const key = String(value || "").toLowerCase();
  if (Object.prototype.hasOwnProperty.call(seasons, key)) return key;
  return seasonForMonth(month);
}

const CREAM = "#f4ead2";
const INK = "#1d2420";
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
  assert.equal(seasonForMonth(13), null);
});

test("query override accepts a known season and ignores anything else", () => {
  assert.equal(seasonFromQuery("winter", 10), "winter");
  assert.equal(seasonFromQuery("SUMMER", 1), "summer");
  assert.equal(seasonFromQuery("nope", 10), "fall");
  assert.equal(seasonFromQuery("", 3), "spring");
  assert.equal(seasonFromQuery(null, 7), "summer");
});

test("seasonal accents keep WCAG AA text contrast on the light design", () => {
  const pairs = [
    ["cream on spruce", (c) => [CREAM, c.spr]],
    ["cream on deep", (c) => [CREAM, c.deep]],
    ["cream on bark", (c) => [CREAM, c.bark]],
    ["ink on blaze", (c) => [INK, c.blaze]],
    ["blaze on bark", (c) => [c.blaze, c.bark]],
    ["blaze on spruce", (c) => [c.blaze, c.spr]],
    ["white on rust", (c) => [WHITE, c.rust]],
    ["rust on paper", (c) => [c.rust, c.paper]],
    ["rust on white", (c) => [c.rust, WHITE]],
    ["rust on cream", (c) => [c.rust, CREAM]],
    ["spruce on paper", (c) => [c.spr, c.paper]],
    ["bark on paper", (c) => [c.bark, c.paper]],
    ["ink on paper", (c) => [INK, c.paper]],
  ];
  for (const [id, season] of Object.entries(seasons)) {
    for (const [label, pick] of pairs) {
      const [a, b] = pick(season.colors);
      const ratio = contrast(a, b);
      assert.ok(ratio >= 4.5, `${id} ${label} is ${ratio.toFixed(2)}`);
    }
  }
});

test("homepage animation is a short one-shot effect", () => {
  const kinds = new Set(["snow", "petal", "firefly", "leaf"]);
  for (const [id, season] of Object.entries(seasons)) {
    assert.equal(typeof season.line, "string");
    assert.ok(season.line.length > 0 && season.line.length < 48);
    assert.ok(kinds.has(season.fx.kind), id);
    assert.ok(season.fx.duration >= 4000 && season.fx.duration <= 6000, id);
    assert.ok(season.fx.count >= 8 && season.fx.count <= 40, id);
    for (const hex of Object.values(season.colors)) {
      assert.match(hex, /^#[0-9a-f]{6}$/i);
    }
  }
});
