# Decisions

Architecture decision records. Each record states the context, the decision and its
consequences, and always says what is decided now. A changed decision is edited in
place, and its Status gives the date of the change; earlier versions are in the git
history. A new record is written only for a new decision. No record keeps text that
no longer holds.

| # | Decision | Status |
|---|---|---|
| [0001](0001-independent-alpine-distribution.md) | GlassineOS is an independent Alpine-based distribution | accepted 2026-10-03, revised 2026-11-05 |
| [0002](0002-licenses.md) | Licenses | accepted 2026-10-03 |
| [0003](0003-contribution-model.md) | AI-assisted contribution model, no DCO, nothing upstream unsolicited | accepted 2026-10-03 |
| [0004](0004-domain-and-ids.md) | Domain `glassine.org` and `org.glassine.*` IDs | accepted 2026-10-03 |
| [0005](0005-versioning.md) | Version scheme | accepted 2026-10-03 |
| [0006](0006-data-encryption.md) | User data: LUKS2 data volume unlocked at login | accepted 2026-10-03, revised 2026-10-31 |
| [0007](0007-recovery-mainline-twrp.md) | Recovery: one GlassineOS recovery, other systems' recoveries as secondary | accepted 2026-10-03, revised 2026-11-12 |
| [0008](0008-bring-your-own-stock-kernel.md) | Stock-kernel flavor: bring your own kernel | accepted 2026-10-03 |
| [0009](0009-specs-and-acceptance.md) | Specs per repository (Spec Kit + org preset), acceptance in images | accepted 2026-10-03 |
| [0010](0010-root-and-deployments.md) | Root file system: read-only bases, deployments, live packages | accepted 2026-10-28, revised 2026-11-05 |
| [0011](0011-semantic-search.md) | Semantic search over the documentation: static and transformer profiles | accepted 2026-10-31 |
| [0012](0012-where-documentation-lives.md) | Where documentation lives, and what the search index covers | proposed 2026-11-03 |
| [0013](0013-images-from-dockerfile-stages.md) | Images from Dockerfile stages, built with BuildKit | accepted 2026-11-03, amended 2026-11-05 |
| [0014](0014-installation-and-provisioning.md) | Installation: one guided flow, device descriptions, platform backends | accepted 2026-11-12 |

Template for new records: copy any record and keep the four headings
(Context, Decision, Consequences, Status).
