console.log("TESTING");

module.exports = function (eleventyConfig) {
  eleventyConfig.addShortcode("year", () => {
    return new Date().getFullYear();
  });

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site",
    },
  };
};
