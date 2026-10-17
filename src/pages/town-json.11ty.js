import { absoluteUrl, archiveBase } from "../../lib/urls.cjs";

export const data = {
  permalink: "/town.json",
  eleventyExcludeFromCollections: true,
};

export function render(data) {
  const payload = {
    name: data.site.name,
    url: absoluteUrl("/"),
    officialUrl: data.site.officialUrl,
    note: "Generated from this site's data files. Values in [brackets] are unknown. Events and alerts marked sample are design-prototype content, not confirmed town notices. Phone and street address were copied from the previous public site.",
    contact: data.site.contact,
    sections: data.directory,
    top_tasks: data.tasks,
    alerts: data.alerts,
    events: data.events,
    departments: data.departments,
    forms: data.forms,
    bodies: data.bodies,
    archive: {
      index: absoluteUrl("/archive/index.json"),
      baseUrl: archiveBase(),
      sample: "Selectboard 2025-2026, Planning Board, and Energy Commission are imported. Other boards have pages and no files yet.",
    },
  };
  return JSON.stringify(payload, null, 2);
}
