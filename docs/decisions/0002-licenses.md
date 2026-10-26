# 0002 — Licenses

## Context

Code needs to flow in several directions: into the kernel one day, into apps that use our
libraries, and back to the upstream projects we fork.

## Decision

| Code | License |
|---|---|
| Our daemons, shell, settings, tools, the e-ink engine | GPL-2.0-or-later |
| Client libraries that apps link | LGPL-2.1-or-later or MIT |
| Wayland protocol files | MIT |
| Commits in forks | the upstream project's license |
| Android-side repositories, if any | Apache-2.0 |
| Documentation | CC-BY-SA-4.0 |

## Consequences

- GPL-2.0-or-later keeps the engine compatible with the kernel (GPL-2.0-only) should
  parts move there.
- Every release must point to the exact sources of the GPL binaries it contains.

## Status

Accepted 2026-10-03.
