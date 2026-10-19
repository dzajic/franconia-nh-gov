/**
 * GitHub "edit this page" targets.
 * A normal page links to its input file. A page generated from one data
 * file links to that file (departments.json, forms.json, bodies.json, …).
 * When several data files feed one template, the template is the fallback.
 */

const DEFAULT_REPO = "https://github.com/dzajic/franconia-nh-gov";

const DATA_FILES = {
  aboutNav: "src/_data/aboutNav.json",
  alerts: "src/_data/alerts.json",
  bodies: "src/_data/bodies.json",
  departments: "src/_data/departments.json",
  directory: "src/_data/directory.json",
  events: "src/_data/events.json",
  forms: "src/_data/forms.json",
  home: "src/_data/home.json",
  primaryNav: "src/_data/primaryNav.json",
  seasons: "src/_data/seasons.js",
  site: "src/_data/site.js",
  tasks: "src/_data/tasks.json",
};

const TEMPLATE_DATA_KEYS = {
  "src/pages/archive-body.njk": "bodies",
};

const SUGGEST_START = "<!-- suggest-change:start -->";
const SUGGEST_END = "<!-- suggest-change:end -->";

function asRepoPath(value) {
  if (value == null) return "";
  const raw = String(value).trim();
  if (!raw || raw === "undefined") return "";
  if (DATA_FILES[raw]) return DATA_FILES[raw];

  let path = raw.replace(/\\/g, "/");
  if (path.includes("://") || path.startsWith("//") || path.split("/").includes("..")) return "";

  if (path.startsWith("./")) path = path.slice(2);
  else if (path.startsWith("/") || /^[A-Za-z]:\//.test(path)) {
    const srcAt = path.lastIndexOf("/src/");
    if (srcAt === -1) return "";
    path = path.slice(srcAt + 1);
  }

  path = path.replace(/^\.\//, "");
  if (DATA_FILES[path]) return DATA_FILES[path];
  if (!path.startsWith("src/") || path.split("/").includes("..")) return "";
  return path;
}

function suggestEditPath(inputPath, suggestSource) {
  const override = asRepoPath(suggestSource);
  if (override) return override;
  const normalized = asRepoPath(inputPath);
  const key = TEMPLATE_DATA_KEYS[normalized];
  if (key && DATA_FILES[key]) return DATA_FILES[key];
  return normalized;
}

function suggestFromData(inputPath, suggestSource) {
  const target = suggestEditPath(inputPath, suggestSource);
  const source = asRepoPath(inputPath);
  return Boolean(target && target.startsWith("src/_data/") && target !== source);
}

function repoBase(repo) {
  const base = String(repo || "").trim().replace(/\/$/, "");
  if (/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(base)) return base;
  return DEFAULT_REPO;
}

function suggestEditUrl(inputPath, suggestSource, repo) {
  const file = suggestEditPath(inputPath, suggestSource);
  if (!file) return "";
  const encoded = file.split("/").map((part) => encodeURIComponent(part)).join("/");
  return `${repoBase(repo)}/edit/main/${encoded}`;
}

function suggestIssueUrl(repo) {
  return `${repoBase(repo)}/issues/new`;
}

function placeSuggestControl(html) {
  const text = String(html || "");
  const start = text.indexOf(SUGGEST_START);
  const end = text.indexOf(SUGGEST_END);
  if (start === -1 || end === -1 || end < start) return text;
  const blockEnd = end + SUGGEST_END.length;
  const block = text.slice(start, blockEnd);
  const without = text.slice(0, start) + text.slice(blockEnd);
  const mainClose = without.lastIndexOf("</main>");
  if (mainClose === -1) return text;
  return without.slice(0, mainClose) + block + without.slice(mainClose);
}

module.exports = {
  DEFAULT_REPO,
  DATA_FILES,
  suggestEditPath,
  suggestFromData,
  suggestEditUrl,
  suggestIssueUrl,
  placeSuggestControl,
};
