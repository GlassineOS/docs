# 0012 — Where documentation lives, and what the search index covers

## Context

GlassineOS documentation sits in two kinds of place: this site and the code
repositories. [0009](0009-specs-and-acceptance.md) keeps specs per repository.
[0011](0011-semantic-search.md) leaves open whether all project knowledge moves into
this site, or the search index spans the repositories and links into each. More pages
are coming, and contributors need one rule for where a page belongs.

Two things pull apart. A reference for commands and settings goes stale unless it
changes in the same commit as the code. The reasons behind a design, and anything that
crosses repositories, have no single code repository to live in.

0011 says the chunk IDs and the manifest's source list allow several sources. Checked
against `GlassineOS/search` at the commit the docs CI pins, that holds for the ID format
and the shape of the manifest, not for the build: it reads one source and writes one.

## Decision

- **In this repository:** cross-cutting and explanatory documentation: architecture,
  decisions, guides, device pages, dead ends.
- **In each code repository:** documentation that must change in the same commit as the
  code: README, build and usage notes, CLI and configuration reference, specs (per
  0009).
- **Where they meet:** the page here owns the design and the reasons. The repository owns
  exact names and flags, and the page links to it.
- **The search index spans repositories; the pages stay where they are.** The manifest's
  source list is extended so the docs CI can index the documentation folders of listed
  public repositories at pinned commits. Chunk IDs take the form
  `<repo>@<commit>:<page>#<anchor>`; the `docs@…` IDs of 0011 are this form already.
- **Repositories that are not public stay out,** per 0011 ("only published documentation
  goes in"). The build fetches each source without credentials, so a private entry fails
  the build; it is not skipped.
- **The list of sources is a file in this repository** that the docs CI reads, as the
  build's input. The build doesn't hold the list itself. Pins move by reviewed pull
  request, as `GLASSINE_SEARCH_REF` does.
- **The website's search shows results from other repositories too,** not only
  `glassine-docs search`.

### The sources file

`search-sources.toml` at the root of this repository, outside `docs/`, so the site
doesn't publish it. Each `[[source]]` entry has three fields:

| Field | Meaning |
|---|---|
| `repository` | A public repository, as `GlassineOS/<name>` |
| `folder` | Its documentation folder, relative to the repository root |
| `commit` | The full commit to index; only a reviewed pull request changes it |

This entry is an illustration, not a source:

```toml
[[source]]
repository = "GlassineOS/example-repo"
folder = "docs"
commit = "<full 40-character commit>"
```

The file has no active entries. Adding a repository waits for the search build and a
released pin. The file is not wired yet: the docs CI pins `GLASSINE_SEARCH_REF` to a
build that doesn't read it. The field names may change until
[GlassineOS/search#1](https://github.com/GlassineOS/search/issues/1) lands.

## Consequences

- One question places a page: must it change in the same commit as the code? Then it
  belongs to the code repository.
- No page moves because of this record.
- Search results from a repository are as old as its pinned commit, and trail the code
  until the pin moves.
- A README or spec outside a repository's documentation folder is not indexed.
- The search build has to change first; until then the index holds this site only. The
  build needs an input list of sources, a way to fetch and render their pages, and links
  that leave the site. The site's search worker and the related pages also assume a
  single source. The full list is in
  [GlassineOS/search#1](https://github.com/GlassineOS/search/issues/1).

## Status

Accepted 2026-11-14. The two questions that were open when it was proposed:

- **Where the list of sources lives, and what moves its pins:** in this repository, in
  the sources file above. Pins move by reviewed pull request.
- **Whether the website's search shows other repositories' results:** yes. The search
  worker and the extra download that this means are part of
  [GlassineOS/search#1](https://github.com/GlassineOS/search/issues/1).

Until that work is released and the pin moves, the index holds this site only.
