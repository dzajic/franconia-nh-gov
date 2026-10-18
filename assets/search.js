const input = document.querySelector("#search-q");
const out = document.querySelector("#search-results");
const params = new URLSearchParams(window.location.search);
const initial = params.get("q") || "";
if (input && initial) input.value = initial;

let archivePromise;

function strip(html) {
  const node = document.createElement("div");
  node.innerHTML = html || "";
  return node.textContent || "";
}

function pathKey(url) {
  if (!url) return "";
  let path = String(url);
  try {
    path = new URL(url, window.location.href).pathname;
  } catch {
    path = path.split("?")[0].split("#")[0];
  }
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1 && !path.endsWith("/")) path += "/";
  return path;
}

function fileReady(doc, archiveBaseUrl) {
  if (!doc || doc.missing) return false;
  const file = String(doc.file || "").replace(/^\//, "").trim();
  const fileUrl = String(doc.fileUrl || "").trim();
  if (!file || !fileUrl) return false;
  const bare = String(archiveBaseUrl || "").replace(/\/$/, "");
  return !bare || fileUrl.replace(/\/$/, "") !== bare;
}

function loadArchive() {
  if (!archivePromise) {
    const src = document.body.dataset.archiveIndex;
    archivePromise = fetch(src)
      .then((response) => {
        if (!response.ok) throw new Error("archive index unavailable");
        return response.json();
      })
      .catch((error) => {
        archivePromise = null;
        throw error;
      });
  }
  return archivePromise;
}

function infoIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "info-icon");
  svg.setAttribute("viewBox", "0 0 20 20");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  ring.setAttribute("cx", "10");
  ring.setAttribute("cy", "10");
  ring.setAttribute("r", "8.25");
  ring.setAttribute("fill", "none");
  ring.setAttribute("stroke", "currentColor");
  ring.setAttribute("stroke-width", "1.6");
  const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  dot.setAttribute("cx", "10");
  dot.setAttribute("cy", "6.35");
  dot.setAttribute("r", "1.05");
  dot.setAttribute("fill", "currentColor");
  const stem = document.createElementNS("http://www.w3.org/2000/svg", "path");
  stem.setAttribute("d", "M10 9.1v5.3");
  stem.setAttribute("fill", "none");
  stem.setAttribute("stroke", "currentColor");
  stem.setAttribute("stroke-width", "1.7");
  stem.setAttribute("stroke-linecap", "round");
  svg.append(ring, dot, stem);
  return svg;
}

function detailsLink(url, title) {
  const link = document.createElement("a");
  link.className = "doc-info";
  link.href = url;
  link.title = "Details";
  link.setAttribute("aria-label", `Details for ${title}`);
  link.append(infoIcon());
  return link;
}

function pageCard(result) {
  const item = document.createElement("article");
  item.className = "result";
  const link = document.createElement("a");
  link.href = result.url;
  link.textContent = result.title || result.url;
  const excerpt = document.createElement("p");
  excerpt.textContent = strip(result.excerpt);
  item.append(link, excerpt);
  return item;
}

function documentCard(doc, archiveBaseUrl, excerptHtml) {
  const item = document.createElement("article");
  item.className = "result";
  const line = document.createElement("div");
  line.className = "doc-line";
  const title = doc.title || "Document";
  if (fileReady(doc, archiveBaseUrl)) {
    const fileLink = document.createElement("a");
    fileLink.className = "doc-title";
    fileLink.href = doc.fileUrl;
    fileLink.target = "_blank";
    fileLink.rel = "noopener";
    const splitAt = title.lastIndexOf(" ");
    const head = splitAt === -1 ? "" : title.slice(0, splitAt);
    const tail = splitAt === -1 ? title : title.slice(splitAt + 1);
    const tailWrap = document.createElement("span");
    tailWrap.className = "doc-tail";
    const tailLink = document.createElement("a");
    tailLink.className = "doc-title";
    tailLink.href = doc.fileUrl;
    tailLink.target = "_blank";
    tailLink.rel = "noopener";
    tailLink.textContent = tail;
    if (head) {
      fileLink.textContent = `${head} `;
      fileLink.setAttribute("aria-label", `${title} (opens in a new tab)`);
      tailLink.tabIndex = -1;
      tailLink.setAttribute("aria-hidden", "true");
      line.append(fileLink);
    } else {
      tailLink.setAttribute("aria-label", `${title} (opens in a new tab)`);
    }
    tailWrap.append(tailLink, detailsLink(doc.url, title));
    line.append(tailWrap);
  } else {
    const details = document.createElement("a");
    details.className = "doc-title";
    details.href = doc.url;
    details.textContent = title;
    details.setAttribute("aria-label", `Details for ${title}`);
    line.append(details);
  }
  const excerpt = document.createElement("p");
  const fallback = `${doc.type || "Document"} · ${doc.bodyName || ""} · ${doc.date || "date unknown"}${doc.needsReview ? " · needs review" : ""}`;
  excerpt.textContent = excerptHtml ? strip(excerptHtml) : fallback;
  item.append(line, excerpt);
  return item;
}

function heading(text) {
  const node = document.createElement("h2");
  node.className = "result-group";
  node.textContent = text;
  return node;
}

function siteRoot() {
  const root = document.body && document.body.dataset.siteRoot;
  if (!root || root === "/") return "/";
  return root.endsWith("/") ? root : `${root}/`;
}

async function pagefindResults(query) {
  const src = document.body.dataset.pagefind;
  const pagefind = await import(src);
  // Pagefind result paths are relative to the built site root. baseUrl is the
  // preview or project prefix (data-site-root), so result links stay under it.
  // The bundle path is detected from the prefixed pagefind.js import.
  if (typeof pagefind.options === "function") {
    await pagefind.options({ baseUrl: siteRoot() });
  }
  const response = await pagefind.search(query);
  const rows = [];
  for (const result of response.results.slice(0, 12)) {
    const data = await result.data();
    rows.push({
      title: data.meta && data.meta.title,
      url: data.url,
      excerpt: data.excerpt,
    });
  }
  return rows;
}

function archiveMatches(payload, query) {
  const needle = query.toLowerCase();
  return (payload.documents || [])
    .filter((doc) => `${doc.title} ${doc.bodyName} ${doc.type} ${doc.date || ""} ${doc.legacyFilename || ""}`.toLowerCase().includes(needle))
    .slice(0, 12);
}

async function run(query) {
  if (!out) return;
  out.replaceChildren();
  const trimmed = query.trim();
  if (!trimmed) {
    const note = document.createElement("p");
    note.textContent = "Type a word to search pages and document records.";
    out.append(note);
    return;
  }
  const status = document.createElement("p");
  status.textContent = "Searching…";
  out.append(status);

  let pages = [];
  let docs = [];
  let archive = { documents: [], archiveBaseUrl: "" };
  let pagefindNote = "";
  try {
    archive = await loadArchive();
    docs = archiveMatches(archive, trimmed);
  } catch {
    docs = [];
  }
  try {
    pages = await pagefindResults(trimmed);
  } catch {
    pagefindNote = "The full-page index is built by npm run build. Showing document records only.";
    pages = [];
  }

  const byUrl = new Map((archive.documents || []).map((doc) => [pathKey(doc.url), doc]));

  out.replaceChildren();
  if (pagefindNote) {
    const note = document.createElement("p");
    note.className = "note";
    note.textContent = pagefindNote;
    out.append(note);
  }
  if (!pages.length && !docs.length) {
    const empty = document.createElement("p");
    empty.textContent = `No matches for “${trimmed}”.`;
    out.append(empty);
    return;
  }
  if (pages.length) {
    out.append(heading("Pages"));
    pages.forEach((result) => {
      const doc = byUrl.get(pathKey(result.url));
      out.append(doc ? documentCard(doc, archive.archiveBaseUrl, result.excerpt) : pageCard(result));
    });
  }
  if (docs.length) {
    out.append(heading("Documents"));
    docs.forEach((doc) => out.append(documentCard(doc, archive.archiveBaseUrl)));
  }
}

if (input) {
  input.addEventListener("input", () => {
    const url = new URL(window.location.href);
    url.searchParams.set("q", input.value);
    window.history.replaceState(null, "", url);
    run(input.value);
  });
}
run(initial);
