# 0007 — Recovery: one GlassineOS recovery, other systems' recoveries as secondary

## Context

Every machine needs a way to repair GlassineOS when it doesn't start, or starts badly:
pick another deployment, reset, repair the boot, collect what went wrong. The machines
differ: a PC starts from UEFI, an e-ink device from an Android bootloader, and some keep
a second system (stock Android) next to GlassineOS. That system has its own recovery
(TWRP), built for its own partitions, packages and backups.

An Android recovery that embeds the vendor's kernel can't be redistributed, because the
vendor never published that kernel's source.

## Decision

- **One GlassineOS recovery, its own program, the same on every machine.** It owns the
  GlassineOS work: deployments (list, select, pin, remove, roll back), resets, repairing
  the boot, the installer's repair and reinstall, diagnostics. It calls the same tools the
  running system uses (`glassine-deploy` and its formats, owned by `boot`) and adds no
  second interface to them. Its core runs without a screen; the touch screen, a console
  and a USB connection are clients of it.
- **Other systems keep their own recovery, as a secondary.** On a machine that also keeps
  another system (dual boot), the GlassineOS recovery can hand over to that system's
  recovery, which then owns that system's work. For stock Android that is TWRP.
  GlassineOS doesn't reimplement any of it. A machine without a second system has no
  hand-over.
- **TWRP stays plain TWRP.** Our fork carries only what TWRP needs to run on a device on
  our kernel (the mainline kernel, a display backend for the e-ink engine), never
  GlassineOS functions.
- **The recovery kernel** comes from the same source tree as the system's, with its own
  minimal, built-in configuration: storage, USB, display, touch, power key,
  battery/charger, watchdog, crash log, dm-crypt, btrfs. No Wi-Fi, Bluetooth, audio,
  modem/DSP or GPU, so it needs no vendor firmware. It is promoted rarely, after a
  hardware boot test.

## Consequences

- PCs and devices get the same recovery, so it is built and tested once.
- A device with one recovery partition that keeps stock Android needs a second place to
  start TWRP from; its backend provides it ([0014](0014-installation-and-provisioning.md)).
- The GlassineOS recovery needs its own e-ink user interface, small enough to start fast.

## Status

Accepted 2026-10-03, revised 2026-11-12.
