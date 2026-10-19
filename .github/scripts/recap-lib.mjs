/**
 * Town recap rules shared by the generator and the tests.
 * An edition is a dated snapshot. Week is 7 days, month is 30 days,
 * and year is January 1 through the edition date, all inclusive.
 */

import { createHash } from "node:crypto";
import { inflateRawSync } from "node:zlib";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const DEFAULT_MODEL = "gpt-4.1-mini";
export const TIMEZONE = "America/New_York";
export const LABEL = "AI-written summary, check the original";

const RATES_PER_MILLION = {
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4.1-nano": { input: 0.1, output: 0.4 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
};

const BOARD_NAMES = {
  selectboard: "Selectmen",
  "planning-board": "Planning Board",
  "energy-commission": "Energy Commission",
  "zoning-board": "Zoning Board",
  "conservation-commission": "Conservation Commission",
};

export function calendarDate(date = new Date(), timeZone = TIMEZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addDays(iso, days) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new Error(`Bad date: ${iso}`);
  const dt = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function displayDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const dt = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(dt);
}

export function editionWindows(date) {
  const year = date.slice(0, 4);
  return [
    { id: "week", nav: "Week", title: "The last week", from: addDays(date, -6), to: date },
    { id: "month", nav: "Month", title: "The last month", from: addDays(date, -29), to: date },
    { id: "year", nav: "Year to date", title: "Year to date", from: `${year}-01-01`, to: date },
  ];
}

export function parseFrontMatter(markdown) {
  const match = String(markdown || "").match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!field) continue;
    let value = field[2].trim();
    if (value === "[]") {
      data[field[1]] = [];
      continue;
    }
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value === "true") data[field[1]] = true;
    else if (value === "false") data[field[1]] = false;
    else data[field[1]] = value;
  }
  return data;
}

export function collectDocuments(root) {
  const archive = join(root, "src", "archive");
  const found = [];
  function walk(dir) {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name.endsWith(".md")) found.push(path);
    }
  }
  walk(archive);
  return found
    .map((path) => {
      const data = parseFrontMatter(readFileSync(path, "utf8"));
      if (!data.permalink) return null;
      return {
        path,
        title: data.title || "",
        permalink: normalizePermalink(data.permalink),
        body: data.body || "",
        type: data.type || "",
        doc_date: data.doc_date || "",
        doc_year: data.doc_year || "",
        date_precision: data.date_precision || "",
        format: data.format || "",
        file: data.file || "",
        legacy_url: data.legacy_url || "",
        checksum: data.checksum || "",
        missing: data.missing === true,
        needs_review: data.needs_review === true,
        text_layer: data.text_layer === true ? true : data.text_layer === false ? false : null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => String(a.permalink).localeCompare(String(b.permalink)));
}

export function sourceFingerprint(documents) {
  const lines = documents
    .map((doc) =>
      [doc.permalink, doc.doc_date, doc.checksum, doc.type, doc.body, doc.file, doc.needs_review ? "review" : ""].join(
        "\t"
      )
    )
    .sort();
  return createHash("sha256").update(lines.join("\n")).digest("hex");
}

export function normalizePermalink(value) {
  if (!value) return "";
  let path = String(value).trim();
  path = path.replace(/^https?:\/\/[^/]+/i, "");
  const hash = path.indexOf("#");
  if (hash !== -1) path = path.slice(0, hash);
  const query = path.indexOf("?");
  if (query !== -1) path = path.slice(0, query);
  if (!path.startsWith("/")) path = `/${path}`;
  if (!path.endsWith("/")) path += "/";
  return path;
}

function isIso(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "");
}

function monthBounds(value) {
  const match = /^(\d{4})-(\d{2})/.exec(value || "");
  if (!match) return null;
  const start = `${match[1]}-${match[2]}-01`;
  const end = addDays(addDays(start, 32).slice(0, 7) + "-01", -1);
  return { start, end };
}

export function sourceInSection(doc, section) {
  if (!doc || !section) return false;
  const precision = doc.date_precision || (isIso(doc.doc_date) ? "exact" : "");
  if (precision === "exact" && isIso(doc.doc_date)) {
    return doc.doc_date >= section.from && doc.doc_date <= section.to;
  }
  if (precision === "month") {
    if (section.id === "week") return false;
    const bounds = monthBounds(doc.doc_date);
    if (!bounds) return false;
    return bounds.end >= section.from && bounds.start <= section.to;
  }
  if (precision === "year" && section.id === "year") {
    const year = String(doc.doc_year || doc.doc_date || "").slice(0, 4);
    return year === section.from.slice(0, 4);
  }
  return false;
}

export function sourceLabel(doc) {
  const board = BOARD_NAMES[doc.body] || String(doc.body || "Town").replace(/-/g, " ");
  const kind = doc.type || "document";
  if (isIso(doc.doc_date)) {
    const when = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(`${doc.doc_date}T12:00:00Z`));
    return `${board} ${kind}, ${when}`;
  }
  if (doc.doc_year) return `${board} ${kind}, ${doc.doc_year}`;
  return `${board} ${kind}`;
}

function dedupeSources(sources) {
  const seen = new Set();
  const out = [];
  for (const source of sources) {
    if (seen.has(source.href)) continue;
    seen.add(source.href);
    out.push(source);
  }
  return out;
}

export function validateEdition(edition, documents) {
  const known = new Map(documents.filter((doc) => doc.permalink).map((doc) => [doc.permalink, doc]));
  let dropped = 0;
  const sections = (edition.sections || []).map((section) => {
    const allowed = new Set(
      documents.filter((doc) => sourceInSection(doc, section)).map((doc) => doc.permalink)
    );
    const next = { ...section };
    const before =
      (section.decided || []).length + (section.comingUp || []).length + (section.deadlines || []).length;
    for (const key of ["decided", "comingUp", "deadlines"]) {
      const items = [];
      for (const item of section[key] || []) {
        const sources = [];
        for (const source of item.sources || []) {
          const href = normalizePermalink(typeof source === "string" ? source : source && source.href);
          if (!href || !allowed.has(href) || !known.has(href)) continue;
          const doc = known.get(href);
          const label = typeof source === "object" && source.label ? String(source.label) : sourceLabel(doc);
          sources.push({ href, label });
        }
        const text = String(item.text || "").replace(/\s+/g, " ").trim();
        if (!text || sources.length === 0) {
          dropped += 1;
          continue;
        }
        items.push({ text, sources: dedupeSources(sources) });
      }
      next[key] = items;
    }
    const after = next.decided.length + next.comingUp.length + next.deadlines.length;
    if (before > 0 && after === 0) {
      next.lead = "No summary in this section could be tied to a posted document.";
    }
    return next;
  });
  return { edition: { ...edition, sections }, dropped };
}

export function shouldGenerate({ today, editions, fingerprint, force = false }) {
  const list = [...(editions || [])].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  if (force) return { ok: true, reason: "Forced." };
  if (list.some((edition) => edition.date === today)) {
    return { ok: false, reason: `An edition already exists for ${today} (${TIMEZONE}).` };
  }
  const latest = list[0];
  if (latest && latest.sourceFingerprint && latest.sourceFingerprint === fingerprint) {
    return { ok: false, reason: "No document records have changed since the last edition." };
  }
  if (!latest) return { ok: true, reason: "No edition has been saved yet." };
  return { ok: true, reason: "Document records changed since the last edition." };
}

export function estimateCost(model, inputChars, outputTokens = 2000) {
  const inputTokens = Math.ceil(Number(inputChars || 0) / 4);
  const rates = RATES_PER_MILLION[model];
  if (!rates) {
    return { model, inputTokens, outputTokens, usd: null };
  }
  const usd = (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000;
  return { model, inputTokens, outputTokens, usd, rates };
}

const TYPE_RANK = { minutes: 0, agenda: 1, notice: 2, report: 3 };

function rank(doc) {
  return TYPE_RANK[doc.type] ?? 9;
}

export function documentsForSection(documents, section) {
  return documents
    .filter((doc) => sourceInSection(doc, section))
    .sort((a, b) => String(b.doc_date).localeCompare(String(a.doc_date)) || rank(a) - rank(b));
}

/**
 * Read one ZIP entry. DOCX files are ZIP archives of XML.
 * Returns the entry bytes, or null when the name is absent.
 */
export function zipEntry(buffer, wanted) {
  const view = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  let eocd = -1;
  const scan = Math.max(0, view.length - 22 - 65536);
  for (let i = view.length - 22; i >= scan; i -= 1) {
    if (view.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;
  const count = view.readUInt16LE(eocd + 10);
  let p = view.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n += 1) {
    if (p + 46 > view.length || view.readUInt32LE(p) !== 0x02014b50) return null;
    const method = view.readUInt16LE(p + 10);
    const compSize = view.readUInt32LE(p + 20);
    const nameLen = view.readUInt16LE(p + 28);
    const extraLen = view.readUInt16LE(p + 30);
    const commentLen = view.readUInt16LE(p + 32);
    const localOffset = view.readUInt32LE(p + 42);
    const name = view.slice(p + 46, p + 46 + nameLen).toString("utf8");
    if (name === wanted) {
      if (localOffset + 30 > view.length) return null;
      const localName = view.readUInt16LE(localOffset + 26);
      const localExtra = view.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localName + localExtra;
      const data = view.slice(dataStart, dataStart + compSize);
      if (method === 0) return data;
      if (method === 8) return inflateRawSync(data);
      return null;
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

export function docxToText(buffer) {
  const xml = zipEntry(buffer, "word/document.xml");
  if (!xml) return "";
  return Buffer.from(xml)
    .toString("utf8")
    .replace(/<w:p[ >]/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function clip(text, max) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}…`;
}

export function buildDocumentPacket(documents, texts, limits) {
  const lines = [];
  let chars = 0;
  const cap = limits.totalChars;
  const chosen = documents.slice(0, limits.maxDocs);
  for (const doc of chosen) {
    const text = clip(texts.get(doc.permalink) || "", limits.perDoc);
    const header = [
      `permalink: ${doc.permalink}`,
      `title: ${doc.title}`,
      `board: ${doc.body}`,
      `type: ${doc.type}`,
      `date: ${doc.doc_date || doc.doc_year || "unknown"}`,
      `date_precision: ${doc.date_precision || "exact"}`,
      `needs_review: ${doc.needs_review ? "yes" : "no"}`,
      `text: ${text || "(no text extracted; you may only say that this document was posted, using the title, board, type, and date above)"}`,
    ].join("\n");
    if (chars + header.length > cap) break;
    lines.push(header);
    chars += header.length;
  }
  return { body: lines.join("\n\n"), count: lines.length, chars };
}

export function groundingInstructions() {
  return [
    "You write the Franconia, New Hampshire town recap, one shared edition for the whole town.",
    "Use only the documents in the user message. Do not use outside knowledge.",
    "Do not invent votes, amounts, names, dates, places, or decisions.",
    "If a document has no extracted text, you may only say that it was posted, using its title, board, type, and date.",
    "Every item must cite one or more permalink values copied exactly from the documents.",
    "Cite a document only in a section whose date window contains that document.",
    "A year-only date is imprecise. State a month or day for it only when the extracted text states that month or day, and say the record is marked for review when needs_review is yes.",
    "If the text says DRAFT, call the minutes a draft.",
    "Do not describe a non-public session beyond the reason printed in the document.",
    "Plain language. Short sentences. What was decided, what is coming up, and deadlines.",
    "Coming up means a meeting, hearing, or agenda item that is still ahead of the edition date, or that the documents schedule.",
    "Deadlines means a date or cutoff the documents state. If there is no deadline, leave the list empty.",
    "If a window has nothing to report, use an empty list and a lead that says no documents were posted, or that the posting has no extractable text.",
    "The lead is one or two sentences. Every claim in the lead must also be supported by the documents in that section.",
    "Do not mention that you are a chatbot, and do not invite questions.",
  ].join(" ");
}

export function responseSchema() {
  const item = {
    type: "object",
    additionalProperties: false,
    required: ["text", "sources"],
    properties: {
      text: { type: "string" },
      sources: { type: "array", items: { type: "string" } },
    },
  };
  const section = {
    type: "object",
    additionalProperties: false,
    required: ["lead", "decided", "comingUp", "deadlines"],
    properties: {
      lead: { type: "string" },
      decided: { type: "array", items: item },
      comingUp: { type: "array", items: item },
      deadlines: { type: "array", items: item },
    },
  };
  return {
    type: "object",
    additionalProperties: false,
    required: ["week", "month", "year"],
    properties: { week: section, month: section, year: section },
  };
}
