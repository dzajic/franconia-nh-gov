import { absoluteUrl, archiveBase, archiveFileUrl, withPrefix } from "../../lib/urls.cjs";

export const data = {
  permalink: "/archive/index.json",
  eleventyExcludeFromCollections: true,
};

export function render({ collections, bodies }) {
  const names = Object.fromEntries((bodies || []).map((body) => [body.slug, body.name]));
  const documents = (collections.document || [])
    .map((doc) => {
      const item = doc.data;
      return {
        title: item.title,
        body: item.body,
        bodyName: names[item.body] || item.body,
        type: item.type,
        date: item.doc_date || null,
        datePrecision: item.date_precision,
        year: item.doc_year,
        status: item.status,
        needsReview: Boolean(item.needs_review),
        flags: item.flags || [],
        format: item.format,
        checksum: item.checksum || null,
        file: item.file,
        fileUrl: archiveFileUrl(item.file),
        legacyUrl: item.legacy_url || null,
        legacyFilename: item.legacy_filename || null,
        textLayer: item.text_layer === "" || item.text_layer == null ? null : Boolean(item.text_layer),
        missing: Boolean(item.missing),
        url: withPrefix(doc.url),
        absoluteUrl: absoluteUrl(doc.url),
      };
    })
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || a.title.localeCompare(b.title));

  return JSON.stringify(
    {
      archiveBaseUrl: archiveBase(),
      count: documents.length,
      note: "File bytes are not hosted here. fileUrl is archiveBaseUrl plus file. needsReview marks inferred or undated records.",
      documents,
    },
    null,
    2
  );
}
