/**
 * The site index lists pages that are not already linked from the homepage
 * sections, the department list, or the forms list.
 */

const COVERED_PATHS = [
  "/",
  "/forms-applications/",
  "/departments/",
  "/events/",
  "/archive/",
  "/site-index/",
];

function indexKey(href) {
  const raw = String(href || "").trim();
  if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return "";
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const host = url.hostname.replace(/^www\./, "").toLowerCase();
      const path = url.pathname.replace(/\/$/, "") || "/";
      return `${host}${path}${url.search}`;
    } catch {
      return raw.toLowerCase();
    }
  }
  const path = raw.split(/[?#]/)[0];
  if (path.startsWith("/")) return path.replace(/\/$/, "") || "/";
  return path;
}

function coveredKeys({ departments, forms, tasks, events } = {}) {
  const keys = new Set(COVERED_PATHS.map(indexKey));
  const lists = [departments, forms, tasks, events];
  for (const list of lists) {
    for (const item of list || []) keys.add(indexKey(item.href));
  }
  keys.delete("");
  return keys;
}

function siteIndexGroups(directory, covered) {
  const seen = new Set(covered || []);
  return (directory || [])
    .map((group) => ({
      heading: group.heading,
      pages: (group.pages || []).filter((page) => {
        const key = indexKey(page.href);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
    }))
    .filter((group) => group.pages.length);
}

module.exports = {
  COVERED_PATHS,
  indexKey,
  coveredKeys,
  siteIndexGroups,
};
