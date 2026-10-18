const input = document.querySelector("#search-q");
const out = document.querySelector("#search-results");
const params = new URLSearchParams(window.location.search);
const initial = params.get("q") || "";
if (input && initial) input.value = initial;

function strip(html) {
  const node = document.createElement("div");
  node.innerHTML = html || "";
  return node.textContent || "";
}

function card(result) {
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

async function archiveResults(query) {
  const response = await fetch(document.body.dataset.archiveIndex);
  if (!response.ok) return [];
  const payload = await response.json();
  const needle = query.toLowerCase();
  return (payload.documents || [])
    .filter((doc) => `${doc.title} ${doc.bodyName} ${doc.type} ${doc.date || ""} ${doc.legacyFilename || ""}`.toLowerCase().includes(needle))
    .slice(0, 12)
    .map((doc) => ({
      title: doc.title,
      url: doc.url,
      excerpt: `${doc.type} · ${doc.bodyName} · ${doc.date || "date unknown"}${doc.needsReview ? " · needs review" : ""}`,
    }));
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
  let pagefindNote = "";
  try {
    [pages, docs] = await Promise.all([pagefindResults(trimmed), archiveResults(trimmed)]);
  } catch (error) {
    pagefindNote = "The full-page index is built by npm run build. Showing document records only.";
    try {
      docs = await archiveResults(trimmed);
    } catch {
      docs = [];
    }
  }

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
    pages.forEach((result) => out.append(card(result)));
  }
  if (docs.length) {
    out.append(heading("Documents"));
    docs.forEach((result) => out.append(card(result)));
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
