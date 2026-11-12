# GlassineOS documentation

Source of [docs.glassine.org](https://docs.glassine.org): devices, guides,
architecture, decision records and dead ends.

```sh
pip install -r requirements.txt
pip install -e "../search[build]"   # the search plugin, from a GlassineOS/search checkout
mkdocs serve        # preview at http://127.0.0.1:8000
mkdocs build        # strict build, fails on broken links
```

`GLASSINE_SEARCH_PROFILES=static mkdocs serve` skips the transformer model for a
quicker preview.

## Look

Colours, fonts, type and spacing come from Interleaf's web form (`web/` of
[GlassineOS/ui](https://github.com/GlassineOS/ui)) at the version in `theme/ui.ref`.
The build serves it at `assets/webform/`, taken from that ref of `$GLASSINE_UI` (a ui
clone), else of a `../ui` checkout beside this one, else of a clone in `.cache/ui`
(the first build needs the network). `GLASSINE_UI_REF=<ref>` builds another version;
a pull request that changes `theme/ui.ref` moves the site to it.

`docs/assets/stylesheets/` holds the site's layout on top of Material and the web form:
`glassine.css` (the structure and the White voice) and `voices.css` (the site's parts
per voice, composed from the web form's variables, and what Editorial and Stationery
draw differently). The Appearance panel's names and words are `theme/appearance.json`.

## Search from a terminal

```sh
pip install "git+https://github.com/GlassineOS/search"
glassine-docs search "how do I get back into recovery if the system doesn't boot"
glassine-docs search "EDL" --profile static --json
```

Results link to the page and heading they come from and name the docs commit. See
[Search](docs/architecture/search.md).

See [Writing docs](docs/contributing/writing-docs.md) for the rules.

Text is licensed CC-BY-SA-4.0 (`LICENSE`).
