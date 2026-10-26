import { recentMonths } from "../../lib/archive-window.cjs";
import { archiveBase, origin } from "../../lib/urls.cjs";

/**
 * Contact values are the town clerk's, copied from franconianh.gov:
 * - phone is 603-823-5237. The homepage, town directory, and town clerk page
 *   all list that number for the Town Clerk and Tax Collector.
 *   603-823-7752 is the Selectmen's office line, not the clerk.
 * - email is townclerk@franconianh.gov, decoded from the town clerk page and
 *   the town directory.
 * - hours are the town clerk page: closed Mondays, Tuesday–Thursday
 *   8:00 a.m.–4:00 p.m., Friday 8:00 a.m.–12:00 p.m.
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
    phone: "603-823-5237",
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
