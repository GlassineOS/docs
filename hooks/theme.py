"""MkDocs hook: the site's looks from Interleaf's web form, the Appearance panel's copy.

The colours, fonts, type and spacing come from the web form of GlassineOS/ui
(web/: tokens.css, bundle.css, combinations.json, fonts/) at the version pinned in
theme/ui.ref. At build time this hook

  - takes web/ at that ref from a GlassineOS/ui clone and serves it, whole, at
    assets/webform/ (the clone: $GLASSINE_UI, else ../ui beside this repository,
    else a clone in .cache/ui; $GLASSINE_UI_REF overrides the pinned ref). Files come
    from the ref itself (git archive), never from the clone's working tree, so a
    local checkout on another branch still builds the pinned version;
  - checks that theme/appearance.json names exactly the voices, schemes and pens of
    web/combinations.json;
  - writes assets/stylesheets/words.css (each voice's words as --gl-word-*
    variables, for CSS content and glassine.js), and
  - puts the panel's copy into config.extra.glassine_theme for the templates: the
    Appearance panel in the header and the script that applies the reader's choice
    before the page renders.
"""
import io
import json
import os
import pathlib
import shutil
import subprocess
import tarfile

from mkdocs.exceptions import PluginError
from mkdocs.structure.files import File

ROOT = pathlib.Path(__file__).resolve().parent.parent
REF_FILE = ROOT / "theme" / "ui.ref"
APPEARANCE = ROOT / "theme" / "appearance.json"
CACHE = ROOT / ".cache"
UI_URL = "https://github.com/GlassineOS/ui"
SERVE = "assets/webform"
WORDS = "assets/stylesheets/words.css"

_web = None
_words = ""


def _git(clone, *args, **kw):
    return subprocess.run(["git", "-C", str(clone), *args], check=True, capture_output=True, **kw).stdout


def _clone():
    env = os.environ.get("GLASSINE_UI")
    if env:
        path = pathlib.Path(env)
        if not (path / ".git").exists():
            raise PluginError(f"GLASSINE_UI={env}: not a git clone of GlassineOS/ui")
        return path
    beside = ROOT.parent / "ui"
    if (beside / ".git").exists() and (beside / "interleaf").is_dir():
        return beside
    path = CACHE / "ui"
    if not (path / ".git").exists():
        CACHE.mkdir(exist_ok=True)
        subprocess.run(["git", "clone", "-q", "--no-checkout", UI_URL, str(path)], check=True)
    return path


def _commit(clone, ref):
    for name in (ref, f"origin/{ref}"):
        try:
            return _git(clone, "rev-parse", "--verify", "-q", f"{name}^{{commit}}", text=True).strip()
        except subprocess.CalledProcessError:
            pass
    return None


def _webform():
    """The directory holding web/ at the pinned ref, extracted once per commit."""
    ref = os.environ.get("GLASSINE_UI_REF") or REF_FILE.read_text(encoding="utf-8").strip()
    clone = _clone()
    commit = _commit(clone, ref)
    if not commit:
        subprocess.run(["git", "-C", str(clone), "fetch", "-q", "--tags", "origin"], check=True)
        commit = _commit(clone, ref)
    if not commit:
        raise PluginError(f"GlassineOS/ui has no ref {ref!r} (theme/ui.ref)")
    out = CACHE / "webform" / commit
    if not (out / "tokens.css").is_file():
        archive = _git(clone, "archive", "--format=tar", commit, "web")
        tmp = out.with_name(commit + ".tmp")
        shutil.rmtree(tmp, ignore_errors=True)
        with tarfile.open(fileobj=io.BytesIO(archive)) as tar:
            tar.extractall(tmp, filter="data")
        out.parent.mkdir(parents=True, exist_ok=True)
        (tmp / "web").rename(out)
        tmp.rmdir()
    for name in ("tokens.css", "bundle.css", "combinations.json", "fonts/fonts.css"):
        if not (out / name).is_file():
            raise PluginError(f"GlassineOS/ui {ref}: web/{name} is missing")
    return out


def _check(appearance, combinations):
    have = {(c["voice"], c["scheme"], c["pen"]) for c in combinations["combinations"]}
    want = {
        (vid, sid, p["pen"])
        for vid, v in appearance["voices"].items()
        for sid in appearance["schemes"]
        for p in v["pens"]
    }
    if have != want:
        raise PluginError(
            "theme/appearance.json does not match the web form's combinations: "
            f"missing {sorted(have - want)}, unknown {sorted(want - have)}"
        )


def _words_css(appearance):
    out = ["/* Generated from theme/appearance.json by hooks/theme.py: the voices' words. */\n"]
    for i, (vid, v) in enumerate(appearance["voices"].items()):
        sel = f'[data-theme^="{vid}"]'
        if i == 0:
            sel = ":root, [data-theme], " + sel
        props = "".join(
            f"  --gl-word-{k}: {json.dumps(w, ensure_ascii=False)};\n" for k, w in v["words"].items()
        )
        out.append(f"{sel} {{\n{props}}}\n")
    return "".join(out)


def _summary(appearance):
    return {
        "defaults": appearance["defaults"],
        "voices": [
            {
                "id": vid,
                "label": v["label"],
                "tag": v["tag"],
                "words": v["words"],
                "pen_word": v["words"]["pen"],
                "pens": [{"pen": p["pen"], "id": p["id"], "label": p["label"], "slot": p["slot"]} for p in v["pens"]],
            }
            for vid, v in appearance["voices"].items()
        ],
        "schemes": [{"id": sid, "label": s["label"], "sub": s["sub"]} for sid, s in appearance["schemes"].items()],
    }


def on_config(config):
    global _web, _words
    _web = _webform()
    appearance = json.loads(APPEARANCE.read_text(encoding="utf-8"))
    _check(appearance, json.loads((_web / "combinations.json").read_text(encoding="utf-8")))
    _words = _words_css(appearance)
    config.extra["glassine_theme"] = _summary(appearance)
    return config


def on_files(files, config):
    for path in sorted(p for p in _web.rglob("*") if p.is_file()):
        uri = f"{SERVE}/{path.relative_to(_web).as_posix()}"
        files.append(File.generated(config, uri, abs_src_path=str(path)))
    files.append(File.generated(config, WORDS, content=_words))
    return files


def on_serve(server, config, builder):
    server.watch(str(APPEARANCE))
    server.watch(str(REF_FILE))
    return server
