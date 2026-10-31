# Decisions

Architecture decision records. Each record states the context, the decision and its
consequences. A changed decision gets a new record that supersedes the earlier one,
and both say so. A record's reasoning may be revised in place; its Status gives the
date.

| # | Decision | Status |
|---|---|---|
| [0001](0001-independent-alpine-distribution.md) | GlassineOS is an independent Alpine-based distribution | accepted 2026-10-03 |
| [0002](0002-licenses.md) | Licenses | accepted 2026-10-03 |
| [0003](0003-contribution-model.md) | AI-assisted contribution model, no DCO, nothing upstream unsolicited | accepted 2026-10-03 |
| [0004](0004-domain-and-ids.md) | Domain `glassine.org` and `org.glassine.*` IDs | accepted 2026-10-03 |
| [0005](0005-versioning.md) | Version scheme | accepted 2026-10-03 |
| [0006](0006-data-encryption.md) | User data: LUKS2 data volume unlocked at login | accepted 2026-10-03, revised 2026-10-31 |
| [0007](0007-recovery-mainline-twrp.md) | Recovery: TWRP on the mainline kernel first | accepted 2026-10-03 |
| [0008](0008-bring-your-own-stock-kernel.md) | Stock-kernel flavor: bring your own kernel | accepted 2026-10-03 |
| [0009](0009-specs-and-acceptance.md) | Specs per repository (Spec Kit + org preset), acceptance in images | accepted 2026-10-03 |
| [0010](0010-root-and-deployments.md) | Root file system: read-only bases, deployments, live packages | accepted 2026-10-28 |

Template for new records: copy any record and keep the four headings
(Context, Decision, Consequences, Status).
