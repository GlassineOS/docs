# 0014 — Installation: one guided flow, device descriptions, platform backends

## Context

Setting up a device takes a person who knows its boot chain, its partition table and its
emergency modes, or an AI session that does. That holds for a device we support and even
more for one we don't. Nothing guides a person from a stock device to a running
GlassineOS, and nothing tells them up front what a device would need.

GlassineOS is meant to run on PCs (x86, UEFI) as well as on e-ink devices that start from
an Android bootloader. The two start differently, but what a person needs from an
installer is the same: find out what the machine is, say what will happen, keep what can't
be replaced, install, and prove that it boots.

## Decision

- **One installer, one flow for every device:** inspect → plan → confirm → back up →
  install → verify. Inspecting and planning write nothing and can be run on their own
  (a dry run), on any device, supported or not. The person confirms the whole plan once.
  The installer then does exactly that plan, and nothing outside it.
- **Device knowledge lives in a device description**, not in the flow: how to recognise
  the device by its hardware, what it can do, which partitions it must never write, what
  it backs up and replaces, its device data ([boot 006](https://github.com/GlassineOS/boot/blob/main/specs/006-device-data-storage-access/spec.md)),
  the values unique to the unit that the stock system knows and GlassineOS can't read
  (captured before anything changes), and its backend. A new device adds a description and,
  where its platform has none yet, a backend. The flow never names a device.
- **One backend per platform family** does the device-specific steps. The first two:
  devices that start from an Android bootloader, and PCs that start from UEFI. A device's
  own recipes (the Note Air's boot loader, partition layout and emergency mode) live in its
  bootstrap repository and are used through that backend.
- **Support is stated as capabilities**, such as starting a chosen kernel, a one-shot
  trial boot, a recovery, keeping the stock system. A device that lacks one gets an
  installation without it, and the plan says so. A device that lacks what the system needs
  to boot safely is refused, with the reason.
- **The installer makes the layout of [0010](0010-root-and-deployments.md)**: a base,
  the first deployment, the person's storage. Partitions, boot slots and boot entries are
  the backend's means to start deployments. They are never deployments themselves.
- **Nothing irreplaceable is lost.** Partitions the description marks never-write are only
  read. By default the installer makes a full backup of the machine's storage, every
  partition and the partition table, on the person's computer or a disk they choose, and
  verifies it before the first write, so any damage can be undone. The way back to stock
  uses that backup. The person can switch the backup off, so that an installation also
  works with little free space; the plan then says that there is no way back from it. The
  values unique to the unit are captured either way.
- **One GlassineOS recovery on every machine.** It is the same recovery on a PC and on a
  device: it lists, selects, pins and removes deployments, resets, repairs the boot, runs
  the installer's repair and reinstall, and collects diagnostics. It is a client of the
  same tools the running system uses. On a machine that also keeps another system (dual
  boot), the GlassineOS recovery can hand over to that system's own recovery (TWRP for
  stock Android), which then owns that system's work: its partitions, its packages, its
  backups. GlassineOS never reimplements a secondary recovery, and a machine without one
  simply has no hand-over. The installer installs the GlassineOS recovery and, where the
  plan keeps another system, leaves or installs its recovery as the secondary.
- **Every step says how to escape it.** If a step fails, the plan says where that leaves
  the device and how to get out. Where the only way out needs special hardware (an
  emergency-mode cable), the plan says so before the person confirms.
- **Vendor files never leave the device and the person's computer**
  ([0008](0008-bring-your-own-stock-kernel.md)). The installer reads them from the device
  and deletes its temporary copies.
- **Where it runs:** for devices, on a computer connected to them, from Linux, Windows or a
  browser. For a PC, on the PC itself, started from removable media.
- **It ends in a booted system.** The installer counts an installation as done only after
  the device has booted the first deployment and that deployment has been accepted
  ([boot 001](https://github.com/GlassineOS/boot/blob/main/specs/001-deployments/spec.md)).
  First-boot setup comes after that and isn't the installer's job.
- **The installer lives in its own repository, `installer`**, which owns the flow and the
  device-description format. Device repositories own their descriptions and recipes.

## Consequences

- A person sets up a supported device without a command line, and anyone can learn what
  an unsupported device lacks without risking it.
- Device work becomes data plus a backend. The PC backend gets the most use, so the flow
  is shaped for many devices from the start.
- The Note Air's recipes must be expressed as steps of the Android-bootloader backend, each
  with its escape.
- Where a device has one recovery partition and keeps stock Android, the backend has to
  give the secondary recovery its own place to start from.

## Status

Accepted 2026-11-12.
