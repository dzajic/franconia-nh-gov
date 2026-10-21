import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  suggestEditPath,
  suggestFromData,
  suggestEditUrl,
  suggestIssueUrl,
  contactEmail,
} = require("../lib/suggest-source.cjs");

const REPO = "https://github.com/dzajic/franconia-nh-gov";

test("a content page links to its input path without the leading dot-slash", () => {
  assert.equal(suggestEditPath("./src/police/index.md"), "src/police/index.md");
  assert.equal(
    suggestEditUrl("./src/police/index.md"),
    `${REPO}/edit/main/src/police/index.md`
  );
  assert.equal(suggestFromData("./src/police/index.md"), false);
});

test("archive records and the homepage template keep their own files", () => {
  assert.equal(
    suggestEditPath("./src/archive/selectboard/2026/2026-01-01-selectboard-minutes.md"),
    "src/archive/selectboard/2026/2026-01-01-selectboard-minutes.md"
  );
  assert.equal(suggestEditPath("./src/index.njk"), "src/index.njk");
  assert.equal(suggestEditPath("/workspace/src/search/index.njk"), "src/search/index.njk");
  assert.equal(suggestFromData("./src/index.njk"), false);
});

test("pages generated from one data file link to that file", () => {
  assert.equal(suggestEditPath("./src/pages/archive-body.njk"), "src/_data/bodies.json");
  assert.equal(suggestFromData("./src/pages/archive-body.njk"), true);
  assert.equal(suggestEditPath("./src/index.njk", "departments"), "src/_data/departments.json");
  assert.equal(suggestEditPath("./src/forms-applications/index.md", "forms"), "src/_data/forms.json");
  assert.equal(
    suggestEditUrl("./src/pages/archive-body.njk"),
    `${REPO}/edit/main/src/_data/bodies.json`
  );
  assert.equal(suggestFromData("./src/index.njk", "forms"), true);
});

test("an explicit template path and an unsafe override fall back sensibly", () => {
  assert.equal(suggestEditPath("./src/index.njk", "src/index.njk"), "src/index.njk");
  assert.equal(suggestEditPath("./src/police/index.md", "https://evil.example/phish"), "src/police/index.md");
  assert.equal(suggestEditPath("./src/police/index.md", "../secrets.env"), "src/police/index.md");
  assert.equal(suggestEditPath(""), "");
  assert.equal(suggestEditUrl(""), "");
});

test("spaces in a path are encoded and the issue link is the new-issue form", () => {
  assert.equal(
    suggestEditUrl("./src/town notes/index.md"),
    `${REPO}/edit/main/src/town%20notes/index.md`
  );
  assert.equal(suggestIssueUrl(REPO), `${REPO}/issues/new`);
  assert.equal(suggestIssueUrl("not a url"), `${REPO}/issues/new`);
  assert.equal(
    suggestIssueUrl(REPO, "https://dzajic.github.io/franconia-nh-gov/police/"),
    `${REPO}/issues/new?body=${encodeURIComponent("Page: https://dzajic.github.io/franconia-nh-gov/police/")}`
  );
  assert.equal(suggestIssueUrl(REPO, "javascript:alert(1)"), `${REPO}/issues/new`);
  assert.equal(contactEmail("clerk@example.gov"), "clerk@example.gov");
  assert.equal(contactEmail("[email]"), "");
  assert.equal(contactEmail(""), "");
});
