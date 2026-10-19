(function () {
  var KEY = "franconia-photo-open";

  function markMissing(img) {
    img.hidden = true;
    var frame = img.closest("[data-photo-frame]");
    if (frame) frame.setAttribute("data-photo-frame", "missing");
  }

  document.querySelectorAll("[data-photo-img]").forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) markMissing(img);
    img.addEventListener("error", function () {
      markMissing(img);
    });
  });

  var fold = document.querySelector("[data-photo-fold]");
  if (fold) {
    function isOpen() {
      return document.documentElement.getAttribute("data-photo-open") !== "closed";
    }
    function applyFold(open) {
      if (open) document.documentElement.removeAttribute("data-photo-open");
      else document.documentElement.setAttribute("data-photo-open", "closed");
      fold.setAttribute("aria-expanded", open ? "true" : "false");
      try {
        if (open) localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, "closed");
      } catch (err) {}
    }
    fold.addEventListener("click", function () {
      applyFold(!isOpen());
    });
  }

  var node = document.getElementById("photo-library");
  var dialog = document.getElementById("photo-viewer");
  if (!node || !dialog || typeof dialog.showModal !== "function") return;

  var library = [];
  try {
    library = JSON.parse(node.textContent);
  } catch (err) {
    return;
  }
  if (!Array.isArray(library)) return;
  library.sort(function (a, b) {
    if (a.sort === b.sort) return 0;
    return a.sort < b.sort ? 1 : -1;
  });

  var byId = {};
  library.forEach(function (item) {
    byId[item.id] = item;
  });

  var viewImg = dialog.querySelector("[data-photo-viewer-img]");
  var labelEl = dialog.querySelector("#photo-viewer-label");
  var kickerEl = dialog.querySelector("[data-photo-viewer-kicker]");
  var descEl = dialog.querySelector("[data-photo-viewer-desc]");
  var creditEl = dialog.querySelector("[data-photo-viewer-credit]");
  var prevBtn = dialog.querySelector("[data-photo-prev]");
  var nextBtn = dialog.querySelector("[data-photo-next]");
  var closeBtn = dialog.querySelector("[data-photo-close]");
  var sequence = [];
  var index = 0;
  var invoker = null;
  var loadedId = "";

  function withRoot(path) {
    if (!path) return "";
    var root = document.body.getAttribute("data-site-root") || "/";
    if (root === "/" || root === "") return path;
    if (path.indexOf(root) === 0) return path;
    return root.replace(/\/$/, "") + path;
  }

  function appendLink(parent, href, text) {
    var link = document.createElement("a");
    link.href = href;
    link.textContent = text;
    parent.appendChild(link);
  }

  function fillCredit(item) {
    creditEl.replaceChildren();
    creditEl.append(item.collection === "Heritage Museum" ? "Image: " : "Photo: ");
    appendLink(creditEl, item.sourceUrl, item.credit);
    creditEl.append(", ");
    appendLink(creditEl, item.licenseUrl || item.sourceUrl, item.license);
    if (item.source) {
      creditEl.append(". Source: ");
      appendLink(creditEl, item.sourceUrl, item.source);
    }
    creditEl.append(". " + (item.changes || "Cropped and resized") + ".");
  }

  function show(i) {
    index = i;
    var item = sequence[index];
    labelEl.textContent = item.label + (item.place ? " · " + item.place : "");
    kickerEl.textContent = item.collection || "";
    kickerEl.hidden = !item.collection;
    descEl.textContent = item.description || "";
    descEl.hidden = !item.description;
    fillCredit(item);
    viewImg.alt = item.alt || "";
    if (item.fullW) viewImg.width = item.fullW;
    if (item.fullH) viewImg.height = item.fullH;
    if (loadedId !== item.id) {
      loadedId = item.id;
      viewImg.src = withRoot(item.full);
    }
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === sequence.length - 1;
  }

  function listFor(trigger) {
    var scope = trigger.getAttribute("data-photo-scope") || "all";
    var pair = trigger.getAttribute("data-photo-pair");
    if (scope === "pair" && pair) {
      return library
        .filter(function (item) {
          return item.pair === pair;
        })
        .slice()
        .sort(function (a, b) {
          if (a.sort === b.sort) return 0;
          return a.sort < b.sort ? -1 : 1;
        });
    }
    if (scope === "filtered") {
      var visible = [];
      document.querySelectorAll("[data-photo-card]:not([hidden])").forEach(function (card) {
        var item = byId[card.getAttribute("data-photo-id")];
        if (item) visible.push(item);
      });
      return visible;
    }
    return library.slice();
  }

  function openFrom(trigger) {
    sequence = listFor(trigger);
    if (!sequence.length) return;
    var id = trigger.getAttribute("data-photo-open-id");
    var start = 0;
    sequence.forEach(function (item, i) {
      if (item.id === id) start = i;
    });
    invoker = trigger;
    show(start);
    if (!dialog.open) dialog.showModal();
  }

  document.querySelectorAll("[data-photo-open-id]").forEach(function (button) {
    button.addEventListener("click", function () {
      openFrom(button);
    });
  });

  function step(delta) {
    var next = index + delta;
    if (next < 0 || next >= sequence.length) return;
    show(next);
  }

  prevBtn.addEventListener("click", function () {
    step(-1);
  });
  nextBtn.addEventListener("click", function () {
    step(1);
  });
  closeBtn.addEventListener("click", function () {
    dialog.close();
  });
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", function () {
    if (invoker && typeof invoker.focus === "function") invoker.focus();
  });
  dialog.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }
  });

  var touchX = 0;
  var touchY = 0;
  dialog.addEventListener(
    "touchstart",
    function (event) {
      if (!event.changedTouches || !event.changedTouches[0]) return;
      touchX = event.changedTouches[0].clientX;
      touchY = event.changedTouches[0].clientY;
    },
    { passive: true }
  );
  dialog.addEventListener(
    "touchend",
    function (event) {
      if (!event.changedTouches || !event.changedTouches[0]) return;
      var dx = event.changedTouches[0].clientX - touchX;
      var dy = event.changedTouches[0].clientY - touchY;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      step(dx < 0 ? 1 : -1);
    },
    { passive: true }
  );

  var chips = document.querySelectorAll("[data-photo-filter]");
  var status = document.querySelector("[data-photo-status]");
  if (!chips.length) return;
  var collection = "all";
  var place = "all";

  function applyFilters() {
    var shown = 0;
    document.querySelectorAll("[data-photo-card]").forEach(function (card) {
      var okCollection = collection === "all" || card.getAttribute("data-collection") === collection;
      var okPlace = place === "all" || card.getAttribute("data-place") === place;
      var visible = okCollection && okPlace;
      card.hidden = !visible;
      if (visible) shown += 1;
    });
    if (!status) return;
    if (collection === "all" && place === "all") {
      status.textContent = "";
    } else if (shown === 0) {
      status.textContent = "No photographs match these filters.";
    } else {
      status.textContent = shown + (shown === 1 ? " photograph." : " photographs.");
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var group = chip.getAttribute("data-photo-filter");
      var value = chip.getAttribute("data-photo-value");
      if (group === "collection") collection = value;
      if (group === "place") place = value;
      document.querySelectorAll('[data-photo-filter="' + group + '"]').forEach(function (other) {
        other.setAttribute("aria-pressed", other === chip ? "true" : "false");
      });
      applyFilters();
    });
  });
})();
