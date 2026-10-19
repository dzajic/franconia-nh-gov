import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { deflateRawSync } from "node:zlib";
import { test } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  addDays,
  calendarDate,
  collectDocuments,
  docxToText,
  editionWindows,
  estimateCost,
  shouldGenerate,
  sourceFingerprint,
  sourceInSection,
  validateEdition,
  zipEntry,
} from "../.github/scripts/recap-lib.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function storedZip(name, text) {
  const nameBuf = Buffer.from(name);
  const data = Buffer.from(text);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(nameBuf.length, 26);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(1, 8);
  central.writeUInt16LE(nameBuf.length, 28);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(data.length, 24);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  const cdStart = 30 + nameBuf.length + data.length;
  eocd.writeUInt32LE(46 + nameBuf.length, 12);
  eocd.writeUInt32LE(cdStart, 16);
  return Buffer.concat([local, nameBuf, data, central, nameBuf, eocd]);
}

test("edition windows are seven days, thirty days, and the year to date", () => {
  const windows = editionWindows("2026-10-19");
  assert.deepEqual(
    windows.map((section) => [section.id, section.from, section.to]),
    [
      ["week", "2026-10-13", "2026-10-19"],
      ["month", "2026-09-20", "2026-10-19"],
      ["year", "2026-01-01", "2026-10-19"],
    ]
  );
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("New York calendar date does not follow UTC after midnight", () => {
  assert.equal(calendarDate(new Date("2026-10-20T03:30:00Z")), "2026-10-19");
  assert.equal(calendarDate(new Date("2026-10-20T04:00:00Z")), "2026-10-20");
});

test("validation drops items that cite a missing or out-of-window source", () => {
  const documents = [
    {
      permalink: "/archive/selectboard/2026/2026-10-19-selectboard-agenda/",
      body: "selectboard",
      type: "agenda",
      doc_date: "2026-10-19",
      date_precision: "exact",
    },
  ];
  const edition = {
    sections: [
      {
        id: "week",
        from: "2026-10-13",
        to: "2026-10-19",
        lead: "Meet tonight.",
        decided: [{ text: "Invented vote.", sources: ["/archive/missing/"] }],
        comingUp: [
          {
            text: "Selectmen meet at 4:00 p.m.",
            sources: ["/archive/selectboard/2026/2026-10-19-selectboard-agenda/"],
          },
        ],
        deadlines: [],
      },
    ],
  };
  const { edition: clean, dropped } = validateEdition(edition, documents);
  assert.equal(dropped, 1);
  assert.equal(clean.sections[0].decided.length, 0);
  assert.equal(clean.sections[0].comingUp.length, 1);
  assert.equal(
    clean.sections[0].comingUp[0].sources[0].href,
    "/archive/selectboard/2026/2026-10-19-selectboard-agenda/"
  );
});

test("a second edition is skipped on the same New York day or when documents are unchanged", () => {
  const editions = [{ date: "2026-10-19", sourceFingerprint: "abc" }];
  assert.equal(shouldGenerate({ today: "2026-10-19", editions, fingerprint: "xyz" }).ok, false);
  assert.equal(shouldGenerate({ today: "2026-10-20", editions, fingerprint: "abc" }).ok, false);
  assert.equal(shouldGenerate({ today: "2026-10-20", editions, fingerprint: "xyz" }).ok, true);
  assert.equal(shouldGenerate({ today: "2026-10-19", editions, fingerprint: "abc", force: true }).ok, true);
});

test("year-only records can be cited in the year section and not in the week", () => {
  const doc = {
    permalink: "/archive/selectboard/2026/town-meeting/",
    doc_date: "",
    doc_year: "2026",
    date_precision: "year",
  };
  const [week, , year] = editionWindows("2026-10-19");
  assert.equal(sourceInSection(doc, week), false);
  assert.equal(sourceInSection(doc, year), true);
});

test("docx text comes out of a stored zip entry", () => {
  const xml = "<w:p>Selectmen approved the minutes.</w:p>";
  const buf = storedZip("word/document.xml", xml);
  assert.match(docxToText(buf), /Selectmen approved the minutes/);
  const deflated = deflateRawSync(Buffer.from(xml));
  const nameBuf = Buffer.from("word/document.xml");
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(8, 8);
  local.writeUInt16LE(nameBuf.length, 26);
  local.writeUInt32LE(deflated.length, 18);
  local.writeUInt32LE(xml.length, 22);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(8, 10);
  central.writeUInt16LE(nameBuf.length, 28);
  central.writeUInt32LE(deflated.length, 20);
  central.writeUInt32LE(xml.length, 24);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  const cdStart = 30 + nameBuf.length + deflated.length;
  eocd.writeUInt32LE(46 + nameBuf.length, 12);
  eocd.writeUInt32LE(cdStart, 16);
  const zipped = Buffer.concat([local, nameBuf, deflated, central, nameBuf, eocd]);
  assert.ok(zipEntry(zipped, "word/document.xml"));
  assert.match(docxToText(zipped), /approved the minutes/);
});

test("saved example editions cite only real documents inside each window", () => {
  const documents = collectDocuments(root);
  assert.ok(documents.length > 50);
  const fingerprint = sourceFingerprint(documents);
  assert.equal(fingerprint.length, 64);
  const editions = collectEditions();
  assert.equal(editions.length, 3);
  for (const edition of editions) {
    const { dropped } = validateEdition(edition, documents);
    assert.equal(dropped, 0, edition.date);
    const windows = editionWindows(edition.date);
    edition.sections.forEach((section, index) => {
      assert.equal(section.from, windows[index].from);
      assert.equal(section.to, windows[index].to);
    });
    assert.equal(edition.example, true);
    assert.equal(edition.label, "AI-written summary, check the original");
    assert.equal(edition.sourceFingerprint, fingerprint);
  }
});

test("default model cost stays under a few cents at the text cap", () => {
  const estimate = estimateCost("gpt-4.1-mini", 90000, 2500);
  assert.ok(estimate.usd < 0.02);
  assert.ok(estimate.usd > 0.005);
});

function collectEditions() {
  return ["2026-08-24", "2026-09-28", "2026-10-19"].map((date) =>
    JSON.parse(readFileSync(join(root, "src", "_data", "recaps", `${date}.json`), "utf8"))
  );
}
