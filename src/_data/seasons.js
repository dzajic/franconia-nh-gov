/**
 * Seasonal themes for the town site. Edit this file to change colors,
 * the header line, and the homepage animation.
 *
 * Meteorological seasons: Dec–Feb winter, Mar–May spring, Jun–Aug summer,
 * Sep–Nov fall. The visitor's local month picks the theme.
 *
 * ?season=winter|spring|summer|fall overrides that for the current page.
 * ?season=default forces the original palette. A footer control remembers
 * "on" or "off" in localStorage under franconia-season. A query string
 * wins over that saved choice so a preview link still shows the requested theme.
 *
 * prefers-reduced-motion: seasonal colors still apply. Motion does not.
 * The footer control turns colors off too, for anyone who wants the
 * original palette. Reduced motion is not the same as "no theme".
 *
 * Colors are the design tokens. They stay in @layer seasonal so an
 * unlayered dark theme can replace them. test/seasons.test.mjs checks
 * WCAG AA for text on these surfaces.
 *
 * fx.hero is the busy first-load moment, in milliseconds (8–12 seconds).
 * After that the homepage eases into a light ambient state. It plays once
 * per browser session (sessionStorage franconia-season-fx). Replay starts it again.
 */

const seasons = {
  winter: {
    months: [12, 1, 2],
    label: "Winter",
    line: "Snow on the ridge",
    colors: {
      spr: "#0b2140",
      deep: "#061428",
      bark: "#16345a",
      cream: "#f5f8fb",
      paper: "#f3f5f7",
      card: "#ffffff",
      blaze: "#d5e2ee",
      rust: "#1a4e86",
      ink: "#0c1826",
      focus: "#1a4e86",
      muted: "#3c4d60",
      line: "#c9d3dc",
    },
    fx: {
      kind: "snow",
      hero: 10000,
      count: 52,
      ambient: 10,
      colors: ["#ffffff", "#e7f2fb", "#d5e6f5", "#f7fbff"],
    },
  },
  spring: {
    months: [3, 4, 5],
    label: "Spring",
    line: "The Notch greens up",
    colors: {
      spr: "#0c6430",
      deep: "#084826",
      bark: "#5c1868",
      cream: "#fff7fb",
      paper: "#d4f2bc",
      card: "#f8e6f6",
      blaze: "#f7d0ea",
      rust: "#922f78",
      ink: "#122414",
      focus: "#922f78",
      muted: "#315640",
      line: "#e6b8ec",
    },
    fx: {
      kind: "spring",
      hero: 10000,
      count: 20,
      ambient: 5,
      colors: ["#f7d0ea", "#e6b8ec", "#ffffff", "#2f9a4e", "#922f78"],
    },
  },
  summer: {
    months: [6, 7, 8],
    label: "Summer",
    line: "Long light over town",
    colors: {
      spr: "#0058c0",
      deep: "#0048a8",
      bark: "#003e8a",
      cream: "#fffdf6",
      paper: "#d6f3ff",
      card: "#fff6c4",
      blaze: "#ffe566",
      rust: "#be3456",
      ink: "#10281c",
      focus: "#be3456",
      muted: "#1a4a58",
      line: "#8acdee",
    },
    fx: {
      kind: "summer",
      hero: 10000,
      count: 18,
      ambient: 6,
      colors: ["#fffdf6", "#ffe566", "#fff6c4", "#ffd0dc"],
    },
  },
  fall: {
    months: [9, 10, 11],
    label: "Fall",
    line: "Foliage in the Notch",
    colors: {
      spr: "#7c2d12",
      deep: "#5c1c0c",
      bark: "#7f1d1d",
      cream: "#fff6ee",
      paper: "#ffd0a4",
      card: "#fff1e4",
      blaze: "#ffb067",
      rust: "#9f1a1a",
      ink: "#2a1208",
      focus: "#9f1a1a",
      muted: "#6a3a22",
      line: "#f0b48a",
    },
    fx: {
      kind: "leaf",
      hero: 10000,
      count: 22,
      ambient: 6,
      colors: ["#e85d04", "#c2410c", "#9a3412", "#9f1a1a", "#7c2d12", "#ffb067"],
    },
  },
};

export default seasons;
