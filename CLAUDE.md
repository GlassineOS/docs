# CLAUDE.md — GlassineOS/docs

Public documentation site (MkDocs Material, `mkdocs build` must pass in strict mode).
Rules for writing are in `docs/contributing/writing-docs.md`; follow them.

## Distilling from the lab notebook

Content comes from the private lab notebook (diaries, summaries, phase docs, agent
memories) through the distillation pipeline. When distilling:

1. Take facts only from confirmed sources (summary, phase and device docs, hardware
   verification). Diaries contain retracted theories: use them for context and dates,
   never as the source of a fact.
2. Classify each fact: device fact · procedure · pitfall · decision · dead end ·
   obsolete · private. Private and obsolete facts don't come here.
3. Merge per topic; the newest hardware-verified result wins. Write one current
   statement with its verification date.
4. One pull request per topic. The maintainer reviews every one.

## Never

- Lab paths, session numbers, agent memory names, serial numbers, MAC addresses, local
  paths, vendor material or decompiler output.
- `Signed-off-by` lines. Commits carry an `Assisted-by:`/`Co-Authored-By:` trailer.
- Softening the hobby/AI/unreviewed disclaimer.
