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
  resolveOwnerEmail,
  suggestMailto,
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

const departments = [
  { name: "Police", href: "/police/", email: "chief@example.gov" },
  { name: "Library", href: "/library/" },
];
const bodies = [
  { slug: "police-department", page: "/police/", kind: "department" },
];

test("owner email prefers the page, then its department, then the site", () => {
  const shared = {
    pageUrl: "/police/",
    departments,
    bodies,
    siteEmail: "clerk@example.gov",
  };
  assert.equal(resolveOwnerEmail({ ...shared, ownerEmail: "editor@example.gov" }), "editor@example.gov");
  assert.equal(resolveOwnerEmail(shared), "chief@example.gov");
  assert.equal(
    resolveOwnerEmail({ ...shared, pageUrl: "/archive/police-department/2026/minutes/", bodySlug: "police-department" }),
    "chief@example.gov"
  );
  assert.equal(resolveOwnerEmail({ ...shared, pageUrl: "/about/", siteEmail: "[email]" }), "");
  assert.equal(resolveOwnerEmail({ ...shared, pageUrl: "/library/" }), "clerk@example.gov");
  const mail = suggestMailto({
    ...shared,
    pageAddress: "https://dzajic.github.io/franconia-nh-gov/police/",
    title: "Police — Town of Franconia",
  });
  assert.equal(
    mail,
    "mailto:chief@example.gov?subject=Suggestion%3A%20Police%20%E2%80%94%20Town%20of%20Franconia&body=https%3A%2F%2Fdzajic.github.io%2Ffranconia-nh-gov%2Fpolice%2F"
  );
});
