/**
 * Stand-in photographs for the unlisted /mockups/photos/ pages.
 * Each file is a cropped, resized derivative of a Wikimedia Commons
 * photograph of Franconia, New Hampshire. The HTML credits name the
 * photographer, link the license, and say that the file was changed.
 */
const BY = "https://creativecommons.org/licenses/by/4.0/";
const BY2 = "https://creativecommons.org/licenses/by/2.0/";
const BY_SA = "https://creativecommons.org/licenses/by-sa/4.0/";
const file = (name) => `https://commons.wikimedia.org/wiki/File:${name}`;

const photos = {
  town: {
    id: "town",
    alt: "Houses and roads of Franconia in a green valley, seen from the northeast, with forested hills behind the town.",
    src: "/assets/mockups/photos/town-1280.webp",
    w: 1280,
    h: 720,
    small: "/assets/mockups/photos/town-800.webp",
    smallW: 800,
    place: "Franconia from the northeast",
    taken: "2 August 2025",
    photographer: "Ascended Dreamer",
    license: "CC BY 4.0",
    licenseUrl: BY,
    sourceUrl: file("Franconia_NH_8-2-2025.jpg"),
    changes: "Cropped and resized",
  },
  bald: {
    id: "bald",
    alt: "Fall-colored trees and a lake seen from Bald Mountain in Franconia, with a higher ridge beyond.",
    src: "/assets/mockups/photos/bald-1280.webp",
    w: 1280,
    h: 720,
    small: "/assets/mockups/photos/bald-800.webp",
    smallW: 800,
    place: "View from Bald Mountain, Franconia",
    taken: "8 October 2013",
    photographer: "Robert Linsdell",
    license: "CC BY 2.0",
    licenseUrl: BY2,
    sourceUrl: file("View_from_Bald_Mountain,_Franconia_(494073)_(11893722896).jpg"),
    changes: "Cropped and resized",
  },
  river: {
    id: "river",
    alt: "The Gale River flowing through woods along the River Walk in Franconia.",
    src: "/assets/mockups/photos/river-1000.webp",
    w: 1000,
    h: 666,
    small: "/assets/mockups/photos/river-640.webp",
    smallW: 640,
    place: "Gale River from the River Walk, Franconia",
    taken: "13 July 2022",
    photographer: "Artaxerxes",
    license: "CC BY-SA 4.0",
    licenseUrl: BY_SA,
    sourceUrl: file("Franconia_River_Walk_Franconia_NH_July_2022.jpg"),
    changes: "Cropped and resized",
  },
  winter: {
    id: "winter",
    alt: "Cannon Mountain and Echo Lake under snow, seen from Artist's Bluff.",
    src: "/assets/mockups/photos/winter-1280.webp",
    w: 1280,
    h: 720,
    small: "/assets/mockups/photos/winter-800.webp",
    smallW: 800,
    place: "Cannon Mountain and Echo Lake from Artist's Bluff",
    taken: "28 December 2018",
    photographer: "DavidWBrooks",
    license: "CC BY-SA 4.0",
    licenseUrl: BY_SA,
    sourceUrl: file("Cannon_Mountain,_Echo_Lake.jpg"),
    changes: "Cropped and resized",
  },
  trail: {
    id: "trail",
    alt: "A leaf-covered trail through woods in Franconia, with one person walking away along the path.",
    src: "/assets/mockups/photos/trail-1000.webp",
    w: 1000,
    h: 400,
    small: "/assets/mockups/photos/trail-640.webp",
    smallW: 640,
    place: "A recreational trail in Franconia",
    taken: "8 October 2013",
    photographer: "Robert Linsdell",
    license: "CC BY 2.0",
    licenseUrl: BY2,
    sourceUrl: file("Recreational_Trail,_Franconia_(494038)_(11866498326).jpg"),
    changes: "Cropped and resized",
  },
};

export default {
  conceptOrder: ["hero", "band", "card", "department", "contest", "masthead"],
  concepts: {
    hero: {
      id: "A",
      slug: "hero",
      href: "/mockups/photos/hero/",
      label: "Name on the photograph",
      why: "The town name sits on a solid plate over the picture, which adds a second headline and pushes the task list down.",
    },
    band: {
      id: "B",
      slug: "band",
      href: "/mockups/photos/band/",
      label: "Slim band",
      why: "A short photograph sits between the task list and the news columns, with the credit under it.",
    },
    card: {
      id: "C",
      slug: "card",
      href: "/mockups/photos/card/",
      label: "Card in the grid",
      why: "Franconia this month is one card under the tasks, and the whole card opens the photograph library.",
    },
    department: {
      id: "D",
      slug: "department",
      href: "/mockups/photos/department/",
      label: "Department header",
      why: "Trails and Parks opens with a photograph of a town trail, and the title stays on the paper.",
    },
    contest: {
      id: "E",
      slug: "contest",
      href: "/mockups/photos/contest/",
      label: "Contest page",
      why: "Residents would email one photograph a month, a board would pick a winner, and past photographs would live in a library.",
    },
    masthead: {
      id: "F",
      slug: "masthead",
      href: "/mockups/photos/masthead/",
      label: "Caption under the picture",
      why: "A short picture and a caption sit under the header, the picture can fold away, and the task list stays first.",
    },
  },
  photos,
  currentId: "town",
};
