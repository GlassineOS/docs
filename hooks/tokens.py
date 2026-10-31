"""MkDocs hook: turn theme/tokens.json into the theme's CSS variables.

theme/tokens.json is the single source of truth for the three voices (White,
Editorial, Stationery), their pens and the three schemes. At build time this hook

  - writes assets/stylesheets/tokens.css (the --gl-* variables), and
  - puts a short summary (voices, pens, schemes, words, defaults) into
    config.extra.glassine_theme for the templates: the Appearance panel in the header
    and the script that applies the reader's choice before the page renders.

In token values, {name} refers to another token of the same voice and scheme and
becomes var(--gl-name). Nothing else is rewritten: values are plain CSS.
"""
import json
import pathlib
import re

from mkdocs.structure.files import File

TOKENS = pathlib.Path(__file__).resolve().parent.parent / "theme" / "tokens.json"
OUT = "assets/stylesheets/tokens.css"
REF = re.compile(r"\{([a-z0-9-]+)\}")

_css = ""


def _value(value):
    return REF.sub(lambda m: f"var(--gl-{m.group(1)})", str(value))


def _block(selector, props):
    lines = [f"  --gl-{k}: {_value(v)};" for k, v in props.items()]
    return selector + " {\n" + "\n".join(lines) + "\n}\n"


def _voice_sel(voice, default):
    sel = f'[data-gl-voice="{voice}"]'
    # Without JavaScript the body carries no voice attribute: it gets the default.
    return f":is({sel}, body:not([data-gl-voice]))" if voice == default else sel


def _house(pens):
    return next(k for k, p in pens.items() if p.get("slot") == "house")


def build(tokens):
    default = tokens["defaults"]["voice"]
    structure = tokens["structure"]
    eink = tokens["schemes"]["eink"]["colours"]
    out = [
        "/* Generated from theme/tokens.json by hooks/tokens.py: edit the JSON, not this file. */\n",
        _block(":root", {
            "unit": structure["unit"],
            "measure": structure["measure"],
            **{f"g{i}": g for i, g in enumerate(structure["greys"])},
        }),
    ]
    for vid, voice in tokens["voices"].items():
        vsel = _voice_sel(vid, default)
        words = {f"word-{k}": json.dumps(w, ensure_ascii=False) for k, w in voice["words"].items()}
        num = voice["numbering"]
        numbering = {
            "num-list": num["style"],
            "num-prefix": json.dumps(num["prefix"], ensure_ascii=False),
            "num-suffix": json.dumps(num["suffix"], ensure_ascii=False),
            "num-circled": "1" if num["circled"] else "0",
        }
        out.append(f"/* ---- {voice['label']} */\n")
        out.append(_block(vsel, {**voice["fonts"], **voice["type"], **voice["shape"], **numbering, **words}))
        house = _house(voice["pens"])
        colours = voice["colours"]
        for scheme in ("paper", "night"):
            props = dict(colours[scheme])
            pen = voice["pens"][house]
            props.update(pen.get(scheme, {k: v for k, v in pen.items() if k not in ("label", "slot")}))
            out.append(_block(f'{vsel}[data-md-color-scheme="{scheme}"]', props))
        for pid, pen in voice["pens"].items():
            for scheme in ("paper", "night"):
                props = pen.get(scheme, {k: v for k, v in pen.items() if k not in ("label", "slot")})
                if pid == house:
                    continue
                out.append(_block(f'[data-gl-voice="{vid}"][data-gl-pen="{pid}"][data-md-color-scheme="{scheme}"]', props))
        # E-ink: greys only, the same for every pen (no pen block matches this scheme).
        out.append(_block(f'{vsel}[data-md-color-scheme="eink"]', {**eink, **colours.get("eink", {})}))
    return "".join(out)


def summary(tokens):
    return {
        "defaults": tokens["defaults"],
        "voices": [
            {
                "id": vid,
                "label": v["label"],
                "tag": v["tag"],
                "words": v["words"],
                "pen_word": v["words"]["pen"],
                "house": _house(v["pens"]),
                "pens": [{"id": pid, "label": p["label"], "slot": p["slot"]} for pid, p in v["pens"].items()],
            }
            for vid, v in tokens["voices"].items()
        ],
        "schemes": [{"id": sid, "label": s["label"], "sub": s["sub"]} for sid, s in tokens["schemes"].items()],
    }


def on_config(config):
    global _css
    tokens = json.loads(TOKENS.read_text(encoding="utf-8"))
    _css = build(tokens)
    config.extra["glassine_theme"] = summary(tokens)
    return config


def on_files(files, config):
    files.append(File.generated(config, OUT, content=_css))
    return files


def on_serve(server, config, builder):
    server.watch(str(TOKENS))
    return server
