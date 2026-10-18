# Town of Franconia, New Hampshire

A Markdown site for Franconia town services and a large public-document archive. It is an Eleventy 3 project with one hand-written CSS file. The official site is still [franconianh.gov](https://www.franconianh.gov/). `franconianh.org` redirects there.

This repository is a design preview. It is not an official town publication.

## Preview

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open http://localhost:8080.

`npm run dev` rebuilds pages as you edit. The full-page search index is created by `npm run build` (Eleventy, then [Pagefind](https://pagefind.app/)). Until you have run a build in this checkout, the search page still searches document titles from `/archive/index.json`.

```bash
npm run build
npm run check:links
```

`npm run build` writes the site to `_site/`.

## What is real, and what is sample

Real, carried over from the previous public site or from pages already in this repo:

- Existing page copy and URLs (`/board-of-selectmen/`, `/notices/`, `/abbie-greanleaf-library/`, and the rest).
- Town hall phone `603-823-7752` and the address `421 Main Street, PO Box 900, Franconia, NH 03580`, as published on the previous homepage.
- A few schedules and numbers that a specific page already stated (for example Planning Board meeting nights, Water Department hours, the cemetery trustee number). Those show on the matching archive page.
- Document **metadata** for the sample import: original filename, public URL, inferred board, type, and date, plus an MD5 from the inventory. The inventory is `data/documents.csv`.

Sample or still unknown:

- The alert bar and the “Today & this week” events are sample copy from the design prototype, not confirmed town notices. Published notices remain on `/notices/` and `/events/`.
- Anything in square brackets (`[phone]`, `[email]`, `[hours]`, `[schedule]`, `[meeting date]`) is unknown. Do not replace a bracket with a guessed value.
- Friday hours disagree between the old homepage (Selectmen’s office until 1:30) and the Selectmen page (until 1:00), so the homepage does not pick one.
- PDF and Word files are **not** in git. Each record’s View button is `ARCHIVE_BASE_URL` plus a path. The file type sits beside it as a short hint, such as PDF. In archive lists, search, and Latest minutes, the document title opens that same file in a new tab, and a circled info icon beside the title opens the record. If the file is missing or has no path, the title is the only link and it opens the record. Until the town copies files into object storage, a file link is only a placeholder (`https://archive.example.invalid/franconia` unless you set the variable). “Current copy on franconianh.gov” opens the file that was public when the inventory was made.

The header mark (iron furnace in front of a ridge) and the homepage silhouettes are original drawings. They are not traced from photographs, surveys, or landmarks. Source SVGs are in `src/assets/marks/`. Option 2, furnace plus ridge, is the header mark.

## Edit a page on GitHub

You do not need Node, a terminal, or the CSS.

1. On GitHub, open this repository and switch to the branch you were asked to use (or `main` after this design is merged).
2. Go to the page’s file. A normal page is `src/<name>/index.md`. About is `src/about/index.md`. The homepage sections (tasks, events, departments, directory) are the JSON files in `src/_data/`, not a long HTML file.
3. Click the pencil (**Edit this file**). Change the words. Leave the lines between the first pair of `---` alone unless you are changing the title.
4. Use **Preview** if GitHub offers it. Commit with a short note such as “Update transfer station hours”.

The next site build publishes the edit. To see it first, someone with Node can run `npm run dev`.

Bracketed placeholders stay until the town supplies the real value.

## Add one document

Create a new file under `src/archive/<board>/<year>/`. Example: `src/archive/selectboard/2026/2026-10-19-selectboard-minutes.md`.

On GitHub: **Add file → Create new file**, paste the path above into the name box, and paste this template:

```yaml
---
title: "Board of Selectmen Minutes, 2026-10-19"
layout: document.njk
permalink: "/archive/selectboard/2026/2026-10-19-selectboard-minutes/"
tags: [document]
body: "selectboard"
type: "minutes"
doc_date: "2026-10-19"
doc_year: "2026"
date_precision: "exact"
status: unverified
file: "archive/selectboard/2026/2026-10-19-selectboard-minutes.pdf"
format: "pdf"
checksum: ""
legacy_url: ""
legacy_filename: ""
needs_review: false
flags: []
---

Optional note for readers.
```

`body` must match a `slug` in `src/_data/bodies.json`. `type` is one of `agenda`, `minutes`, `notice`, `budget`, `audit`, `ordinance`, `form`, `report`, `other`.

`file` is the path inside object storage, not a file you upload to git. Put the PDF in the bucket that `ARCHIVE_BASE_URL` points at, using that same path.

If the date or the board is a guess, set `needs_review: true`, set `date_precision` to `unknown`, `month`, or `year`, and add a flag such as `undated` or `type-unclear`. Use `doc_year: "undated"` when there is no year. Those records show a **Needs review** label on the archive pages and in `/archive/index.json`.

Leave `generated: true` off of hand-written files. The importer will not delete them.

## Import many documents

`data/documents.csv` is the inventory of files that were public on franconianh.gov (original filename, inferred board, type, date, proposed path, flags, MD5). It does not contain the files.

The sample already in the repo is Selectboard for 2025 and 2026, plus every non-image Planning Board and Energy Commission record (218 records, some flagged for review).

```bash
npm run import:sample   # rewrite that sample
npm run import:all      # every non-image archive row in the CSV
```

Or pick boards and years:

```bash
node scripts/import-documents.mjs --bodies water-department,zoning-board --years 2024,2025 --clean
```

`--clean` removes records the script wrote earlier (`generated: true` in the file) and keeps hand-written ones. Images and other site assets are skipped. After an import, run `npm run build`.

Flags that mark a record **Needs review**: `undated`, `date-year-only`, `date-month-only`, `type-unclear`, `body-unclear`, `type-assumed-minutes`, `future-date?`, `BROKEN-404`, `path-collision`. A missing or inexact date does the same.

## Where the files live

Set `ARCHIVE_BASE_URL` to the object-storage origin, with no trailing slash:

```bash
ARCHIVE_BASE_URL=https://files.example.gov/franconia npm run build
```

A record with `file: archive/selectboard/2026/2026-10-19-selectboard-minutes.pdf` is linked as:

`https://files.example.gov/franconia/archive/selectboard/2026/2026-10-19-selectboard-minutes.pdf`

GitHub Actions reads the repository variable `ARCHIVE_BASE_URL` when it is set. If it is empty, the placeholder base is used.

## Archive window

Board archive pages and the global archive expand every document from the last 12 months, grouped by month, newest first. The cutoff is the build date minus 12 months. Older years are collapsed `<details>` sections, with a document count in each summary. Those records stay in the HTML, so Pagefind can search them, and they stay in `/archive/index.json`.

A month-only date is expanded when that month overlaps the window. Undated, year-only, and future-dated records stay in the collapsed year (or Undated) section. Needs review stays as a short rust note on the row.

Set `RECENT_MONTHS` to use a different length (the default is 12):

```bash
RECENT_MONTHS=18 npm run build
```

The window moves only when the site is rebuilt. The build clock is the UTC date of that run, not a date stored in the records. `.github/workflows/deploy.yml` runs every Monday at 12:00 UTC so a merged site keeps advancing. GitHub runs that schedule from the default branch only, after the workflow file is on `main`.

`npm test` checks the window math. `npm run build` also reads the archive HTML and fails if a page is not newest-first, or if the global archive has records but none fall in the window. A board with only older files prints a warning.

Machine-readable copies of the same records are at `/archive/index.json`. `/town.json` and `/llms.txt` describe the site for people and for software agents. `/sitemap.xml` lists HTML pages. Pages include schema.org `GovernmentOrganization` and `Event` data. Event descriptions say when the event is sample content.

## Deploy

Pushes to `main` run `.github/workflows/deploy.yml`: install, build with the GitHub Pages base path, check internal links, and deploy the `_site` folder. Pull requests build and check links, and do not deploy. The same workflow is scheduled for Monday 12:00 UTC so the archive window stays current; that cron takes effect once this file is on `main`, and a scheduled run deploys.

The Pages base path (for this project, `/franconia-nh-gov`) is taken from `actions/configure-pages` and passed as `ELEVENTY_PATH_PREFIX`. Local preview does not set that variable, so links stay at the server root. `SITE_URL` is the Pages origin (`https://dzajic.github.io`), used for canonical URLs, the sitemap, and the JSON feeds.

In the repository settings, Pages should use **GitHub Actions** as the source (this workflow), not a branch folder.

## Design

The look follows the approved homepage: spruce `#173f33`, bark `#5a3a24`, cream `#f4ead2`, trail-sign section headers, a sticky header, an alerts bar, five tasks, this-week events, latest minutes, forms, departments, a grouped directory, and a ridge footer. About is written for people living here or thinking of moving here. Visitors are pointed to the Franconia Notch Chamber of Commerce at https://www.franconianotch.org/. Interior pages keep their old wording inside that frame.

Editors change Markdown and the JSON/YAML data. They do not edit the layout files for ordinary updates.
