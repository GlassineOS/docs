# Devices

## Support tiers

| Tier | Meaning |
|---|---|
| **testing** | boots, work in progress; for developers with a recovery path (EDL cable) |
| **community** | daily-usable; known gaps listed on the device page |
| **main** | everything in the feature matrix works; installer supported |

## Devices

| Device | SoC | Tier | Page |
|---|---|---|---|
| Onyx Boox Note Air (1st gen) | Snapdragon 636 (sdm660 family) | testing | [Note Air](onyx-noteair/index.md) |

## Feature matrix

| Feature | Note Air |
|---|---|
| Boot (mainline kernel) | works (2026-10-01) |
| Display / e-ink engine | works (2026-10-01) |
| Touch | works (2026-09-28) |
| Pen | works (2026-09-28) |
| Suspend / resume | works (2026-10-01) |
| Wi-Fi | works (2026-09-28) |
| Bluetooth | works (2026-10-01) |
| Audio | partial: speaker works (2026-10-03), mic untested |
| Battery / charging | works (2026-09-28) |
| Updates | no |
| Recovery | partial |

Each cell: works, partial or no, with the date it was last verified on hardware.

## Adding a device

A new model has to pass these gates before any port work:

1. **Code execution at boot:** a usable EDL loader or another unlock path, and a
   bootloader we can replace or that boots our images.
2. **SoC family:** which kernel branch, how much mainline support exists.
3. **Display pipeline:** software-driven panel (like the Note Air) or a hardware
   display controller.
4. **Partition room:** space for GlassineOS without losing the user's data.

Share what you know about a model with the device report form.
