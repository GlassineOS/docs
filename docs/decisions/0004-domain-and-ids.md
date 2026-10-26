# 0004 — Domain and identifiers

## Context

The package repository URL, the Flatpak remote and app IDs end up on every installed
device. Changing them later means pushing an update to every device.

## Decision

- Domain: `glassine.org` (subdomains `docs.`, `pkgs.`, `www.`).
- Reverse-DNS IDs for our apps and forks: `org.glassine.*` (for example
  `org.glassine.Rnote`).
- The GitHub organization is `GlassineOS`.

## Consequences

- Hosting can move (GitHub Pages first, object storage later) by changing DNS only.
- The domain must be verified in the GitHub organization to protect its Pages
  subdomains.

## Status

Accepted 2026-10-03.
