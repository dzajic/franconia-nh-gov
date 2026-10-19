import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("text size lives in the page controls bar, not the header", () => {
  const header = readFileSync(join(root, "src/_includes/partials/header.njk"), "utf8");
  const bar = readFileSync(join(root, "src/_includes/partials/suggest-change.njk"), "utf8");
  const shell = readFileSync(join(root, "src/_includes/shell.njk"), "utf8");
  assert.doesNotMatch(header, /data-text-size-control/);
  assert.match(bar, /data-text-size-control/);
  assert.match(bar, /aria-pressed="true"/);
  assert.match(bar, /aria-label="Smaller text"/);
  assert.match(bar, /aria-expanded="true"/);
  assert.match(bar, /aria-controls="page-controls-panel"/);
  assert.match(bar, /Hide page controls/);
  assert.match(bar, /Show page controls/);
  assert.match(bar, /franconia-page-controls/);
  assert.match(shell, /franconia-page-controls/);
});

test("a collapsed page-controls bar does not keep the full bottom padding", () => {
  const css = readFileSync(join(root, "src/assets/site.css"), "utf8");
  assert.match(css, /padding-bottom:\s*calc\(44px \+ env\(safe-area-inset-bottom, 0px\)\)/);
  assert.match(css, /html\.page-controls-collapsed body\s*\{[^}]*padding-bottom:\s*0/);
  assert.match(css, /\.suggest-info \.info-icon\s*\{[^}]*width:\s*20px/);
  assert.match(css, /\.suggest-edit\s*\{[^}]*font-size:\s*15px/);
});
