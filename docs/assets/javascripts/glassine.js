/* GlassineOS docs theme: the voice and pen buttons, the voice's words, decision
   numbers in the navigation, and Mermaid diagrams in the voice's face. Everything here
   is optional: without JavaScript the pages keep the White voice, its house pen and
   Material's diagrams.

   The voices and pens are read from the header buttons' data (generated from
   theme/tokens.json); the words from the --gl-word-* variables of the current voice. */
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

  function setupSwitches(T) {
    var voiceButton = document.querySelector("[data-gl-switch=voice]");
    var penButton = document.querySelector("[data-gl-switch=pen]");
    if (!T || !voiceButton || !penButton) return;

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

    function next(list, item) {
      return list[(list.indexOf(item) + 1) % list.length];
    }

    function sync() {
      var v = voice(), p = pen(v), nv = next(T.voices, v), np = next(v.pens, p);
      voiceButton.querySelector(".gl-switch__name").textContent = v.label;
      voiceButton.setAttribute("aria-label", "Voice: " + v.label + ". Switch to " + nv.label);
      voiceButton.title = voiceButton.getAttribute("aria-label");
      penButton.querySelector(".gl-switch__name").textContent = p.label;
      penButton.setAttribute("aria-label", v.pen_word + ": " + p.label + ". Switch to " + np.label);
      penButton.title = penButton.getAttribute("aria-label");
      applyWords();
    }

    voiceButton.addEventListener("click", function () {
      var v = next(T.voices, voice());
      var stored = null;
      try { stored = localStorage.getItem("gl-pen-" + v.id); } catch (e) { /* private mode */ }
      var p = v.pens[0];
      for (var i = 0; i < v.pens.length; i++) {
        if (v.pens[i].id === (stored || v.house)) p = v.pens[i];
      }
      body.setAttribute("data-gl-voice", v.id);
      body.setAttribute("data-gl-pen", p.id);
      store("gl-voice", v.id);
      sync();
      /* Diagrams are drawn once, in the voice's face: draw them again. */
      if (document.querySelector(".mermaid svg")) location.reload();
    });

    penButton.addEventListener("click", function () {
      var v = voice(), p = next(v.pens, pen(v));
      body.setAttribute("data-gl-pen", p.id);
      store("gl-pen-" + v.id, p.id);
      sync();
    });

    sync();
    voiceButton.hidden = false;
    penButton.hidden = false;
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
  setupSwitches(tokens());
  splitDecisionNumbers();
  applyWords();
})();
