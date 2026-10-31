/* GlassineOS docs theme: the Appearance panel, the voice's words, decision
   numbers in the navigation, and Mermaid diagrams in the voice's face. Everything here
   is optional: without JavaScript the pages keep the White voice, its house pen and
   Material's diagrams.

   The voices, pens and schemes are read from the header's token summary (generated
   from theme/tokens.json); the words from the --gl-word-* variables of the current
   voice. */
(function () {
  "use strict";

  var body = document.body;

  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode */ }
  }

  function tokens() {
    var el = document.getElementById("__gl-tokens");
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  }

  function word(name) {
    var value = getComputedStyle(body).getPropertyValue("--gl-word-" + name).trim();
    if (!value) return null;
    try { return JSON.parse(value); } catch (e) { return value.replace(/^["']|["']$/g, ""); }
  }

  /* The words a voice uses for the same things: search, contents, previous, next. */
  function applyWords() {
    var search = word("search");
    var input = document.querySelector(".md-search__input");
    if (search && input) {
      input.setAttribute("placeholder", search);
    }
    var toc = word("toc");
    var titles = document.querySelectorAll(".md-nav--secondary > .md-nav__title");
    for (var t = 0; toc && t < titles.length; t++) {
      for (var i = 0; i < titles[t].childNodes.length; i++) {
        var node = titles[t].childNodes[i];
        if (node.nodeType === 3 && node.textContent.trim()) {
          node.textContent = " " + toc + " ";
        }
      }
    }
    var dirs = document.querySelectorAll("[data-gl-word]");
    for (var j = 0; j < dirs.length; j++) {
      var w = word(dirs[j].getAttribute("data-gl-word"));
      if (w) dirs[j].textContent = w;
    }
  }

  /* The Appearance panel: one button in the bar, three radio groups inside. Voice and
     pen are our radios; the scheme radios are Material's palette inputs, which apply
     the scheme themselves on change. Previews carry the voice, pen and scheme they
     show as data attributes; sync() keeps the parts that follow the page current. */
  function setupAppearance(T) {
    var button = document.querySelector(".gl-appearance__button");
    var panel = document.getElementById("gl-appearance");
    if (!T || !button || !panel) return;

    function voice() {
      var id = body.getAttribute("data-gl-voice");
      for (var i = 0; i < T.voices.length; i++) if (T.voices[i].id === id) return T.voices[i];
      return T.voices[0];
    }

    function pen(v) {
      var id = body.getAttribute("data-gl-pen");
      for (var i = 0; i < v.pens.length; i++) if (v.pens[i].id === id) return v.pens[i];
      return v.pens[0];
    }

    function storedPen(v) {
      var id = null;
      try { id = localStorage.getItem("gl-pen-" + v.id); } catch (e) { /* private mode */ }
      for (var i = 0; i < v.pens.length; i++) if (v.pens[i].id === (id || v.house)) return v.pens[i];
      return v.pens[0];
    }

    function each(selector, fn) {
      var list = panel.querySelectorAll(selector);
      for (var i = 0; i < list.length; i++) fn(list[i]);
    }

    function sync() {
      var v = voice(), p = pen(v);
      var scheme = body.getAttribute("data-md-color-scheme") || T.defaults.scheme;
      var text = { menu: v.words.menu, "menu-title": v.words["menu-title"], pen: v.pen_word };
      var all = document.querySelectorAll("[data-gl-text]");
      for (var i = 0; i < all.length; i++) {
        var w = text[all[i].getAttribute("data-gl-text")];
        if (w) all[i].textContent = w;
      }
      button.setAttribute("aria-label", v.words.menu + ": " + v.label + ", " + p.label);
      button.title = button.getAttribute("aria-label");
      each("input[name=gl-voice]", function (el) { el.checked = el.value === v.id; });
      each("[data-gl-pens]", function (el) {
        el.hidden = el.getAttribute("data-gl-pens") !== v.id;
      });
      each("input[name='gl-pen-" + v.id + "']", function (el) { el.checked = el.value === p.id; });
      each("input[name=__palette]", function (el) {
        el.checked = el.getAttribute("data-md-color-scheme") === scheme;
      });
      /* Voice cards and pen swatches show the current scheme; the scheme pages show
         the current voice and pen. */
      each(".gl-option--voice, .gl-option--pen .gl-swatch", function (el) {
        el.setAttribute("data-md-color-scheme", scheme);
      });
      each(".gl-option__page", function (el) {
        el.setAttribute("data-gl-voice", v.id);
        el.setAttribute("data-gl-pen", p.id);
      });
      applyWords();
    }

    function open(state) {
      panel.hidden = !state;
      button.setAttribute("aria-expanded", state ? "true" : "false");
      if (state) {
        sync();
        var first = panel.querySelector("input[name=gl-voice]:checked") || panel.querySelector("input");
        if (first) first.focus();
      }
    }

    button.addEventListener("click", function () { open(panel.hidden); });
    panel.querySelector(".gl-pop__close").addEventListener("click", function () {
      open(false);
      button.focus();
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !panel.hidden) {
        open(false);
        button.focus();
      }
    });
    document.addEventListener("click", function (ev) {
      if (!panel.hidden && !panel.contains(ev.target) && !button.contains(ev.target)) open(false);
    });
    /* Material steps to the next scheme on Enter anywhere in its form: inside the panel
       Enter means "this one", which the radio already is. */
    each("input[name=__palette]", function (el) {
      el.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") ev.stopPropagation();
      });
      el.addEventListener("change", function () { setTimeout(sync, 0); });
    });

    each("input[name=gl-voice]", function (el) {
      el.addEventListener("change", function () {
        var v = null;
        for (var i = 0; i < T.voices.length; i++) if (T.voices[i].id === el.value) v = T.voices[i];
        if (!v) return;
        body.setAttribute("data-gl-voice", v.id);
        body.setAttribute("data-gl-pen", storedPen(v).id);
        store("gl-voice", v.id);
        sync();
        /* Diagrams are drawn once, in the voice's face: draw them again. */
        if (document.querySelector(".mermaid svg")) location.reload();
      });
    });

    each("[data-gl-pens] input", function (el) {
      el.addEventListener("change", function () {
        var v = voice();
        body.setAttribute("data-gl-pen", el.value);
        store("gl-pen-" + v.id, el.value);
        sync();
      });
    });

    sync();
    button.hidden = false;
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
     the global when it is defined: White draws by hand, the other voices draw clean
     lines; all set labels in the voice's face. Material's colour variables still
     apply. */
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
              var hand = (body.getAttribute("data-gl-voice") || "white") === "white";
              var extra = {
                fontFamily: css.getPropertyValue("--md-mermaid-font-family").trim() || "sans-serif"
              };
              if (hand) {
                /* Rough.js draws each node as two paths: hatching, then the outline.
                   Colour both from Material's variables so schemes still apply. */
                var rough =
                  ".rough-node > g:first-child > path:first-child{stroke:var(--md-mermaid-node-bg-color)!important}" +
                  ".rough-node > g:first-child > path:nth-child(2){stroke:var(--md-mermaid-node-fg-color)!important}";
                extra.look = "handDrawn";
                extra.handDrawnSeed = 7;
                extra.themeCSS = (config && config.themeCSS ? config.themeCSS : "") + rough;
              }
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
  setupAppearance(tokens());
  splitDecisionNumbers();
  applyWords();
})();
