#!/usr/bin/env node
/**
 * Turn data/documents.csv into Markdown document records.
 *
 *   node scripts/import-documents.mjs --sample --clean
 *   node scripts/import-documents.mjs --all --clean
 *   node scripts/import-documents.mjs --bodies selectboard,water-department --years 2024,2025
 *
 * Records land in src/archive/<body>/<year>/*.md and are built by Eleventy.
 * The files themselves are not copied. Each record stores a storage path
 * that is prefixed with ARCHIVE_BASE_URL at build time.
 *
 * --clean deletes records this script previously wrote (generated: true)
 * under src/archive. Hand-written records are left alone.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, unlinkSync, rmdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

function flag(name) {
  return args.includes(name);
}
function option(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : "";
}

const IMAGE_TYPES = new Set(["png", "jpg", "jpeg", "gif", "tif", "tiff", "webp", "svg"]);
const REVIEW_FLAGS = new Set([
  "undated",
  "type-unclear",
  "body-unclear",
  "type-assumed-minutes",
  "future-date?",
  "BROKEN-404",
  "path-collision",
  "date-year-only",
  "date-month-only",
]);

const SAMPLE = {
  selectboard: new Set(["2025", "2026"]),
  "planning-board": null,
  "energy-commission": null,
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const header = rows.shift() || [];
  return rows
    .filter((cells) => cells.some((cell) => cell && cell.trim()))
    .map((cells) => Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""])));
}

function yamlString(value) {
  return JSON.stringify(value ?? "");
}

function splitFlags(value) {
  return String(value || "")
    .split(";")
    .map((flagName) => flagName.trim())
    .filter(Boolean);
}

function needsReview(row, flags) {
  const precision = row.date_precision || "unknown";
  if (!row.inferred_date || precision === "unknown" || precision === "year" || precision === "month") return true;
  return flags.some((flagName) => REVIEW_FLAGS.has(flagName));
}

function selected(row) {
  if (flag("--all")) return true;
  if (flag("--sample") || (!option("--bodies") && !flag("--all"))) {
    if (!(row.inferred_body in SAMPLE)) return false;
    const years = SAMPLE[row.inferred_body];
    return !years || years.has(row.inferred_year);
  }
  const bodies = new Set(option("--bodies").split(",").map((item) => item.trim()).filter(Boolean));
  if (!bodies.has(row.inferred_body)) return false;
  const years = option("--years");
  if (!years) return true;
  return new Set(years.split(",").map((item) => item.trim())).has(row.inferred_year);
}

function walk(dir, found = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const info = statSync(path);
    if (info.isDirectory()) walk(path, found);
    else found.push(path);
  }
  return found;
}

function cleanGenerated(archiveDir) {
  if (!statExists(archiveDir)) return 0;
  let removed = 0;
  for (const path of walk(archiveDir)) {
    if (!path.endsWith(".md")) continue;
    const head = readFileSync(path, "utf8").slice(0, 500);
    if (head.includes("generated: true")) {
      unlinkSync(path);
      removed += 1;
    }
  }
  pruneEmpty(archiveDir);
  return removed;
}

function statExists(path) {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}

function pruneEmpty(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      pruneEmpty(path);
      if (!readdirSync(path).length) rmdirSync(path);
    }
  }
}

function titleFor(row, bodyName) {
  const type = (row.inferred_doc_type || "document").toLowerCase();
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  const precision = row.date_precision || "unknown";
  if (precision === "exact" && row.inferred_date) return `${bodyName} ${label}, ${row.inferred_date}`;
  if (precision === "month" && row.inferred_date) return `${bodyName} ${label}, ${row.inferred_date.slice(0, 7)}`;
  if (precision === "year" && row.inferred_year) return `${bodyName} ${label}, ${row.inferred_year}`;
  const stem = row.original_filename.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ");
  return `${bodyName} ${label} (undated): ${stem}`;
}

function usage() {
  console.log(`Usage:
  node scripts/import-documents.mjs --sample [--clean]
  node scripts/import-documents.mjs --all [--clean]
  node scripts/import-documents.mjs --bodies slug,slug [--years YYYY,YYYY] [--clean]

Reads data/documents.csv (override with --csv). Writes src/archive/<body>/<year>/*.md.`);
}

if (flag("--help") || args.length === 0) {
  usage();
  process.exit(args.length === 0 ? 1 : 0);
}

const csvPath = resolve(root, option("--csv") || "data/documents.csv");
const archiveDir = join(root, "src", "archive");
const bodies = JSON.parse(readFileSync(join(root, "src", "_data", "bodies.json"), "utf8"));
const names = Object.fromEntries(bodies.map((body) => [body.slug, body.name]));

if (flag("--clean")) {
  const removed = cleanGenerated(archiveDir);
  console.log(`Removed ${removed} previously generated records.`);
}

const rows = parseCsv(readFileSync(csvPath, "utf8"));
const used = new Set();
let written = 0;
let skipped = 0;
let review = 0;

for (const row of rows) {
  if (!selected(row)) continue;
  const ext = (row.file_type || "").toLowerCase();
  const proposed = row.proposed_path || "";
  if (IMAGE_TYPES.has(ext) || row.inferred_doc_type === "image" || !proposed.startsWith("archive/")) {
    skipped += 1;
    continue;
  }
  const flags = splitFlags(row.flags);
  const ambiguous = needsReview(row, flags);
  if (ambiguous) review += 1;
  const body = row.inferred_body || "town";
  const bodyName = names[body] || body;
  const year = row.inferred_year || "undated";
  let stem = proposed.replace(/^archive\/[^/]+\/[^/]+\//, "").replace(/\.[^.]+$/, "");
  if (!stem || stem.includes("/")) stem = proposed.split("/").pop().replace(/\.[^.]+$/, "");
  let filename = `${stem}.md`;
  let rel = `archive/${body}/${year}/${filename}`;
  let n = 2;
  while (used.has(rel)) {
    filename = `${stem}-${n}.md`;
    rel = `archive/${body}/${year}/${filename}`;
    n += 1;
  }
  used.add(rel);
  const permalink = `/${rel.replace(/\.md$/, "")}/`;
  const precision = row.date_precision || "unknown";
  const docDate = precision === "unknown" || !row.inferred_date ? "" : row.inferred_date;
  const textLayer = row.pdf_text_layer === "text" ? "true" : row.pdf_text_layer === "scanned-or-image-only" ? "false" : "";
  const lines = [
    "---",
    `title: ${yamlString(titleFor(row, bodyName))}`,
    "layout: document.njk",
    `permalink: ${yamlString(permalink)}`,
    "tags: [document]",
    "generated: true",
    `body: ${yamlString(body)}`,
    `type: ${yamlString((row.inferred_doc_type || "other").toLowerCase())}`,
    `doc_date: ${yamlString(docDate)}`,
    `doc_year: ${yamlString(year)}`,
    `date_precision: ${yamlString(precision === "" ? "unknown" : precision)}`,
    "status: unverified",
    `file: ${yamlString(proposed)}`,
    `format: ${yamlString(ext || "pdf")}`,
    `checksum: ${yamlString(row.md5 ? `md5:${row.md5}` : "")}`,
    `legacy_url: ${yamlString(row.url)}`,
    `legacy_filename: ${yamlString(row.original_filename)}`,
    `link_text: ${yamlString(row.link_text || "")}`,
    `http_status: ${Number(row.http) || 0}`,
    `missing: ${row.http === "404" ? "true" : "false"}`,
    `needs_review: ${ambiguous ? "true" : "false"}`,
    `flags: [${flags.map(yamlString).join(", ")}]`,
    textLayer ? `text_layer: ${textLayer}` : "text_layer:",
    "---",
    "",
    "Imported from the public document inventory. Check `needs_review` and `flags` before treating the date, board, or type as final. Remove `generated: true` if you edit this file by hand and want later imports to leave it alone.",
    "",
  ];
  const dest = join(root, "src", rel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, lines.join("\n"));
  written += 1;
}

console.log(`Wrote ${written} records (${review} flagged needs_review). Skipped ${skipped} images or non-archive paths.`);
