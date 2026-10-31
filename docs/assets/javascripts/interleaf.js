/* Interleaf theme: accent picker, decision numbers in the navigation, hand-drawn
   Mermaid diagrams. Everything here is optional: without JavaScript the pages keep
   the default accent and Material's diagrams. */
(function () {
  "use strict";

  var ACCENTS = ["cobalt", "vermilion", "violet"];
  var KEY = "gl-accent";

  /* Accent picker: stores the choice in localStorage; the header script applies it
     before the page renders. Hidden in the E-ink scheme by CSS. */
  function setupAccent() {
    var group = document.querySelector(".gl-accent");
    if (!group) return;
    var buttons = group.querySelectorAll("[data-gl-accent-value]");
    function current() {
      var value = document.body.getAttribute("data-gl-accent");
      return ACCENTS.indexOf(value) >= 0 ? value : "violet";
    }
    function sync() {
      var value = current();
      for (var i = 0; i < buttons.length; i++) {
        var on = buttons[i].getAttribute("data-gl-accent-value") === value;
        buttons[i].setAttribute("aria-pressed", on ? "true" : "false");
      }
    }
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function () {
        var value = this.getAttribute("data-gl-accent-value");
        document.body.setAttribute("data-gl-accent", value);
        try { localStorage.setItem(KEY, value); } catch (e) { /* private mode */ }
        sync();
      });
    }
    sync();
    group.hidden = false;
  }

  /* "0006 — User data: …" in the navigation: the number goes into its own span so
     it can be set in the code face, as in a ledger. */
  function splitDecisionNumbers() {
    var labels = document.querySelectorAll(".md-nav--primary .md-nav__link .md-ellipsis");
    for (var i = 0; i < labels.length; i++) {
      var el = labels[i];
      if (el.children.length) continue;
      var m = /^\s*(\d{4})\s+—\s+(.+?)\s*$/.exec(el.textContent);
      if (!m) continue;
      var num = document.createElement("span");
      num.className = "gl-nav-number";
      num.textContent = m[1];
      el.textContent = "";
      el.appendChild(num);
      el.appendChild(document.createTextNode(" " + m[2]));
    }
  }

  /* Mermaid: Material loads Mermaid on demand and calls mermaid.initialize(). Catch
     the global when it is defined and add the hand-drawn look and the theme fonts.
     Material's own colour variables still apply. */
  function hookMermaid() {
    if (typeof window.mermaid !== "undefined") return;
    try {
      Object.defineProperty(window, "mermaid", {
        configurable: true,
        get: function () { return undefined; },
        set: function (value) {
          if (value && typeof value.initialize === "function") {
            var initialize = value.initialize;
            value.initialize = function (config) {
              var css = getComputedStyle(document.body);
              /* Rough.js draws each node as two paths: hatching, then the outline.
                 Colour both from Material's variables so schemes still apply. */
              var rough =
                ".rough-node > g:first-child > path:first-child{stroke:var(--md-mermaid-node-bg-color)!important}" +
                ".rough-node > g:first-child > path:nth-child(2){stroke:var(--md-mermaid-node-fg-color)!important}";
              var extra = {
                look: "handDrawn",
                themeCSS: (config && config.themeCSS ? config.themeCSS : "") + rough,
                handDrawnSeed: 7,
                fontFamily: css.getPropertyValue("--md-mermaid-font-family").trim() || "Kalam, cursive"
              };
              return initialize.call(this, Object.assign({}, config, extra));
            };
          }
          Object.defineProperty(window, "mermaid", {
            configurable: true, writable: true, value: value
          });
        }
      });
    } catch (e) { /* leave Material's default */ }
  }

  hookMermaid();
  setupAccent();
  splitDecisionNumbers();
})();
