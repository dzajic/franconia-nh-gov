#!/usr/bin/env node
/**
 * Assert archive HTML is newest-first.
 * Warn when a page has records but none fall in the open window.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const site = resolve("_site");
const MONTH = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

function walk(dir, found = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, found);
    else if (name === "index.html" && path.includes(`${join("archive")}`)) found.push(path);
  }
  return found;
}

function parsePretty(text) {
  const raw = text.replace(/\s+/g, " ").trim();
  if (!raw || /date unknown/i.test(raw)) return null;
  let match = raw.match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/);
  if (match) {
    const month = MONTH[match[1].toLowerCase()];
    if (!month) return null;
    return Date.UTC(Number(match[3]), month - 1, Number(match[2]));
  }
  match = raw.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (match) {
    const month = MONTH[match[1].toLowerCase()];
    if (!month) return null;
    return Date.UTC(Number(match[2]), month - 1, 1);
  }
  match = raw.match(/^(\d{4})$/);
  if (match) return Date.UTC(Number(match[1]), 0, 1);
  return null;
}

function monthStamp(label) {
  const match = label.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (!match) return null;
  const month = MONTH[match[1].toLowerCase()];
  if (!month) return null;
  return Date.UTC(Number(match[2]), month - 1, 1);
}

function assertDescending(values, where, errors) {
  let previous = null;
  let seenNull = false;
  for (const value of values) {
    if (value === null) {
      seenNull = true;
      continue;
    }
    if (seenNull) errors.push(`${where}: a dated record follows an undated one`);
    if (previous !== null && value > previous) errors.push(`${where}: ${new Date(value).toISOString().slice(0, 10)} is newer than the record before it`);
    previous = value;
  }
}

const errors = [];
const warnings = [];
let globalNewest = "";

for (const file of walk(site)) {
  const html = readFileSync(file, "utf8");
  if (!html.includes("month-group") && !html.includes("year-fold")) continue;
  const rel = `/${relative(site, file).replaceAll("\\", "/")}`;
  const months = [...html.matchAll(/<h2 class="sign">(?:(?!<\/h2>).)*<\/span>([^<]+)<\/h2>([\s\S]*?)(?=<section class="month-group|<h2 class="older-label"|<p class="more"|$)/g)];
  const monthStamps = months.map((match) => monthStamp(match[1].trim()));
  assertDescending(monthStamps, `${rel} months`, errors);
  months.forEach((match, index) => {
    const dates = [...match[2].matchAll(/<span class="doc-meta">([^·<]+)/g)].map((item) => parsePretty(item[1]));
    assertDescending(dates, `${rel} ${match[1].trim()}`, errors);
    if (index === 0) {
      /* first open month is the newest */
    }
  });
  if (rel === "/archive/index.html" && months[0]) globalNewest = months[0][1].trim();

  const years = [...html.matchAll(/<details class="year-fold[\s\S]*?<\/details>/g)];
  const yearNumbers = years.map((match) => {
    const name = (match[0].match(/<span class="year-name">([^<]+)/) || [])[1] || "";
    return name === "Undated" ? null : Number(name);
  });
  let previousYear = Infinity;
  let seenUndated = false;
  yearNumbers.forEach((year, index) => {
    if (year === null) {
      seenUndated = true;
      return;
    }
    if (seenUndated || year > previousYear) errors.push(`${rel} years: ${years[index]} is out of descending order`);
    previousYear = year;
  });
  years.forEach((match) => {
    const name = (match[0].match(/<span class="year-name">([^<]+)/) || [])[1] || "year";
    const dates = [...match[0].matchAll(/<span class="doc-meta">([^·<]+)/g)].map((item) => parsePretty(item[1]));
    assertDescending(dates, `${rel} ${name}`, errors);
  });

  const documents = (html.match(/<li class="/g) || []).length;
  const openMonths = (html.match(/class="month-group/g) || []).length;
  if (documents > 0 && openMonths === 0) {
    const message = `${rel} has ${documents} documents and none inside the open window`;
    if (rel === "/archive/index.html") errors.push(message);
    else warnings.push(message);
  }
}

for (const warning of warnings) console.warn(`warning: ${warning}`);
if (errors.length) {
  console.error(`Archive order check failed (${errors.length})`);
  for (const error of errors.slice(0, 40)) console.error(error);
  process.exit(1);
}
console.log(
  globalNewest
    ? `Archive order is newest-first. Global archive opens on ${globalNewest}.`
    : "Archive order is newest-first."
);
