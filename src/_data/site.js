import { recentMonths } from "../../lib/archive-window.cjs";
import { archiveBase, origin } from "../../lib/urls.cjs";

/**
 * Contact values:
 * - phone stays 603-823-7752. The town homepage lists it for the Selectmen's
 *   office. The request for this demo treats it as the clerk phone.
 * - email is townclerk@franconianh.gov, decoded from the town clerk page and
 *   the town directory.
 * - hours are the town clerk's hours on the town clerk page. Selectmen's
 *   Friday closing time is not used: the homepage says 1:30 and the selectmen
 *   page says 1:00.
 */
const officialUrl = "https://www.franconianh.gov/";

export default {
  name: "Town of Franconia, New Hampshire",
  shortName: "Franconia",
  officialUrl,
  origin: origin(),
  archiveBaseUrl: archiveBase(),
  repo: "https://github.com/dzajic/franconia-nh-gov",
  suggestions: "https://github.com/dzajic/franconia-nh-gov/issues",
  /**
   * Where "Contact us" sends a suggestion.
   * TODO: energy-commission+suggestions@mail.grokbot.com is a temporary
   * address. The Technology Committee is not formed yet. Replace this
   * with the committee's real address.
   */
  suggestionsContact: {
    name: "Technology Committee (TBD)",
    email: "energy-commission+suggestions@mail.grokbot.com",
  },
  contact: {
    phone: "603-823-7752",
    email: "townclerk@franconianh.gov",
    address: "421 Main Street, PO Box 900, Franconia, NH 03580",
    hours: "Closed Mondays. Tuesdays–Thursdays 8:00 a.m.–4:00 p.m. Fridays 8:00 a.m.–12:00 p.m.",
  },
  /**
   * Archive pages expand this many months at build time.
   * RECENT_MONTHS overrides the default. A weekly rebuild moves the window.
   */
  recentMonths: recentMonths(),
  /**
   * Visitor pointer only. Do not add lodging, hours, or other Chamber facts here.
   * The sentence is the whole claim this site makes about that organization.
   */
  visiting: {
    name: "Franconia Notch Chamber of Commerce",
    url: "https://www.franconianotch.org/",
    text: "Visiting? The Franconia Notch Chamber of Commerce has lodging, dining, and things to do.",
  },
  /**
   * Slim notice on every page while this build is a demo.
   * Edit text, linkLabel, and url here. Set enabled to false to remove the
   * bar and show the alert bar again. url must stay an absolute http(s) URL
   * so pull-request preview prefixes do not rewrite it.
   */
  previewNotice: {
    enabled: true,
    text: "Preview of the future Franconia town website. A demo, not the official site.",
    linkLabel: "franconianh.gov",
    url: officialUrl,
  },
};
