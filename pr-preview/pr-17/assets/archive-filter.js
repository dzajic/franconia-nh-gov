const form = document.querySelector("[data-doc-filter]");
if (form) {
  const q = form.querySelector("#doc-q");
  const body = form.querySelector("#doc-body");
  const type = form.querySelector("#doc-type");
  const review = form.querySelector("#doc-review");
  const count = document.querySelector("#filter-count");

  const label = (n) => `${n} document${n === 1 ? "" : "s"}`;

  const apply = () => {
    const query = (q && q.value ? q.value : "").trim().toLowerCase();
    const bodyValue = body ? body.value : "";
    const typeValue = type ? type.value : "";
    const reviewOnly = Boolean(review && review.checked);
    const filtering = Boolean(query || bodyValue || typeValue || reviewOnly);
    let shown = 0;
    let total = 0;
    document.querySelectorAll(".doclist li").forEach((item) => {
      total += 1;
      const title = (item.dataset.title || item.textContent || "").toLowerCase();
      const ok =
        (!query || title.includes(query)) &&
        (!bodyValue || item.dataset.body === bodyValue) &&
        (!typeValue || item.dataset.type === typeValue) &&
        (!reviewOnly || item.dataset.review === "yes");
      item.hidden = !ok;
      if (ok) shown += 1;
    });
    document.querySelectorAll(".doc-group").forEach((group) => {
      const items = [...group.querySelectorAll(".doclist li")];
      const visibleCount = items.filter((item) => !item.hidden).length;
      group.hidden = visibleCount === 0;
      if (group.tagName === "DETAILS") {
        if (filtering && visibleCount > 0) {
          if (!group.open) group.dataset.forcedOpen = "yes";
          group.open = true;
        } else if (!filtering && group.dataset.forcedOpen === "yes") {
          group.open = false;
          delete group.dataset.forcedOpen;
        }
        const countEl = group.querySelector(".year-count");
        if (countEl) {
          const totalInYear = Number(countEl.dataset.total || items.length);
          countEl.textContent = label(filtering ? visibleCount : totalInYear);
        }
      }
    });
    const older = document.querySelector(".older-label");
    if (older) {
      older.hidden = ![...document.querySelectorAll("details.year-fold")].some((group) => !group.hidden);
    }
    if (count) {
      count.textContent = shown === total ? label(total) : `${shown} of ${total} documents`;
    }
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    apply();
  });
  [q, body, type, review].forEach((control) => {
    if (control) control.addEventListener("input", apply);
  });
  apply();
}
