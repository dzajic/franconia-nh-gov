/**
 * Seasonal accents for the town site.
 *
 * Edit this file only. Colors are applied as the existing design tokens
 * (--spr, --deep, --bark, --paper, --blaze, --rust, --focus).
 * --cream and --ink stay put so header type and the furnace mark match.
 *
 * Meteorological seasons: Dec–Feb winter, Mar–May spring, Jun–Aug summer,
 * Sep–Nov fall. The visitor's local month picks the theme. ?season=winter
 * (spring, summer, fall) overrides it for preview.
 *
 * Each palette is checked in test/seasons.test.mjs for WCAG AA:
 * cream text on spruce, deep, and bark; ink on blaze; rust links on paper.
 */

const seasons = {
  winter: {
    months: [12, 1, 2],
    label: "Winter",
    line: "Snow on the ridge",
    colors: {
      spr: "#1a4556",
      deep: "#102c38",
      bark: "#4a4034",
      paper: "#f3f6f7",
      blaze: "#d7e6f1",
      rust: "#8e3a36",
      focus: "#8e3a36",
    },
    fx: {
      kind: "snow",
      duration: 5200,
      count: 34,
      colors: ["#ffffff", "#e7f1f8", "#d7e6f1"],
    },
  },
  spring: {
    months: [3, 4, 5],
    label: "Spring",
    line: "The Notch greens up",
    colors: {
      spr: "#1c5c3e",
      deep: "#0f3c28",
      bark: "#5c4a2e",
      paper: "#f6f6ee",
      blaze: "#f3dc96",
      rust: "#8a4030",
      focus: "#8a4030",
    },
    fx: {
      kind: "petal",
      duration: 5200,
      count: 22,
      colors: ["#f6d5e0", "#f3e4ee", "#f3dc96"],
    },
  },
  summer: {
    months: [6, 7, 8],
    label: "Summer",
    line: "Long light over town",
    colors: {
      spr: "#14624a",
      deep: "#0c3d2e",
      bark: "#5a3a24",
      paper: "#faf6e6",
      blaze: "#f4cc62",
      rust: "#9a3b1a",
      focus: "#9a3b1a",
    },
    fx: {
      kind: "firefly",
      duration: 5200,
      count: 18,
      colors: ["#fff4c2", "#f0c14b", "#e7f6c8"],
    },
  },
  fall: {
    months: [9, 10, 11],
    label: "Fall",
    line: "Foliage in the Notch",
    colors: {
      spr: "#3a4328",
      deep: "#1c2616",
      bark: "#6b3d1e",
      paper: "#faf3e8",
      blaze: "#f0b04a",
      rust: "#8e3012",
      focus: "#8e3012",
    },
    fx: {
      kind: "leaf",
      duration: 5200,
      count: 20,
      colors: ["#c4522a", "#e0a526", "#8e3012", "#d4a04a"],
    },
  },
};

export default seasons;
