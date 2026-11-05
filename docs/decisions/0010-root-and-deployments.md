# 0010 — Root file system: read-only bases, deployments, live packages

## Context

On a root file system that is one mutable partition, a broken package or edit can
leave the device unbootable, updates can't be rolled back, and "reset the system" would
mean reinstalling. A device with no keyboard and a slow e-ink screen needs updates that
can't break it, and a reset that keeps the user's Wi-Fi and pairings when asked to.

Image-based designs solve this but make every package install a rebuild and a reboot.
Arkane Linux (arkdep) is the closest model: deployments with a writable `/etc` and
`/var` and a migrate list. It installs packages into a new deployment rather than
live. A new deployment receives only the files on its migrate list; other `/etc` edits
stay behind in the old one.

## Decision

- **Bases are read-only btrfs subvolumes** on the system partition. A new base is a
  snapshot plus changes, delivered as btrfs send streams: incremental from each of the
  last few bases plus one full stream, and the device takes the smallest one it can
  apply. For now the person's computer builds the streams and sends them over USB
  ([0013](0013-images-from-dockerfile-stages.md)). Later CI publishes them signed, and
  a stream is downloaded completely and its signature checked before it is applied.
  The device can build a base itself (snapshot + upgrade) when it is offline or in a
  hurry.
- **A deployment = a base + its own layers on the data partition**: a read-only build
  layer and a live upper (overlayfs). The root is **read-only by default**. `/etc`,
  `/var`, `/usr/local` and `/opt` stay writable; `/usr`, `/lib`, `/bin` and `/sbin` are
  guarded.
- **Packages install live** into the upper, through a wrapper that unlocks the root for
  that transaction and records it. The declarative record (which packages the user
  added) is derived from these transactions, not kept by hand. Packages, including our
  own and the base's, upgrade live within the same Alpine stable branch. `glassine
  unlock` opens the root for arbitrary edits.
- **Kernel modules and firmware are subvolumes per kernel release**, separate from the
  bases. The kernel itself is in the boot partition for now. Later the kernels are kept
  on the device's storage with a try counter and a fallback kernel, and handed to the
  bootloader by one **hand-off method per device**, from cleanest to last resort:
  kexec from a minimal loader in the boot partition; a hardboot (the boot image staged
  in RAM, then a warm reset into it); a cold boot of a kernel file whose storage blocks
  the bootloader reads; writing the boot partition. Kernel records, selection, tries
  and acceptance are the same on every device; only the hand-off differs. The Note Air
  can't use kexec (its power controller's channel doesn't come back afterwards) and
  goes to the block-list cold boot.
- **New deployments are tried before they count.** A candidate gets two boots, and is
  accepted only when the system has stayed healthy for two minutes. Otherwise the
  previous deployment boots again. Rollback lists the packages that would go down in
  version.
- **The switch happens at shutdown.** A new deployment is prepared in the background.
  At the next shutdown or reboot the user starts, with the charger or enough battery,
  persistent state is carried into a fresh layer and only then is the deployment
  selected. Persistent state is the migrate list and `/var/lib`. An interrupted switch
  selects nothing and is redone.
- **Two reset levels.** "Reset system" keeps the migrate list (network, pairings and
  similar). The full reset keeps only home. A reset is carried at the shutdown switch
  like an update, so changes made in between are kept. From the recovery it happens at
  once.
- **Conflicts work like apk's.** A kept file stays active, and the base's new default
  lands next to it as `.apk-new`. A downgrade stops and asks. User accounts are merged
  at the switch, and owners are remapped by name.
- **Hibernation stays safe.** A hibernated session is resumed only when nothing has
  touched the data partition since, and the same kernel build and deployment boot.
  Otherwise the image is cancelled before anything is mounted read-write.
- **Recovery.** The recovery partition holds the mainline recovery permanently. New
  kernels get a one-shot test boot through the device's hand-off method, with the
  watchdog armed, instead of being booted from the recovery partition. Kernel updates
  wait until this works.
- **One tool, `glassine-deploy`**, serves the running system and the recovery. Its
  formats and exit codes are owned by the `boot` repository.

## Consequences

- A broken update or edit can't damage a base. The worst case is a fallback boot to the
  previous deployment, or a bare boot of a base.
- Live installs keep the normal Alpine workflow. The price is the replay at each new
  base, and a derived record that has to stay correct.
- The system partition is formatted btrfs. Existing installs migrate from the mainline
  recovery: their root is archived on the data partition, and the first deployment's
  upper is built from its differences. The archive stays as the rollback.
- Space at a branch change: the stream is deduplicated against the parent base and the partition
  uses zstd. The base gets slimmer because heavy apps move to a first-boot setup
  (Flatpaks or user packages on the data partition). If a new base still doesn't fit
  next to the old one, that update has no rollback base and says so first.
- Kernel updates pause until the device's test boot works.

## Status

Accepted 2026-10-28. Revised 2026-10-30 (kernel hand-off per device, after kexec failed
on the Note Air) and 2026-11-05 (streams built on the person's computer until CI
publishes them).

Built and verified on hardware (Note Air, 2026-10-31 to 2026-11-01): the migration of an
existing install, the deployment model with the boot steps and the boot-success
service, a base update through an incremental stream, and live packages replayed onto a
new base across an Alpine branch change. Rollback and reset are host-tested only,
including end to end in QEMU. Signed streams from CI and the kernel hand-off are not
built yet.
