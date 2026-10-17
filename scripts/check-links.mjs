#!/usr/bin/env node
/**
 * Check internal links in the built site.
 *   node scripts/check-links.mjs
 * External URLs (including ARCHIVE_BASE_URL) are ignored.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve, extname } from "node:path";

const site = resolve("_site");
const prefix = (process.env.ELEVENTY_PATH_PREFIX || "").trim().replace(/\/$/, "");
const broken = [];

function walk(dir, found = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (path.includes(`${join(site, "pagefind")}`)) continue;
    const info = statSync(path);
    if (info.isDirectory()) walk(path, found);
    else if (name.endsWith(".html")) found.push(path);
  }
  return found;
}

function exists(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  if (!clean || clean.endsWith("/")) {
    const index = join(site, clean, "index.html");
    try {
      return statSync(index).isFile();
    } catch {
      return false;
    }
  }
  const direct = join(site, clean);
  try {
    if (statSync(direct).isFile()) return true;
  } catch {
    /* try alternatives */
  }
  if (!extname(clean)) {
    try {
      return statSync(join(site, clean, "index.html")).isFile() || statSync(`${direct}.html`).isFile();
    } catch {
      return false;
    }
  }
  return false;
}

const attr = /\b(?:href|src)="([^"]+)"/g;
for (const file of walk(site)) {
  const html = readFileSync(file, "utf8");
  for (const match of html.matchAll(attr)) {
    const raw = match[1].trim();
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:") || raw.startsWith("javascript:") || raw.startsWith("data:")) {
      continue;
    }
    if (/^https?:\/\//i.test(raw) || raw.startsWith("//")) continue;
    let path = raw;
    if (prefix && (path === prefix || path.startsWith(`${prefix}/`))) {
      path = path.slice(prefix.length) || "/";
    }
    if (!path.startsWith("/")) {
      const base = dirname(file).slice(site.length).replaceAll("\\", "/");
      path = `${base}/${path}`.replace(/\/+/g, "/");
    }
    if (!exists(path)) broken.push(`${file.slice(site.length)} -> ${raw}`);
  }
}

if (broken.length) {
  console.error(`Broken internal links: ${broken.length}`);
  for (const line of broken.slice(0, 80)) console.error(line);
  process.exit(1);
}
console.log("No broken internal links.");
