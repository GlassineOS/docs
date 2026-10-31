# 0011 — Semantic search over the documentation

## Context

The documentation will keep growing, and every repository's coding agents, the device's
own tools and the readers of this site need to find what it says. Keyword search alone
misses paraphrases; an agent that reads the whole text gets slower and costlier as it
grows. A search that works by meaning has to stay cheap where it runs: in a browser on
an e-ink device, on arm64 musl systems, and offline.

## Decision

- **One build in the docs CI, published with the site.** On every change to `main`, CI
  splits the pages into chunks at headings, builds a keyword (BM25) index of them and
  embeds them. The result is served from `docs.glassine.org/search/`, not as run
  artifacts: no login, no expiry, one fixed address.
- **Two embedding profiles over the same chunks.** A query is always embedded with its
  own profile's model; the profiles' vectors are never mixed.
- **`static`:** a static embedding model (token lookup and average, no transformer
  layers, a few MB), vectors cut to 256 dimensions and stored binary, with int8 copies
  to rescore the best candidates. For the website and the device's tools.
- **`transformer`:** a small transformer embedding model (ONNX, int8), int8 vectors at
  full size. For coding agents.
- **Files, not a database server.** `chunks.json` (text, page, anchor), the BM25 index,
  one vector file per profile and `manifest.json` (docs commit, sources, and per profile
  the model, its sha256, dimensions, quantization and the vector file's hash). Search is
  a full scan; no approximate index is needed at this size.
- **Results combine keywords and meaning** by reciprocal rank fusion, so exact terms
  (partition names, commands, package names) are found as reliably as paraphrases.
- **Chunk IDs name their source**: `docs@<commit>:<page>#<anchor>`. Every result links
  to the page and heading it came from.
- **Models are pinned and mirrored.** Each model is pinned by sha256 and mirrored as a
  release asset, so clients don't depend on a third-party model host. Only models under
  MIT or Apache-2.0 licences.
- **Cheap updates.** CI re-embeds only chunks whose text changed (a cache keyed by chunk
  hash and model). Clients check the manifest with an ETag and download a profile's
  files only when their hash changes, the model once into `~/.cache/glassine/`.
- **The website search is semantic for everyone.** The first focus on, or key in, the
  search box loads the static model and vectors in a web worker. Keyword results show
  at once and are re-ranked when the vectors arrive. Pages that no one searches from load
  nothing extra. File names carry content hashes, and the browser revalidates them by
  ETag (GitHub Pages sets no custom cache headers), so an unchanged file costs one short
  request.
- **Related pages** on each page are computed in CI from the vectors, so readers load no
  model for them.
- **Agents use one tool.** `glassine-docs search "<query>"` returns the best chunks with
  their links and the docs commit. It uses the `transformer` profile by default and the
  `static` profile with `--profile static`. The org-sync job adds one line to every
  repository's `CLAUDE.md` that names this tool as the entry point to project knowledge.
- **Only published documentation goes in.** Nothing private: no lab notes, no
  unpublished drafts.

## Consequences

- Every repository's agents get the same search, with links they can cite, at the cost
  of one model download.
- The site gains a few MB of downloads for readers who search, once per docs or model
  change.
- Changing a profile's model rebuilds that profile's vectors; clients follow the
  manifest.
- The docs CI gets an embedding step and a model cache.

## Status

Accepted 2026-10-31. Open:

- Which profile computes the related pages.
- How the vector results join the theme's own search: hooks into its results list, or
  our own results component beside it. A prototype decides.
- The models of both profiles.
- Wider scope: the index is meant to hold all project knowledge eventually, either by
  moving it into the documentation or as an index across the organisation's
  repositories that links into each. The chunk IDs and the manifest's source list allow
  both.
