import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("header menu falls back to a visible nav without JS", () => {
  const header = readFileSync(join(root, "src/_includes/partials/header.njk"), "utf8");
  const shell = readFileSync(join(root, "src/_includes/shell.njk"), "utf8");
  assert.match(header, /class="menu-toggle"[^>]*hidden/);
  assert.match(header, /aria-expanded="false"/);
  assert.match(header, /aria-controls="primary-nav-list"/);
  assert.match(header, />Menu</);
  assert.match(header, /class="slim-bar"[^>]*hidden/);
  assert.match(header, /id="primary-nav-list"/);
  assert.match(shell, /nav-menu\.js/);
});

test("nav collapse is measured and the full header is not sticky", () => {
  const css = readFileSync(join(root, "src/assets/site.css"), "utf8");
  const js = readFileSync(join(root, "src/assets/nav-menu.js"), "utf8");
  assert.match(js, /ResizeObserver/);
  assert.match(js, /max-width:\s*640px/);
  assert.match(js, /offsetTop/);
  assert.match(css, /prefers-reduced-motion:\s*no-preference/);
  assert.match(css, /\.slim-bar[\s\S]*max-height:\s*56px/);
  assert.doesNotMatch(css, /\.top\s*\{[^}]*position:\s*sticky/);
  assert.match(css, /html\.nav-collapsed:not\(\.nav-open\)/);
});
