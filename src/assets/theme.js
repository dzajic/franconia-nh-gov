(function () {
  const key = "franconia-theme";
  const root = document.documentElement;

  function setTheme(mode) {
    root.setAttribute("data-bs-theme", mode);
    localStorage.setItem(key, mode);
  }

  const saved = localStorage.getItem(key);
  if (saved === "dark" || saved === "light") {
    setTheme(saved);
  } else {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }

  function wire(id) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener("click", () => {
      const cur = root.getAttribute("data-bs-theme") || "light";
      setTheme(cur === "dark" ? "light" : "dark");
    });
  }

  wire("themeToggle");
  wire("themeToggleMobile");
})();
