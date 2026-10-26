# 0001 — An independent Alpine-based distribution

## Context

GlassineOS started as Alpine Linux on a Boox Note Air, at first described as
"postmarketOS-style". It never used postmarketOS components: the image was plain Alpine,
and the kernel, initramfs, boot images and device services were our own. postmarketOS
does not accept contributions made fully or in part with generative AI. GlassineOS is
developed largely with AI coding agents and will stay that way.

## Decision

GlassineOS is an independent distribution based on Alpine Linux. It does not depend on
postmarketOS tooling, packages or branding. Images are built with Alpine-native tooling
from our own package repository.

## Consequences

- Alpine is the only upstream for the base system, security updates and release cadence
  (about every six months).
- Device, kernel, boot, firmware-extraction and Qualcomm service packages are ours to
  maintain.
- postmarketOS documentation and packages may be read and reused under their licenses,
  with attribution. We don't send them contributions and don't bring AI-made work into
  their spaces.
- Our findings are published in these docs for anyone to use.

## Status

Accepted 2026-10-03.
