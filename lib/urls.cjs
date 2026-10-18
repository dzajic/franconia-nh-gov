/**
 * Shared URL helpers for the Eleventy config and JS templates.
 * ARCHIVE_BASE_URL is where PDF/DOCX bytes live (object storage).
 * This repository never stores those files.
 */

const DEFAULT_ARCHIVE_BASE = "https://archive.example.invalid/franconia";

function origin() {
  return (process.env.SITE_URL || "http://localhost:8080").replace(/\/$/, "");
}

function pathPrefix() {
  const raw = (process.env.ELEVENTY_PATH_PREFIX || "").trim();
  if (!raw || raw === "/") return "";
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withSlash.replace(/\/$/, "");
}

function sitePath(path) {
  const prefix = pathPrefix();
  if (!path || path === "/") return prefix ? `${prefix}/` : "/";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${prefix}${normalized}`;
}

function archiveBase() {
  const raw = (process.env.ARCHIVE_BASE_URL || "").trim();
  return (raw || DEFAULT_ARCHIVE_BASE).replace(/\/$/, "");
}

function archiveFileUrl(file) {
  const path = String(file || "").replace(/^\//, "");
  return path ? `${archiveBase()}/${path}` : archiveBase();
}

function withPrefix(pageUrl) {
  if (!pageUrl) return sitePath("/");
  if (/^https?:\/\//i.test(pageUrl)) return pageUrl;
  const prefix = pathPrefix();
  if (prefix && (pageUrl === prefix || pageUrl.startsWith(`${prefix}/`))) return pageUrl;
  return sitePath(pageUrl.startsWith("/") ? pageUrl : `/${pageUrl}`);
}

function absoluteUrl(pageUrl) {
  const prefixed = withPrefix(pageUrl);
  if (/^https?:\/\//i.test(prefixed)) return prefixed;
  return origin() + prefixed;
}

/**
 * Prefix root-relative href/src/action values in built HTML.
 * Templated links already include the prefix; this catches Markdown
 * links such as /archive/ so they resolve under a preview subfolder.
 * Values that already start with the prefix are left as they are.
 */
function prefixAttributeUrls(html) {
  if (!pathPrefix()) return String(html || "");
  return String(html || "").replace(
    /\b(href|src|action)="(\/[^"]*)"/g,
    (_match, attr, value) => `${attr}="${withPrefix(value)}"`
  );
}

module.exports = {
  DEFAULT_ARCHIVE_BASE,
  origin,
  pathPrefix,
  sitePath,
  withPrefix,
  archiveBase,
  archiveFileUrl,
  absoluteUrl,
  prefixAttributeUrls,
};
