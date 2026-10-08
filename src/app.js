(function () {
  "use strict";
  const config = window.AbelianSandpileProject;
  document.querySelector("[data-version]").textContent = config.version;
  const buttons = Array.from(document.querySelectorAll("[data-mode]"));
  const panels = Array.from(document.querySelectorAll("[data-panel]"));
  for (const button of buttons) {
    button.addEventListener("click", function () {
      const mode = button.dataset.mode;
      for (const item of buttons) {
        item.setAttribute("aria-pressed", String(item === button));
      }
      for (const panel of panels) panel.hidden = panel.dataset.panel !== mode;
    });
  }
  document.documentElement.dataset.ready = "true";
})();
