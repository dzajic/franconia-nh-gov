(function () {
  var KEY = "franconia-text-size";
  var SIZES = ["16", "18", "22"];
  var root = document.documentElement;
  var group = document.querySelector("[data-text-size-control]");
  if (!group) return;

  function stored() {
    try {
      return localStorage.getItem(KEY);
    } catch (err) {
      return null;
    }
  }

  function current() {
    var inline = String(root.style.fontSize || "").replace("px", "");
    if (SIZES.indexOf(inline) !== -1) return inline;
    var saved = stored();
    if (SIZES.indexOf(saved) !== -1) return saved;
    return "18";
  }

  function apply(size) {
    root.style.fontSize = size + "px";
    root.setAttribute("data-text-size", size);
    try {
      localStorage.setItem(KEY, size);
    } catch (err) {}
    var buttons = group.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      var on = buttons[i].getAttribute("data-size") === size;
      buttons[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  group.addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button || !group.contains(button)) return;
    var size = button.getAttribute("data-size");
    if (SIZES.indexOf(size) === -1) return;
    apply(size);
  });

  apply(current());
})();
