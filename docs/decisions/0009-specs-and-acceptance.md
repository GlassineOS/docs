# 0009 — Specs per repository, acceptance in images

## Context

GlassineOS is spread across many repositories, each with its own release cycle. Agents
need written intent to work from, without a heavy process for exploratory hardware work.

## Decision

- [Spec Kit](https://github.com/github/spec-kit) (pinned version) in every code
  repository, with one organization preset (`glassine`, in `GlassineOS/.github`)
  providing the shared constitution and spec template.
- Each repository pins `GlassineOS/.github` as a git submodule (`.glassine/org`);
  Dependabot proposes updates and a soft CI check warns when it falls behind.
- Interfaces between repositories are owned and versioned by one repository; consumers pin
  a version.
- End-to-end behaviour is specified and tested only as product acceptance in the
  `images` repository: high-level behavioural scenarios on hardware, never repeating
  library tests.
- Investigations stay in issues until they become a feature or fix; cross-repository
  decisions stay decision records here.

## Status

Accepted 2026-10-03.
