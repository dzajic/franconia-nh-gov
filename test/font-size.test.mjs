import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = join(root, "src", "assets");

// 1rem is 16px: the text-size control can set the root to 16px, and nothing
// may paint smaller than that. The default root in CSS is 18px.
const REM_PX = 16;
const FLOOR_PX = 16;
const NARROW_VIEWPORT = 320;

const SIZE_KEYWORDS = {
  "xx-small": 9,
  "x-small": 10,
  small: 13,
  medium: 16,
  large: 18,
  "x-large": 24,
  "xx-large": 32,
  smaller: 13,
  larger: 18,
};

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function splitTopLevel(value, separator) {
  const parts = [];
  let current = "";
  let depth = 0;
  for (const ch of value) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (ch === separator && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function tokens(value) {
  const out = [];
  let current = "";
  let depth = 0;
  for (const ch of value) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (depth === 0 && /\s/.test(ch)) {
      if (current) out.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current) out.push(current);
  return out;
}

function isSizeToken(token) {
  if (/^(?:clamp|min|max|calc)\(/i.test(token)) return true;
  if (/^-?[\d.]+(?:px|rem|em|vw|vh|ch|%)$/i.test(token)) return true;
  return Object.prototype.hasOwnProperty.call(SIZE_KEYWORDS, token.toLowerCase());
}

function sizeFromFontShorthand(value) {
  const cleaned = value.replace(/!important/gi, "").trim();
  if (/^(inherit|initial|unset|revert|revert-layer)$/i.test(cleaned)) return null;
  for (const token of tokens(cleaned)) {
    if (/^(italic|oblique|normal|small-caps|bold|bolder|lighter|ultra-condensed|extra-condensed|condensed|semi-condensed|semi-expanded|expanded|extra-expanded|ultra-expanded)$/i.test(token)) {
      continue;
    }
    if (/^[1-9]00$/.test(token)) continue;
    const sizePart = token.split("/")[0];
    if (isSizeToken(sizePart)) return sizePart;
  }
  return undefined;
}

function minPx(expr) {
  const value = expr.trim();
  const fn = value.match(/^(clamp|min|max)\((.*)\)$/i);
  if (fn) {
    const args = splitTopLevel(fn[2], ",");
    const sizes = args.map(minPx);
    if (fn[1].toLowerCase() === "min") return Math.min(...sizes);
    if (fn[1].toLowerCase() === "max") return Math.max(...sizes);
    // clamp(min, preferred, max): the used value is never below the min argument.
    return sizes[0];
  }
  const calc = value.match(/^calc\((.*)\)$/i);
  if (calc) {
    const simple = calc[1].match(/^\s*(-?[\d.]+)(px|rem|em)\s*$/i);
    if (simple) return minPx(`${simple[1]}${simple[2]}`);
    throw new Error(`Unsupported calc() in font-size: ${value}`);
  }
  const keyword = SIZE_KEYWORDS[value.toLowerCase()];
  if (keyword !== undefined) return keyword;
  const length = value.match(/^(-?[\d.]+)(px|rem|em|vw|vh|ch|%)$/i);
  if (!length) throw new Error(`Unsupported font-size: ${value}`);
  const amount = Number(length[1]);
  const unit = length[2].toLowerCase();
  if (unit === "px") return amount;
  if (unit === "rem" || unit === "em") return amount * REM_PX;
  if (unit === "%") return (amount / 100) * REM_PX;
  if (unit === "vw" || unit === "vh") return (amount / 100) * NARROW_VIEWPORT;
  if (unit === "ch") return amount * (REM_PX * 0.5);
  throw new Error(`Unsupported font-size unit: ${value}`);
}

export function sizesBelowFloor(css) {
  const text = stripComments(css);
  const found = [];
  const decl = /(?:^|[{;])\s*(font-size|font)\s*:\s*([^;}{]+)/gi;
  let match;
  while ((match = decl.exec(text))) {
    const property = match[1].toLowerCase();
    const raw = match[2].trim();
    const line = text.slice(0, match.index).split("\n").length;
    let size = raw.replace(/!important/gi, "").trim();
    if (property === "font") {
      size = sizeFromFontShorthand(raw);
      if (size === null) continue;
      if (size === undefined) {
        found.push({ line, value: raw, px: 0, error: "could not read font-size from font shorthand" });
        continue;
      }
    }
    try {
      const px = minPx(size);
      if (!(px >= FLOOR_PX)) found.push({ line, value: size, px });
    } catch (error) {
      found.push({ line, value: size, px: 0, error: error.message });
    }
  }
  return found;
}

function cssFiles() {
  return readdirSync(assetsDir)
    .filter((name) => name.endsWith(".css"))
    .map((name) => join(assetsDir, name));
}

test("checker flags a font-size that resolves below 16px", () => {
  const small = sizesBelowFloor(".badge { font-size: 0.65rem; } h2 { font: 800 0.9rem/1 var(--sign); }");
  assert.equal(small.length, 2);
  assert.ok(small.every((item) => item.px < 16));
  const ok = sizesBelowFloor("html { font-size: 18px; } p { font: 400 1rem/1.6 var(--body); } h1 { font: 900 clamp(2rem, 7vw, 4rem) / 1.15 var(--sign); }");
  assert.deepEqual(ok, []);
});

test("no font-size in the CSS resolves below 16px", () => {
  const problems = [];
  for (const file of cssFiles()) {
    const css = readFileSync(file, "utf8");
    for (const item of sizesBelowFloor(css)) {
      problems.push(`${file}:${item.line} ${item.value} → ${item.error || `${item.px}px`}`);
    }
  }
  assert.deepEqual(problems, []);
});

test("the default root font size is 18px", () => {
  const css = readFileSync(join(assetsDir, "site.css"), "utf8");
  const htmlRule = stripComments(css).match(/html\s*\{([^}]*)\}/);
  assert.ok(htmlRule, "html rule");
  assert.match(htmlRule[1], /font-size:\s*18px/);
});

test("narrow screens use a 16.5px root and shorter heading steps", () => {
  const css = readFileSync(join(assetsDir, "site.css"), "utf8");
  const narrow = css.match(/@media \(max-width:\s*640px\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(narrow, "narrow media query");
  assert.match(narrow[1], /html\s*\{[^}]*font-size:\s*16\.5px/);
  assert.match(narrow[1], /h1[^}]*font-size:\s*1\.5rem/);
  assert.match(narrow[1], /h2[^}]*font-size:\s*1\.25rem/);
  assert.match(narrow[1], /h3[^}]*font-size:\s*1\.1rem/);
  const script = readFileSync(join(assetsDir, "text-size.js"), "utf8");
  assert.match(script, /small:\s*\[16,\s*16\]/);
  assert.match(script, /medium:\s*\[18,\s*16\.5\]/);
  assert.match(script, /large:\s*\[22,\s*18\]/);
});
