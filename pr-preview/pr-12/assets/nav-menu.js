(function () {
  var root = document.documentElement;
  var header = document.querySelector("header.top");
  var hdr = header && header.querySelector(".hdr");
  var nav = header && header.querySelector(".primary-nav");
  var links = document.getElementById("primary-nav-list");
  var toggles = Array.prototype.slice.call(document.querySelectorAll(".menu-toggle"));
  var bar = document.querySelector("[data-slim-bar]");
  if (!header || !hdr || !nav || !links || !toggles.length) return;

  var headerToggle = null;
  for (var t = 0; t < toggles.length; t++) {
    if (!toggles[t].closest("[data-slim-bar]")) headerToggle = toggles[t];
  }

  var open = false;
  var collapsed = false;
  var opener = null;

  if (bar) bar.hidden = false;

  var probe = document.createElement("div");
  probe.className = "nav-probe";
  probe.setAttribute("aria-hidden", "true");
  var row = document.createElement("div");
  row.className = "probe-row";

  function muteClone(node) {
    if (node.removeAttribute) node.removeAttribute("id");
    if (node.querySelectorAll) {
      var tagged = node.querySelectorAll("[id]");
      for (var i = 0; i < tagged.length; i++) tagged[i].removeAttribute("id");
      var focusable = node.querySelectorAll("a, button, input");
      for (var j = 0; j < focusable.length; j++) focusable[j].tabIndex = -1;
    }
    return node;
  }

  var brand = hdr.querySelector(".brand-block") || hdr.querySelector(".brand");
  var search = hdr.querySelector(".search");
  var textSize = hdr.querySelector(".text-size");
  if (brand) row.appendChild(muteClone(brand.cloneNode(true)));
  if (search) {
    var searchSpacer = document.createElement("div");
    searchSpacer.className = "search";
    row.appendChild(searchSpacer);
  }
  if (textSize) {
    var textClone = muteClone(textSize.cloneNode(true));
    textClone.removeAttribute("data-text-size-control");
    row.appendChild(textClone);
  }
  var probeNav = document.createElement("nav");
  probeNav.className = "primary-nav";
  var probeLinks = document.createElement("div");
  probeLinks.className = "nav-links";
  var realLinks = links.querySelectorAll("a");
  for (var n = 0; n < realLinks.length; n++) {
    var clone = document.createElement("a");
    clone.className = "nav-link";
    clone.textContent = realLinks[n].textContent;
    clone.tabIndex = -1;
    probeLinks.appendChild(clone);
  }
  probeNav.appendChild(probeLinks);
  row.appendChild(probeNav);
  probe.appendChild(row);
  hdr.appendChild(probe);

  function contentWidth() {
    var style = window.getComputedStyle(hdr);
    var padL = parseFloat(style.paddingLeft) || 0;
    var padR = parseFloat(style.paddingRight) || 0;
    return Math.max(0, hdr.clientWidth - padL - padR);
  }

  function linksWrap() {
    row.style.width = contentWidth() + "px";
    var items = probeLinks.children;
    if (items.length < 2) return false;
    var first = items[0].offsetTop;
    for (var i = 1; i < items.length; i++) {
      if (items[i].offsetTop - first > 1) return true;
    }
    return false;
  }

  function sharesRow() {
    var about = document.body.classList.contains("about");
    if (about) return window.matchMedia("(min-width: 900px)").matches;
    return window.matchMedia("(min-width: 1100px)").matches;
  }

  function navDropped() {
    if (!sharesRow()) return false;
    var brandClone = row.querySelector(".brand-block") || row.querySelector(".brand");
    var probeNavEl = row.querySelector(".primary-nav");
    if (!brandClone || !probeNavEl) return false;
    return probeNavEl.offsetTop > brandClone.offsetTop + brandClone.offsetHeight - 1;
  }

  function shouldCollapse() {
    row.style.width = contentWidth() + "px";
    if (window.matchMedia("(max-width: 640px)").matches) return true;
    if (linksWrap()) return true;
    return navDropped();
  }

  function setExpanded(value) {
    var state = value ? "true" : "false";
    for (var i = 0; i < toggles.length; i++) toggles[i].setAttribute("aria-expanded", state);
  }

  function syncHidden() {
    if (headerToggle) headerToggle.hidden = !collapsed;
    nav.hidden = collapsed && !open;
  }

  function setCollapsed(next) {
    var changed = next !== collapsed;
    collapsed = next;
    root.classList.toggle("nav-collapsed", next);
    if (!next && open) {
      open = false;
      root.classList.remove("nav-open");
      setExpanded(false);
      opener = null;
    }
    syncHidden();
    if (!changed) return;
  }

  function measure() {
    if (open) return;
    setCollapsed(shouldCollapse());
  }

  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(function () {
      queued = false;
      measure();
    });
  }

  function firstLink() {
    return links.querySelector("a");
  }

  function openMenu(from) {
    if (!collapsed) return;
    opener = from || headerToggle;
    open = true;
    root.classList.add("nav-open");
    syncHidden();
    setExpanded(true);
    var first = firstLink();
    if (first) first.focus();
  }

  function closeMenu(restore) {
    if (!open) return;
    var back = opener;
    open = false;
    root.classList.remove("nav-open");
    setExpanded(false);
    opener = null;
    if (restore && back && document.contains(back)) back.focus();
    syncHidden();
    schedule();
  }

  for (var b = 0; b < toggles.length; b++) {
    toggles[b].addEventListener("click", function (event) {
      var btn = event.currentTarget;
      if (open && opener === btn) closeMenu(true);
      else if (open) opener = btn;
      else openMenu(btn);
    });
  }

  document.addEventListener("keydown", function (event) {
    if (!open || event.key !== "Escape") return;
    event.preventDefault();
    closeMenu(true);
  });

  document.addEventListener("focusin", function (event) {
    if (!open) return;
    var target = event.target;
    if (links.contains(target)) return;
    if (opener && target === opener) return;
    closeMenu(false);
  });

  document.addEventListener("click", function (event) {
    if (!open) return;
    var target = event.target;
    if (links.contains(target)) return;
    if (target.closest && target.closest(".menu-toggle")) return;
    closeMenu(false);
  });

  links.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("a");
    if (!link) return;
    window.setTimeout(function () { closeMenu(false); }, 0);
  });

  var lastY = window.scrollY || 0;
  var slim = false;
  window.addEventListener("scroll", function () {
    var y = window.scrollY || 0;
    var delta = y - lastY;
    lastY = y;
    var headerGone = header.getBoundingClientRect().bottom <= 0;
    var next = slim;
    if (!headerGone || y <= 0) next = false;
    else if (delta > 4) next = false;
    else if (delta < -4) next = true;
    if (next === slim) return;
    slim = next;
    root.classList.toggle("slim-shown", slim);
    if (!slim && open) closeMenu(false);
  }, { passive: true });

  if (window.ResizeObserver) {
    var observer = new ResizeObserver(schedule);
    observer.observe(hdr);
    observer.observe(root);
  }
  window.addEventListener("resize", schedule);
  document.addEventListener("franconia-text-size", schedule);
  measure();
})();
