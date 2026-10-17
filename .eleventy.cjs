const { archiveFileUrl } = require("./lib/urls.cjs");

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
  eleventyConfig.addFilter("prettyDate", prettyDate);
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

  eleventyConfig.addFilter("docsByYear", (docs) => {
    const groups = new Map();
    for (const doc of docs || []) {
      const year = String((doc.data && doc.data.doc_year) || "undated");
      if (!groups.has(year)) groups.set(year, []);
      groups.get(year).push(doc);
    }
    return [...groups.keys()]
      .sort((a, b) => {
        if (a === "undated") return 1;
        if (b === "undated") return -1;
        return Number(b) - Number(a);
      })
      .map((year) => ({
        year,
        items: groups.get(year).sort((a, b) => {
          const date = String(b.data.doc_date || "").localeCompare(String(a.data.doc_date || ""));
          return date || String(a.data.title || "").localeCompare(String(b.data.title || ""));
        }),
      }));
  });

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addWatchTarget("src/assets");

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
