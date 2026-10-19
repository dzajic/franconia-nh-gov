import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { coveredKeys, siteIndexGroups } from "../lib/site-index.cjs";

const read = (name) => JSON.parse(readFileSync(new URL(`../src/_data/${name}`, import.meta.url)));

test("the site index omits pages already linked from the homepage lists", () => {
  const directory = read("directory.json");
  const departments = read("departments.json");
  const forms = read("forms.json");
  const tasks = read("tasks.json");
  const events = read("events.json");
  const groups = siteIndexGroups(directory, coveredKeys({ departments, forms, tasks, events }));
  const titles = groups.flatMap((group) => group.pages.map((page) => page.title));
  const headings = groups.map((group) => group.heading);

  assert.deepEqual(headings, [
    "Town Hall & Services",
    "Boards & Committees",
    "Library, Museums & Outdoors",
    "Records & Rules",
  ]);
  for (const gone of [
    "Home",
    "Events",
    "Departments",
    "Town Clerk / Tax",
    "Selectmen",
    "Police",
    "Fire",
    "Highway",
    "Water",
    "Cemetery",
    "Transfer Station",
    "Building Permit",
    "Driveway Permit",
    "Abbie Greenleaf Library",
    "Archives",
  ]) {
    assert.equal(titles.includes(gone), false, gone);
  }
  assert.ok(titles.includes("Town Facts"));
  assert.ok(titles.includes("Planning Board"));
  assert.ok(titles.includes("Heritage Museum"));
  assert.ok(titles.includes("Budgets"));
  assert.equal(new Set(titles).size, titles.length);
});
