import { archiveBase, origin } from "../../lib/urls.cjs";

/**
 * Contact values:
 * - phone and street address are copied from the migrated homepage and the
 *   Board of Selectmen page. They are not newly verified.
 * - email and office hours stay as placeholders. The old pages disagree about
 *   Friday closing time (1:00 vs 1:30), so hours are not asserted here.
 */
export default {
  name: "Town of Franconia, New Hampshire",
  shortName: "Franconia",
  officialUrl: "https://www.franconianh.gov/",
  origin: origin(),
  archiveBaseUrl: archiveBase(),
  repo: "https://github.com/dzajic/franconia-nh-gov",
  suggestions: "https://github.com/dzajic/franconia-nh-gov/issues",
  contact: {
    phone: "603-823-7752",
    email: "[email]",
    address: "421 Main Street, PO Box 900, Franconia, NH 03580",
    hours: "[hours]",
  },
};
