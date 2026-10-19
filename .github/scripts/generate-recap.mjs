#!/usr/bin/env node
/**
 * Write one Franconia town recap edition.
 *
 *   node .github/scripts/generate-recap.mjs
 *   node .github/scripts/generate-recap.mjs --dry-run
 *   node .github/scripts/generate-recap.mjs --check
 *
 * Uses OPENAI_API_KEY. The model is OPENAI_RECAP_MODEL, or gpt-4.1-mini.
 * Exits 0 when the key is missing, when today's edition already exists
 * (America/New_York), or when no document record changed since the last edition.
 *
 * Cost, default model, public rates as of 2025 (dollars per 1M tokens):
 *   gpt-4.1-mini  input $0.40   output $1.60
 *   gpt-4.1-nano  input $0.10   output $0.40
 *   gpt-4o-mini   input $0.15   output $0.60
 * The script caps document text at about 90,000 characters (~23,000 tokens)
 * and asks for at most 2,500 output tokens. At gpt-4.1-mini that ceiling is
 * about $0.013 of input plus $0.004 of output, roughly 1–2 cents. A typical
 * day, with a handful of new minutes, is under 2 cents.
 */

import { appendFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_MODEL,
  LABEL,
  TIMEZONE,
  buildDocumentPacket,
  calendarDate,
  clip,
  collectDocuments,
  displayDate,
  documentsForSection,
  docxToText,
  editionWindows,
  estimateCost,
  groundingInstructions,
  responseSchema,
  shouldGenerate,
  sourceFingerprint,
  validateEdition,
} from "./recap-lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const editionDir = join(root, "src", "_data", "recaps");
const OUTPUT_TOKEN_CAP = 2500;
const FETCH_LIMIT = 8_000_000;

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const force = args.has("--force");
const checkOnly = args.has("--check");

function option(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function setOutput(key, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

function loadEditions() {
  let names = [];
  try {
    names = readdirSync(editionDir).filter((name) => name.endsWith(".json"));
  } catch {
    return [];
  }
  return names
    .map((name) => JSON.parse(readFileSync(join(editionDir, name), "utf8")))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function modelName() {
  return (process.env.OPENAI_RECAP_MODEL || "").trim() || DEFAULT_MODEL;
}

async function pdfToText(bytes) {
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const result = await extractText(pdf, { mergePages: true });
    const text = result && result.text;
    return Array.isArray(text) ? text.join("\n") : String(text || "");
  } catch (error) {
    console.warn(`PDF text was not extracted: ${error.message}`);
    return "";
  }
}

async function fetchBytes(url) {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "FranconiaTownRecap/1.0" },
    });
    if (!response.ok) return null;
    const length = Number(response.headers.get("content-length") || 0);
    if (length > FETCH_LIMIT) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > FETCH_LIMIT) return null;
    return bytes;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function extractDocument(doc) {
  const bytes = await fetchBytes(doc.legacy_url);
  if (!bytes) return "";
  const format = String(doc.format || "").toLowerCase();
  if (format === "docx" || bytes.slice(0, 2).toString() === "PK") return docxToText(bytes);
  if (format === "pdf" || bytes.slice(0, 4).toString() === "%PDF") return pdfToText(bytes);
  return "";
}

async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function packetPlan(documents, windows) {
  const weekDocs = documentsForSection(documents, windows[0]);
  const monthDocs = documentsForSection(documents, windows[1]);
  const yearDocs = documentsForSection(documents, windows[2]);
  const weekIds = new Set(weekDocs.map((doc) => doc.permalink));
  const monthIds = new Set(monthDocs.map((doc) => doc.permalink));
  const yearExtra = yearDocs.filter((doc) => !monthIds.has(doc.permalink));
  const toFetch = [
    ...weekDocs,
    ...monthDocs.filter((doc) => !weekIds.has(doc.permalink)),
    ...yearExtra.filter((doc) => ["minutes", "agenda", "notice"].includes(doc.type)).slice(0, 12),
  ];
  return { weekDocs, monthDocs, yearDocs, toFetch };
}

function userMessage(date, windows, packets) {
  const lines = [
    `Edition date: ${date} (${TIMEZONE}).`,
    "Write three sections. Cite only documents inside each section.",
    "",
  ];
  for (const section of windows) {
    lines.push(`## ${section.id}`);
    lines.push(`Window: ${section.from} through ${section.to}, inclusive.`);
    lines.push(packets[section.id].body || "(no documents)");
    lines.push("");
  }
  return lines.join("\n");
}

async function callModel(model, user) {
  const body = {
    model,
    temperature: 0,
    max_tokens: OUTPUT_TOKEN_CAP,
    messages: [
      { role: "system", content: groundingInstructions() },
      { role: "user", content: user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "town_recap", strict: true, schema: responseSchema() },
    },
  };
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`OpenAI ${response.status}: ${raw.slice(0, 600)}`);
  }
  const payload = JSON.parse(raw);
  const content = payload.choices && payload.choices[0] && payload.choices[0].message
    ? payload.choices[0].message.content
    : "";
  if (!content) throw new Error("OpenAI returned an empty message.");
  return { parsed: JSON.parse(content), usage: payload.usage || {} };
}

function editionFromModel({ date, editionNumber, model, fingerprint, documents, windows, parsed }) {
  const byId = Object.fromEntries(windows.map((section) => [section.id, section]));
  const sections = windows.map((section) => {
    const source = parsed[section.id] || {};
    return {
      ...section,
      lead: String(source.lead || "").replace(/\s+/g, " ").trim(),
      decided: source.decided || [],
      comingUp: source.comingUp || [],
      deadlines: source.deadlines || [],
    };
  });
  const draft = {
    edition: editionNumber,
    date,
    displayDate: displayDate(date),
    generatedAt: new Date().toISOString(),
    generatedDisplay: new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date()),
    timezone: TIMEZONE,
    model,
    example: false,
    label: LABEL,
    sourceFingerprint: fingerprint,
    documentsConsidered: documentsForSection(documents, byId.year).length,
    teaser: "",
    sections,
  };
  const { edition, dropped } = validateEdition(draft, documents);
  edition.teaser = clip(edition.sections[0] && edition.sections[0].lead, 220);
  return { edition, dropped };
}

function checkSeeds(documents) {
  const editions = loadEditions();
  if (!editions.length) {
    console.error("No editions in src/_data/recaps/.");
    process.exit(1);
  }
  let failed = 0;
  for (const edition of editions) {
    const { dropped } = validateEdition(edition, documents);
    const windows = editionWindows(edition.date);
    const windowOk = windows.every((section, index) => {
      const saved = edition.sections[index];
      return saved && saved.id === section.id && saved.from === section.from && saved.to === section.to;
    });
    if (dropped || !windowOk) {
      failed += 1;
      console.error(`${edition.date}: dropped ${dropped}, windows ${windowOk ? "ok" : "mismatch"}`);
    } else {
      console.log(`${edition.date}: every cited source is in that section's window.`);
    }
  }
  if (failed) process.exit(1);
}

async function main() {
  const documents = collectDocuments(root);
  if (checkOnly) {
    checkSeeds(documents);
    return;
  }

  const today = option("--date") || calendarDate();
  const editions = loadEditions();
  const fingerprint = sourceFingerprint(documents);
  const decision = shouldGenerate({ today, editions, fingerprint, force });
  const model = modelName();
  const windows = editionWindows(today);
  const plan = packetPlan(documents, windows);

  console.log(`Edition date ${today} (${TIMEZONE}). ${decision.reason}`);
  console.log(
    `Documents in window: week ${plan.weekDocs.length}, month ${plan.monthDocs.length}, year ${plan.yearDocs.length}.`
  );

  if (!decision.ok) {
    setOutput("created", "false");
    setOutput("date", today);
    return;
  }

  const texts = new Map();
  if (!dryRun && process.env.OPENAI_API_KEY) {
    await mapPool(plan.toFetch, 4, async (doc) => {
      const text = await extractDocument(doc);
      texts.set(doc.permalink, text);
      console.log(`${doc.permalink} ${text ? `${text.length} chars` : "no text"}`);
    });
  }

  const packets = {
    week: buildDocumentPacket(plan.weekDocs, texts, { maxDocs: 8, perDoc: 8000, totalChars: 28000 }),
    month: buildDocumentPacket(plan.monthDocs, texts, { maxDocs: 12, perDoc: 5000, totalChars: 30000 }),
    year: buildDocumentPacket(plan.yearDocs, texts, { maxDocs: 28, perDoc: 1600, totalChars: 32000 }),
  };
  const user = userMessage(today, windows, packets);
  const inputChars = groundingInstructions().length + user.length;
  const estimate = estimateCost(model, inputChars, OUTPUT_TOKEN_CAP);
  const dollars = estimate.usd == null ? "unknown model rate" : `$${estimate.usd.toFixed(4)} ceiling`;
  console.log(
    `Model ${model}. Input ~${estimate.inputTokens} tokens. Output cap ${OUTPUT_TOKEN_CAP}. Estimated cost ${dollars}.`
  );

  if (dryRun) {
    setOutput("created", "false");
    setOutput("date", today);
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    console.log("OPENAI_API_KEY is not set. Skipping recap generation.");
    setOutput("created", "false");
    setOutput("date", today);
    return;
  }

  const { parsed, usage } = await callModel(model, user);
  const editionNumber = editions.reduce((max, edition) => Math.max(max, Number(edition.edition) || 0), 0) + 1;
  const { edition, dropped } = editionFromModel({
    date: today,
    editionNumber,
    model,
    fingerprint,
    documents,
    windows,
    parsed,
  });
  const useful = edition.sections.some(
    (section) => section.decided.length || section.comingUp.length || section.deadlines.length
  );
  console.log(`Dropped ${dropped} item(s) with no valid source.`);
  if (usage.prompt_tokens) {
    const billed = estimateCost(model, (usage.prompt_tokens || 0) * 4, usage.completion_tokens || 0);
    console.log(
      `Usage: input ${usage.prompt_tokens}, output ${usage.completion_tokens}` +
        (billed.usd == null ? "" : `, about $${billed.usd.toFixed(4)}`)
    );
  }
  if (!useful) {
    console.log("No cited items survived validation. No edition written.");
    setOutput("created", "false");
    setOutput("date", today);
    return;
  }

  mkdirSync(editionDir, { recursive: true });
  const file = join(editionDir, `${today}.json`);
  writeFileSync(file, `${JSON.stringify(edition, null, 2)}\n`);
  console.log(`Wrote ${file}`);
  setOutput("created", "true");
  setOutput("date", today);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
