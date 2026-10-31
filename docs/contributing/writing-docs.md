# Writing docs

## Principles

- **Facts, present tense, forward-looking.** Say what is true and what to do. The
  story of how we found out belongs in [Dead ends](../dead-ends/index.md) or a decision
  record, in one short paragraph at most.
- **Every hardware fact carries a verification date:** *verified on hardware
  2026-10-02*. A fact without hardware verification says so: *from source, untested*.
- **One topic, one place.** Link instead of repeating. Code-level details live in the
  repository that holds the code.
- **Warnings come with an exit.** Every "this can brick your device" names how to get
  out of it.
- **Plain language.** Short sentences, terms explained once, tables for comparisons.

## Never publish

- Serial numbers, MAC addresses, Wi-Fi names, local paths, personal data.
- Vendor firmware, binaries, partition dumps, RAM dumps.
- Decompiler output from vendor binaries (written specifications are fine).

The safety scan blocks most of these, but not all. Read your diff.

## Page types

| Type | Where | Template |
|---|---|---|
| Device page | `devices/<codename>/index.md` | headings of the Note Air page |
| Guide | `guides/` | context · steps · how to undo · verified on |
| Architecture | `architecture/` | purpose · design · interfaces · open questions |
| Decision | `decisions/NNNN-*.md` | context · decision · consequences · status |
| Dead end | `dead-ends/index.md` | tried · happened · stopped because · instead · date |

## Marks

Plain Markdown covers almost everything. A few optional marks are styled by the theme;
none of them carries meaning that the text doesn't already say.

| Write | Gives |
|---|---|
| `==text==` | a highlighter mark |
| `*text*{ .gl-note }` at the start of a paragraph | a hand-written note beside the paragraph |
| `**Verified on hardware** Note Air · 2026-10-02` + `{ .gl-verified }` on the next line | a stamp |
| `**From source** untested on hardware` + `{ .gl-untested }` on the next line | a dashed stamp |
| `---` | a drawn rule |

Admonition types differ by shape: `note` (grey sheet), `tip` (dashed, hand-written
title), `warning` (ink border, tab), `danger` (thick border, no undo).

## Preview

```sh
pip install -r requirements.txt
pip install -e "../search[build]"   # the search plugin, from a GlassineOS/search checkout
GLASSINE_SEARCH_PROFILES=static mkdocs serve
```
