const { partitionArchive } = require("./lib/archive-window.cjs");
const { suggestEditUrl, suggestFromData, suggestIssueUrl, contactEmail, suggestMailto } = require("./lib/suggest-source.cjs");
const { archiveFileUrl, prefixAttributeUrls, withPrefix } = require("./lib/urls.cjs");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function isoDate(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value);
  const match = text.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : text.slice(0, 10);
}

function splitRecordNote(html) {
  const provenance = [];
  const visible = String(html || "")
    .replace(/<p>\s*Imported from the public document inventory\.[\s\S]*?<\/p>/gi, (match) => {
      provenance.push(match.trim());
      return "";
    })
    .trim();
  return { visible, provenance: provenance.join("\n") };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function balancedTitle(value) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  const words = text.split(" ").filter(Boolean);
  if (words.length < 3) return escapeHtml(text);
  const head = escapeHtml(words.slice(0, -2).join(" "));
  const tail = escapeHtml(words.slice(-2).join(" "));
  return `${head} <span class="keep-together">${tail}</span>`;
}

function recordHeading(title, committee) {
  let text = String(title || "").trim();
  const name = String(committee || "").trim();
  if (name && text.toLowerCase().startsWith(name.toLowerCase())) {
    text = text.slice(name.length).trim();
  }
  text = text.replace(/^,\s*/, "");
  text = text.replace(/,\s*\d{4}(?:-\d{2}(?:-\d{2})?)?$/, "");
  text = text.replace(/\s*\(undated\)\s*/i, " ");
  text = text.replace(/\s{2,}/g, " ").replace(/\s+:\s*/, ": ").trim();
  return text || String(title || "").trim();
}

function prettyDate(value, precision) {
  const iso = isoDate(value);
  if (!iso || precision === "unknown") return "Date unknown";
  const [year, month, day] = iso.split("-");
  if (!month || precision === "year") return year;
  const monthName = MONTHS[Number(month) - 1] || month;
  if (!day || precision === "month") return `${monthName} ${year}`;
  return `${monthName} ${Number(day)}, ${year}`;
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addShortcode("year", () => new Date().getFullYear());

  eleventyConfig.addFilter("json", (value) => JSON.stringify(value ?? null));
  eleventyConfig.addFilter("archiveFileUrl", (file) => archiveFileUrl(file));
  eleventyConfig.addFilter("prefixHrefs", (html) =>
    String(html || "").replace(/href="(\/[^"]*)"/g, (_match, href) => `href="${withPrefix(href)}"`)
  );
  eleventyConfig.addFilter("prettyDate", prettyDate);
  eleventyConfig.addFilter("recordHeading", recordHeading);
  eleventyConfig.addFilter("balancedTitle", balancedTitle);
  eleventyConfig.addFilter("titleHead", (value) => {
    const text = String(value || "").trim();
    const index = text.lastIndexOf(" ");
    return index === -1 ? "" : text.slice(0, index);
  });
  eleventyConfig.addFilter("titleTail", (value) => {
    const text = String(value || "").trim();
    const index = text.lastIndexOf(" ");
    return index === -1 ? text : text.slice(index + 1);
  });
  eleventyConfig.addFilter("splitRecordNote", splitRecordNote);
  eleventyConfig.addFilter("monthShort", (value) => {
    const iso = isoDate(value);
    return MONTHS[Number(iso.slice(5, 7)) - 1] || "";
  });
  eleventyConfig.addFilter("dayNum", (value) => {
    const iso = isoDate(value);
    return iso.length >= 10 ? String(Number(iso.slice(8, 10))) : "";
  });
  eleventyConfig.addFilter("startsWith", (value, prefix) => String(value || "").startsWith(prefix));
  eleventyConfig.addFilter("findBody", (bodies, slug) => (bodies || []).find((body) => body.slug === slug));

  eleventyConfig.addFilter("whereBody", (docs, slug) =>
    (docs || []).filter((doc) => doc.data && doc.data.body === slug)
  );

  eleventyConfig.addFilter("latestMinutes", (docs, slug) => {
    const rows = (docs || []).filter((doc) => {
      const data = doc.data || {};
      return data.body === slug && data.type === "minutes" && data.doc_date && data.date_precision === "exact";
    });
    rows.sort((a, b) => String(b.data.doc_date).localeCompare(String(a.data.doc_date)));
    return rows[0] || null;
  });

  eleventyConfig.addFilter("archiveWindow", (docs) => partitionArchive(docs));
  eleventyConfig.addFilter("bodyName", (bodies, slug) => {
    const found = (bodies || []).find((body) => body.slug === slug);
    return found ? found.shortName : slug || "";
  });
  eleventyConfig.addFilter("suggestEditUrl", (inputPath, suggestSource, repo) =>
    suggestEditUrl(inputPath, suggestSource, repo)
  );
  eleventyConfig.addFilter("suggestFromData", (inputPath, suggestSource) =>
    suggestFromData(inputPath, suggestSource)
  );
  eleventyConfig.addFilter("suggestIssueUrl", (repo, pageUrl) => suggestIssueUrl(repo, pageUrl));
  eleventyConfig.addFilter("contactEmail", (value) => contactEmail(value));
  eleventyConfig.addFilter("suggestMailto", (options) => suggestMailto(options));

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addWatchTarget("src/assets");

  eleventyConfig.addTransform("prefix-root-urls", function (content, outputPath) {
    if (!outputPath || !outputPath.endsWith(".html")) return content;
    return prefixAttributeUrls(content);
  });

  eleventyConfig.addTransform("proxy-http-images", function (content, outputPath) {
    if (!outputPath || !outputPath.endsWith(".html")) return content;
    return content.replace(
      /(src|srcset)="http:\/\/([^"]+)"/g,
      (_match, attr, url) => `${attr}="https://images.weserv.nl/?url=${encodeURIComponent(url)}"`
    );
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site",
    },
    pathPrefix: process.env.ELEVENTY_PATH_PREFIX || "/",
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
