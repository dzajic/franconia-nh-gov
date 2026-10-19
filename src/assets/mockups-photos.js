(function () {
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

  var button = document.querySelector("[data-photo-toggle]");
  if (!button) return;
  button.addEventListener("click", function () {
    var root = document.documentElement;
    var off = root.getAttribute("data-photo") === "off";
    if (off) root.removeAttribute("data-photo");
    else root.setAttribute("data-photo", "off");
    button.textContent = off ? "Hide photo" : "Show photo";
    button.setAttribute("aria-pressed", off ? "false" : "true");
  });
})();
