const form = document.querySelector("[data-doc-filter]");
if (form) {
  const q = form.querySelector("#doc-q");
  const body = form.querySelector("#doc-body");
  const type = form.querySelector("#doc-type");
  const review = form.querySelector("#doc-review");
  const count = document.querySelector("#filter-count");

  const apply = () => {
    const query = (q && q.value ? q.value : "").trim().toLowerCase();
    const bodyValue = body ? body.value : "";
    const typeValue = type ? type.value : "";
    const reviewOnly = Boolean(review && review.checked);
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
    document.querySelectorAll(".year-group").forEach((group) => {
      group.hidden = ![...group.querySelectorAll(".doclist li")].some((item) => !item.hidden);
    });
    if (count) {
      count.textContent = shown === total ? `${total} documents` : `${shown} of ${total} documents`;
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
