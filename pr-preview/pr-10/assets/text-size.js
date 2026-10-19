(function () {
  var KEY = "franconia-text-size";
  // Desktop px, then narrow (max-width 640px) px. A− / A / A+.
  var PX = { small: [16, 16], medium: [18, 17], large: [22, 19] };
  var root = document.documentElement;
  var group = document.querySelector("[data-text-size-control]");
  if (!group) return;
  var narrowQuery = window.matchMedia("(max-width: 640px)");

  function stored() {
    try {
      return localStorage.getItem(KEY);
    } catch (err) {
      return null;
    }
  }

  function stepFrom(saved) {
    if (saved === "small" || saved === "16") return "small";
    if (saved === "large" || saved === "22") return "large";
    if (saved === "medium" || saved === "18" || saved === "17" || saved === "19") return "medium";
    return "";
  }

  function pxFor(step) {
    return PX[step][narrowQuery.matches ? 1 : 0];
  }

  function mark(step) {
    var buttons = group.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      var on = buttons[i].getAttribute("data-step") === step;
      buttons[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  function notify() {
    root.dispatchEvent(new CustomEvent("franconia-text-size"));
  }

  function apply(step, persist) {
    root.style.fontSize = pxFor(step) + "px";
    root.setAttribute("data-text-size", step);
    mark(step);
    if (persist) {
      try {
        localStorage.setItem(KEY, step);
      } catch (err) {}
    }
    notify();
  }

  group.addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button || !group.contains(button)) return;
    var step = button.getAttribute("data-step");
    if (!PX[step]) return;
    apply(step, true);
  });

  function onViewportChange() {
    var step = stepFrom(stored());
    if (step) apply(step, false);
    else {
      root.style.fontSize = "";
      root.removeAttribute("data-text-size");
      mark("medium");
      notify();
    }
  }

  if (narrowQuery.addEventListener) narrowQuery.addEventListener("change", onViewportChange);
  else if (narrowQuery.addListener) narrowQuery.addListener(onViewportChange);

  var saved = stepFrom(stored());
  if (saved) apply(saved, saved !== stored());
  else mark("medium");
})();
