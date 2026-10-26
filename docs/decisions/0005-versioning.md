# 0005 — Version scheme

## Decision

| Artifact | Scheme |
|---|---|
| Images | calendar versions `YYYY.MM[.patch]`, tied to the Alpine release they are based on |
| Our libraries and daemons | semantic versioning |
| Forks | `<upstream version>-glassine<N>` |

Every released artifact gets a changelog entry.

## Status

Accepted 2026-10-03.
