import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { partitionArchive, compareDocsDesc, dateValue } = require("../lib/archive-window.cjs");

const NOW = new Date("2026-10-17T15:30:00Z");

function doc(date, precision = "exact", title = date) {
  const year = date ? String(date).slice(0, 4) : "undated";
  return { data: { doc_date: date, date_precision: precision, doc_year: year, title } };
}

test("dates compare as UTC calendar days, not strings or local Date text", () => {
  const october = dateValue("2026-10-05");
  const january = dateValue(new Date("2026-01-15T00:00:00Z"));
  assert.ok(october > january);
  const rows = [
    doc(new Date("2026-01-15T00:00:00Z"), "exact", "january"),
    doc("2026-10-05", "exact", "october"),
  ].sort(compareDocsDesc);
  assert.deepEqual(
    rows.map((row) => row.data.title),
    ["october", "january"]
  );
});

test("a 17 Oct 2026 build opens 2026 months newest first and leaves the future agenda collapsed", () => {
  const window = partitionArchive(
    [
      doc("2026-10-19", "exact", "future"),
      doc("2026-10-05", "exact", "oct-5"),
      doc("2026-09-28", "exact", "sep"),
      doc("2025-10-17", "exact", "cutoff"),
      doc("2025-10-16", "exact", "before"),
      doc("", "unknown", "undated"),
    ],
    NOW
  );
  assert.equal(window.today, "2026-10-17");
  assert.equal(window.cutoff, "2025-10-17");
  assert.deepEqual(
    window.recent.map((month) => month.label),
    ["October 2026", "September 2026", "October 2025"]
  );
  assert.deepEqual(
    window.recent[0].items.map((item) => item.data.title),
    ["oct-5"]
  );
  assert.equal(window.years[0].label, "2026");
  assert.deepEqual(
    window.years[0].items.map((item) => item.data.title),
    ["future"]
  );
  assert.equal(window.years.at(-1).label, "Undated");
});

test("selectboard 2026 inventory dates stay four-digit ISO dates", () => {
  const text = readFileSync(new URL("../data/documents.csv", import.meta.url), "utf8");
  const lines = text.split(/\n/).slice(1).filter(Boolean);
  const hits = [];
  for (const line of lines) {
    if (!line.includes(",selectboard,")) continue;
    const date = line.match(/,(20\d{2}-\d{2}-\d{2}),exact,(20\d{2}),/);
    if (!date) continue;
    if (date[2] === "2026") hits.push({ iso: date[1], year: date[2], line });
  }
  assert.ok(hits.length >= 40, `expected the 2026 selectboard sample, found ${hits.length}`);
  for (const hit of hits) {
    assert.match(hit.iso, /^2026-\d{2}-\d{2}$/);
    assert.equal(hit.year, "2026");
    assert.doesNotMatch(hit.iso, /^19/);
  }
});
