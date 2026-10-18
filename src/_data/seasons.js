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
      spr: "#14304d",
      deep: "#0a1a2e",
      bark: "#1c4260",
      cream: "#f4f7fb",
      paper: "#e4eef6",
      card: "#f4f8fb",
      blaze: "#d5e6f5",
      rust: "#1a4f86",
      ink: "#0e1c2f",
      focus: "#1a4f86",
      muted: "#3a4d63",
      line: "#b7c9d8",
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
      spr: "#1b6a3c",
      deep: "#0e3c24",
      bark: "#3a5834",
      cream: "#f7f2f8",
      paper: "#e7f3df",
      card: "#fbf4fa",
      blaze: "#f6cce4",
      rust: "#7a3568",
      ink: "#17281c",
      focus: "#7a3568",
      muted: "#3c5344",
      line: "#d4c0dc",
    },
    fx: {
      kind: "spring",
      hero: 10000,
      count: 20,
      ambient: 5,
      colors: ["#f6cce4", "#f3d6f0", "#ffffff", "#f8e4a8", "#c7e6b0"],
    },
  },
  summer: {
    months: [6, 7, 8],
    label: "Summer",
    line: "Long light over town",
    colors: {
      spr: "#0f6890",
      deep: "#0a4560",
      bark: "#1c5c32",
      cream: "#fff6e4",
      paper: "#fff1cc",
      card: "#fff9ec",
      blaze: "#f9dc78",
      rust: "#8a4214",
      ink: "#1a2416",
      focus: "#8a4214",
      muted: "#3e4a32",
      line: "#e4cfa0",
    },
    fx: {
      kind: "summer",
      hero: 10000,
      count: 18,
      ambient: 6,
      colors: ["#fff4c2", "#f9dc78", "#fffaf0", "#e7f6c8"],
    },
  },
  fall: {
    months: [9, 10, 11],
    label: "Fall",
    line: "Foliage in the Notch",
    colors: {
      spr: "#6a2c12",
      deep: "#3c180e",
      bark: "#7a3812",
      cream: "#fff1e0",
      paper: "#f6e0c4",
      card: "#fff4e6",
      blaze: "#f6c15c",
      rust: "#8c1e14",
      ink: "#2a140c",
      focus: "#8c1e14",
      muted: "#5c3a28",
      line: "#e0bc96",
    },
    fx: {
      kind: "leaf",
      hero: 10000,
      count: 22,
      ambient: 6,
      colors: ["#c4451a", "#e07a22", "#8e2e14", "#d4a017", "#a33b22", "#f0c36a"],
    },
  },
};

export default seasons;
