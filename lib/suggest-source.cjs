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

function suggestIssueUrl(repo, pageUrl) {
  const base = `${repoBase(repo)}/issues/new`;
  const page = String(pageUrl || "").trim();
  if (!/^https?:\/\//i.test(page)) return base;
  return `${base}?body=${encodeURIComponent(`Page: ${page}`)}`;
}

function contactEmail(value) {
  const text = String(value || "").trim();
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(text)) return "";
  return text;
}

function pagePath(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  let path = text;
  if (/^https?:/i.test(text)) {
    try {
      path = new URL(text).pathname;
    } catch {
      return "";
    }
  }
  path = path.split("?")[0].split("#")[0];
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1) path = path.replace(/\/+$/, "");
  return path.toLowerCase();
}

function departmentForPage(departments, pageUrl, bodySlug, bodies) {
  const list = Array.isArray(departments) ? departments : [];
  const wanted = new Set();
  const own = pagePath(pageUrl);
  if (own) wanted.add(own);
  const slug = typeof bodySlug === "string" ? bodySlug.trim() : "";
  if (slug && Array.isArray(bodies)) {
    const body = bodies.find((item) => item && item.slug === slug);
    const via = pagePath(body && body.page);
    if (via) wanted.add(via);
  }
  if (!wanted.size) return null;
  return list.find((dept) => wanted.has(pagePath(dept && (dept.href || dept.page)))) || null;
}

function resolveOwnerEmail(options) {
  const opts = options || {};
  const explicit = contactEmail(opts.ownerEmail);
  if (explicit) return explicit;
  const dept = departmentForPage(opts.departments, opts.pageUrl, opts.bodySlug, opts.bodies);
  const fromDept = contactEmail(dept && dept.email);
  if (fromDept) return fromDept;
  return contactEmail(opts.siteEmail);
}

function suggestMailto(options) {
  const opts = options || {};
  const email = resolveOwnerEmail(opts);
  if (!email) return "";
  const title = String(opts.title || "").trim() || "this page";
  const page = String(opts.pageAddress || "").trim();
  const query = [`subject=${encodeURIComponent(`Suggestion: ${title}`)}`];
  if (/^https?:\/\//i.test(page)) query.push(`body=${encodeURIComponent(page)}`);
  return `mailto:${email}?${query.join("&")}`;
}

module.exports = {
  DEFAULT_REPO,
  DATA_FILES,
  suggestEditPath,
  suggestFromData,
  suggestEditUrl,
  suggestIssueUrl,
  contactEmail,
  resolveOwnerEmail,
  suggestMailto,
};
