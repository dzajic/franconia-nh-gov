module.exports = function (eleventyConfig) {
  eleventyConfig.addShortcode("year", () => {
    return new Date().getFullYear();
  });

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  eleventyConfig.addTransform("proxy-http-images", function (content, outputPath) {
    if (!outputPath || !outputPath.endsWith(".html")) return content;

    return content.replace(
      /(src|srcset)="http:\/\/([^"]+)"/g,
      (_match, attr, url) =>
        `${attr}="https://images.weserv.nl/?url=${encodeURIComponent(url)}"`
    );
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site",
    },
    pathPrefix: process.env.ELEVENTY_PATH_PREFIX || "/",
  };
};
