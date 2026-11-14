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

## Where a page belongs

Ask one question: must this text change in the same commit as the code? If so, it belongs
in that code repository. If not, it belongs here.

| Where | What |
|---|---|
| This repository | Cross-cutting and explanatory documentation: architecture, decisions, guides, device pages, dead ends |
| The code repository | README, build and usage notes, CLI and configuration reference, specs |

Where the two meet, the page here owns the design and the reasons. The repository owns
exact names and flags, and the page links to it. [Decision
0012](../decisions/0012-where-documentation-lives.md) has the reasons.

## Indexing a repository's documentation

[Decision 0012](../decisions/0012-where-documentation-lives.md) lets the search index
cover the documentation of other public repositories. Only that repository's
documentation folder is indexed: a README or a spec outside it is not.

To ask for a repository to be indexed, open a pull request to this repository that adds an
entry to
[`search-sources.toml`](https://github.com/GlassineOS/docs/blob/main/search-sources.toml):
the repository, its documentation folder and a full commit. A maintainer reviews it, and
moving the pin later is another reviewed pull request. The repository must be public, since
the build fetches it without credentials and a private entry fails the build.

Not yet: the list has no entries and the docs CI doesn't read it. The search build has to
be released and its pin moved first, so the index holds this site only for now. The field
names may change until then.

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
