import { absoluteUrl, archiveBase } from "../../lib/urls.cjs";

export const data = {
  permalink: "/llms.txt",
  eleventyExcludeFromCollections: true,
};

function link(_data, href, title) {
  return `- [${title}](${absoluteUrl(href)})`;
}

export function render(data) {
  const lines = [
    `# ${data.site.name}`,
    "> Demo redesign. Not the official site. Official site: https://www.franconianh.gov/ (franconianh.org redirects there).",
    "> Values in [brackets] are unknown. Alert and homepage event dates are sample content from the design prototype.",
    "> The furnace-and-ridge mark and the silhouettes are original drawings, not traced from landmarks or surveys.",
    "",
  ];
  for (const group of data.directory) {
    lines.push(`## ${group.heading}`);
    for (const page of group.pages) lines.push(link(data, page.href, page.title));
    lines.push("");
  }
  lines.push("## Upcoming (sample)");
  for (const event of data.events) {
    lines.push(`- ${event.date}: ${event.name}${event.sample ? " (sample)" : ""}`);
  }
  lines.push("");
  lines.push("## Data");
  lines.push(`- [town.json](${absoluteUrl("/town.json")}): sections, events, contacts, bodies`);
  lines.push(`- [archive/index.json](${absoluteUrl("/archive/index.json")}): one record per imported document`);
  lines.push(`- Document files resolve under ${archiveBase()} (ARCHIVE_BASE_URL). PDFs are not in the git repository.`);
  lines.push(`- Phone on file from the previous site: ${data.site.contact.phone}. Email: ${data.site.contact.email}. Hours: ${data.site.contact.hours}.`);
  lines.push("");
  return lines.join("\n");
}
