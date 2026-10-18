import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { prefixAttributeUrls, withPrefix } = require("../lib/urls.cjs");

const PREFIX = "/franconia-nh-gov/pr-preview/pr-7";

test("preview prefix is applied once to root-relative links and archive urls", () => {
  const previous = process.env.ELEVENTY_PATH_PREFIX;
  process.env.ELEVENTY_PATH_PREFIX = PREFIX;
  try {
    const html = prefixAttributeUrls(
      [
        '<a href="/archive/">Archive</a>',
        `<a href="${PREFIX}/about/">About</a>`,
        '<a href="https://example.com/archive/">External</a>',
        '<a href="/">Home</a>',
        '<img src="/assets/site.css">',
      ].join("")
    );
    assert.equal(
      html,
      [
        `<a href="${PREFIX}/archive/">Archive</a>`,
        `<a href="${PREFIX}/about/">About</a>`,
        '<a href="https://example.com/archive/">External</a>',
        `<a href="${PREFIX}/">Home</a>`,
        `<img src="${PREFIX}/assets/site.css">`,
      ].join("")
    );
    assert.equal(withPrefix("/archive/selectboard/2026/"), `${PREFIX}/archive/selectboard/2026/`);
    assert.equal(withPrefix(`${PREFIX}/archive/`), `${PREFIX}/archive/`);
  } finally {
    if (previous === undefined) delete process.env.ELEVENTY_PATH_PREFIX;
    else process.env.ELEVENTY_PATH_PREFIX = previous;
  }
});

test("an empty path prefix leaves root-relative links unchanged", () => {
  const previous = process.env.ELEVENTY_PATH_PREFIX;
  delete process.env.ELEVENTY_PATH_PREFIX;
  try {
    assert.equal(prefixAttributeUrls('<a href="/archive/">Archive</a>'), '<a href="/archive/">Archive</a>');
  } finally {
    if (previous === undefined) delete process.env.ELEVENTY_PATH_PREFIX;
    else process.env.ELEVENTY_PATH_PREFIX = previous;
  }
});
