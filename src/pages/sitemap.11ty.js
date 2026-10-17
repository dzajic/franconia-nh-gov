import { absoluteUrl } from "../../lib/urls.cjs";

export const data = {
  permalink: "/sitemap.xml",
  eleventyExcludeFromCollections: true,
};

function escapeXml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function render({ collections }) {
  const urls = [...new Set((collections.all || []).map((item) => item.url).filter((url) => url && (url.endsWith("/") || url.endsWith(".html"))))].sort();
  const body = urls.map((url) => `  <url><loc>${escapeXml(absoluteUrl(url))}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}
