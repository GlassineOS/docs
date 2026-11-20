# 0005 — Version scheme

## Decision

| Artifact | Scheme |
|---|---|
| Images | calendar versions `YYYY.MM.DD`: the UTC day the base was built; bases built on the same day share it and differ by id |
| Our libraries and daemons | semantic versioning |
| Forks | `<upstream version>-glassine<N>` |

Every released artifact gets a changelog entry.

## Status

Accepted 2026-10-03.
