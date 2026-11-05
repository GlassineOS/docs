# 0013 — Images from Dockerfile stages, built with BuildKit

## Context

Images were built by a script using Alpine's root file system tools, and the plan was to
grow a builder from it. That approach has no place for e-ink files in `/etc/skel` or for
a device's system configuration apart from the generic system, so every target would
become its own 2 GB image. A new build takes hours, because nothing is cached between
steps. Builds have also failed on inputs nobody declared: files missing from a checkout,
quoting in long shell blocks.

A base is still what [0010](0010-root-and-deployments.md) says: a read-only btrfs
subvolume, delivered as send streams. What changes is how its tree is made.

## Decision

- **Images are built from Dockerfile stages, run by BuildKit.** Plain multi-stage builds:
  no feature system, no second build language. Dockerfiles describe the build; BuildKit
  only runs it. Alpine stays the only distribution we build.
- **The stages separate what today is one image:** `alpine` → `glassine-common` → `eink`
  → `device-<name>`, then a validation stage. A new device adds a stage and rebuilds
  nothing above it. No device names in the generic stages.
- **The kernel is its own stage**, outside the root file system chain, and replaces the
  kernel package. It is compiled per SoC where a device doesn't need its own
  configuration. Device trees and the initramfs are stages of their own, and the boot
  image is the last stage, joining them. A kernel change doesn't rebuild the root, and a
  root change doesn't rebuild the kernel.
- **One lockfile per stage**, with the exact versions it installed. A stage installs plain
  package names and fails if the result differs from its lockfile, so `/etc/apk/world`
  never carries pinned versions and live upgrades keep working. A weekly pull request
  refreshes the lockfiles, and a security fix triggers it early.
- **Published stages are the record of old builds.** CI on `main` pushes each stage to
  GHCR, kept by digest. We don't run an Alpine mirror, so an old base is restored from
  its stages, not rebuilt by rerunning.
- **The tree comes from BuildKit's tar export**, and becomes a base through the existing
  method: a new subvolume, or a snapshot of the parent with the new tree synced in by
  content, then send streams. A stage image from the registry is a cache, not a source
  for the tree.
- **The person's computer builds the stream**, and it goes to the device over USB. Hosted
  streams and an online updater come later.
- **No vendor firmware in any stage, cache or stream.** A build check enforces it, by
  content.
- **The build makes artifacts and never touches a running system.** Deployments, tries,
  rollback, reset and live packages stay as [0010](0010-root-and-deployments.md) and the
  `boot` repository define them.
- **The definition lives in the `images` repository.** `builders` keeps only toolchain
  images.

## Consequences

- Changing a device's configuration reruns only that stage. A spike measured it on a
  sample chain of 627 Alpine packages (arm64 emulated on one amd64 computer): 12 s to
  build, a 4 KiB delta, under a minute from the edit to a checked stream.
- Rebuilds give small deltas, because the sync compares content: a rebuild with nothing
  cached gave 152 KiB, a package added at the bottom of the chain 1 MiB. Rewritten
  timestamps cost a few bytes per file.
- BuildKit's tar export keeps owners, modes, hardlinks, file capabilities and xattrs.
  Image layers drop `user.*` xattrs, which is why the tree comes from the tar export.
- Building needs Docker with BuildKit on a stock Linux computer. Making the btrfs
  subvolume needs a privileged container with loop devices, unless a check finds a simple
  unprivileged way.
- Every file in today's image is sorted into a package, a stage or dropped. Inputs built
  by hand become package recipes or tagged inputs: no stage reads an untracked file.
- The validation stage is where files a build leaves behind are caught, such as a filled
  `/etc/machine-id` ([hub#19](https://github.com/GlassineOS/hub/issues/19)).
- The old image scripts stay the working build until the first base from the stages has
  been used daily, then they and the kernel package are removed.

## Status

Accepted 2026-11-03, amended 2026-11-05 (kernel, device tree, initramfs and boot image as
separate stages). [0001](0001-independent-alpine-distribution.md) was revised to match.
The spike from BuildKit export to btrfs streams passed. Nothing else is built yet. Plan
and order: [GlassineOS/hub#8](https://github.com/GlassineOS/hub/issues/8).
