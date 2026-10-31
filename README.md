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
