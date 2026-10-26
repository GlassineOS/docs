# 0008 — Stock-kernel flavor: bring your own kernel

## Context

A fallback image flavor runs on the vendor's own kernel. The vendor never published its
source, so we may not distribute the binary.

## Decision

The installer reads the kernel from the user's own device, prepares it locally (allowing
our modules, built against that kernel's symbol versions), flashes it, and deletes the
temporary copy. Nothing is uploaded, cached or shipped. Unknown kernel versions are
refused with a clear message.

## Consequences

- No vendor binary passes through GlassineOS infrastructure.
- CI builds our modules for each known vendor kernel version.

## Status

Accepted 2026-10-03.
